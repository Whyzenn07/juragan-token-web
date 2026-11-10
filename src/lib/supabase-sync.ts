import type { Order, KeyRecord } from "./store";
import { query, mutate } from "./store";

export function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  const isServiceRole = Boolean(process.env.SUPABASE_SECRET_KEY?.trim());
  return { url, key, isConfigured: Boolean(url && key), isServiceRole };
}

function getHeaders(key: string, prefer?: string) {
  const h: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) h["Prefer"] = prefer;
  return h;
}

export type SupabaseHealth = {
  connected: boolean;
  url: string;
  isServiceRole: boolean;
  latencyMs: number;
  tables: {
    orders: boolean;
    keys: boolean;
    usageLogs: boolean;
  };
  error?: string;
};

/**
 * Periksa status kesehatan koneksi dan ketersediaan tabel di Supabase
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const { url, key, isConfigured, isServiceRole } = getSupabaseConfig();
  if (!isConfigured) {
    return {
      connected: false,
      url: url || "(belum diisi)",
      isServiceRole: false,
      latencyMs: 0,
      tables: { orders: false, keys: false, usageLogs: false },
      error: "Supabase URL atau API Key belum dikonfigurasi di .env.local",
    };
  }

  const start = Date.now();
  const tables = { orders: false, keys: false, usageLogs: false };

  try {
    const [ordersRes, keysRes, logsRes] = await Promise.all([
      fetch(`${url}/rest/v1/orders?select=id&limit=1`, { headers: getHeaders(key) }).catch(() => null),
      fetch(`${url}/rest/v1/keys?select=hash&limit=1`, { headers: getHeaders(key) }).catch(() => null),
      fetch(`${url}/rest/v1/usage_logs?select=id&limit=1`, { headers: getHeaders(key) }).catch(() => null),
    ]);

    tables.orders = Boolean(ordersRes && ordersRes.ok);
    tables.keys = Boolean(keysRes && keysRes.ok);
    tables.usageLogs = Boolean(logsRes && logsRes.ok);

    const connected = tables.orders || tables.keys;
    return {
      connected,
      url,
      isServiceRole,
      latencyMs: Date.now() - start,
      tables,
    };
  } catch (err: any) {
    return {
      connected: false,
      url,
      isServiceRole,
      latencyMs: Date.now() - start,
      tables,
      error: err?.message || "Gagal menghubungi Supabase REST API",
    };
  }
}

/**
 * Sinkronisasi data pesanan secara real-time ke Supabase PostgreSQL
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: getHeaders(key, "resolution=merge-duplicates"),
      body: JSON.stringify({
        id: order.id,
        token_hash: order.tokenHash,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone || null,
        package_id: order.packageId,
        package_name: order.packageName,
        est_package: order.estPackage || null,
        base_idr: order.baseIdr,
        fee_idr: order.feeIdr,
        total_idr: order.totalIdr,
        method_id: order.methodId,
        method_name: order.methodName,
        status: order.status,
        created_at: order.createdAt,
        paid_at: order.paidAt || null,
        key_hash: order.keyHash || null,
        pending_reveal: order.pendingReveal || null,
        email_status: order.emailStatus,
        email_message: order.emailMessage || null,
      }),
    });

    if (res.ok) {
      console.log(`[SUPABASE SYNC OK] Order ${order.id} berhasil disinkronkan ke cloud.`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`[SUPABASE SYNC WARNING] Gagal sinkronisasi order ${order.id}:`, err);
      return false;
    }
  } catch (err) {
    console.warn(`[SUPABASE SYNC NETWORK] Terkendala koneksi ke Supabase:`, err);
    return false;
  }
}

/**
 * Sinkronisasi data kunci API & saldo secara real-time ke Supabase PostgreSQL
 */
export async function syncKeyToSupabase(keyRecord: KeyRecord): Promise<boolean> {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${url}/rest/v1/keys`, {
      method: "POST",
      headers: getHeaders(key, "resolution=merge-duplicates"),
      body: JSON.stringify({
        hash: keyRecord.hash,
        last4: keyRecord.last4,
        order_id: keyRecord.orderId || null,
        plan_name: keyRecord.planName,
        est_package: keyRecord.estPackage || null,
        balance_idr: keyRecord.balanceIdr,
        status: keyRecord.status,
        created_at: keyRecord.createdAt,
      }),
    });

    if (res.ok) {
      console.log(`[SUPABASE SYNC OK] Key ${keyRecord.last4} berhasil disinkronkan ke cloud.`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`[SUPABASE SYNC WARNING] Gagal sinkronisasi key ${keyRecord.last4}:`, err);
      return false;
    }
  } catch (err) {
    console.warn(`[SUPABASE SYNC NETWORK] Terkendala koneksi ke Supabase:`, err);
    return false;
  }
}

/**
 * Catat pemakaian inferensi AI ke tabel public.usage_logs
 */
export async function syncUsageLogToSupabase(log: {
  keyHash: string;
  keyLast4: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costIdr: number;
  remainingBalanceIdr: number;
  createdAt: string;
}): Promise<boolean> {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${url}/rest/v1/usage_logs`, {
      method: "POST",
      headers: getHeaders(key),
      body: JSON.stringify({
        key_hash: log.keyHash,
        key_last4: log.keyLast4,
        model: log.model,
        provider: log.provider,
        prompt_tokens: log.promptTokens,
        completion_tokens: log.completionTokens,
        total_tokens: log.totalTokens,
        cost_idr: log.costIdr,
        remaining_balance_idr: log.remainingBalanceIdr,
        created_at: log.createdAt,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sinkronisasi dua arah (Bidirectional Sync) antara Supabase Cloud & Local JSON Store
 */
export async function syncBidirectionalStore(): Promise<{
  syncedKeys: number;
  syncedOrders: number;
  cloudKeysTotal: number;
  cloudOrdersTotal: number;
  localKeysTotal: number;
  localOrdersTotal: number;
}> {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error("Supabase belum terkonfigurasi di environment variable.");
  }

  // 1. Ambil data lokal
  const localDb = await query((db) => ({
    keys: { ...db.keys },
    orders: { ...db.orders },
  }));

  // 2. Ambil data dari Supabase Cloud
  const [keysRes, ordersRes] = await Promise.all([
    fetch(`${url}/rest/v1/keys?select=*`, { headers: getHeaders(key) }),
    fetch(`${url}/rest/v1/orders?select=*`, { headers: getHeaders(key) }),
  ]);

  const cloudKeys: any[] = keysRes.ok ? await keysRes.json() : [];
  const cloudOrders: any[] = ordersRes.ok ? await ordersRes.json() : [];

  let syncedKeys = 0;
  let syncedOrders = 0;

  // 3. Push data lokal yang belum ada di Cloud ke Supabase
  // Order harus dikirim lebih dulu agar foreign key keys.order_id terpenuhi
  for (const localOrder of Object.values(localDb.orders)) {
    const exists = cloudOrders.some((co) => co.id === localOrder.id);
    if (!exists) {
      const ok = await syncOrderToSupabase(localOrder);
      if (ok) syncedOrders++;
    }
  }

  for (const localKey of Object.values(localDb.keys)) {
    const exists = cloudKeys.some((ck) => ck.hash === localKey.hash);
    if (!exists) {
      const ok = await syncKeyToSupabase(localKey);
      if (ok) syncedKeys++;
    }
  }

  // 4. Pull data cloud ke Local Store untuk memperkaya cache
  await mutate((db) => {
    for (const ck of cloudKeys) {
      if (!db.keys[ck.hash]) {
        db.keys[ck.hash] = {
          hash: ck.hash,
          last4: ck.last4,
          orderId: ck.order_id,
          planName: ck.plan_name,
          estPackage: ck.est_package,
          balanceIdr: ck.balance_idr,
          status: ck.status,
          createdAt: ck.created_at,
        };
      }
    }
    for (const co of cloudOrders) {
      if (!db.orders[co.id]) {
        db.orders[co.id] = {
          id: co.id,
          tokenHash: co.token_hash,
          customerName: co.customer_name,
          customerEmail: co.customer_email,
          customerPhone: co.customer_phone || "",
          packageId: co.package_id,
          packageName: co.package_name,
          estPackage: co.est_package || "",
          baseIdr: co.base_idr,
          feeIdr: co.fee_idr || 0,
          totalIdr: co.total_idr,
          methodId: co.method_id,
          methodName: co.method_name,
          status: co.status,
          createdAt: co.created_at,
          paidAt: co.paid_at,
          keyHash: co.key_hash,
          emailStatus: co.email_status || "none",
          emailMessage: co.email_message,
        };
      }
    }
  });

  return {
    syncedKeys,
    syncedOrders,
    cloudKeysTotal: cloudKeys.length,
    cloudOrdersTotal: cloudOrders.length,
    localKeysTotal: Object.keys(localDb.keys).length,
    localOrdersTotal: Object.keys(localDb.orders).length,
  };
}
