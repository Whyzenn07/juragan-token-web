import { NextRequest, NextResponse } from "next/server";
import { checkSupabaseHealth, syncBidirectionalStore } from "@/lib/supabase-sync";
import { getPaymentGatewayStatus } from "@/lib/payment-gateway";
import { getUpstreamEngineStatus } from "@/lib/gateway";
import { query } from "@/lib/store";
import { rateLimited, safeEqualSecret } from "@/lib/keys";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`status:${ip}`, 60, 60_000)) {
    return NextResponse.json({ success: false, error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const health = await checkSupabaseHealth();
  const paymentGateway = getPaymentGatewayStatus();
  const upstreamEngine = getUpstreamEngineStatus();
  const emailConfigured = Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());

  const localStats = await query((db) => ({
    ordersCount: Object.keys(db.orders || {}).length,
    keysCount: Object.keys(db.keys || {}).length,
    usageLogsCount: (db.usageLogs || []).length,
  }));

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    health: {
      connected: health.connected,
      isServiceRole: health.isServiceRole,
      latencyMs: health.latencyMs,
      tables: health.tables,
    },
    pillars: {
      supabase: {
        connected: health.connected,
        isServiceRole: health.isServiceRole,
        latencyMs: health.latencyMs,
        tables: health.tables,
      },
      email: {
        configured: emailConfigured,
        fromName: process.env.GMAIL_FROM_NAME || "Juragan Token Indonesia",
      },
      paymentGateway,
      upstreamEngine,
    },
    localStore: localStats,
    hint: !health.tables.usageLogs
      ? "Tabel public.usage_logs belum ada di Supabase. Jalankan query migrations/20261102000002_usage_logs.sql di SQL Editor Supabase."
      : "Semua tabel Supabase aktif dan siap sinkronisasi.",
  });
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  const providedSecret = req.headers.get("x-admin-secret")?.trim();
  if (!adminSecret || !safeEqualSecret(adminSecret, providedSecret)) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak: Sinkronisasi paksa memerlukan header x-admin-secret." },
      { status: 403 }
    );
  }

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
