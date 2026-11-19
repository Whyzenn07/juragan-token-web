import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminApproveOrder, adminUpdateOrderStatus } from "@/lib/admin-service";
import type { OrderStatus } from "@/lib/store";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "expire" | "note";
    status?: OrderStatus;
    adminNotes?: string;
  };

  if (body.action === "approve") {
    const result = await adminApproveOrder(id, guard.session.user, body.adminNotes);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      order: result.order,
      issuedKey: result.issuedKey,
      keyRecord: result.keyRecord,
    });
  }

  const nextStatus: OrderStatus | undefined =
    body.action === "expire" ? "expired" : body.status;

  const result = await adminUpdateOrderStatus({
    orderId: id,
    status: nextStatus,
    adminNotes: body.adminNotes,
    admin: guard.session.user,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order });
}
