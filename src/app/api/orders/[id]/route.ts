import { NextRequest, NextResponse } from "next/server";
import { readOrder } from "@/lib/orders";
import { rateLimited } from "@/lib/keys";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`order-poll:${ip}`, 120, 60_000)) {
    return NextResponse.json({ success: false, error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const result = await readOrder(id, req.headers.get("x-order-token"));
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, order: result.value }, { headers: { "Cache-Control": "no-store" } });
}
