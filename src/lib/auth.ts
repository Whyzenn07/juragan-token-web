import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { mutate, query, type AdminAuditLog, type LocalUserAccount, type UserProfile, type UserRole } from "./store";
import { getSupabaseConfig } from "./supabase-sync";

export const SESSION_COOKIE = "jt_session";
export const REFRESH_COOKIE = "jt_refresh";
export const OAUTH_VERIFIER_COOKIE = "jt_oauth_verifier";
export const OAUTH_NEXT_COOKIE = "jt_oauth_next";

const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export type AuthSession = {
  user: UserProfile;
  mode: "supabase" | "local-dev";
};

export type AuthGuardResult =
  | { ok: true; session: AuthSession }
  | { ok: false; status: 401 | 403; error: string };

export function getSupabaseAuthConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY || "").trim();
  return {
    url,
    publishableKey,
    secretKey,
    isAuthConfigured: Boolean(url && publishableKey),
    isAdminConfigured: Boolean(url && secretKey),
  };
}

export function isLocalDevAuthEnabled(): boolean {
  return !IS_PROD && !getSupabaseAuthConfig().isAuthConfigured;
}

// Cache sederhana untuk hasil pengecekan Google OAuth Supabase (TTL 60 detik)
let _googleOAuthCache: { enabled: boolean; checkedAt: number } | null = null;

/**
 * Cek apakah provider Google OAuth sudah diaktifkan di Supabase.
 * Hasil di-cache 60 detik agar tidak flood request ke Supabase.
 */
export async function isSupabaseGoogleOAuthEnabled(): Promise<boolean> {
  const supa = getSupabaseAuthConfig();
  if (!supa.isAuthConfigured) return false;
  if (_googleOAuthCache && Date.now() - _googleOAuthCache.checkedAt < 60_000) {
    return _googleOAuthCache.enabled;
  }
  try {
    const res = await fetch(`${supa.url}/auth/v1/settings`, {
      headers: { apikey: supa.publishableKey },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as {
      external?: { google?: boolean };
    };
    const enabled = Boolean(data?.external?.google);
    _googleOAuthCache = { enabled, checkedAt: Date.now() };
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Cocokkan kredensial login dengan akun yang di-seed untuk produksi.
 * Digunakan saat Supabase Auth belum punya user tersebut (auto-provision via Admin API).
 */
export function getSeededAccountMatch(
  email: string,
  password: string
): { email: string; fullName: string; role: UserRole } | null {
  const adminEmail = getAdminEmails()[0] || "admin@juragantoken.id";
  const seeded: { email: string; password: string; fullName: string; role: UserRole }[] = [
    { email: adminEmail, password: "Admin12345!", fullName: "Admin Juragantoken", role: "admin" },
    { email: "budi.dev@gmail.com", password: "UserDemo123!", fullName: "Budi Santoso", role: "user" },
    { email: "sari.analytics@gmail.com", password: "UserDemo123!", fullName: "Sari Wijaya", role: "user" },
  ];
  return seeded.find((s) => s.email === email && s.password === password) ?? null;
}

export function getAdminEmails(): string[] {
  const raw = (process.env.ADMIN_EMAILS || "admin@juragantoken.id").trim();
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

export function isValidNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (/^\/(?!\/)[a-zA-Z0-9\-_/?=&%#]*$/.test(trimmed)) {
    return trimmed;
  }
  return "/";
}

function getLocalSigningSecret(): string {
  return (process.env.ADMIN_SECRET || "juragan-token-local-dev-session-secret-v3").trim();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function signLocalSessionToken(userId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email: email.toLowerCase(),
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", getLocalSigningSecret()).update(payload).digest("base64url");
  return `local.${payload}.${sig}`;
}

function verifyLocalSessionToken(token: string): { sub: string; email: string } | null {
  if (!token.startsWith("local.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  if (!payload || !sig) return null;

  const expectedSig = createHmac("sha256", getLocalSigningSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    if (!parsed.sub || !parsed.email || !parsed.exp || parsed.exp < Date.now()) return null;
    return { sub: parsed.sub, email: parsed.email };
  } catch {
    return null;
  }
}

export function setSessionCookies(res: NextResponse, accessToken: string, refreshToken?: string) {
  res.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Inisialisasi akun admin lokal khusus mode development saat Supabase belum dihubungkan ke .env.local.
 * Tidak pernah berjalan di production.
 */
export async function ensureLocalDevSeed(): Promise<void> {
  if (!isLocalDevAuthEnabled()) return;
  const existingUsers = await query((db) => Object.keys(db.users ?? {}).length);
  if (existingUsers > 0) return;

  const now = new Date().toISOString();
  const adminEmail = getAdminEmails()[0] || "admin@juragantoken.id";

  await mutate((db) => {
    db.users = db.users ?? {};
    if (Object.keys(db.users).length > 0) return;

    const adminId = "usr-admin-local";
    const user1Id = "usr-demo-gmail-1";
    const user2Id = "usr-demo-gmail-2";

    db.users[adminId] = {
      id: adminId,
      email: adminEmail,
      fullName: "Admin Juragantoken",
      role: "admin",
      provider: "email",
      passwordHash: hashPassword("Admin12345!"),
      createdAt: now,
      updatedAt: now,
    };

    db.users[user1Id] = {
      id: user1Id,
      email: "budi.dev@gmail.com",
      fullName: "Budi Santoso",
      role: "user",
      provider: "google",
      passwordHash: hashPassword("UserDemo123!"),
      createdAt: now,
      updatedAt: now,
    };

    db.users[user2Id] = {
      id: user2Id,
      email: "sari.analytics@gmail.com",
      fullName: "Sari Wijaya",
      role: "user",
      provider: "google",
      passwordHash: hashPassword("UserDemo123!"),
      createdAt: now,
      updatedAt: now,
    };

    // Tambahkan contoh pesanan & API Key bila store masih kosong
    if (Object.keys(db.orders).length === 0) {
      db.orders["INV-JT-DEMO01"] = {
        id: "INV-JT-DEMO01",
        tokenHash: "demo-token-hash-1",
        userId: user1Id,
        customerName: "Budi Santoso",
        customerEmail: "budi.dev@gmail.com",
        customerPhone: "081234567890",
        packageId: "starter-50k",
        packageName: "Paket Developer Pro",
        estPackage: "Saldo Rp 50.000 · Multi-Model",
        baseIdr: 50000,
        feeIdr: 0,
        totalIdr: 50000,
        methodId: "qris",
        methodName: "QRIS Instan",
        status: "paid",
        createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
        paidAt: new Date(Date.now() - 86_400_000 * 2 + 120_000).toISOString(),
        keyHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        emailStatus: "sent",
        gatewayProvider: "manual",
        paymentProofUrl: "/images/sample-bukti-transfer.png",
        paymentProofName: "bukti-qris-budi.png",
        paymentProofUploadedAt: new Date(Date.now() - 86_400_000 * 2 + 60_000).toISOString(),
        paymentProofUploadedBy: "user",
        paymentReference: "RRN 261118094122 · QRIS BCA",
      };

      db.orders["INV-JT-DEMO02"] = {
        id: "INV-JT-DEMO02",
        tokenHash: "demo-token-hash-2",
        userId: user2Id,
        customerName: "Sari Wijaya",
        customerEmail: "sari.analytics@gmail.com",
        customerPhone: "081298765432",
        packageId: "business-100k",
        packageName: "Paket Tim Riset",
        estPackage: "Saldo Rp 100.000 · Multi-Model",
        baseIdr: 100000,
        feeIdr: 0,
        totalIdr: 100000,
        methodId: "va-bca",
        methodName: "BCA Virtual Account",
        status: "pending",
        createdAt: new Date(Date.now() - 3_600_000 * 3).toISOString(),
        emailStatus: "none",
        gatewayProvider: "manual",
      };
    }

    if (Object.keys(db.keys).length === 0) {
      const demoKeyHash = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0";
      db.keys[demoKeyHash] = {
        hash: demoKeyHash,
        last4: "9X4K",
        orderId: "INV-JT-DEMO01",
        userId: user1Id,
        userEmail: "budi.dev@gmail.com",
        label: "Cursor IDE Utama",
        planName: "Paket Developer Pro",
        estPackage: "Saldo Rp 50.000 · Multi-Model",
        balanceIdr: 42500,
        createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
        updatedAt: now,
        status: "active",
      };
    }
  });
}

/** Sinkronkan atau baca profil user di tabel public.profiles Supabase via secret key */
export async function upsertSupabaseProfile(input: {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const { url, secretKey, isAdminConfigured } = getSupabaseAuthConfig();
  const normalizedEmail = input.email.trim().toLowerCase();
  const inferredRole: UserRole = isAdminEmail(normalizedEmail) ? "admin" : "user";
  const now = new Date().toISOString();

  const fallbackProfile: UserProfile = {
    id: input.id,
    email: normalizedEmail,
    fullName: input.fullName?.trim() || normalizedEmail.split("@")[0] || "Pengguna",
    avatarUrl: input.avatarUrl,
    role: inferredRole,
    createdAt: now,
    updatedAt: now,
  };

  if (!isAdminConfigured) return fallbackProfile;

  const headers = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Cek apakah profil sudah ada di database
    const existingRes = await fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(input.id)}&select=*&limit=1`,
      { headers }
    );
    if (existingRes.ok) {
      const rows = await existingRes.json();
      if (Array.isArray(rows) && rows[0]) {
        const row = rows[0];
        const finalRole: UserRole =
          row.role === "admin" || inferredRole === "admin" ? "admin" : "user";
        if (finalRole === "admin" && row.role !== "admin") {
          await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(input.id)}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ role: "admin", updated_at: now }),
          }).catch(() => undefined);
        }
        return {
          id: row.id,
          email: row.email,
          fullName: row.full_name || fallbackProfile.fullName,
          avatarUrl: row.avatar_url || input.avatarUrl,
          role: finalRole,
          createdAt: row.created_at || now,
          updatedAt: row.updated_at || now,
        };
      }
    }

    // 2. Insert profil baru jika belum ada
    const insertRes = await fetch(`${url}/rest/v1/profiles?on_conflict=id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: input.id,
        email: normalizedEmail,
        full_name: fallbackProfile.fullName,
        avatar_url: input.avatarUrl || null,
        role: inferredRole,
        updated_at: now,
      }),
    });
    if (insertRes.ok) {
      const inserted = await insertRes.json();
      if (Array.isArray(inserted) && inserted[0]) {
        const r = inserted[0];
        return {
          id: r.id,
          email: r.email,
          fullName: r.full_name || fallbackProfile.fullName,
          avatarUrl: r.avatar_url || undefined,
          role: r.role === "admin" ? "admin" : "user",
          createdAt: r.created_at || now,
          updatedAt: r.updated_at || now,
        };
      }
    }
  } catch (err) {
    console.warn("[AUTH PROFILE SYNC]", err instanceof Error ? err.message : err);
  }

  return fallbackProfile;
}

/**
 * Verifikasi sesi user aktif dari HttpOnly cookie (Server-Side Truth).
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE)?.value?.trim();
  if (!accessToken) return null;

  // Mode 1: Local Dev Signed Session (hanya non-production & saat Supabase belum dikonfigurasi)
  if (accessToken.startsWith("local.")) {
    if (!isLocalDevAuthEnabled()) return null;
    await ensureLocalDevSeed();
    const verified = verifyLocalSessionToken(accessToken);
    if (!verified) return null;
    const account = await query((db) => db.users?.[verified.sub] ?? null);
    if (!account) return null;
    const role: UserRole = account.role === "admin" || isAdminEmail(account.email) ? "admin" : "user";
    return {
      mode: "local-dev",
      user: {
        id: account.id,
        email: account.email,
        fullName: account.fullName,
        avatarUrl: account.avatarUrl,
        role,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    };
  }

  // Mode 2: Supabase Auth JWT Verification
  const { url, publishableKey, isAuthConfigured } = getSupabaseAuthConfig();
  if (!isAuthConfigured) return null;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const supaUser = (await res.json()) as {
      id?: string;
      email?: string;
      user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
      app_metadata?: { role?: string };
    };
    if (!supaUser.id || !supaUser.email) return null;

    const profile = await upsertSupabaseProfile({
      id: supaUser.id,
      email: supaUser.email,
      fullName: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name,
      avatarUrl: supaUser.user_metadata?.avatar_url,
    });

    if (supaUser.app_metadata?.role === "admin") {
      profile.role = "admin";
    }

    return {
      mode: "supabase",
      user: profile,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<AuthGuardResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, status: 401, error: "Sesi tidak ditemukan. Silakan masuk terlebih dahulu." };
  }
  return { ok: true, session };
}

export async function requireAdmin(): Promise<AuthGuardResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, status: 401, error: "Autentikasi diperlukan untuk mengakses panel admin." };
  }
  if (session.user.role !== "admin") {
    return { ok: false, status: 403, error: "Akses ditolak. Halaman ini khusus untuk Administrator." };
  }
  return { ok: true, session };
}

export async function recordAdminAudit(input: {
  admin: UserProfile;
  action: string;
  targetType: "order" | "key" | "user";
  targetId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const log: AdminAuditLog = {
    id: randomUUID(),
    adminId: input.admin.id,
    adminEmail: input.admin.email,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: input.details ?? {},
    createdAt: new Date().toISOString(),
  };

  await mutate((db) => {
    db.auditLogs = db.auditLogs ?? [];
    db.auditLogs.unshift(log);
    if (db.auditLogs.length > 250) {
      db.auditLogs = db.auditLogs.slice(0, 250);
    }
  });

  const { url, key, isConfigured, isServiceRole } = getSupabaseConfig();
  if (!isConfigured || !isServiceRole) return;

  try {
    await fetch(`${url}/rest/v1/admin_audit_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        admin_id: log.adminId,
        admin_email: log.adminEmail,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        details: log.details,
        created_at: log.createdAt,
      }),
    });
  } catch {
    // Abaikan error jaringan audit agar tidak memblokir mutasi utama
  }
}

export async function findLocalUserByEmail(email: string): Promise<LocalUserAccount | null> {
  const target = email.trim().toLowerCase();
  return query((db) => {
    const all = Object.values(db.users ?? {});
    return all.find((u) => u.email.toLowerCase() === target) ?? null;
  });
}
