import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { confirmOrder, expireOrder } from "@/lib/orders";


/**
 * Universal Payment Gateway Webhook Handler
 * Mendukung callback resmi dari Tripay, Midtrans, dan Xendit
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Identifikasi Provider & Order ID
    let orderId = "";
    let isPaid = false;
    let isExpired = false;
    let provider = "unknown";

    // A. Deteksi Callback Tripay
    const tripaySignature = req.headers.get("x-callback-signature");
    if (tripaySignature || payload.merchant_ref) {
      provider = "tripay";
      orderId = String(payload.merchant_ref || payload.reference || "");
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID";
      isExpired = status === "EXPIRED" || status === "FAILED";

      // Validasi HMAC SHA-256 Tripay jika private key tersedia
      const privateKey = process.env.TRIPAY_PRIVATE_KEY?.trim();
      if (privateKey && tripaySignature) {
        const hmac = crypto.createHmac("sha256", privateKey).update(rawBody).digest("hex");
        if (hmac !== tripaySignature) {
          console.warn("[WEBHOOK TRIPAY] Signature mismatch!");
          return NextResponse.json({ success: false, error: "Invalid Tripay signature" }, { status: 403 });
        }
      }
    }

    // B. Deteksi Callback Midtrans
    else if (payload.order_id && payload.transaction_status) {
      provider = "midtrans";
      orderId = String(payload.order_id);
      const txStatus = String(payload.transaction_status);
      const fraudStatus = String(payload.fraud_status || "");
      isPaid = txStatus === "settlement" || (txStatus === "capture" && fraudStatus === "accept");
      isExpired = txStatus === "expire" || txStatus === "cancel" || txStatus === "deny";

      // Validasi Signature SHA-512 Midtrans jika server key tersedia
      const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
      const midtransSignature = String(payload.signature_key || "");
      if (serverKey && midtransSignature) {
        const statusCode = String(payload.status_code || "");
        const grossAmount = String(payload.gross_amount || "");
        const expected = crypto
          .createHash("sha512")
          .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
          .digest("hex");
        if (expected !== midtransSignature) {
          console.warn("[WEBHOOK MIDTRANS] Signature mismatch!");
          return NextResponse.json({ success: false, error: "Invalid Midtrans signature" }, { status: 403 });
        }
      }
    }

    // C. Deteksi Callback Xendit
    else if (payload.external_id) {
      provider = "xendit";
      orderId = String(payload.external_id);
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID" || status === "COMPLETED";
      isExpired = status === "EXPIRED";

      // Validasi callback token Xendit jika tersedia
      const callbackToken = process.env.XENDIT_CALLBACK_TOKEN?.trim();
      const reqToken = req.headers.get("x-callback-token");
      if (callbackToken && reqToken && callbackToken !== reqToken) {
        console.warn("[WEBHOOK XENDIT] Callback token mismatch!");
        return NextResponse.json({ success: false, error: "Invalid Xendit callback token" }, { status: 403 });
      }
    }

    // D. Manual / Generic Callback
    else if (payload.invoiceId || payload.orderId) {
      provider = "generic";
      orderId = String(payload.invoiceId || payload.orderId);
      const status = String(payload.status || "").toUpperCase();
      isPaid = status === "PAID" || status === "SUCCESS";
      isExpired = status === "EXPIRED";
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: "No recognized order ID found in payload" }, { status: 400 });
    }

    console.log(`[WEBHOOK ${provider.toUpperCase()}] Order: ${orderId} | Status Paid: ${isPaid} | Expired: ${isExpired}`);

    // 2. Eksekusi Perubahan Status Order
    if (isPaid) {
      const confirmRes = await confirmOrder(orderId);
      if (!confirmRes.ok) {
        // Jika order sudah dibayar sebelumnya (idempotent), kembalikan HTTP 200 agar gateway tidak terus retry
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
