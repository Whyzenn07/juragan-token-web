import { NextResponse } from "next/server";
import { getServerSession, getSupabaseAuthConfig, isLocalDevAuthEnabled } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  const supa = getSupabaseAuthConfig();

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      user: session?.user ?? null,
      mode: session?.mode ?? (supa.isAuthConfigured ? "supabase" : isLocalDevAuthEnabled() ? "local-dev" : "unconfigured"),
      googleOAuthEnabled: supa.isAuthConfigured,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
