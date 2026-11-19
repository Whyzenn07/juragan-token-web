import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "jt_session";

/**
 * Next.js 16 Proxy Guard (Optimistic Session Check).
 * Otorisasi RBAC (role admin/user) tetap diverifikasi ketat di server pada setiap API route & server guard.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  const { pathname, search } = request.nextUrl;

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
