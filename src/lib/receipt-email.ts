import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

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
    gatewayUrl: rawGatewayUrl = process.env.GATEWAY_BASE_URL || "https://api.tokotokenai.com/v1",
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

  // Lampirkan badge centang sukses resolusi tinggi (Retina) sebagai inline CID image
  const badgePath = path.join(process.cwd(), "public", "assets", "email", "success-check-badge.png");
  const attachments = fs.existsSync(badgePath)
    ? [
        {
          filename: "success-check-badge.png",
          path: badgePath,
          cid: "success-check-badge@juragantoken",
        },
      ]
    : [];

  // ─── Template Email HTML — Clean Fintech Receipt v4 ───────────────────────
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Pembayaran Berhasil</title>
  <style>
    @media only screen and (max-width: 520px) {
      .ew td[align="center"] { padding: 14px 6px !important; }
      .eh { padding: 20px 16px !important; }
      .eb { padding: 24px 16px 20px !important; }
      .slogan { font-size: 11px !important; }
      .price { font-size: 19px !important; }
      .h1   { font-size: 20px !important; }
      .inv-num { font-size: 10.5px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.5;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="ew" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:28px 10px;">

        <!-- ░░░ CARD ░░░ -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width:540px;width:100%;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.09);border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td class="eh" style="background:linear-gradient(135deg,#0a2d75 0%,#1346c0 55%,#1e6beb 100%);padding:24px 26px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;line-height:1.1;">QRIS</div>
                    <div style="color:rgba(255,255,255,0.72);font-size:9px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;margin-top:3px;">Payment Gateway</div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div class="slogan" style="color:rgba(255,255,255,0.88);font-style:italic;font-size:12px;font-weight:500;text-align:right;line-height:1.4;">
                      Transaksi Aman,<br>Mudah &amp; Terpercaya
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="eb" style="padding:30px 26px 24px;">

              <!-- ✅ Authentic Fintech Success Badge (Identik dengan PaymentSuccessMark Website) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
                <tr>
                  <td align="center" valign="middle" style="text-align:center;">
                    <img src="cid:success-check-badge@juragantoken"
                         width="84"
                         height="84"
                         alt="Pembayaran Berhasil"
                         style="display:block;margin:0 auto;width:84px;height:84px;max-width:84px;border:0;outline:none;text-decoration:none;" />
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <div style="text-align:center;margin-bottom:24px;">
                <div class="h1" style="font-size:23px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;margin-bottom:6px;">
                  Pembayaran <span style="color:#00b37e;">Berhasil!</span>
                </div>
                <div style="font-size:13.5px;color:#64748b;font-weight:500;">
                  Halo <strong style="color:#0f172a;">${customerName}</strong>, pembayaran Anda telah dikonfirmasi.
                </div>
              </div>

              <!-- ─── Detail Invoice ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:12px;">DETAIL INVOICE</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;padding:7px 0;border-bottom:1px solid #f1f5f9;width:38%;">No. Invoice</td>
                        <td align="right" class="inv-num" style="font-size:11.5px;color:#0f172a;font-weight:700;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;padding:7px 0;border-bottom:1px solid #f1f5f9;white-space:nowrap;letter-spacing:0.2px;">${invoiceId}</td>
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
                           style="margin-top:12px;background-color:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                      <tr>
                        <td style="padding:12px 14px;font-size:13.5px;font-weight:700;color:#1e293b;vertical-align:middle;">Total Pembayaran</td>
                        <td align="right" class="price" style="padding:12px 14px;font-size:21px;font-weight:800;color:#1d4ed8;vertical-align:middle;">${formattedPrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Kredensial API ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#f0f5fc;border:1px solid #d4e0f3;border-radius:12px;margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:12px;">KREDENSIAL API ANDA</div>
                    <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;">&#128273; API Key (Rahasia)</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                           style="background-color:#0c1829;border-radius:8px;margin-bottom:12px;">
                      <tr>
                        <td style="padding:11px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#38bdf8;font-weight:600;word-break:break-all;letter-spacing:0.2px;">${apiKey}</td>
                      </tr>
                    </table>
                    <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;">&#128279; Base URL Gateway</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                           style="background-color:#dde8f5;border:1px solid #c5d9ed;border-radius:8px;">
                      <tr>
                        <td style="padding:10px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#1e3a5f;font-weight:600;word-break:break-all;">${gatewayUrl}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Tips Keamanan ─── -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                     style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:22px;">
                <tr>
                  <td style="padding:12px 14px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size:17px;vertical-align:top;padding-right:10px;line-height:1.3;">&#128161;</td>
                        <td style="vertical-align:top;">
                          <div style="font-size:12.5px;font-weight:700;color:#78350f;margin-bottom:2px;">Tips Keamanan</div>
                          <div style="font-size:12px;color:#92400e;line-height:1.5;">Simpan API Key Anda dengan aman. Jangan bagikan kepada siapa pun.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ─── Footer ─── -->
              <div style="text-align:center;font-size:12px;color:#94a3b8;line-height:1.75;border-top:1px solid #f1f5f9;padding-top:18px;">
                <div style="color:#64748b;font-weight:500;margin-bottom:4px;">Terima kasih telah menggunakan layanan kami.</div>
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
              <svg viewBox="0 0 540 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
                <path d="M0 13C140 28 350 2 540 15V30H0V13Z" fill="#1e6beb" fill-opacity="0.22"/>
                <path d="M0 19C120 7 330 28 540 15V30H0V19Z" fill="#0f4fc7"/>
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
    attachments,
  });
  console.log(`[EMAIL BERHASIL] ID: ${info.messageId} dikirim ke ${customerEmail}`);

  return { status: "sent", messageId: info.messageId };
}
