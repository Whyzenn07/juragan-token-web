import { NextRequest, NextResponse } from "next/server";
import { query, mutate } from "@/lib/store";
import { maskKey, rateLimited, sha256 } from "@/lib/keys";
import { fetchKeyFromSupabase, fetchUsageLogsFromSupabase } from "@/lib/supabase-sync";

async function handleCheck(keyRaw: string, ip: string) {
  if (rateLimited(`check:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const key = keyRaw.trim();
  if (!key.startsWith("jt-live-") || key.length < 20 || key.length > 80) {
    return NextResponse.json({ success: false, error: "API Key tidak ditemukan." }, { status: 404 });
  }

  const hash = sha256(key);
  let record = await query((db) => db.keys[hash]);

  // Di serverless atau jika record belum ada di memory, selalu ambil dari Supabase
  const remote = await fetchKeyFromSupabase(hash);
  if (remote) {
    record = remote;
    await mutate((db) => {
      db.keys[hash] = remote;
    });
  }

  if (!record) {
    return NextResponse.json({ success: false, error: "API Key tidak ditemukan." }, { status: 404 });
  }

  // Ambil 10 riwayat pemakaian terbaru dari Supabase (fallback ke local store jika kosong)
  let usageLogs = await fetchUsageLogsFromSupabase(hash, 10);
  if (usageLogs.length === 0) {
    const localLogs = await query((db) => (db.usageLogs ?? []).filter((l) => l.keyHash === hash).slice(0, 10));
    if (localLogs.length > 0) usageLogs = localLogs;
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
        usageLogs: usageLogs.map((l) => ({
          id: l.id,
          model: l.model,
          provider: l.provider,
          totalTokens: l.totalTokens,
          costIdr: l.costIdr,
          createdAt: l.createdAt,
        })),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const body = (await req.json().catch(() => ({}))) as { key?: string };
  return handleCheck(body.key ?? "", ip);
}
