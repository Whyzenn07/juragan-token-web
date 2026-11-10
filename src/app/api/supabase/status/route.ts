import { NextRequest, NextResponse } from "next/server";
import { checkSupabaseHealth, syncBidirectionalStore } from "@/lib/supabase-sync";
import { query } from "@/lib/store";

export async function GET() {
  const health = await checkSupabaseHealth();
  const localStats = await query((db) => ({
    ordersCount: Object.keys(db.orders || {}).length,
    keysCount: Object.keys(db.keys || {}).length,
    usageLogsCount: (db.usageLogs || []).length,
  }));

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    health,
    localStore: localStats,
    hint: !health.tables.usageLogs
      ? "Tabel public.usage_logs belum ada di Supabase. Jalankan query migrations/20261102000002_usage_logs.sql di SQL Editor Supabase."
      : "Semua tabel Supabase aktif dan siap sinkronisasi.",
  });
}

export async function POST(_req: NextRequest) {
  try {
    const syncResult = await syncBidirectionalStore();
    return NextResponse.json({
      success: true,
      message: "Sinkronisasi dua arah antara Local Store & Supabase Cloud berhasil dijalankan.",
      result: syncResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Gagal menjalankan sinkronisasi Supabase.",
      },
      { status: 500 }
    );
  }
}
