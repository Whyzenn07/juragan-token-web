import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createUserOrderRequest, getUserDashboardData } from "@/lib/admin-service";

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const data = await getUserDashboardData(guard.session.user);
  return NextResponse.json(
    { success: true, ...data },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    packageId?: string;
    baseIdr?: number;
    methodName?: string;
    customerPhone?: string;
    note?: string;
    accountTier?: "standard" | "enterprise";
    companyName?: string;
    department?: string;
    requiresTaxInvoice?: boolean;
    npwp?: string;
    targetKeyHash?: string;
  };

  const result = await createUserOrderRequest(guard.session.user, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order });
}
