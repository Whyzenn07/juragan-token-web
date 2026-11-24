import {
  generateApiKey,
  generateInvoiceId,
  generateOrderToken,
  maskKey,
  sha256,
} from "./keys";
import { retailPackages } from "@/data/catalog";
import { ensureLocalDevSeed, recordAdminAudit } from "./auth";
import { sendReceiptEmail } from "./receipt-email";
import {
  mutate,
  query,
  type AccountTier,
  type AdminAuditLog,
  type KeyRecord,
  type KeyStatus,
  type Order,
  type OrderStatus,
  type UserProfile,
  type UserRole,
} from "./store";
import {
  getSupabaseConfig,
  rowToKey,
  rowToOrder,
  syncKeyToSupabase,
  syncOrderToSupabase,
} from "./supabase-sync";

function getSupaHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function fetchAllFromSupabase<T>(table: string, queryStr: string, mapper: (row: Record<string, unknown>) => T): Promise<T[] | null> {
  const { url, key, isConfigured, isServiceRole } = getSupabaseConfig();
  if (!isConfigured || !isServiceRole) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${queryStr}`, {
      headers: getSupaHeaders(key),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return null;
    return rows.map(mapper);
  } catch {
    return null;
  }
}

export async function listAllOrders(): Promise<Order[]> {
  await ensureLocalDevSeed();
  const remote = await fetchAllFromSupabase<Order>(
    "orders",
    "select=*&order=created_at.desc&limit=200",
    (r) => rowToOrder(r)
  );
  if (remote) return remote;
  const local = await query((db) => Object.values(db.orders));
  return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllKeys(): Promise<KeyRecord[]> {
  await ensureLocalDevSeed();
  const remote = await fetchAllFromSupabase<KeyRecord>(
    "keys",
    "select=*&order=created_at.desc&limit=300",
    (r) => rowToKey(r)
  );
  if (remote) return remote;
  const local = await query((db) => Object.values(db.keys));
  return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllProfiles(): Promise<UserProfile[]> {
  await ensureLocalDevSeed();
  const remote = await fetchAllFromSupabase<UserProfile>(
    "profiles",
    "select=*&order=created_at.desc&limit=300",
    (r) => ({
      id: String(r.id ?? ""),
      email: String(r.email ?? "").toLowerCase(),
      fullName: String(r.full_name ?? ""),
      avatarUrl: r.avatar_url ? String(r.avatar_url) : undefined,
      role: r.role === "admin" ? "admin" : "user",
      createdAt: String(r.created_at ?? new Date().toISOString()),
      updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    })
  );
  if (remote) return remote;
  const local = await query((db) =>
    Object.values(db.users ?? {}).map<UserProfile>((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))
  );
  return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
  await ensureLocalDevSeed();
  const remote = await fetchAllFromSupabase<AdminAuditLog>(
    "admin_audit_logs",
    `select=*&order=created_at.desc&limit=${limit}`,
    (r) => ({
      id: String(r.id ?? ""),
      adminId: String(r.admin_id ?? ""),
      adminEmail: String(r.admin_email ?? ""),
      action: String(r.action ?? ""),
      targetType: (r.target_type === "key" || r.target_type === "user" ? r.target_type : "order") as "order" | "key" | "user",
      targetId: String(r.target_id ?? ""),
      details: (typeof r.details === "object" && r.details !== null ? r.details : {}) as Record<string, unknown>,
      createdAt: String(r.created_at ?? new Date().toISOString()),
    })
  );
  if (remote) return remote;
  const local = await query((db) => (db.auditLogs ?? []).slice(0, limit));
  return local;
}

export type EnrichedKey = KeyRecord & {
  maskedKey: string;
  ownerEmail: string;
  ownerName: string;
};

export type EnrichedUser = UserProfile & {
  keysCount: number;
  activeKeysCount: number;
  totalBalanceIdr: number;
  ordersCount: number;
  paidOrdersCount: number;
  keys: EnrichedKey[];
};

export async function getEnrichedKeys(filters?: { status?: string; search?: string }): Promise<EnrichedKey[]> {
  const [keys, orders, profiles] = await Promise.all([
    listAllKeys(),
    listAllOrders(),
    listAllProfiles(),
  ]);

  const orderById = new Map(orders.map((o) => [o.id, o]));
  const profileByEmail = new Map(profiles.map((p) => [p.email.toLowerCase(), p]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  let enriched: EnrichedKey[] = keys.map((k) => {
    const linkedOrder = k.orderId ? orderById.get(k.orderId) : undefined;
    const ownerProfile =
      (k.userId ? profileById.get(k.userId) : undefined) ||
      (k.userEmail ? profileByEmail.get(k.userEmail.toLowerCase()) : undefined) ||
      (linkedOrder?.customerEmail ? profileByEmail.get(linkedOrder.customerEmail.toLowerCase()) : undefined);

    const ownerEmail =
      k.userEmail || ownerProfile?.email || linkedOrder?.customerEmail || "belum-ditautkan";
    const ownerName =
      ownerProfile?.fullName || linkedOrder?.customerName || ownerEmail.split("@")[0] || "Pengguna";

    return {
      ...k,
      maskedKey: `jt-live-••••••••${k.last4}`,
      ownerEmail,
      ownerName,
    };
  });

  if (filters?.status && filters.status !== "all") {
    enriched = enriched.filter((k) => k.status === filters.status);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    enriched = enriched.filter(
      (k) =>
        k.ownerEmail.toLowerCase().includes(q) ||
        k.ownerName.toLowerCase().includes(q) ||
        k.last4.toLowerCase().includes(q) ||
        (k.label ?? "").toLowerCase().includes(q) ||
        k.planName.toLowerCase().includes(q) ||
        (k.orderId ?? "").toLowerCase().includes(q)
    );
  }

  return enriched;
}

export async function getEnrichedUsers(search?: string): Promise<EnrichedUser[]> {
  const [profiles, enrichedKeys, orders] = await Promise.all([
    listAllProfiles(),
    getEnrichedKeys(),
    listAllOrders(),
  ]);

  let result: EnrichedUser[] = profiles.map((p) => {
    const emailLower = p.email.toLowerCase();
    const userKeys = enrichedKeys.filter(
      (k) => k.userId === p.id || k.ownerEmail.toLowerCase() === emailLower
    );
    const userOrders = orders.filter(
      (o) => o.userId === p.id || o.customerEmail.toLowerCase() === emailLower
    );

    return {
      ...p,
      keysCount: userKeys.length,
      activeKeysCount: userKeys.filter((k) => k.status === "active").length,
      totalBalanceIdr: userKeys
        .filter((k) => k.status === "active")
        .reduce((acc, k) => acc + k.balanceIdr, 0),
      ordersCount: userOrders.length,
      paidOrdersCount: userOrders.filter((o) => o.status === "paid").length,
      keys: userKeys,
    };
  });

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.role.includes(q)
    );
  }

  return result;
}

export async function getAdminOverview() {
  const [orders, keys, users, auditLogs, localUsageLogs, remoteUsageRows] = await Promise.all([
    listAllOrders(),
    getEnrichedKeys(),
    getEnrichedUsers(),
    listAuditLogs(25),
    query((db) => db.usageLogs ?? []),
    fetchAllFromSupabase<{ costIdr: number }>(
      "usage_logs",
      "select=cost_idr&order=created_at.desc&limit=1000",
      (r) => ({ costIdr: Number(r.cost_idr ?? 0) || 0 })
    ),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenueIdr = paidOrders.reduce((sum, o) => sum + o.totalIdr, 0);
  const activeKeys = keys.filter((k) => k.status === "active");
  const totalBalanceIdr = activeKeys.reduce((sum, k) => sum + k.balanceIdr, 0);
  const usageSource = remoteUsageRows ?? localUsageLogs.map((l) => ({ costIdr: Number(l.costIdr) || 0 }));
  const totalUsageChargesIdr = usageSource.reduce((sum, l) => sum + l.costIdr, 0);
  const totalApiRequests = usageSource.length;

  return {
    stats: {
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      paidOrders: paidOrders.length,
      totalRevenueIdr,
      totalUsageChargesIdr,
      totalApiRequests,
      totalKeys: keys.length,
      activeKeys: activeKeys.length,
      totalBalanceIdr,
      totalUsers: users.length,
    },
    recentPendingOrders: pendingOrders.slice(0, 8),
    recentAuditLogs: auditLogs,
  };
}

export function parseIpWhitelistInput(raw?: string[] | string): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? raw.split(/[\n,;]+/)
    : [];
  const cleaned = list
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /^[0-9a-fA-F:.*\/]+$/.test(s))
    .slice(0, 32);
  return Array.from(new Set(cleaned));
}

function parseStrictIdrAmount(
  raw: unknown,
  fallback: number,
  min: number,
  max: number
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: fallback };
  }
  if (typeof raw === "boolean" || (typeof raw === "string" && !raw.trim())) {
    return { ok: false, error: "Nominal kredit (IDR) harus berupa angka yang valid." };
  }
  const num = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(num)) {
    return { ok: false, error: "Nominal kredit (IDR) harus berupa angka yang valid." };
  }
  const rounded = Math.round(num);
  if (rounded < min || rounded > max) {
    const fmt = new Intl.NumberFormat("id-ID");
    return {
      ok: false,
      error: `Nominal pesanan harus berada di antara Rp ${fmt.format(min)} hingga Rp ${fmt.format(max)}.`,
    };
  }
  return { ok: true, value: rounded };
}

const orderApprovalLocks = new Map<string, Promise<unknown>>();

async function withOrderApprovalLock<T>(orderId: string, task: () => Promise<T>): Promise<T> {
  const prev = orderApprovalLocks.get(orderId) ?? Promise.resolve();
  const current = prev.catch(() => undefined).then(task);
  orderApprovalLocks.set(orderId, current);
  try {
    return await current;
  } finally {
    if (orderApprovalLocks.get(orderId) === current) {
      orderApprovalLocks.delete(orderId);
    }
  }
}

export function validatePaymentProofUrl(
  raw?: string | null
): { ok: true; value?: string } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  const trimmed = String(raw).trim();
  if (!trimmed) return { ok: true, value: undefined };

  // Explicitly allow ONLY safe raster image data URLs (PNG/JPEG/WebP), blocking SVG/XSS
  if (trimmed.startsWith("data:")) {
    if (trimmed.length > 1_200_000) {
      return {
        ok: false,
        error: "Ukuran gambar bukti transaksi terlalu besar (maksimal ~900 KB setelah kompresi).",
      };
    }
    if (!/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return {
        ok: false,
        error: "Format bukti transaksi harus berupa gambar PNG, JPG/JPEG, atau WebP yang valid.",
      };
    }
    return { ok: true, value: trimmed };
  }

  // Safe local asset path under /images/
  if (trimmed.startsWith("/")) {
    if (!/^\/images\/[a-zA-Z0-9._-]+$/.test(trimmed) || trimmed.includes("..")) {
      return { ok: false, error: "Path lokal gambar bukti transaksi tidak valid." };
    }
    return { ok: true, value: trimmed };
  }

  // Strictly HTTPS external URL without whitespace or HTML delimiters
  if (trimmed.length > 1000 || /[\s<>'"]/.test(trimmed)) {
    return { ok: false, error: "URL bukti transaksi tidak valid." };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return { ok: false, error: "URL eksternal bukti transaksi harus menggunakan protokol HTTPS." };
    }
    return { ok: true, value: parsed.toString() };
  } catch {
    return { ok: false, error: "Format bukti transaksi tidak dikenali." };
  }
}

export async function adminCreateOrder(input: {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  packageId?: string;
  packageName?: string;
  baseIdr?: number;
  methodName?: string;
  adminNotes?: string;
  accountTier?: AccountTier;
  companyName?: string;
  department?: string;
  requiresTaxInvoice?: boolean;
  npwp?: string;
  paymentProofUrl?: string;
  paymentProofName?: string;
  paymentReference?: string;
  autoApprove?: boolean;
  admin: UserProfile;
}): Promise<{ ok: true; order: Order; issuedKey?: string } | { ok: false; status: number; error: string }> {
  const email = input.customerEmail.trim().toLowerCase();
  const name = input.customerName.trim().slice(0, 80);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Format email Gmail tujuan tidak valid." };
  }
  if (name.length < 2) {
    return { ok: false, status: 400, error: "Nama pelanggan minimal 2 karakter." };
  }

  const proofCheck = validatePaymentProofUrl(input.paymentProofUrl);
  if (!proofCheck.ok) {
    return { ok: false, status: 400, error: proofCheck.error };
  }

  const pkg = retailPackages.find((p) => p.id === input.packageId);
  const amountCheck = parseStrictIdrAmount(input.baseIdr, pkg?.priceIdr ?? 50_000, 5_000, 100_000_000);
  if (!amountCheck.ok) {
    return { ok: false, status: 400, error: amountCheck.error };
  }
  const baseIdr = amountCheck.value;
  const packageName = (input.packageName?.trim() || pkg?.name || "Paket Token Custom").slice(0, 80);
  const estPackage = pkg?.estToken || `Saldo Rp ${new Intl.NumberFormat("id-ID").format(baseIdr)} · Multi-Model`;

  const profiles = await listAllProfiles();
  const matchedProfile = profiles.find((p) => p.email.toLowerCase() === email);

  const invoiceId = generateInvoiceId();
  const orderToken = generateOrderToken();
  const now = new Date().toISOString();

  const order: Order = {
    id: invoiceId,
    tokenHash: sha256(orderToken),
    userId: matchedProfile?.id,
    customerName: name,
    customerEmail: email,
    customerPhone: (input.customerPhone || "").trim().slice(0, 20),
    packageId: pkg?.id || "custom-admin",
    packageName,
    estPackage,
    baseIdr,
    feeIdr: 0,
    totalIdr: baseIdr,
    methodId: "manual-admin",
    methodName: (input.methodName || "Transfer / Aktivasi Admin").trim().slice(0, 50),
    status: "pending",
    createdAt: now,
    emailStatus: "none",
    gatewayProvider: "manual",
    adminNotes: input.adminNotes?.trim().slice(0, 300) || undefined,
    accountTier: input.accountTier === "enterprise" ? "enterprise" : "standard",
    companyName: input.companyName?.trim().slice(0, 100) || undefined,
    department: input.department?.trim().slice(0, 60) || undefined,
    requiresTaxInvoice: Boolean(input.requiresTaxInvoice),
    npwp: input.npwp?.trim().slice(0, 32) || undefined,
    paymentProofUrl: proofCheck.value,
    paymentProofName: proofCheck.value
      ? (input.paymentProofName || "bukti-transfer.png").trim().slice(0, 120)
      : undefined,
    paymentProofUploadedAt: proofCheck.value ? now : undefined,
    paymentProofUploadedBy: proofCheck.value ? "admin" : undefined,
    paymentReference: input.paymentReference?.trim().slice(0, 120) || undefined,
  };

  await mutate((db) => {
    db.orders[order.id] = order;
  });
  await syncOrderToSupabase(order);

  await recordAdminAudit({
    admin: input.admin,
    action: "order.create_manual",
    targetType: "order",
    targetId: order.id,
    details: { customerEmail: email, totalIdr: baseIdr, autoApprove: Boolean(input.autoApprove) },
  });

  if (input.autoApprove) {
    const approved = await adminApproveOrder(order.id, input.admin, input.adminNotes);
    if (approved.ok) {
      return { ok: true, order: approved.order, issuedKey: approved.issuedKey };
    }
  }

  return { ok: true, order };
}

export async function adminApproveOrder(
  orderId: string,
  admin: UserProfile,
  adminNotes?: string
): Promise<{ ok: true; order: Order; issuedKey?: string; keyRecord?: KeyRecord } | { ok: false; status: number; error: string }> {
  return withOrderApprovalLock(orderId, async () => {
    const allOrders = await listAllOrders();
    const existing = allOrders.find((o) => o.id === orderId);
    if (!existing) {
      return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };
    }
    if (existing.status === "paid") {
      return { ok: true, order: existing };
    }
    if (existing.status === "expired") {
      return { ok: false, status: 409, error: "Pesanan berstatus expired dan tidak dapat disetujui." };
    }

    const profiles = await listAllProfiles();
    const owner = profiles.find(
      (p) => p.id === existing.userId || p.email.toLowerCase() === existing.customerEmail.toLowerCase()
    );

    const now = new Date().toISOString();
    let issuedKey: string | undefined;
    let updatedKeyRecord: KeyRecord | undefined;

    if (existing.isTopUp && existing.targetKeyHash) {
      const keys = await listAllKeys();
      const target = keys.find((k) => k.hash === existing.targetKeyHash);
      if (!target) {
        return { ok: false, status: 404, error: "API Key target top-up tidak ditemukan." };
      }
      if (target.status !== "active") {
        return {
          ok: false,
          status: 400,
          error: `API Key target berstatus ${target.status} dan tidak dapat menerima top-up.`,
        };
      }
      updatedKeyRecord = {
        ...target,
        balanceIdr: target.balanceIdr + existing.baseIdr,
        userId: target.userId || owner?.id,
        userEmail: target.userEmail || existing.customerEmail.toLowerCase(),
        updatedAt: now,
      };
    } else {
      issuedKey = generateApiKey();
      const keyHash = sha256(issuedKey);
      updatedKeyRecord = {
        hash: keyHash,
        last4: issuedKey.slice(-4),
        orderId: existing.id,
        userId: owner?.id || existing.userId,
        userEmail: existing.customerEmail.toLowerCase(),
        label: existing.packageName,
        planName: existing.packageName,
        estPackage: existing.estPackage,
        balanceIdr: existing.baseIdr,
        createdAt: now,
        updatedAt: now,
        status: "active",
        accountTier: existing.accountTier || "standard",
        companyName: existing.companyName,
        department: existing.department,
        allowedIps: [],
      };
    }

    const paidOrder: Order = {
      ...existing,
      userId: owner?.id || existing.userId,
      status: "paid",
      paidAt: now,
      keyHash: updatedKeyRecord.hash,
      pendingReveal: issuedKey || existing.pendingReveal,
      adminNotes: adminNotes?.trim() ? adminNotes.trim().slice(0, 300) : existing.adminNotes,
      reviewedBy: admin.id,
      reviewedAt: now,
    };

    const txResult = await mutate<
      | { alreadyPaid: true; order: Order }
      | { alreadyPaid: false; order: Order; keyRecord: KeyRecord }
    >((db) => {
      const current = db.orders[existing.id];
      if (current?.status === "paid") {
        return { alreadyPaid: true, order: current };
      }
      if (updatedKeyRecord!.hash && existing.isTopUp && db.keys[updatedKeyRecord!.hash]) {
        const liveKey = db.keys[updatedKeyRecord!.hash];
        updatedKeyRecord = {
          ...liveKey,
          balanceIdr: liveKey.balanceIdr + existing.baseIdr,
          userId: liveKey.userId || owner?.id,
          userEmail: liveKey.userEmail || existing.customerEmail.toLowerCase(),
          updatedAt: now,
        };
      }
      db.keys[updatedKeyRecord!.hash] = updatedKeyRecord!;
      db.orders[paidOrder.id] = paidOrder;
      return { alreadyPaid: false, order: paidOrder, keyRecord: updatedKeyRecord! };
    });

    if (txResult.alreadyPaid) {
      return { ok: true, order: txResult.order };
    }

    await syncKeyToSupabase(txResult.keyRecord);

    if (issuedKey) {
      try {
        const mail = await sendReceiptEmail({
          customerEmail: paidOrder.customerEmail,
          customerName: paidOrder.customerName,
          invoiceId: paidOrder.id,
          packageName: paidOrder.packageName,
          priceIdr: paidOrder.totalIdr,
          paymentMethod: paidOrder.methodName,
          apiKey: issuedKey,
        });
        paidOrder.emailStatus = mail.status;
        paidOrder.emailMessage = mail.message;
        await mutate((db) => {
          if (db.orders[paidOrder.id]) {
            db.orders[paidOrder.id].emailStatus = mail.status;
            db.orders[paidOrder.id].emailMessage = mail.message;
          }
        });
      } catch {
        paidOrder.emailStatus = "error";
      }
    }

    await syncOrderToSupabase(paidOrder);

    await recordAdminAudit({
      admin,
      action: "order.approve",
      targetType: "order",
      targetId: paidOrder.id,
      details: {
        customerEmail: paidOrder.customerEmail,
        totalIdr: paidOrder.totalIdr,
        keyLast4: txResult.keyRecord.last4,
        isTopUp: Boolean(paidOrder.isTopUp),
      },
    });

    return { ok: true, order: paidOrder, issuedKey, keyRecord: txResult.keyRecord };
  });
}

export async function adminUpdateOrderStatus(input: {
  orderId: string;
  status?: OrderStatus;
  adminNotes?: string;
  admin: UserProfile;
}): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  const allOrders = await listAllOrders();
  const existing = allOrders.find((o) => o.id === input.orderId);
  if (!existing) return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };

  const now = new Date().toISOString();
  const nextStatus: OrderStatus =
    input.status && ["pending", "paid", "expired"].includes(input.status)
      ? input.status
      : existing.status;

  const updated: Order = {
    ...existing,
    status: nextStatus,
    adminNotes: input.adminNotes !== undefined ? input.adminNotes.trim().slice(0, 300) : existing.adminNotes,
    reviewedBy: input.admin.id,
    reviewedAt: now,
  };

  await mutate((db) => {
    db.orders[updated.id] = updated;
  });
  await syncOrderToSupabase(updated);

  await recordAdminAudit({
    admin: input.admin,
    action: `order.update_${nextStatus}`,
    targetType: "order",
    targetId: updated.id,
    details: { previousStatus: existing.status, nextStatus, adminNotes: updated.adminNotes },
  });

  return { ok: true, order: updated };
}

export async function adminUpdateOrderPaymentProof(input: {
  orderId: string;
  paymentProofUrl?: string | null;
  paymentProofName?: string;
  paymentReference?: string;
  adminNotes?: string;
  admin: UserProfile;
}): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  const allOrders = await listAllOrders();
  const existing = allOrders.find((o) => o.id === input.orderId);
  if (!existing) {
    return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };
  }

  const now = new Date().toISOString();
  const isRemoving = input.paymentProofUrl === null;

  let nextProofUrl = existing.paymentProofUrl;
  let nextProofName = existing.paymentProofName;
  let nextUploadedAt = existing.paymentProofUploadedAt;
  let nextUploadedBy = existing.paymentProofUploadedBy;
  let actionName = "order.update_proof_meta";

  if (isRemoving) {
    nextProofUrl = undefined;
    nextProofName = undefined;
    nextUploadedAt = undefined;
    nextUploadedBy = undefined;
    actionName = "order.remove_proof";
  } else if (input.paymentProofUrl !== undefined) {
    const check = validatePaymentProofUrl(input.paymentProofUrl);
    if (!check.ok) {
      return { ok: false, status: 400, error: check.error };
    }
    if (check.value) {
      nextProofUrl = check.value;
      nextProofName = (input.paymentProofName || "bukti-transaksi.png").trim().slice(0, 120);
      nextUploadedAt = now;
      nextUploadedBy = "admin";
      actionName = "order.upload_proof";
    }
  }

  const updated: Order = {
    ...existing,
    paymentProofUrl: nextProofUrl,
    paymentProofName: nextProofName,
    paymentProofUploadedAt: nextUploadedAt,
    paymentProofUploadedBy: nextUploadedBy,
    paymentReference:
      input.paymentReference !== undefined
        ? input.paymentReference.trim().slice(0, 120) || undefined
        : existing.paymentReference,
    adminNotes:
      input.adminNotes !== undefined
        ? input.adminNotes.trim().slice(0, 300) || undefined
        : existing.adminNotes,
    reviewedBy: input.admin.id,
    reviewedAt: now,
  };

  await mutate((db) => {
    db.orders[updated.id] = updated;
  });
  await syncOrderToSupabase(updated);

  await recordAdminAudit({
    admin: input.admin,
    action: actionName,
    targetType: "order",
    targetId: updated.id,
    details: {
      customerEmail: updated.customerEmail,
      paymentProofName: updated.paymentProofName ?? null,
      paymentReference: updated.paymentReference ?? null,
    },
  });

  return { ok: true, order: updated };
}

export async function adminProvisionKeyForGmail(input: {
  userEmail: string;
  label?: string;
  planName?: string;
  balanceIdr: number;
  accountTier?: AccountTier;
  companyName?: string;
  department?: string;
  allowedIps?: string[] | string;
  sendEmail?: boolean;
  admin: UserProfile;
}): Promise<{ ok: true; key: KeyRecord; plaintextKey: string; maskedKey: string } | { ok: false; status: number; error: string }> {
  const email = input.userEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "Format akun email Gmail tidak valid." };
  }
  const balanceIdr = Math.round(Number(input.balanceIdr));
  if (!Number.isFinite(balanceIdr) || balanceIdr < 0 || balanceIdr > 100_000_000) {
    return { ok: false, status: 400, error: "Nominal saldo harus antara Rp 0 hingga Rp 100.000.000." };
  }

  const profiles = await listAllProfiles();
  const owner = profiles.find((p) => p.email.toLowerCase() === email);

  const plaintextKey = generateApiKey();
  const hash = sha256(plaintextKey);
  const now = new Date().toISOString();

  const planName = (input.planName?.trim() || "API Key Terintegrasi Admin").slice(0, 80);
  const label = (input.label?.trim() || "Virtual Key Utama").slice(0, 60);

  const record: KeyRecord = {
    hash,
    last4: plaintextKey.slice(-4),
    orderId: `ADMIN-${Date.now().toString(36).toUpperCase()}`,
    userId: owner?.id,
    userEmail: email,
    label,
    planName,
    estPackage: `Saldo Rp ${new Intl.NumberFormat("id-ID").format(balanceIdr)} · Multi-Model`,
    balanceIdr,
    createdAt: now,
    updatedAt: now,
    status: "active",
    accountTier: input.accountTier === "enterprise" ? "enterprise" : "standard",
    companyName: input.companyName?.trim().slice(0, 100) || undefined,
    department: input.department?.trim().slice(0, 60) || undefined,
    allowedIps: parseIpWhitelistInput(input.allowedIps),
  };

  await mutate((db) => {
    db.keys[hash] = record;
  });
  await syncKeyToSupabase(record);

  if (input.sendEmail) {
    await sendReceiptEmail({
      customerEmail: email,
      customerName: owner?.fullName || email.split("@")[0] || "Pengguna",
      invoiceId: record.orderId,
      packageName: `${planName} (${label})`,
      priceIdr: balanceIdr,
      paymentMethod: "Integrasi Langsung Admin",
      apiKey: plaintextKey,
    }).catch(() => undefined);
  }

  await recordAdminAudit({
    admin: input.admin,
    action: "key.provision_gmail",
    targetType: "key",
    targetId: record.last4,
    details: { userEmail: email, label, balanceIdr, sendEmail: Boolean(input.sendEmail) },
  });

  return { ok: true, key: record, plaintextKey, maskedKey: maskKey(plaintextKey) };
}

export async function adminControlKey(input: {
  hash: string;
  action: "suspend" | "activate" | "revoke" | "adjust_balance" | "rotate" | "assign_email" | "update_ip_whitelist";
  deltaIdr?: number;
  userEmail?: string;
  label?: string;
  allowedIps?: string[] | string;
  accountTier?: AccountTier;
  companyName?: string;
  department?: string;
  admin: UserProfile;
}): Promise<
  | { ok: true; key: KeyRecord; rotatedPlaintextKey?: string; newKey?: KeyRecord }
  | { ok: false; status: number; error: string }
> {
  const keys = await listAllKeys();
  const existing = keys.find((k) => k.hash === input.hash);
  if (!existing) {
    return { ok: false, status: 404, error: "API Key tidak ditemukan." };
  }

  const now = new Date().toISOString();

  if (input.action === "suspend" || input.action === "activate" || input.action === "revoke") {
    const nextStatus: KeyStatus =
      input.action === "activate" ? "active" : input.action === "suspend" ? "suspended" : "revoked";
    const updated: KeyRecord = { ...existing, status: nextStatus, updatedAt: now };
    await mutate((db) => {
      db.keys[updated.hash] = updated;
    });
    await syncKeyToSupabase(updated);

    await recordAdminAudit({
      admin: input.admin,
      action: `key.${input.action}`,
      targetType: "key",
      targetId: existing.last4,
      details: { userEmail: existing.userEmail, nextStatus },
    });
    return { ok: true, key: updated };
  }

  if (input.action === "adjust_balance") {
    const delta = Math.round(Number(input.deltaIdr ?? 0));
    if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 100_000_000) {
      return { ok: false, status: 400, error: "Nominal penyesuaian saldo tidak valid." };
    }
    const nextBalance = Math.max(0, Math.min(100_000_000, existing.balanceIdr + delta));
    const updated: KeyRecord = { ...existing, balanceIdr: nextBalance, updatedAt: now };
    await mutate((db) => {
      db.keys[updated.hash] = updated;
    });
    await syncKeyToSupabase(updated);

    await recordAdminAudit({
      admin: input.admin,
      action: "key.adjust_balance",
      targetType: "key",
      targetId: existing.last4,
      details: { userEmail: existing.userEmail, deltaIdr: delta, nextBalance },
    });
    return { ok: true, key: updated };
  }

  if (input.action === "assign_email") {
    const email = (input.userEmail ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, status: 400, error: "Format email Gmail tidak valid." };
    }
    const profiles = await listAllProfiles();
    const owner = profiles.find((p) => p.email.toLowerCase() === email);
    const updated: KeyRecord = {
      ...existing,
      userEmail: email,
      userId: owner?.id,
      label: input.label !== undefined ? input.label.trim().slice(0, 60) : existing.label,
      updatedAt: now,
    };
    await mutate((db) => {
      db.keys[updated.hash] = updated;
    });
    await syncKeyToSupabase(updated);

    await recordAdminAudit({
      admin: input.admin,
      action: "key.assign_email",
      targetType: "key",
      targetId: existing.last4,
      details: { userEmail: email, label: updated.label },
    });
    return { ok: true, key: updated };
  }

  if (input.action === "rotate") {
    const revokedOld: KeyRecord = { ...existing, status: "revoked", balanceIdr: 0, updatedAt: now };
    const newPlaintext = generateApiKey();
    const newHash = sha256(newPlaintext);
    const replacement: KeyRecord = {
      ...existing,
      hash: newHash,
      last4: newPlaintext.slice(-4),
      status: "active",
      balanceIdr: existing.balanceIdr,
      createdAt: now,
      updatedAt: now,
    };

    await mutate((db) => {
      db.keys[revokedOld.hash] = revokedOld;
      db.keys[replacement.hash] = replacement;
    });
    await Promise.all([syncKeyToSupabase(revokedOld), syncKeyToSupabase(replacement)]);

    await recordAdminAudit({
      admin: input.admin,
      action: "key.rotate",
      targetType: "key",
      targetId: `${existing.last4}->${replacement.last4}`,
      details: { userEmail: existing.userEmail, carriedBalanceIdr: replacement.balanceIdr },
    });

    return { ok: true, key: revokedOld, newKey: replacement, rotatedPlaintextKey: newPlaintext };
  }

  if (input.action === "update_ip_whitelist") {
    const allowedIps = parseIpWhitelistInput(input.allowedIps);
    const updated: KeyRecord = {
      ...existing,
      allowedIps,
      accountTier: input.accountTier ?? existing.accountTier ?? (allowedIps.length > 0 ? "enterprise" : "standard"),
      companyName: input.companyName !== undefined ? input.companyName.trim().slice(0, 100) || undefined : existing.companyName,
      department: input.department !== undefined ? input.department.trim().slice(0, 60) || undefined : existing.department,
      updatedAt: now,
    };
    await mutate((db) => {
      db.keys[updated.hash] = updated;
    });
    await syncKeyToSupabase(updated);

    await recordAdminAudit({
      admin: input.admin,
      action: "key.update_ip_whitelist",
      targetType: "key",
      targetId: existing.last4,
      details: {
        userEmail: existing.userEmail,
        accountTier: updated.accountTier,
        allowedIpsCount: allowedIps.length,
        allowedIps,
      },
    });
    return { ok: true, key: updated };
  }

  return { ok: false, status: 400, error: "Aksi API Key tidak dikenali." };
}

export async function adminUpdateUserRole(input: {
  userId: string;
  role: UserRole;
  admin: UserProfile;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (input.userId === input.admin.id && input.role !== "admin") {
    return { ok: false, status: 400, error: "Admin tidak dapat menurunkan perannya sendiri." };
  }
  const now = new Date().toISOString();

  await mutate((db) => {
    if (db.users?.[input.userId]) {
      db.users[input.userId].role = input.role;
      db.users[input.userId].updatedAt = now;
    }
  });

  const { url, key, isConfigured, isServiceRole } = getSupabaseConfig();
  if (isConfigured && isServiceRole) {
    await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(input.userId)}`, {
      method: "PATCH",
      headers: getSupaHeaders(key),
      body: JSON.stringify({ role: input.role, updated_at: now }),
    }).catch(() => undefined);
  }

  await recordAdminAudit({
    admin: input.admin,
    action: "user.update_role",
    targetType: "user",
    targetId: input.userId,
    details: { role: input.role },
  });

  return { ok: true };
}

/**
 * Data dashboard milik user Gmail yang sedang login (terisolasi ketat per user.id / user.email).
 */
export async function getUserDashboardData(user: UserProfile) {
  const emailLower = user.email.toLowerCase();
  const [orders, enrichedKeys] = await Promise.all([listAllOrders(), getEnrichedKeys()]);

  const myOrders = orders.filter(
    (o) => o.userId === user.id || o.customerEmail.toLowerCase() === emailLower
  );
  const myKeys = enrichedKeys.filter(
    (k) => k.userId === user.id || k.ownerEmail.toLowerCase() === emailLower
  );

  const activeKeys = myKeys.filter((k) => k.status === "active");
  const totalBalanceIdr = activeKeys.reduce((acc, k) => acc + k.balanceIdr, 0);

  return {
    user,
    stats: {
      activeKeysCount: activeKeys.length,
      totalKeysCount: myKeys.length,
      totalBalanceIdr,
      totalOrdersCount: myOrders.length,
      pendingOrdersCount: myOrders.filter((o) => o.status === "pending").length,
    },
    keys: myKeys,
    orders: myOrders,
  };
}

export async function createUserOrderRequest(
  user: UserProfile,
  input: {
    packageId?: string;
    baseIdr?: number;
    methodName?: string;
    customerPhone?: string;
    note?: string;
    accountTier?: AccountTier;
    companyName?: string;
    department?: string;
    requiresTaxInvoice?: boolean;
    npwp?: string;
    targetKeyHash?: string;
    paymentProofUrl?: string;
    paymentProofName?: string;
    paymentReference?: string;
  }
): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  const proofCheck = validatePaymentProofUrl(input.paymentProofUrl);
  if (!proofCheck.ok) {
    return { ok: false, status: 400, error: proofCheck.error };
  }

  const pkg = retailPackages.find((p) => p.id === input.packageId);
  const amountCheck = parseStrictIdrAmount(input.baseIdr, pkg?.priceIdr ?? 50_000, 15_000, 50_000_000);
  if (!amountCheck.ok) {
    return { ok: false, status: 400, error: amountCheck.error };
  }
  const baseIdr = amountCheck.value;
  const tier: AccountTier = input.accountTier === "enterprise" ? "enterprise" : "standard";
  const rawTargetKeyHash = input.targetKeyHash?.trim() || "";
  const isTopUp = Boolean(rawTargetKeyHash);

  if (isTopUp) {
    const keys = await listAllKeys();
    const targetKey = keys.find((k) => k.hash === rawTargetKeyHash);
    if (!targetKey) {
      return { ok: false, status: 404, error: "API Key tujuan top-up tidak ditemukan." };
    }
    const emailLower = user.email.toLowerCase();
    const isKeyOwner =
      (targetKey.userId && targetKey.userId === user.id) ||
      (targetKey.userEmail && targetKey.userEmail.toLowerCase() === emailLower);
    if (!isKeyOwner) {
      return { ok: false, status: 403, error: "Anda tidak memiliki akses untuk melakukan top-up ke API Key ini." };
    }
    if (targetKey.status !== "active") {
      return { ok: false, status: 400, error: `API Key berstatus ${targetKey.status} tidak dapat menerima top-up.` };
    }
  }
  const packageName =
    pkg?.name ||
    `${isTopUp ? "Top-Up" : "Deposit"} ${tier === "enterprise" ? "Enterprise B2B" : "Standard"} Rp ${new Intl.NumberFormat("id-ID").format(baseIdr)}`;
  const estPackage = pkg?.estToken || `Saldo Rp ${new Intl.NumberFormat("id-ID").format(baseIdr)} · 1 Key Semua AI`;

  const invoiceId = generateInvoiceId();
  const now = new Date().toISOString();

  const order: Order = {
    id: invoiceId,
    tokenHash: sha256(generateOrderToken()),
    userId: user.id,
    customerName: user.fullName || user.email.split("@")[0] || "Pengguna",
    customerEmail: user.email.toLowerCase(),
    customerPhone: (input.customerPhone || "").trim().slice(0, 20),
    packageId: pkg?.id || (tier === "enterprise" ? "enterprise-b2b" : "standard-portal"),
    packageName,
    estPackage,
    baseIdr,
    feeIdr: 0,
    totalIdr: baseIdr,
    methodId: tier === "enterprise" ? "invoice-b2b" : "portal-transfer",
    methodName: (input.methodName || (tier === "enterprise" ? "Invoice B2B / Transfer PT" : "QRIS / Transfer Bank")).trim().slice(0, 50),
    status: "pending",
    createdAt: now,
    emailStatus: "none",
    gatewayProvider: "manual",
    isTopUp,
    targetKeyHash: isTopUp ? input.targetKeyHash?.trim() : undefined,
    adminNotes: input.note?.trim().slice(0, 250) || undefined,
    accountTier: tier,
    companyName: input.companyName?.trim().slice(0, 100) || undefined,
    department: input.department?.trim().slice(0, 60) || undefined,
    requiresTaxInvoice: tier === "enterprise" ? Boolean(input.requiresTaxInvoice) : false,
    npwp: input.npwp?.trim().slice(0, 32) || undefined,
    paymentProofUrl: proofCheck.value,
    paymentProofName: proofCheck.value
      ? (input.paymentProofName || "bukti-transfer.png").trim().slice(0, 120)
      : undefined,
    paymentProofUploadedAt: proofCheck.value ? now : undefined,
    paymentProofUploadedBy: proofCheck.value ? "user" : undefined,
    paymentReference: input.paymentReference?.trim().slice(0, 120) || undefined,
  };

  await mutate((db) => {
    db.orders[order.id] = order;
  });
  await syncOrderToSupabase(order);

  return { ok: true, order };
}

export async function userAttachOrderProof(
  user: UserProfile,
  orderId: string,
  input: {
    paymentProofUrl: string;
    paymentProofName?: string;
    paymentReference?: string;
  }
): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  const proofCheck = validatePaymentProofUrl(input.paymentProofUrl);
  if (!proofCheck.ok) {
    return { ok: false, status: 400, error: proofCheck.error };
  }
  if (!proofCheck.value) {
    return { ok: false, status: 400, error: "File gambar bukti pembayaran wajib diunggah." };
  }

  const allOrders = await listAllOrders();
  const existing = allOrders.find((o) => o.id === orderId);
  if (!existing) {
    return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };
  }

  const isOwner =
    existing.userId === user.id ||
    existing.customerEmail.toLowerCase() === user.email.toLowerCase();
  if (!isOwner) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses ke pesanan ini." };
  }
  if (existing.status !== "pending") {
    return {
      ok: false,
      status: 409,
      error: `Bukti pembayaran tidak dapat diubah karena pesanan sudah berstatus ${existing.status}.`,
    };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...existing,
    paymentProofUrl: proofCheck.value,
    paymentProofName: (input.paymentProofName || "bukti-pembayaran.png").trim().slice(0, 120),
    paymentProofUploadedAt: now,
    paymentProofUploadedBy: "user",
    paymentReference:
      input.paymentReference !== undefined
        ? input.paymentReference.trim().slice(0, 120) || existing.paymentReference
        : existing.paymentReference,
  };

  await mutate((db) => {
    db.orders[updated.id] = updated;
  });
  await syncOrderToSupabase(updated);

  return { ok: true, order: updated };
}

export async function userDismissOrderKeyReveal(
  user: UserProfile,
  orderId: string
): Promise<{ ok: true; order: Order } | { ok: false; status: number; error: string }> {
  const allOrders = await listAllOrders();
  const existing = allOrders.find((o) => o.id === orderId);
  if (!existing) {
    return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };
  }

  const isOwner =
    existing.userId === user.id ||
    existing.customerEmail.toLowerCase() === user.email.toLowerCase();
  if (!isOwner) {
    return { ok: false, status: 403, error: "Anda tidak memiliki akses ke pesanan ini." };
  }

  const updated: Order = {
    ...existing,
    pendingReveal: undefined,
  };

  await mutate((db) => {
    db.orders[updated.id] = updated;
    delete db.orders[updated.id].pendingReveal;
  });
  await syncOrderToSupabase(updated);

  return { ok: true, order: updated };
}
