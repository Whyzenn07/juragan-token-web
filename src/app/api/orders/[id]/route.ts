import { NextRequest, NextResponse } from "next/server";
import { readOrder } from "@/lib/orders";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await readOrder(id, req.headers.get("x-order-token"));
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, order: result.value }, { headers: { "Cache-Control": "no-store" } });
}
