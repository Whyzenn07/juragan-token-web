import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/store";
import { maskKey, rateLimited, sha256 } from "@/lib/keys";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`check:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const key = (body.key ?? "").trim();
  if (!key.startsWith("jt-live-") || key.length < 20 || key.length > 80) {
    return NextResponse.json({ success: false, error: "API Key tidak ditemukan." }, { status: 404 });
  }

  const record = await query((db) => db.keys[sha256(key)]);
  if (!record) {
    return NextResponse.json({ success: false, error: "API Key tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: true,
      key: {
        maskedKey: maskKey(key),
        planName: record.planName,
        estPackage: record.estPackage,
        balanceIdr: record.balanceIdr,
        status: record.status,
        createdAt: record.createdAt,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
