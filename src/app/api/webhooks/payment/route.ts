import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmOrder, expireOrder } from "@/lib/orders";
import { rateLimited, safeEqualHash, safeEqualSecret } from "@/lib/keys";
import { mutate, query } from "@/lib/store";
import { fetchOrderFromSupabase } from "@/lib/supabase-sync";

/**
 * Universal Payment Gateway Webhook Handler (Fail-Closed)
 * Mendukung callback resmi dari Tripay, Midtrans, dan Xendit dengan validasi signature wajib.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ success: false, error: "Too many webhook requests" }, { status: 429 });
  }

  try {
    const rawBody = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Identifikasi Provider, Validasi Signature Wajib (Fail-Closed), & Order ID
    let orderId = "";
    let isPaid = false;
    let isExpired = false;
    let paidAmountIdr: number | null = null;
    let provider = "unknown";

    // A. Deteksi Callback Tripay
    const tripaySignature = req.headers.get("x-callback-signature")?.trim();
    if (tripaySignature || payload.merchant_ref) {
      provider = "tripay";
      const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim();
      if (!privateKey || !tripaySignature) {
        return NextResponse.json({ success: false, error: "Tripay signature or private key missing" }, { status: 403 });
      }
      const hmac = crypto.createHmac("sha256", privateKey).update(rawBody).digest("hex");
      if (!safeEqualHash(hmac, tripaySignature)) {
        console.warn("[WEBHOOK TRIPAY] Signature mismatch!");
        return NextResponse.json({ success: false, error: "Invalid Tripay signature" }, { status: 403 });
      }

      orderId = String(payload.merchant_ref || payload.reference || "").trim();
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID";
      isExpired = status === "EXPIRED" || status === "FAILED";
      const amt = Number(payload.total_amount ?? payload.amount);
      if (Number.isFinite(amt) && amt > 0) paidAmountIdr = amt;
    }

    // B. Deteksi Callback Midtrans
    else if (payload.order_id && payload.transaction_status) {
      provider = "midtrans";
      const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
      const midtransSignature = String(payload.signature_key || "").trim();
      if (!serverKey || !midtransSignature) {
        return NextResponse.json({ success: false, error: "Midtrans signature or server key missing" }, { status: 403 });
      }

      orderId = String(payload.order_id).trim();
      const statusCode = String(payload.status_code || "");
      const grossAmount = String(payload.gross_amount || "");
      const expected = crypto
        .createHash("sha512")
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest("hex");
      if (!safeEqualHash(expected, midtransSignature)) {
        console.warn("[WEBHOOK MIDTRANS] Signature mismatch!");
        return NextResponse.json({ success: false, error: "Invalid Midtrans signature" }, { status: 403 });
      }

      const txStatus = String(payload.transaction_status);
      const fraudStatus = String(payload.fraud_status || "");
      isPaid = txStatus === "settlement" || (txStatus === "capture" && fraudStatus === "accept");
      isExpired = txStatus === "expire" || txStatus === "cancel" || txStatus === "deny";
      const amt = Number(payload.gross_amount);
      if (Number.isFinite(amt) && amt > 0) paidAmountIdr = Math.round(amt);
    }

    // C. Deteksi Callback Xendit
    else if (payload.external_id) {
      provider = "xendit";
      const callbackToken = process.env.XENDIT_CALLBACK_TOKEN?.trim();
      const reqToken = req.headers.get("x-callback-token")?.trim();
      if (!callbackToken || !reqToken || !safeEqualSecret(callbackToken, reqToken)) {
        console.warn("[WEBHOOK XENDIT] Callback token missing or mismatch!");
        return NextResponse.json({ success: false, error: "Invalid Xendit callback token" }, { status: 403 });
      }

      orderId = String(payload.external_id).trim();
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID" || status === "COMPLETED";
      isExpired = status === "EXPIRED";
      const amt = Number(payload.paid_amount ?? payload.amount);
      if (Number.isFinite(amt) && amt > 0) paidAmountIdr = amt;
    }

    // D. Manual / Internal Callback (Wajib x-admin-secret)
    else if (payload.invoiceId || payload.orderId) {
      provider = "admin_manual";
      const adminSecret = process.env.ADMIN_SECRET?.trim();
      const providedAdmin = req.headers.get("x-admin-secret")?.trim();
      if (!adminSecret || !safeEqualSecret(adminSecret, providedAdmin)) {
        return NextResponse.json({ success: false, error: "Unauthorized manual webhook" }, { status: 403 });
      }
      orderId = String(payload.invoiceId || payload.orderId).trim();
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID" || status === "SUCCESS";
      isExpired = status === "EXPIRED";
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: "No recognized order ID found in payload" }, { status: 400 });
    }

    console.log(`[WEBHOOK ${provider.toUpperCase()}] Order: ${orderId} | Status Paid: ${isPaid} | Expired: ${isExpired}`);

    // 2. Verifikasi Kecocokan Nominal Pembayaran Sebelum Settlement
    if (isPaid && paidAmountIdr !== null) {
      let existing = await query((db) => db.orders[orderId]);
      if (!existing) {
        const remote = await fetchOrderFromSupabase(orderId);
        if (remote) {
          existing = remote;
          await mutate((db) => {
            db.orders[orderId] = remote;
          });
        }
      }
      if (existing && paidAmountIdr < existing.totalIdr) {
        console.warn(`[WEBHOOK AMOUNT MISMATCH] Order ${orderId}: expected ${existing.totalIdr}, got ${paidAmountIdr}`);
        return NextResponse.json(
          { success: false, error: "Nominal pembayaran kurang dari total tagihan order." },
          { status: 400 }
        );
      }
    }

    // 3. Eksekusi Perubahan Status Order
    if (isPaid) {
      const confirmRes = await confirmOrder(orderId);
      if (!confirmRes.ok) {
        if (confirmRes.status === 410) {
          return NextResponse.json({ success: true, message: confirmRes.error }, { status: 200 });
        }
        return NextResponse.json({ success: false, error: confirmRes.error }, { status: confirmRes.status || 400 });
      }
      return NextResponse.json({
        success: true,
        provider,
        orderId,
        status: "confirmed",
        message: "Payment successfully settled and balance credited.",
      });
    }

    if (isExpired) {
      await expireOrder(orderId);
      return NextResponse.json({
        success: true,
        provider,
        orderId,
        status: "expired",
        message: "Order marked as expired.",
      });
    }

    return NextResponse.json({
      success: true,
      provider,
      orderId,
      status: "pending_ack",
      message: "Webhook acknowledged, pending further settlement.",
    });
  } catch (err) {
    console.error("[WEBHOOK EXCEPTION]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
