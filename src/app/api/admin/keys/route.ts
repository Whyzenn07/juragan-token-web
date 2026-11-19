import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminProvisionKeyForGmail, getEnrichedKeys } from "@/lib/admin-service";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim() || "all";
  const search = req.nextUrl.searchParams.get("q")?.trim() || "";

  const keys = await getEnrichedKeys({ status, search });
  return NextResponse.json(
    { success: true, keys, total: keys.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userEmail?: string;
    label?: string;
    planName?: string;
    balanceIdr?: number;
    sendEmail?: boolean;
  };

  const result = await adminProvisionKeyForGmail({
    userEmail: body.userEmail ?? "",
    label: body.label,
    planName: body.planName,
    balanceIdr: Number(body.balanceIdr ?? 0),
    sendEmail: Boolean(body.sendEmail),
    admin: guard.session.user,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    key: result.key,
    plaintextKey: result.plaintextKey,
    maskedKey: result.maskedKey,
  });
}
