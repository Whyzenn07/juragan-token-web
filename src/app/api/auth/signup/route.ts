import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureLocalDevSeed,
  findLocalUserByEmail,
  getSupabaseAuthConfig,
  hashPassword,
  isAdminEmail,
  isLocalDevAuthEnabled,
  setSessionCookies,
  signLocalSessionToken,
  upsertSupabaseProfile,
} from "@/lib/auth";
import { rateLimited } from "@/lib/keys";
import { mutate } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`auth-signup:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak permintaan pendaftaran. Coba lagi sebentar." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    fullName?: string;
    email?: string;
    password?: string;
  };
  const fullName = (body.fullName ?? "").trim().slice(0, 80);
  const email = (body.email ?? "").trim().toLowerCase().slice(0, 120);
  const password = body.password ?? "";

  if (fullName.length < 2) {
    return NextResponse.json({ success: false, error: "Nama lengkap minimal 2 karakter." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: "Format alamat email Gmail tidak valid." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { success: false, error: "Kata sandi minimal 8 karakter untuk keamanan akun Anda." },
      { status: 400 }
    );
  }

  const supa = getSupabaseAuthConfig();

  // Jalur 1: Supabase Auth
  if (supa.isAuthConfigured) {
    try {
      const origin = req.nextUrl.origin;
      const signupRes = await fetch(`${supa.url}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: supa.publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
          email_redirect_to: `${origin}/api/auth/callback`,
        }),
      });

      const data = (await signupRes.json().catch(() => ({}))) as {
        access_token?: string;
        refresh_token?: string;
        id?: string;
        user?: { id?: string; email?: string };
        msg?: string;
        error_description?: string;
      };

      if (!signupRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.msg || data.error_description || "Gagal mendaftarkan akun. Email mungkin sudah digunakan.",
          },
          { status: 400 }
        );
      }

      const userId = data.user?.id || data.id;
      if (userId) {
        const profile = await upsertSupabaseProfile({ id: userId, email, fullName });
        if (data.access_token) {
          const redirectTo = profile.role === "admin" ? "/admin" : "/dashboard";
          const res = NextResponse.json({
            success: true,
            requiresVerification: false,
            user: profile,
            redirectTo,
          });
          setSessionCookies(res, data.access_token, data.refresh_token);
          return res;
        }
      }

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Pendaftaran berhasil. Silakan periksa kotak masuk Gmail Anda untuk tautan konfirmasi.",
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Gagal menghubungi server autentikasi." },
        { status: 502 }
      );
    }
  }

  // Jalur 2: Local Development Fallback
  if (!isLocalDevAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: "Konfigurasi autentikasi server belum lengkap." },
      { status: 503 }
    );
  }

  await ensureLocalDevSeed();
  const existing = await findLocalUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Alamat email ini sudah terdaftar. Silakan Sign In." },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const id = `usr-${randomUUID().slice(0, 12)}`;
  const role = isAdminEmail(email) ? "admin" : "user";

  await mutate((db) => {
    db.users = db.users ?? {};
    db.users[id] = {
      id,
      email,
      fullName,
      role,
      provider: email.endsWith("@gmail.com") ? "google" : "email",
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };
  });

  const token = signLocalSessionToken(id, email);
  const redirectTo = role === "admin" ? "/admin" : "/dashboard";
  const res = NextResponse.json({
    success: true,
    requiresVerification: false,
    user: { id, email, fullName, role, createdAt: now, updatedAt: now },
    redirectTo,
    mode: "local-dev",
  });
  setSessionCookies(res, token);
  return res;
}
