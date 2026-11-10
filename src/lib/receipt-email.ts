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
  isTopUp?: boolean;
}

export type SendReceiptResult = { status: "sent" | "simulated"; messageId?: string; message?: string };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Dipanggil hanya dari server setelah pembayaran terkonfirmasi. Melempar error jika SMTP gagal. */
export async function sendReceiptEmail(payload: SendReceiptPayload): Promise<SendReceiptResult> {
  const {
    customerEmail,
    priceIdr,
    invoiceId,
    isTopUp = false,
    gatewayUrl: rawGatewayUrl = process.env.GATEWAY_BASE_URL || "https://www.juragantoken.co.id/v1",
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

  const adminWaRaw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990").replace(/[^0-9]/g, "");
  const adminWaFormatted = adminWaRaw.startsWith("62")
    ? `+62 ${adminWaRaw.slice(2, 5)}-${adminWaRaw.slice(5, 9)}-${adminWaRaw.slice(9)}`
    : `+${adminWaRaw}`;
  const officialWeb = "https://api.tokotokenai.com/";

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

  // Template Email HTML (Desain Responsif Mobile-First, Antislop UI/Layout, Bebas SingaPay)
  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Bukti Pembayaran &amp; Kredensial API Token</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-container { padding: 12px 6px !important; }
      .email-card-body { padding: 20px 16px !important; }
      .email-banner { padding: 18px 16px !important; }
      .email-summary-table td { font-size: 12px !important; }
      .email-api-box { padding: 14px 12px !important; }
      .email-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:24px 10px;" class="email-container">
    <tr>
      <td align="center">
        <!-- Container Kartu Utama -->
        <table role="presentation" width="100%" style="max-width:580px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 6px 20px rgba(10,37,64,0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0a2442; padding:22px 24px; text-align:left;" class="email-banner">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:22px; font-weight:850; color:#ffffff; letter-spacing:-0.5px;">
                      juragan<span style="color:#60a5fa;">token</span><span style="color:#38bdf8;">.</span>
                    </div>
                    <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#93c5fd; margin-top:4px; font-weight:700;">
                      Kredit API Multi-AI Prabayar Indonesia
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block; background-color:#166534; color:#dcfce7; font-size:11px; padding:4px 12px; border-radius:20px; font-weight:700; border:1px solid #22c55e; white-space:nowrap;">
                      Lunas ✓
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Konten Body -->
          <tr>
            <td style="padding:26px 24px;" class="email-card-body">
              <h1 style="font-size:19px; font-weight:800; color:#0f172a; margin:0 0 10px; letter-spacing:-0.3px; line-height:1.35;">
                ${isTopUp ? "Bukti Pembayaran &amp; Pengisian Saldo Berhasil" : "Bukti Pembayaran &amp; Kredensial Token Anda"}
              </h1>
              
              <p style="font-size:13.5px; color:#334155; margin:0 0 20px; line-height:1.65;">
                ${isTopUp
                  ? `Halo <strong>${customerName}</strong>, pembayaran Anda sebesar <strong>${formattedPrice}</strong> telah <strong>berhasil dikonfirmasi</strong>. Saldo kredit telah berhasil ditambahkan ke API Key Anda dengan nomor invoice <strong>${invoiceId}</strong>. Kunci Anda di Cursor atau terminal tetap sama dan siap langsung digunakan.`
                  : `Halo <strong>${customerName}</strong>, pembayaran Anda sebesar <strong>${formattedPrice}</strong> untuk <strong>${packageName}</strong> telah <strong>berhasil dikonfirmasi</strong> dengan nomor invoice <strong>${invoiceId}</strong>. Kredensial Virtual API Key Anda kini telah aktif permanen (tanpa masa kedaluwarsa) dan siap langsung digunakan.`}
              </p>

              <!-- Box Ringkasan Transaksi -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 16px; margin-bottom:20px; font-size:12.5px;" class="email-summary-table">
                <tr>
                  <td style="color:#64748b; padding:5px 0; width:36%;">No. Invoice</td>
                  <td align="right" style="font-weight:700; color:#0f172a; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:12.5px; padding:5px 0; width:64%; word-break:break-all; letter-spacing:0.3px;">${invoiceId}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:5px 0;">Waktu Pembayaran</td>
                  <td align="right" style="color:#0f172a; padding:5px 0;">${transactionDate}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:5px 0;">Paket Token</td>
                  <td align="right" style="font-weight:700; color:#0a58ca; padding:5px 0;">${packageName}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding:5px 0;">Metode Pembayaran</td>
                  <td align="right" style="color:#0f172a; padding:5px 0;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top:1px dashed #cbd5e1; padding-top:8px; margin-top:8px;"></td>
                </tr>
                <tr>
                  <td style="color:#0f172a; font-weight:800; font-size:13.5px; padding:6px 0 2px;">Total Pembayaran</td>
                  <td align="right" style="font-size:16px; font-weight:900; color:#0a58ca; padding:6px 0 2px; white-space:nowrap;">${formattedPrice}</td>
                </tr>
              </table>

              <!-- Box Kredensial API Key (Sorotan Utama) -->
              <div style="background-color:#0b192e; border:1px solid #1e3a5f; border-radius:10px; padding:18px 16px; margin-bottom:22px; color:#ffffff;" class="email-api-box">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#93c5fd; font-weight:700; margin-bottom:8px;">
                  ${isTopUp ? "🔑 API Key Anda yang Telah Diisi Saldo" : "🔑 Virtual API Key Anda (Rahasia)"}
                </div>
                <div style="background-color:#030d1a; border:1px solid #1e3a5f; border-radius:6px; padding:12px 14px; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:14px; color:#38bdf8; font-weight:700; word-break:break-all; letter-spacing:0.5px; line-height:1.4;">
                  ${apiKey}
                </div>

                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:#93c5fd; font-weight:700; margin:14px 0 6px;">
                  🌐 Base URL Gateway (OpenAI Compatible)
                </div>
                <div style="background-color:#030d1a; border:1px solid #1e3a5f; border-radius:6px; padding:10px 14px; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; font-size:12.5px; color:#f1f5f9; word-break:break-all; line-height:1.4;">
                  ${gatewayUrl}
                </div>
                <div style="font-size:11.5px; color:#94a3b8; margin-top:10px; line-height:1.45;">
                  💡 Tips: Salin kredensial di atas dan simpan di pengelola kata sandi atau catatan aman Anda.
                </div>
              </div>

              <!-- Panduan Pemasangan Kilat -->
              <h2 style="font-size:14.5px; font-weight:750; color:#0f172a; margin:0 0 10px;">
                🚀 Panduan Cepat Menghubungkan Token:
              </h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:12.5px; color:#334155; margin-bottom:22px; line-height:1.55;">
                <tr>
                  <td style="padding:5px 0; vertical-align:top; width:22px;"><b>1.</b></td>
                  <td style="padding:5px 0;">
                    <strong>Web Client:</strong> Buka <a href="https://web.chatboxai.app/" target="_blank" style="color:#0a58ca; font-weight:600; text-decoration:none;">Chatbox Web</a> atau <a href="https://app.nextchat.dev/" target="_blank" style="color:#0a58ca; font-weight:600; text-decoration:none;">NextChat</a>, pilih provider <i>OpenAI</i>, lalu masukkan API Key &amp; Base URL di atas.
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0; vertical-align:top; width:22px;"><b>2.</b></td>
                  <td style="padding:5px 0;">
                    <strong>Cursor AI:</strong> Masuk ke <i>Settings &gt; Models &gt; OpenAI API Key</i> atau centang <i>Override OpenAI Base URL</i> lalu tempel Base URL di atas.
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 0; vertical-align:top; width:22px;"><b>3.</b></td>
                  <td style="padding:5px 0;">
                    <strong>Claude Code CLI (Terminal):</strong><br>
                    <div style="background-color:#0f172a; border:1px solid #1e293b; border-radius:6px; padding:10px 12px; margin-top:6px; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:11.5px; color:#e2e8f0; word-break:break-all; line-height:1.5;">
                      <span style="color:#94a3b8;"># PowerShell (Windows):</span><br>
                      <code style="color:#38bdf8;">$env:ANTHROPIC_API_KEY="${apiKey}"</code><br><br>
                      <span style="color:#94a3b8;"># Bash / macOS / Linux:</span><br>
                      <code style="color:#38bdf8;">export ANTHROPIC_API_KEY="${apiKey}"</code>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Tombol Web Resmi -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${officialWeb}" target="_blank" style="display:inline-block; background-color:#0a58ca; color:#ffffff; text-decoration:none; font-weight:700; font-size:13.5px; padding:12px 24px; border-radius:8px; box-shadow:0 4px 12px rgba(10,88,202,0.28);" class="email-btn">
                      Buka Web Resmi Juragan Token ↗
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Email Resmi -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:22px 20px; font-size:12px; color:#64748b; text-align:center; line-height:1.6;">
              <p style="margin:0 0 10px; color:#475569;">
                Email ini diterbitkan otomatis oleh sistem transaksi <strong>Juragan Token Indonesia</strong> sebagai bukti pembayaran yang sah.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:12px; font-size:12px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px; color:#334155;">
                      💬 <strong>Bantuan &amp; Customer Care:</strong><br>
                      WhatsApp Admin: <a href="https://wa.me/${adminWaRaw}" target="_blank" style="color:#0a58ca; font-weight:700; text-decoration:none;">${adminWaFormatted} ↗</a>
                    </p>
                    <p style="margin:6px 0 0; color:#334155;">
                      🌐 <strong>Website Resmi:</strong><br>
                      <a href="${officialWeb}" target="_blank" style="color:#0a58ca; font-weight:700; text-decoration:none;">${officialWeb} ↗</a>
                    </p>
                  </td>
                </tr>
              </table>
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
    subject: isTopUp
      ? `[Juragan Token] Saldo API Key Berhasil Ditambahkan (+${formattedPrice}) (${invoiceId})`
      : `[Juragan Token] Bukti Pembayaran & Kredensial API Key Token (${invoiceId})`,
    html: htmlContent,
  });
  console.log(`[EMAIL BERHASIL] ID: ${info.messageId} dikirim ke ${customerEmail}`);

  return { status: "sent", messageId: info.messageId };
}
