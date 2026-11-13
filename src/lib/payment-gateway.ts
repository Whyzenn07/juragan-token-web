import crypto from "crypto";

export type PaymentGatewayProvider = "tripay" | "midtrans" | "xendit" | "manual";

export type GatewayTransactionInput = {
  invoiceId: string;
  amountIdr: number;
  methodId: string;
  packageName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
};

export type GatewayTransactionOutput = {
  provider: PaymentGatewayProvider;
  isLive: boolean;
  reference?: string;
  paymentUrl?: string;
  qrString?: string;
  qrUrl?: string;
  payCode?: string;
  rawError?: string;
};

export type PaymentGatewayStatus = {
  provider: PaymentGatewayProvider;
  isLiveConfigured: boolean;
  demoMode: boolean;
  sandbox: boolean;
  webhookEndpoint: string;
};

/**
 * Deteksi otomatis konfigurasi Payment Gateway dari Environment Variables.
 * Jika kredensial belum diisi oleh tim developer, sistem otomatis berjalan di mode "manual" (Static QRIS/VA + Simulasi).
 */
export function getPaymentGatewayStatus(): PaymentGatewayStatus {
  const explicitProvider = (process.env.PAYMENT_GATEWAY_PROVIDER || "").trim().toLowerCase();
  const tripayKey = (process.env.TRIPAY_API_KEY || "").trim();
  const tripayPrivate = (process.env.TRIPAY_PRIVATE_KEY || "").trim();
  const tripayMerchant = (process.env.TRIPAY_MERCHANT_CODE || "").trim();
  const midtransKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  const xenditKey = (process.env.XENDIT_SECRET_KEY || "").trim();

  let provider: PaymentGatewayProvider = "manual";
  let isLiveConfigured = false;

  if (explicitProvider === "tripay" || (!explicitProvider && tripayKey && tripayPrivate && tripayMerchant)) {
    provider = "tripay";
    isLiveConfigured = Boolean(tripayKey && tripayPrivate && tripayMerchant);
  } else if (explicitProvider === "midtrans" || (!explicitProvider && midtransKey)) {
    provider = "midtrans";
    isLiveConfigured = Boolean(midtransKey);
  } else if (explicitProvider === "xendit" || (!explicitProvider && xenditKey)) {
    provider = "xendit";
    isLiveConfigured = Boolean(xenditKey);
  }

  const demoEnv = (process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase();
  const demoMode = demoEnv === "true" || !isLiveConfigured;
  const sandbox = (process.env.PAYMENT_GATEWAY_SANDBOX || "false").toLowerCase() === "true";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app").replace(/\/+$/, "");

  return {
    provider,
    isLiveConfigured,
    demoMode,
    sandbox,
    webhookEndpoint: `${baseUrl}/api/webhooks/payment`,
  };
}

/**
 * Pemetaan ID metode pembayaran internal Juragan Token ke kode channel Tripay
 */
function mapMethodToTripayChannel(methodId: string): string {
  const m = methodId.toLowerCase();
  if (m === "qris") return "QRIS2";
  if (m.includes("bca")) return "BCAVA";
  if (m.includes("mandiri")) return "MANDIRIVA";
  if (m.includes("bri")) return "BRIVA";
  if (m.includes("bni")) return "BNIVA";
  if (m.includes("permata")) return "PERMATAVA";
  if (m.includes("cimb")) return "CIMBVA";
  if (m.includes("bsi")) return "BSIVA";
  if (m.includes("ovo")) return "OVO";
  if (m.includes("dana")) return "DANA";
  if (m.includes("shopeepay")) return "SHOPEEPAY";
  return "QRIS2";
}

/**
 * Adapter Outbound Payment Gateway (Plug-and-Play).
 * - Jika kredensial Tripay / Midtrans / Xendit sudah diisi di .env, otomatis membuat transaksi resmi.
 * - Jika belum diisi, langsung mengembalikan mode "manual" tanpa error agar UI QRIS/VA bawaan tetap berjalan.
 */
export async function createGatewayTransaction(
  input: GatewayTransactionInput
): Promise<GatewayTransactionOutput> {
  const status = getPaymentGatewayStatus();

  if (!status.isLiveConfigured || status.provider === "manual") {
    return {
      provider: "manual",
      isLive: false,
    };
  }

  try {
    // 1. TRIPAY ADAPTER
    if (status.provider === "tripay") {
      const apiKey = process.env.TRIPAY_API_KEY!.trim();
      const privateKey = process.env.TRIPAY_PRIVATE_KEY!.trim();
      const merchantCode = process.env.TRIPAY_MERCHANT_CODE!.trim();
      const endpoint = status.sandbox
        ? "https://tripay.co.id/api-sandbox/transaction/create"
        : "https://tripay.co.id/api/transaction/create";

      const signature = crypto
        .createHmac("sha256", privateKey)
        .update(`${merchantCode}${input.invoiceId}${input.amountIdr}`)
        .digest("hex");

      const payload = {
        method: mapMethodToTripayChannel(input.methodId),
        merchant_ref: input.invoiceId,
        amount: input.amountIdr,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || "081226983990",
        order_items: [
          {
            sku: input.invoiceId,
            name: input.packageName,
            price: input.amountIdr,
            quantity: 1,
          },
        ],
        callback_url: status.webhookEndpoint,
        expired_time: Math.floor(Date.now() / 1000) + 15 * 60,
        signature,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.data) {
        return {
          provider: "tripay",
          isLive: true,
          reference: data.data.reference,
          paymentUrl: data.data.checkout_url,
          qrString: data.data.qr_string,
          qrUrl: data.data.qr_url,
          payCode: data.data.pay_code,
        };
      }
      return {
        provider: "tripay",
        isLive: false,
        rawError: data?.message || `Tripay HTTP ${res.status}`,
      };
    }

    // 2. MIDTRANS SNAP ADAPTER
    if (status.provider === "midtrans") {
      const serverKey = process.env.MIDTRANS_SERVER_KEY!.trim();
      const endpoint = status.sandbox
        ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
        : "https://app.midtrans.com/snap/v1/transactions";
      const basicAuth = Buffer.from(`${serverKey}:`).toString("base64");

      const payload = {
        transaction_details: {
          order_id: input.invoiceId,
          gross_amount: input.amountIdr,
        },
        customer_details: {
          first_name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone || "081226983990",
        },
        item_details: [
          {
            id: input.invoiceId,
            price: input.amountIdr,
            quantity: 1,
            name: input.packageName.slice(0, 50),
          },
        ],
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.redirect_url) {
        return {
          provider: "midtrans",
          isLive: true,
          reference: data.token,
          paymentUrl: data.redirect_url,
        };
      }
      return {
        provider: "midtrans",
        isLive: false,
        rawError: Array.isArray(data?.error_messages) ? data.error_messages.join(", ") : `Midtrans HTTP ${res.status}`,
      };
    }

    // 3. XENDIT INVOICE ADAPTER
    if (status.provider === "xendit") {
      const secretKey = process.env.XENDIT_SECRET_KEY!.trim();
      const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

      const payload = {
        external_id: input.invoiceId,
        amount: input.amountIdr,
        payer_email: input.customerEmail,
        description: `Juragan Token - ${input.packageName}`,
        invoice_duration: 900,
        currency: "IDR",
        customer: {
          given_names: input.customerName,
          email: input.customerEmail,
        },
      };

      const res = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.invoice_url) {
        return {
          provider: "xendit",
          isLive: true,
          reference: data.id,
          paymentUrl: data.invoice_url,
        };
      }
      return {
        provider: "xendit",
        isLive: false,
        rawError: data?.message || `Xendit HTTP ${res.status}`,
      };
    }
  } catch (err) {
    console.warn("[PAYMENT GATEWAY ADAPTER] Fallback ke mode manual karena error koneksi:", err);
  }

  return {
    provider: "manual",
    isLive: false,
  };
}

