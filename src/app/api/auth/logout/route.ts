import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, getSupabaseAuthConfig, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value?.trim();
  const supa = getSupabaseAuthConfig();

  if (token && !token.startsWith("local.") && supa.isAuthConfigured) {
    await fetch(`${supa.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: supa.publishableKey,
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
