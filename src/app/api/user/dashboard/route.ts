import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  createUserOrderRequest,
  getUserDashboardData,
  userAttachOrderProof,
  userDismissOrderKeyReveal,
} from "@/lib/admin-service";

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
    paymentProofUrl?: string;
    paymentProofName?: string;
    paymentReference?: string;
  };

  const result = await createUserOrderRequest(guard.session.user, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: "dismiss_reveal" | "upload_proof";
    orderId?: string;
    paymentProofUrl?: string;
    paymentProofName?: string;
    paymentReference?: string;
  };

  if (!body.orderId?.trim()) {
    return NextResponse.json({ success: false, error: "ID pesanan wajib disertakan." }, { status: 400 });
  }

  if (body.action === "dismiss_reveal") {
    const result = await userDismissOrderKeyReveal(guard.session.user, body.orderId.trim());
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, order: result.order });
  }

  const result = await userAttachOrderProof(guard.session.user, body.orderId.trim(), {
    paymentProofUrl: body.paymentProofUrl ?? "",
    paymentProofName: body.paymentProofName,
    paymentReference: body.paymentReference,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, order: result.order });
}
