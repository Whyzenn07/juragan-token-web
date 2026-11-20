import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminCreateOrder, listAllOrders } from "@/lib/admin-service";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const status = req.nextUrl.searchParams.get("status")?.trim() || "all";
  const search = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";

  let orders = await listAllOrders();
  if (status !== "all") {
    orders = orders.filter((o) => o.status === status);
  }
  if (search) {
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(search) ||
        o.customerEmail.toLowerCase().includes(search) ||
        o.customerName.toLowerCase().includes(search) ||
        o.packageName.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(
    { success: true, orders, total: orders.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    packageId?: string;
    packageName?: string;
    baseIdr?: number;
    methodName?: string;
    adminNotes?: string;
    accountTier?: "standard" | "enterprise";
    companyName?: string;
    department?: string;
    requiresTaxInvoice?: boolean;
    npwp?: string;
    paymentProofUrl?: string;
    paymentProofName?: string;
    paymentReference?: string;
    autoApprove?: boolean;
  };

  const result = await adminCreateOrder({
    customerEmail: body.customerEmail ?? "",
    customerName: body.customerName ?? "",
    customerPhone: body.customerPhone,
    packageId: body.packageId,
    packageName: body.packageName,
    baseIdr: body.baseIdr,
    methodName: body.methodName,
    adminNotes: body.adminNotes,
    accountTier: body.accountTier,
    companyName: body.companyName,
    department: body.department,
    requiresTaxInvoice: Boolean(body.requiresTaxInvoice),
    npwp: body.npwp,
    paymentProofUrl: body.paymentProofUrl,
    paymentProofName: body.paymentProofName,
    paymentReference: body.paymentReference,
    autoApprove: Boolean(body.autoApprove),
    admin: guard.session.user,
  });

  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    order: result.order,
    issuedKey: result.issuedKey,
  });
}
