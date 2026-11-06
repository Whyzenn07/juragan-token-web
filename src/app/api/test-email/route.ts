import { NextRequest, NextResponse } from "next/server";
import { sendReceiptEmail } from "@/lib/receipt-email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetEmail = searchParams.get("to")?.trim() || "wahyuargomu123@gmail.com";
  const customerName = searchParams.get("name")?.trim() || "Wahyu Argo";

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  const isConfigured = Boolean(
    gmailUser &&
    gmailPass &&
    !gmailPass.includes("xxxx") &&
    gmailUser.includes("@")
  );

  if (!isConfigured) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        targetEmail,
        error: "Kredensial Gmail belum dikonfigurasi di file .env.local",
        currentConfig: {
          GMAIL_USER: gmailUser || "(kosong)",
          GMAIL_APP_PASSWORD: gmailPass ? "********" : "(kosong)",
          GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME || "Juragan Token Indonesia",
        },
        instruction: [
          "1. Buka akun Google Anda di https://myaccount.google.com/security",
          "2. Pastikan '2-Step Verification' (Verifikasi 2 Langkah) sudah aktif",
          "3. Buat Sandi Aplikasi di https://myaccount.google.com/apppasswords",
          "4. Beri nama aplikasi misal 'Juragan Token Web', lalu salin 16 karakter kodenya",
          "5. Buka file .env.local dan isi:",
          "   GMAIL_USER=\"email-anda@gmail.com\"",
          "   GMAIL_APP_PASSWORD=\"xxxx xxxx xxxx xxxx\"",
          "6. Restart dev server (jika perlu) lalu reload endpoint ini.",
        ],
      },
      { status: 400 }
    );
  }

  try {
    const testInvoiceId = `INV-JT-${Date.now().toString().slice(-6)}`;
    const testApiKey = `jt-live-test-${Math.random().toString(36).slice(2, 10)}`;

    const result = await sendReceiptEmail({
      customerName,
      customerEmail: targetEmail,
      packageName: "Paket Ritel Sultan (10 Juta Token)",
      priceIdr: 150000,
      paymentMethod: "QRIS Standar Nasional",
      apiKey: testApiKey,
      invoiceId: testInvoiceId,
      gatewayUrl: process.env.GATEWAY_BASE_URL || "https://www.juragantoken.co.id/v1",
    });

    if (result.status === "simulated") {
      return NextResponse.json({
        success: false,
        status: "simulated",
        message: result.message,
      });
    }

    return NextResponse.json({
      success: true,
      status: "sent",
      message: `Email invoice berhasil dikirim ke ${targetEmail}!`,
      messageId: result.messageId,
      detail: {
        invoiceId: testInvoiceId,
        recipient: targetEmail,
        customerName,
        packageName: "Paket Ritel Sultan (10 Juta Token)",
        testApiKey,
        sentAt: new Date().toISOString(),
      },
      checkInboxNote: "Silakan periksa folder Inbox (atau folder Spam/Promotions jika pertama kali kirim).",
    });
  } catch (err: any) {
    console.error("[TEST EMAIL ERROR]", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Gagal mengirim email via Gmail SMTP",
        code: err.code,
        response: err.response,
        hint:
          err.code === "EAUTH"
            ? "Autentikasi Google gagal. Pastikan GMAIL_APP_PASSWORD adalah 'App Password' 16 digit dari Google, bukan password akun Google biasa."
            : "Terjadi kesalahan koneksi SMTP ke Google.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
