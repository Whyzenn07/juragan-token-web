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
    gatewayUrl: rawGatewayUrl = process.env.GATEWAY_BASE_URL || "https://www.juragantoken.co.id/v1",
  } = payload;

  const packageName = escapeHtml(payload.packageName);
  const paymentMethod = escapeHtml(payload.paymentMethod);
  const apiKey = escapeHtml(payload.apiKey);
  const gatewayUrl = escapeHtml(rawGatewayUrl);

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(priceIdr);

  const now = new Date();
  const datePart = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);

  const timePart = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(now).replace(":", ".");

  const transactionDate = `${datePart} pukul ${timePart} WIB`;

  const adminWaRaw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990").replace(/[^0-9]/g, "");
  const adminWaFormatted = adminWaRaw.startsWith("62")
    ? `+62 ${adminWaRaw.slice(2, 5)}-${adminWaRaw.slice(5, 9)}-${adminWaRaw.slice(9)}`
    : `+${adminWaRaw}`;
  const officialWeb = "https://api.tokotokenai.com/";

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  const fromName = "Qris Payment Gateway";

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

  // Template Email HTML (Desain 1:1 Persis Contoh Gambar Qris Payment Gateway)
  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Invoice Pembayaran Berhasil</title>
  <style>
    @media only screen and (max-width: 520px) {
      .email-wrapper { padding: 10px 4px !important; }
      .email-card { border-radius: 12px !important; }
      .email-header-table { padding: 20px 16px !important; }
      .email-body-content { padding: 24px 16px 18px !important; }
      .email-detail-card { padding: 16px 14px !important; }
      .email-api-container { padding: 16px 14px !important; }
      .header-slogan { font-size: 12px !important; line-height: 1.3 !important; }
      .price-highlight { font-size: 19px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; padding:24px 10px;" class="email-wrapper">
    <tr>
      <td align="center">
        <!-- Kartu Utama -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e1e8f2; box-shadow:0 8px 26px rgba(15,37,64,0.07);" class="email-card">
          
          <!-- 1. Header Banner Gradient Biru (QRIS Payment Gateway + Slogan Italic) -->
          <tr>
            <td style="background: linear-gradient(135deg, #092c72 0%, #134fb8 50%, #1e6beb 100%); padding: 24px 28px;" class="email-header-table">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <!-- QRIS Logo Vector -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <svg width="124" height="40" viewBox="0 0 124 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Q Outer Frame -->
                            <path d="M3 15V3H26V11" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M11 29H3V19" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M29 21V29H19" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="9" y="9" width="7" height="7" fill="#ffffff" rx="1"/>
                            <path d="M20 20L25 25" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
                            <!-- RIS Text -->
                            <text x="36" y="25" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="21" letter-spacing="0.5">RIS</text>
                            <!-- Payment Gateway -->
                            <text x="37" y="35" fill="rgba(255,255,255,0.92)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="7.5" letter-spacing="0.6">Payment Gateway</text>
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-style: italic; font-size: 13.5px; color: #ffffff; line-height: 1.35; text-align: right; opacity: 0.95; font-weight: 500;" class="header-slogan">
                      Transaksi Aman,<br>Mudah, dan Terpercaya
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Konten Tengah -->
          <tr>
            <td style="padding: 30px 28px 24px;" class="email-body-content">
              
              <!-- Green Checkmark Icon Circle -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 16px;">
                <tr>
                  <td align="center" style="width: 68px; height: 68px; border-radius: 50%; background-color: #e6f9ee; text-align: center; vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td align="center" style="width: 48px; height: 48px; border-radius: 50%; background-color: #16a34a; text-align: center; vertical-align: middle; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.28);">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Headline Status -->
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; font-weight: 850; color: #0f172a; margin: 0 0 6px; letter-spacing: -0.4px;">
                  Pembayaran <span style="color: #16a34a;">Berhasil!</span>
                </h1>
                <p style="font-size: 14px; color: #475569; margin: 0; font-weight: 500;">
                  Terima kasih, pembayaran Anda telah berhasil diproses.
                </p>
              </div>

              <!-- 3. Detail Invoice Box (Clean Card) -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(15,23,42,0.02);" class="email-detail-card">
                
                <!-- Card Header -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 14px;">
                  <tr>
                    <td style="width: 22px; vertical-align: middle;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </td>
                    <td style="font-size: 15px; font-weight: 750; color: #0f172a; vertical-align: middle;">
                      Detail Invoice
                    </td>
                  </tr>
                </table>

                <!-- Table Rows -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13.5px; line-height: 1.5;">
                  <tr>
                    <td style="color: #64748b; padding: 6px 0; width: 40%;">No. Invoice</td>
                    <td align="right" style="color: #0f172a; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 13px; padding: 6px 0; word-break: break-all;">
                      ${invoiceId}
                      <span style="display: inline-block; vertical-align: middle; margin-left: 6px; color: #64748b;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0;">Waktu Pembayaran</td>
                    <td align="right" style="color: #1e293b; font-size: 13px; padding: 6px 0;">${transactionDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0;">Paket Token</td>
                    <td align="right" style="padding: 6px 0;">
                      <span style="background-color: #dbeafe; color: #1d4ed8; font-weight: 700; font-size: 12.5px; padding: 3px 10px; border-radius: 5px; display: inline-block;">
                        ${packageName}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding: 6px 0;">Metode Pembayaran</td>
                    <td align="right" style="color: #1e293b; font-weight: 600; font-size: 13px; padding: 6px 0;">${paymentMethod}</td>
                  </tr>

                  <!-- Total Pembayaran Highlight Box (Sesuai Gambar) -->
                  <tr>
                    <td colspan="2" style="padding-top: 14px;">
                      <div style="background-color: #f0f7ff; border-radius: 8px; padding: 12px 16px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="color: #0f172a; font-weight: 750; font-size: 15px; vertical-align: middle;">
                              Total Pembayaran
                            </td>
                            <td align="right" style="color: #1d4ed8; font-weight: 900; font-size: 22px; vertical-align: middle;" class="price-highlight">
                              ${formattedPrice}
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 4. Virtual API Key & Base URL Box (Background Soft Blue-Grey) -->
              <div style="background-color: #eef4fb; border: 1px solid #dce7f3; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;" class="email-api-container">
                
                <!-- Sub-Block 1: API Key -->
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 13.5px; font-weight: 750; color: #0f172a; margin-bottom: 8px;">
                    🔑 Virtual API Key Anda (Rahasia)
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0c1829; border: 1px solid #1a2c47; border-radius: 8px;">
                    <tr>
                      <td style="padding: 12px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13.5px; color: #38bdf8; font-weight: 600; word-break: break-all; letter-spacing: 0.3px;">
                        ${apiKey}
                      </td>
                      <td align="right" style="padding: 12px 14px; width: 24px; vertical-align: middle;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Sub-Block 2: Base URL Gateway -->
                <div>
                  <div style="font-size: 13.5px; font-weight: 750; color: #0f172a; margin-bottom: 8px;">
                    🔗 Base URL Gateway (OpenAI Compatible)
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #dbe7f4; border: 1px solid #cadbeb; border-radius: 8px;">
                    <tr>
                      <td style="padding: 10px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #1e293b; font-weight: 600; word-break: break-all;">
                        ${gatewayUrl}
                      </td>
                      <td align="right" style="padding: 10px 14px; width: 24px; vertical-align: middle;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </td>
                    </tr>
                  </table>
                </div>

              </div>

              <!-- 5. Tips Keamanan (Amber Callout Box Sesuai Gambar) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
                <tr>
                  <td style="width: 28px; vertical-align: top; font-size: 18px; line-height: 1.2;">
                    💡
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 13.5px; font-weight: 750; color: #78350f; margin-bottom: 2px;">
                      Tips Keamanan
                    </div>
                    <div style="font-size: 12.5px; color: #92400e; line-height: 1.5;">
                      Simpan API Key Anda dengan aman dan jangan bagikan kepada pihak lain.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 6. Footer Bawah (Sesuai Gambar + WhatsApp & Web Resmi) -->
              <div style="text-align: center; padding-top: 6px; font-size: 12px; color: #64748b; line-height: 1.6;">
                <p style="margin: 0 0 4px; color: #475569;">
                  Terima kasih telah menggunakan layanan kami.
                </p>
                <p style="margin: 0; color: #64748b;">
                  Qris Payment Gateway &nbsp;•&nbsp; <a href="${officialWeb}" target="_blank" style="color: #1d4ed8; text-decoration: none; font-weight: 600;">https://www.juragantoken.co.id</a>
                </p>
                <p style="margin: 8px 0 0; font-size: 11.5px; color: #64748b;">
                  Bantuan WhatsApp: <a href="https://wa.me/${adminWaRaw}" target="_blank" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${adminWaFormatted}</a> &nbsp;•&nbsp; Web Resmi: <a href="${officialWeb}" target="_blank" style="color: #1d4ed8; font-weight: 600; text-decoration: none;">${officialWeb}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- 7. Bottom Wave Art (Gelombang Biru Bawah) -->
          <tr>
            <td style="line-height: 0; font-size: 0;">
              <svg viewBox="0 0 580 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; display: block;">
                <path d="M0 16C160 34 380 4 580 18V36H0V16Z" fill="#1e6beb" fill-opacity="0.3"/>
                <path d="M0 22C140 10 360 32 580 18V36H0V22Z" fill="#0f4fc7"/>
              </svg>
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
    subject: `Invoice Pembayaran Berhasil`,
    html: htmlContent,
  });
  console.log(`[EMAIL BERHASIL] ID: ${info.messageId} dikirim ke ${customerEmail}`);

  return { status: "sent", messageId: info.messageId };
}
