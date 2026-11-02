import type { Order, KeyRecord } from "./store";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Sinkronisasi data pesanan secara real-time ke Supabase PostgreSQL
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
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
export async function syncKeyToSupabase(key: KeyRecord): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/keys`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        hash: key.hash,
        last4: key.last4,
        order_id: key.orderId,
        plan_name: key.planName,
        est_package: key.estPackage,
        balance_idr: key.balanceIdr,
        status: key.status,
        created_at: key.createdAt,
      }),
    });

    if (res.ok) {
      console.log(`[SUPABASE SYNC OK] Key ${key.last4} berhasil disinkronkan ke cloud.`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn(`[SUPABASE SYNC WARNING] Gagal sinkronisasi key ${key.last4}:`, err);
      return false;
    }
  } catch (err) {
    console.warn(`[SUPABASE SYNC NETWORK] Terkendala koneksi ke Supabase:`, err);
    return false;
  }
}
