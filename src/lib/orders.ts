import { paymentMethods, retailPackages } from "@/data/catalog";
import { generateApiKey, generateInvoiceId, generateOrderToken, safeEqualHash, sha256 } from "./keys";
import { mutate, query, type Order } from "./store";
import { sendReceiptEmail } from "./receipt-email";
import { syncOrderToSupabase, syncKeyToSupabase } from "./supabase-sync";

export const ORDER_TTL_MS = 15 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateOrderInput = {
  packageId?: string;
  methodId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  existingApiKey?: string;
  modelName?: string;
  estToken?: string;
};

export type OrderResult<T> = { ok: true; value: T } | { ok: false; status: number; error: string };

/** Harga selalu dihitung ulang di server dari katalog; angka dari klien tidak dipercaya. */
export async function createOrder(
  input: CreateOrderInput
): Promise<OrderResult<{ invoiceId: string; orderToken: string; totalIdr: number }>> {
  const customerName = (input.customerName ?? "").trim().slice(0, 80);
  const customerEmail = (input.customerEmail ?? "").trim().slice(0, 120);
  const customerPhone = (input.customerPhone ?? "").trim().slice(0, 20);

  if (!customerName) return { ok: false, status: 400, error: "Nama lengkap wajib diisi." };
  if (!EMAIL_RE.test(customerEmail)) return { ok: false, status: 400, error: "Format email tidak valid. Harap gunakan alamat email aktif yang tepat." };

  const emailDomain = customerEmail.split("@")[1]?.toLowerCase() || "";
  const invalidDomainTypos = ["gmai.com", "gamil.com", "gmial.com", "gmaill.com", "gmal.com", "gemail.com", "yaho.com", "yahooo.com", "yahu.com", "hotmial.com", "hotmaill.com", "outlok.com"];
  if (invalidDomainTypos.includes(emailDomain)) {
    return { ok: false, status: 400, error: `Domain email @${emailDomain} tidak valid. Harap gunakan alamat email aktif yang tepat (misal: @gmail.com) agar kredensial API dapat terkirim.` };
  }

  const pkg = retailPackages.find((p) => p.id === input.packageId);
  if (!pkg) return { ok: false, status: 400, error: "Paket tidak ditemukan." };
  const method = paymentMethods.find((m) => m.id === input.methodId);
  if (!method) return { ok: false, status: 400, error: "Metode pembayaran tidak valid." };

  let targetKeyHash: string | undefined;
  let isTopUp = false;

  if (input.existingApiKey?.trim()) {
    const rawKey = input.existingApiKey.trim();
    if (!rawKey.startsWith("jt-live-") || rawKey.length < 20 || rawKey.length > 80) {
      return { ok: false, status: 400, error: "Format API Key untuk top-up tidak valid (harus diawali 'jt-live-')." };
    }
    targetKeyHash = sha256(rawKey);
    isTopUp = true;

    // Verifikasi keberadaan key di local store atau Supabase
    const localKey = await query((db) => db.keys[targetKeyHash!]);
    if (!localKey && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const sbRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/keys?hash=eq.${targetKeyHash}&select=hash`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        );
        const rows = await sbRes.json();
        if (!rows || rows.length === 0) {
          return { ok: false, status: 404, error: "API Key untuk top-up tidak ditemukan di server Juragan Token." };
        }
      } catch {
        // Fallback jika network error
      }
    } else if (!localKey) {
      return { ok: false, status: 404, error: "API Key untuk top-up tidak ditemukan di server Juragan Token." };
    }
  }

  const invoiceId = generateInvoiceId();
  const orderToken = generateOrderToken();
  const estPackage = (input.estToken ?? "").trim() || pkg.estToken;
  const packageName = input.modelName?.trim()
    ? `${pkg.name} (${input.modelName.trim()})`
    : pkg.name;

  const order: Order = {
    id: invoiceId,
    tokenHash: sha256(orderToken),
    customerName,
    customerEmail,
    customerPhone,
    packageId: pkg.id,
    packageName,
    estPackage,
    baseIdr: pkg.priceIdr,
    feeIdr: method.feeAmount ?? 0,
    totalIdr: pkg.priceIdr + (method.feeAmount ?? 0),
    methodId: method.id,
    methodName: method.name,
    status: "pending",
    createdAt: new Date().toISOString(),
    emailStatus: "none",
    targetKeyHash,
    isTopUp,
  };
  await mutate((db) => {
    db.orders[invoiceId] = order;
  });
  // Sinkronisasi otomatis ke Supabase di background
  syncOrderToSupabase(order).catch(() => {});
  return { ok: true, value: { invoiceId, orderToken, totalIdr: order.totalIdr } };
}

export function tokenMatches(order: Order, token: string | null): boolean {
  if (!token) return false;
  return safeEqualHash(order.tokenHash, sha256(token));
}

export type PublicOrder = {
  invoiceId: string;
  status: Order["status"];
  packageName: string;
  methodName: string;
  totalIdr: number;
  createdAt: string;
  paidAt?: string;
  emailStatus: Order["emailStatus"];
  emailMessage?: string;
  apiKey?: string;
  isTopUp?: boolean;
  keyHash?: string;
};

function toPublic(order: Order, apiKey?: string): PublicOrder {
  return {
    invoiceId: order.id,
    status: order.status,
    packageName: order.packageName,
    methodName: order.methodName,
    totalIdr: order.totalIdr,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    emailStatus: order.emailStatus,
    emailMessage: order.emailMessage,
    apiKey,
    isTopUp: order.isTopUp,
    keyHash: order.keyHash,
  };
}

export async function readOrder(id: string, token: string | null): Promise<OrderResult<PublicOrder>> {
  const probe = await query((db) => db.orders[id]);
  if (!probe || !tokenMatches(probe, token)) return { ok: false, status: 404, error: "Order tidak ditemukan." };

  return mutate((db) => {
    const order = db.orders[id];
    if (order.status === "pending" && Date.now() - Date.parse(order.createdAt) > ORDER_TTL_MS) {
      order.status = "expired";
    }
    let apiKey: string | undefined;
    if (order.status === "paid" && order.pendingReveal) {
      apiKey = order.pendingReveal;
      delete order.pendingReveal;
    }
    return { ok: true as const, value: toPublic(order, apiKey) };
  });
}

/** Idempoten: memanggil dua kali tidak menerbitkan kunci kedua. */
export async function confirmOrder(id: string): Promise<OrderResult<PublicOrder>> {
  const issued = await mutate((db): OrderResult<{ order: Order; apiKey?: string }> => {
    const order = db.orders[id];
    if (!order) return { ok: false, status: 404, error: "Order tidak ditemukan." };
    if (order.status === "paid") return { ok: true, value: { order } };
    if (order.status === "expired" || Date.now() - Date.parse(order.createdAt) > ORDER_TTL_MS) {
      order.status = "expired";
      return { ok: false, status: 410, error: "Order sudah kedaluwarsa." };
    }

    if (order.isTopUp && order.targetKeyHash) {
      const hash = order.targetKeyHash;
      let existingKey = db.keys[hash];
      if (existingKey) {
        existingKey.balanceIdr += order.baseIdr;
        existingKey.planName = order.packageName;
        existingKey.estPackage = order.estPackage;
      } else {
        existingKey = {
          hash,
          last4: "xxxx",
          orderId: order.id,
          planName: order.packageName,
          estPackage: order.estPackage,
          balanceIdr: order.baseIdr,
          createdAt: new Date().toISOString(),
          status: "active",
        };
        db.keys[hash] = existingKey;
      }
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.keyHash = hash;
      return { ok: true, value: { order } };
    }

    const apiKey = generateApiKey();
    const hash = sha256(apiKey);
    db.keys[hash] = {
      hash,
      last4: apiKey.slice(-4),
      orderId: order.id,
      planName: order.packageName,
      estPackage: order.estPackage,
      balanceIdr: order.baseIdr,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    order.keyHash = hash;
    order.pendingReveal = apiKey;
    return { ok: true, value: { order, apiKey } };
  });

  if (!issued.ok) return issued;
  const { order, apiKey } = issued.value;

  // Email dikirim saat konfirmasi sukses (baik kunci baru maupun top-up)
  if (apiKey || order.isTopUp) {
    let emailStatus: Order["emailStatus"] = "error";
    let emailMessage: string | undefined;
    try {
      const result = await sendReceiptEmail({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        packageName: order.packageName,
        priceIdr: order.totalIdr,
        paymentMethod: order.methodName,
        apiKey: apiKey || (order.targetKeyHash ? "jt-live-•••••••• (Kunci Tetap)" : ""),
        invoiceId: order.id,
        isTopUp: order.isTopUp,
      });
      emailStatus = result.status;
      emailMessage = result.message;
    } catch (err) {
      emailMessage = err instanceof Error ? err.message : "Gagal mengirim email.";
      console.error("[EMAIL ERROR]", emailMessage);
    }
    await mutate((db) => {
      const o = db.orders[id];
      if (o) {
        o.emailStatus = emailStatus;
        o.emailMessage = emailMessage;
      }
    });
  }

  const fresh = await query((db) => db.orders[id]);
  const freshKey = order.keyHash ? await query((db) => db.keys[order.keyHash!]) : undefined;
  if (fresh) syncOrderToSupabase(fresh).catch(() => {});
  if (freshKey) syncKeyToSupabase(freshKey).catch(() => {});

  return { ok: true, value: toPublic(fresh ?? order) };
}
