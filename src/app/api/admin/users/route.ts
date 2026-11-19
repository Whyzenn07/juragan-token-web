import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminUpdateUserRole, getEnrichedUsers } from "@/lib/admin-service";
import type { UserRole } from "@/lib/store";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const search = req.nextUrl.searchParams.get("q")?.trim() || "";
  const users = await getEnrichedUsers(search);
  return NextResponse.json(
    { success: true, users, total: users.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const body = (await req.json().catch(() => ({}))) as { userId?: string; role?: UserRole };
  if (!body.userId || (body.role !== "admin" && body.role !== "user")) {
    return NextResponse.json({ success: false, error: "Parameter userId atau role tidak valid." }, { status: 400 });
  }

  const result = await adminUpdateUserRole({
    userId: body.userId,
    role: body.role,
    admin: guard.session.user,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true });
}
