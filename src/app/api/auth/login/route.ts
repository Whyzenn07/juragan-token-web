import { NextRequest, NextResponse } from "next/server";
import {
  ensureLocalDevSeed,
  findLocalUserByEmail,
  getSeededAccountMatch,
  getSupabaseAuthConfig,
  isAdminEmail,
  isLocalDevAuthEnabled,
  setSessionCookies,
  signLocalSessionToken,
  upsertSupabaseProfile,
  verifyPassword,
} from "@/lib/auth";
import { rateLimited } from "@/lib/keys";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`auth-login:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!EMAIL_RE.test(email) || password.length < 6) {
    return NextResponse.json(
      { success: false, error: "Email atau kata sandi tidak valid." },
      { status: 400 }
    );
  }

  const supa = getSupabaseAuthConfig();

  // Jalur 1: Supabase Auth (Produksi & Lokal Terkonfigurasi)
  if (supa.isAuthConfigured) {
    try {
      let authRes = await fetch(`${supa.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: supa.publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data = (await authRes.json().catch(() => ({}))) as {
        access_token?: string;
        refresh_token?: string;
        user?: { id?: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } };
        error_description?: string;
        msg?: string;
      };

      // Jika login gagal dan secretKey ada, periksa apakah ini akun seed (auto-provision ke Supabase Auth)
      if ((!authRes.ok || !data.access_token) && supa.isAdminConfigured) {
        const seeded = getSeededAccountMatch(email, password);
        if (seeded) {
          const adminHeaders = {
            apikey: supa.secretKey,
            Authorization: `Bearer ${supa.secretKey}`,
            "Content-Type": "application/json",
          };
          await fetch(`${supa.url}/auth/v1/admin/users`, {
            method: "POST",
            headers: adminHeaders,
            body: JSON.stringify({
              email: seeded.email,
              password,
              email_confirm: true,
              user_metadata: { full_name: seeded.fullName },
              app_metadata: { role: seeded.role },
            }),
          }).catch(() => null);

          // Coba login kembali
          authRes = await fetch(`${supa.url}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
              apikey: supa.publishableKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });
          data = (await authRes.json().catch(() => ({}))) as typeof data;
        }
      }

      if (!authRes.ok || !data.access_token || !data.user?.id || !data.user?.email) {
        return NextResponse.json(
          { success: false, error: "Email atau kata sandi salah, atau akun belum terverifikasi." },
          { status: 401 }
        );
      }

      const profile = await upsertSupabaseProfile({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
        avatarUrl: data.user.user_metadata?.avatar_url,
      });

      const redirectTo = profile.role === "admin" ? "/admin" : "/dashboard";
      const res = NextResponse.json({
        success: true,
        user: profile,
        redirectTo,
      });
      setSessionCookies(res, data.access_token, data.refresh_token);
      return res;
    } catch {
      return NextResponse.json(
        { success: false, error: "Layanan autentikasi sedang tidak tersedia. Coba lagi sebentar." },
        { status: 502 }
      );
    }
  }

  // Jalur 2: Local Development Fallback (hanya non-production)
  if (!isLocalDevAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: "Konfigurasi autentikasi server belum lengkap." },
      { status: 503 }
    );
  }

  await ensureLocalDevSeed();
  const account = await findLocalUserByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json(
      { success: false, error: "Email atau kata sandi salah." },
      { status: 401 }
    );
  }

  const role = account.role === "admin" || isAdminEmail(account.email) ? "admin" : "user";
  const profile = {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    avatarUrl: account.avatarUrl,
    role,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };

  const token = signLocalSessionToken(account.id, account.email);
  const redirectTo = role === "admin" ? "/admin" : "/dashboard";
  const res = NextResponse.json({
    success: true,
    user: profile,
    redirectTo,
    mode: "local-dev",
  });
  setSessionCookies(res, token);
  return res;
}
