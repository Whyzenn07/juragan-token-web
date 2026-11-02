import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { rateLimited } from "@/lib/keys";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`order:${ip}`, 20, 60_000)) {
    return NextResponse.json({ success: false, error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const result = await createOrder(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, ...result.value });
}
