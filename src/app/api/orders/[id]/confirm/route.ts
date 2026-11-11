import { NextRequest, NextResponse } from "next/server";
import { confirmOrder, tokenMatches } from "@/lib/orders";
import { query, mutate } from "@/lib/store";
import { rateLimited, safeEqualHash, sha256 } from "@/lib/keys";
import { fetchOrderFromSupabase } from "@/lib/supabase-sync";

/**
 * Konfirmasi pembayaran. Diizinkan untuk:
 *  - admin: header `x-admin-secret` sama dengan ADMIN_SECRET, atau
 *  - mode demo: DEMO_MODE !== "false" dan pemegang order token yang sah (tombol simulasi di modal).
 * Webhook SingaPay nanti cukup memanggil confirmOrder() yang sama setelah memverifikasi tanda tangannya.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`confirm:${ip}`, 30, 60_000)) {
    return NextResponse.json({ success: false, error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const adminSecret = process.env.ADMIN_SECRET?.trim();
  const provided = req.headers.get("x-admin-secret");
  const isAdmin = Boolean(adminSecret && provided && safeEqualHash(sha256(adminSecret), sha256(provided)));

  let allowed = isAdmin;
  if (!allowed && process.env.DEMO_MODE !== "false") {
    let order = await query((db) => db.orders[id]);
    if (!order) {
      const remote = await fetchOrderFromSupabase(id);
      if (remote) {
        order = remote;
        await mutate((db) => {
          db.orders[id] = remote;
        });
      }
    }
    allowed = Boolean(order && tokenMatches(order, req.headers.get("x-order-token")));
  }
  if (!allowed) {
    return NextResponse.json({ success: false, error: "Tidak diizinkan." }, { status: 403 });
  }

  const result = await confirmOrder(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  // Kunci utuh tidak dikembalikan di sini; pembeli mengambilnya lewat GET /api/orders/[id].
  return NextResponse.json({ success: true, order: result.value });
}
