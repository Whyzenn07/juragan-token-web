import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAuthConfig,
  isValidNextPath,
  OAUTH_NEXT_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  setSessionCookies,
  upsertSupabaseProfile,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supa = getSupabaseAuthConfig();
  const code = req.nextUrl.searchParams.get("code")?.trim();
  const errorDesc = req.nextUrl.searchParams.get("error_description");
  const codeVerifier = req.cookies.get(OAUTH_VERIFIER_COOKIE)?.value?.trim();
  const savedNext = req.cookies.get(OAUTH_NEXT_COOKIE)?.value;

  const fail = (message: string) => {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  };

  if (errorDesc) return fail(errorDesc);
  if (!supa.isAuthConfigured || !code || !codeVerifier) {
    return fail("Sesi OAuth Google tidak valid atau telah kedaluwarsa. Silakan coba lagi.");
  }

  try {
    const tokenRes = await fetch(`${supa.url}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        apikey: supa.publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: codeVerifier,
      }),
    });

    const data = (await tokenRes.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
      user?: { id?: string; email?: string; user_metadata?: { full_name?: string; name?: string; avatar_url?: string } };
    };

    if (!tokenRes.ok || !data.access_token || !data.user?.id || !data.user?.email) {
      return fail("Gagal memverifikasi akun Google. Pastikan Google Provider aktif di Supabase.");
    }

    const profile = await upsertSupabaseProfile({
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      avatarUrl: data.user.user_metadata?.avatar_url,
    });

    const requestedNext = isValidNextPath(savedNext);
    const destination =
      requestedNext !== "/"
        ? requestedNext
        : profile.role === "admin"
        ? "/admin"
        : "/dashboard";

    const res = NextResponse.redirect(new URL(destination, req.url));
    setSessionCookies(res, data.access_token, data.refresh_token);
    res.cookies.set(OAUTH_VERIFIER_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(OAUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return fail("Terjadi gangguan jaringan saat menukar token Google OAuth.");
  }
}
