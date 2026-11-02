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

  let record = await query((db) => db.keys[sha256(key)]);
  if (!record && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const sbRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/keys?hash=eq.${sha256(key)}&select=*`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (sbRes.ok) {
        const rows = await sbRes.json();
        if (rows && rows.length > 0) {
          const r = rows[0];
          record = {
            hash: r.hash,
            last4: r.last4,
            orderId: r.order_id,
            planName: r.plan_name,
            estPackage: r.est_package,
            balanceIdr: r.balance_idr,
            status: r.status,
            createdAt: r.created_at,
          };
        }
      }
    } catch {
      // Supabase query error fallback
    }
  }

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
