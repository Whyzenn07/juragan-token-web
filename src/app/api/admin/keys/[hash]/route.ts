import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminControlKey } from "@/lib/admin-service";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ hash: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { hash } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "suspend" | "activate" | "revoke" | "adjust_balance" | "rotate" | "assign_email";
    deltaIdr?: number;
    userEmail?: string;
    label?: string;
  };

  if (!body.action) {
    return NextResponse.json({ success: false, error: "Aksi wajib ditentukan." }, { status: 400 });
  }

  const result = await adminControlKey({
    hash,
    action: body.action,
    deltaIdr: body.deltaIdr,
    userEmail: body.userEmail,
    label: body.label,
    admin: guard.session.user,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    key: result.key,
    newKey: result.newKey,
    rotatedPlaintextKey: result.rotatedPlaintextKey,
  });
}
