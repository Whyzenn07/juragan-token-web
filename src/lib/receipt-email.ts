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

  const customerName = escapeHtml(payload.customerName);
  const packageName  = escapeHtml(payload.packageName);
  const paymentMethod = escapeHtml(payload.paymentMethod);
  const apiKey       = escapeHtml(payload.apiKey);
  const gatewayUrl   = escapeHtml(rawGatewayUrl);

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
  const fromName  = "Qris Payment Gateway";

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
      pass: gmailPass?.replace(/\s+/g, ""),
    },
  });

  // ─── Template Email HTML — Clean Receipt v3 ───────────────────────────────
  // Catatan: SVG <polyline> TIDAK render di Gmail/Outlook. Gunakan &#10003;
  // (karakter Unicode ✓) di dalam tabel-circle sebagai ganti SVG checkmark.
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Pembayaran Berhasil</title>
  <style>
    @media only screen and (max-width: 520px) {
      .ew td[align="center"] { padding: 16px 8px !important; }
      .eh { padding: 22px 18px !important; }
      .eb { padding: 26px 16px 22px !important; }
      .slogan { font-size: 11px !important; }
      .price { font-size: 19px !important; }
      .h1   { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.5;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="ew" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <!-- ░░░ CARD ░░░ -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:560px;width:100%;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.09);border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td class="eh" style="background:linear-gradient(135deg,#0a2d75 0%,#1346c0 55%,#1e6beb 100%);padding:26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:-0.3px;line-height:1.1;">QRIS</div>
                    <div style="color:rgba(255,255,255,0.72);font-size:9.5px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;margin-top:3px;">Payment Gateway</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div class="slogan" style="color:rgba(255,255,255,0.88);font-style:italic;font-size:12.5px;font-weight:500;text-align:right;line-height:1.45;">
                      Transaksi Aman,<br>Mudah &amp; Terpercaya
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="eb" style="padding:32px 28px 26px;">

              <!-- ✅ Checkmark badge (table-based, renders di semua email client) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 22px;">
                <tr>
                  <!-- Outer light-green ring -->
                  <td align="center" valign="middle"
                      style="width:72px;height:72px;border-radius:36px;background-color:#dcfce7;text-align:center;vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <!-- Inner solid green circle -->
                        <td align="center" valign="middle"
                            style="width:50px;height:50px;border-radius:25px;background-color:#16a34a;text-align:center;vertical-align:middle;">
                          <!-- ✓ glyph — warna putih, ukuran besar, line-height pas dengan tinggi sel -->
                          <span style="display:block;width:50px;height:50px;line-height:50px;text-align:center;font-size:30px;font-weight:900;color:#ffffff;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <div style="text-align:center;margin-bottom:28px;">
                <div class="h1" style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;margin-bottom:7px;">
                  Pembayaran <span style="color:#16a34a;">Berhasil!</span>
                </div>
                <div style="font-size:13.5px;color:#64748b;font-weight:500;">
                  Halo <strong style="color:#0f172a;">${customerName}</strong>, pembayaran Anda telah dikonfirmasi.
                </div>
              </div>

              <!-- ─── Detail Invoice ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:14px;">DETAIL INVOICE</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:7px 0;border-bottom:1px solid #f1f5f9;width:44%;">No. Invoice</td>
                        <td align="right" style="font-size:12px;color:#0f172a;font-weight:700;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;padding:7px 0;border-bottom:1px solid #f1f5f9;word-break:break-all;">${invoiceId}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:7px 0;border-bottom:1px solid #f1f5f9;">Tanggal</td>
                        <td align="right" style="font-size:12.5px;color:#1e293b;padding:7px 0;border-bottom:1px solid #f1f5f9;">${transactionDate}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:7px 0;border-bottom:1px solid #f1f5f9;">Paket</td>
                        <td align="right" style="padding:7px 0;border-bottom:1px solid #f1f5f9;">
                          <span style="background-color:#dbeafe;color:#1d4ed8;font-weight:700;font-size:12px;padding:3px 10px;border-radius:4px;display:inline-block;">${packageName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:7px 0;">Metode Bayar</td>
                        <td align="right" style="font-size:13px;color:#1e293b;font-weight:600;padding:7px 0;">${paymentMethod}</td>
                      </tr>
                    </table>
                    <!-- Total highlight -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                           style="margin-top:14px;background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                      <tr>
                        <td style="padding:13px 16px;font-size:14px;font-weight:700;color:#1e293b;vertical-align:middle;">Total Pembayaran</td>
                        <td align="right" class="price" style="padding:13px 16px;font-size:22px;font-weight:800;color:#1d4ed8;vertical-align:middle;">${formattedPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Kredensial API ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#f0f5fc;border:1px solid #d4e0f3;border-radius:12px;margin-bottom:16px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:14px;">KREDENSIAL API ANDA</div>
                    <div style="font-size:12.5px;font-weight:700;color:#0f172a;margin-bottom:7px;">&#128273; API Key (Rahasia)</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                           style="background-color:#0c1829;border-radius:8px;margin-bottom:14px;">
                      <tr>
                        <td style="padding:12px 15px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12.5px;color:#38bdf8;font-weight:600;word-break:break-all;letter-spacing:0.2px;">${apiKey}</td>
                      </tr>
                    </table>
                    <div style="font-size:12.5px;font-weight:700;color:#0f172a;margin-bottom:7px;">&#128279; Base URL Gateway</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                           style="background-color:#dde8f5;border:1px solid #c5d9ed;border-radius:8px;">
                      <tr>
                        <td style="padding:11px 15px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12.5px;color:#1e3a5f;font-weight:600;word-break:break-all;">${gatewayUrl}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Tips Keamanan ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size:18px;vertical-align:top;padding-right:10px;line-height:1.3;">&#128161;</td>
                        <td style="vertical-align:top;">
                          <div style="font-size:13px;font-weight:700;color:#78350f;margin-bottom:3px;">Tips Keamanan</div>
                          <div style="font-size:12.5px;color:#92400e;line-height:1.5;">Simpan API Key Anda dengan aman. Jangan bagikan kepada siapa pun.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Footer ─── -->
              <div style="text-align:center;font-size:12.5px;color:#94a3b8;line-height:1.8;border-top:1px solid #f1f5f9;padding-top:20px;">
                <div style="color:#64748b;font-weight:500;margin-bottom:5px;">Terima kasih telah menggunakan layanan kami.</div>
                <div>
                  <a href="https://wa.me/${adminWaRaw}" target="_blank" style="color:#1d4ed8;font-weight:600;text-decoration:none;">WhatsApp Admin</a>
                  &nbsp;&bull;&nbsp;
                  <a href="${officialWeb}" target="_blank" style="color:#1d4ed8;font-weight:600;text-decoration:none;">api.tokotokenai.com</a>
                </div>
              </div>

            </td>
          </tr>

          <!-- WAVE BOTTOM -->
          <tr>
            <td style="line-height:0;font-size:0;padding:0;">
              <svg viewBox="0 0 560 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
                <path d="M0 14C150 30 370 2 560 16V32H0V14Z" fill="#1e6beb" fill-opacity="0.22"/>
                <path d="M0 20C130 8 350 30 560 16V32H0V20Z" fill="#0f4fc7"/>
              </svg>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${gmailUser}>`,
    to: customerEmail,
    subject: `Invoice Pembayaran Berhasil — ${invoiceId}`,
    html: htmlContent,
  });
  console.log(`[EMAIL BERHASIL] ID: ${info.messageId} dikirim ke ${customerEmail}`);

  return { status: "sent", messageId: info.messageId };
}
