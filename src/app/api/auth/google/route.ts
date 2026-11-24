import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAuthConfig,
  isSupabaseGoogleOAuthEnabled,
  isValidNextPath,
  OAUTH_NEXT_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const supa = getSupabaseAuthConfig();
  const nextPath = isValidNextPath(req.nextUrl.searchParams.get("next"));
  const referer = req.headers.get("referer") || "";
  const targetPage = referer.includes("/signup") ? "/signup" : "/login";
  const googleEnabled = await isSupabaseGoogleOAuthEnabled();

  if (!supa.isAuthConfigured || !googleEnabled) {
    const redirectUrl = new URL(targetPage, req.url);
    redirectUrl.searchParams.set(
      "error",
      "Login cepat Google OAuth belum diaktifkan di server. Silakan masuk atau daftar langsung menggunakan form Alamat Gmail & Kata Sandi di bawah."
    );
    if (nextPath && nextPath !== "/") redirectUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(redirectUrl);
  }

  // PKCE S256 verifier + challenge
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const callbackUrl = `${req.nextUrl.origin}/api/auth/callback`;

  const authorizeUrl = new URL(`${supa.url}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", callbackUrl);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");

  const res = NextResponse.redirect(authorizeUrl);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set(OAUTH_NEXT_COOKIE, nextPath, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}
