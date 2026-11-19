import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/admin-service";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const overview = await getAdminOverview();
  return NextResponse.json(
    { success: true, admin: guard.session.user, ...overview },
    { headers: { "Cache-Control": "no-store" } }
  );
}
