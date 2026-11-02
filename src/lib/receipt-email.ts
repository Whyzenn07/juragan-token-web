import nodemailer from "nodemailer";

export interface SendReceiptPayload {
  customerName: string;
  customerEmail: string;
  packageName: string;
  priceIdr: number;
  paymentMethod: string;
  apiKey: string;
  gatewayUrl?: string;
  invoiceId: string;
}

export type SendReceiptResult = { status: "sent" | "simulated"; messageId?: string; message?: string };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Dipanggil hanya dari server setelah pembayaran terkonfirmasi. Melempar error jika SMTP gagal. */
export async function sendReceiptEmail(payload: SendReceiptPayload): Promise<SendReceiptResult> {
  {
    const {
      customerEmail,
      priceIdr,
      invoiceId,
      gatewayUrl: rawGatewayUrl = process.env.GATEWAY_BASE_URL || "https://gateway.juragantoken.co.id/v1",
    } = payload;
    const customerName = escapeHtml(payload.customerName);
    const packageName = escapeHtml(payload.packageName);
    const paymentMethod = escapeHtml(payload.paymentMethod);
    const apiKey = escapeHtml(payload.apiKey);
    const gatewayUrl = escapeHtml(rawGatewayUrl);

    const formattedPrice = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(priceIdr);

    const transactionDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date());

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
    const fromName = process.env.GMAIL_FROM_NAME?.trim() || "Juragan Token Indonesia";

    // Mode simulasi bila kredensial Gmail belum diisi di .env.local
    const isConfigured = Boolean(
      gmailUser &&
      gmailPass &&
      !gmailPass.includes("xxxx") &&
      gmailUser.includes("@")
    );

    if (!isConfigured) {
      console.log(`[SIMULASI EMAIL] Ke: ${customerEmail} | Invoice: ${invoiceId} | Paket: ${payload.packageName}`);
      return {
        status: "simulated",
        message: `Mode simulasi: kredensial Gmail belum diisi, email untuk ${customerEmail} tidak dikirim.`,
      };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass?.replace(/\s+/g, ""), // Hapus spasi dari Sandi Aplikasi Google
      },
    });

    // Template Email HTML (Desain Responsif, Navy & Blue Juragan Token)
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bukti Pembayaran & Kredensial API Token</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f7fb; padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Container Kartu Utama -->
        <table role="presentation" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 8px 24px rgba(10,37,64,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0a2442; padding:28px 32px; text-align:left;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <div style="font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                      juragan<span style="color:#60a5fa;">token</span><span style="color:#38bdf8;">.</span>
                    </div>
                    <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#93c5fd; margin-top:4px; font-weight:700;">
                      Kredit API Multi-AI Prabayar Indonesia
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block; background-color:#1e3a5f; color:#93c5fd; font-size:11px; padding:4px 10px; border-radius:20px; font-weight:600; border:1px solid #2b4c7e;">
                      Lunas ✓
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Konten Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="font-size:20px; font-weight:800; color:#0f172a; margin:0 0 12px; letter-spacing:-0.4px;">
                Bukti Pembayaran &amp; Kredensial Token Anda
              </h1>
              <p style="font-size:14px; color:#475569; margin:0 0 24px;">
                Halo <strong>${customerName}</strong>, terima kasih atas pesanan Anda. Pembayaran Anda telah terverifikasi otomatis oleh SingaPay. Kredensial Virtual API Key Anda kini telah aktif permanen (tanpa masa kedaluwarsa).
              </p>

              <!-- Box Ringkasan Transaksi -->
              <table role="presentation" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px; font-size:13px;">
                <tr>
                  <td style="color:#64748b; padding:4px 0;">No. Invoice</td>
                  <td align="right" style="font-weight:700; color:#0f172a; font-family:monospace; padding:4px 0;">${invoiceId}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:4px 0;">Waktu Pembayaran</td>
                  <td align="right" style="color:#0f172a; padding:4px 0;">${transactionDate}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:4px 0;">Paket Token</td>
                  <td align="right" style="font-weight:700; color:#0a4ea3; padding:4px 0;">${packageName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:4px 0;">Metode Pembayaran</td>
                  <td align="right" style="color:#0f172a; padding:4px 0;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top:1px dashed #cbd5e1; padding-top:8px; margin-top:8px;"></td>
                </tr>
                <tr>
                  <td style="color:#0f172a; font-weight:700; font-size:14px; padding:4px 0;">Total Pembayaran</td>
                  <td align="right" style="font-size:16px; font-weight:800; color:#0a4ea3; padding:4px 0;">${formattedPrice}</td>
                </tr>
              </table>

              <!-- Box Kredensial API Key (Sorotan Utama) -->
              <div style="background-color:#0f172a; border-radius:10px; padding:20px; margin-bottom:24px; color:#ffffff;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; font-weight:700; margin-bottom:6px;">
                  🔑 Virtual API Key Anda (Rahasia)
                </div>
                <div style="background-color:#1e293b; border:1px solid #334155; border-radius:6px; padding:12px 14px; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:15px; color:#38bdf8; font-weight:700; word-break:break-all;">
                  ${apiKey}
                </div>

                <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; font-weight:700; margin:16px 0 6px;">
                  🌐 Base URL Gateway (OpenAI Compatible)
                </div>
                <div style="background-color:#1e293b; border:1px solid #334155; border-radius:6px; padding:10px 14px; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:13px; color:#f1f5f9; word-break:break-all;">
                  ${gatewayUrl}
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-top:10px; line-height:1.4;">
                  💡 Tips: Salin kredensial di atas dan simpan di pengelola kata sandi atau catatan aman Anda.
                </div>
              </div>

              <!-- Panduan Pemasangan Kilat -->
              <h2 style="font-size:15px; font-weight:700; color:#0f172a; margin:0 0 12px;">
                🚀 Panduan Cepat Menghubungkan Token:
              </h2>
              <table role="presentation" width="100%" style="font-size:13px; color:#334155; margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0; vertical-align:top; width:22px;"><b>1.</b></td>
                  <td style="padding:6px 0;">
                    <strong>Web Client Gratis:</strong> Buka <a href="https://web.chatboxai.app/" target="_blank" style="color:#0a4ea3; font-weight:600;">Chatbox Web</a> atau <a href="https://app.nextchat.dev/" target="_blank" style="color:#0a4ea3; font-weight:600;">NextChat</a>, pilih provider <i>OpenAI</i>, lalu masukkan API Key &amp; Base URL di atas.
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0; vertical-align:top; width:22px;"><b>2.</b></td>
                  <td style="padding:6px 0;">
                    <strong>Cursor AI:</strong> Masuk ke <i>Settings &gt; Models &gt; OpenAI API Key</i> atau centang <i>Override OpenAI Base URL</i> lalu tempel URL di atas.
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0; vertical-align:top; width:22px;"><b>3.</b></td>
                  <td style="padding:6px 0;">
                    <strong>Claude Code CLI (Terminal):</strong> Jalankan:<br>
                    <code style="background-color:#f1f5f9; color:#0a4ea3; padding:2px 6px; border-radius:4px; font-family:monospace; display:inline-block; margin-top:4px;">$env:ANTHROPIC_API_KEY="${apiKey}"</code>
                  </td>
                </tr>
              </table>

              <!-- Tombol Cek Saldo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://juragantoken.co.id" target="_blank" style="display:inline-block; background-color:#0a4ea3; color:#ffffff; text-decoration:none; font-weight:700; font-size:13px; padding:12px 24px; border-radius:6px; box-shadow:0 4px 10px rgba(10,78,163,0.25);">
                      Buka Portal Juragan Token ↗
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Email -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 32px; font-size:11.5px; color:#64748b; text-align:center;">
              <p style="margin:0 0 6px;">
                Email ini dikirim otomatis oleh sistem pembayaran <strong>Juragan Token</strong> melalui gateway SingaPay.
              </p>
              <p style="margin:0;">
                Butuh bantuan teknis? Hubungi Customer Service kami di Telegram: <a href="https://t.me/juragantoken" target="_blank" style="color:#0a4ea3; text-decoration:none; font-weight:600;">@juragantoken</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to: customerEmail,
      subject: `[Juragan Token] Bukti Pembayaran & Kredensial API Key Token (${invoiceId})`,
      html: htmlContent,
    });
    console.log(`[EMAIL BERHASIL] ID: ${info.messageId} dikirim ke ${customerEmail}`);

    return { status: "sent", messageId: info.messageId };
  }
}
