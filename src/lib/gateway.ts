import { sha256 } from "./keys";
import { query, mutate, type KeyRecord } from "./store";
import { syncKeyToSupabase } from "./supabase-sync";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export type AuthResult = {
  ok: boolean;
  error?: string;
  status?: number;
  keyRecord?: KeyRecord;
  keyHash?: string;
};

/**
 * Autentikasi API Key `jt-live-...` dari database lokal atau Supabase cloud
 */
export async function authenticateGatewayKey(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader) {
    return {
      ok: false,
      status: 401,
      error: "Header Authorization tidak ditemukan. Gunakan format: 'Authorization: Bearer jt-live-...'",
    };
  }

  const parts = authHeader.split(" ");
  const rawKey = parts.length === 2 && parts[0].toLowerCase() === "bearer" ? parts[1].trim() : authHeader.trim();

  if (!rawKey.startsWith("jt-live-") || rawKey.length < 20) {
    return {
      ok: false,
      status: 401,
      error: "Format API Key tidak valid. API Key resmi Juragan Token diawali dengan 'jt-live-'",
    };
  }

  const hash = sha256(rawKey);

  // 1. Cek di local store
  let record = await query((db) => db.keys[hash]);

  // 2. Jika tidak ada di lokal, cek di Supabase Cloud
  if (!record && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/keys?hash=eq.${hash}&select=*`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (res.ok) {
        const rows = await res.json();
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
          // Simpan ke local cache untuk request berikutnya
          await mutate((db) => {
            db.keys[hash] = record!;
          });
        }
      }
    } catch (err) {
      console.warn("[GATEWAY AUTH] Gagal query Supabase fallback:", err);
    }
  }

  if (!record) {
    return {
      ok: false,
      status: 401,
      error: "API Key tidak terdaftar atau tidak aktif. Periksa kembali kunci Anda di https://juragantoken.com",
    };
  }

  if (record.status !== "active") {
    return {
      ok: false,
      status: 403,
      error: `API Key dalam status non-aktif (${record.status}). Hubungi bantuan di WhatsApp 081226983990.`,
    };
  }

  if (record.balanceIdr <= 0) {
    return {
      ok: false,
      status: 402,
      error: "Saldo kredit Juragan Token Anda telah habis (Rp 0). Silakan lakukan top-up paket di https://juragantoken.com",
    };
  }

  return {
    ok: true,
    keyRecord: record,
    keyHash: hash,
  };
}

/**
 * Normalisasi nama model ke provider upstream yang sesuai
 */
export function resolveUpstreamModel(inputModel: string): {
  provider: "gemini" | "openrouter";
  targetModel: string;
} {
  const m = (inputModel || "gemini-2.0-flash").toLowerCase().trim();

  // Mapping Google Gemini
  if (
    m.includes("gemini") ||
    m === "default" ||
    m === "gpt-3.5-turbo" // fallback umum untuk client lama
  ) {
    if (m.includes("pro")) return { provider: "gemini", targetModel: "gemini-1.5-pro" };
    if (m.includes("1.5-flash")) return { provider: "gemini", targetModel: "gemini-1.5-flash" };
    return { provider: "gemini", targetModel: "gemini-2.0-flash" };
  }

  // Model lainnya (Claude, GPT-4o, DeepSeek) diarahkan ke OpenRouter
  return {
    provider: "openrouter",
    targetModel: inputModel,
  };
}

/**
 * Perhitungan tarif Rupiah per token berdasarkan jenis model
 */
export function calculateUsageCost(model: string, promptTokens: number, completionTokens: number): number {
  const m = model.toLowerCase();

  // Gemini Flash: sangat hemat (Rp 20 per 1.000 tokens)
  if (m.includes("flash")) {
    const totalTokens = promptTokens + completionTokens;
    const cost = Math.ceil((totalTokens / 1000) * 20);
    return Math.max(5, cost); // Minimal potong Rp 5
  }

  // Gemini Pro: (Rp 60 per 1.000 tokens)
  if (m.includes("pro")) {
    const totalTokens = promptTokens + completionTokens;
    const cost = Math.ceil((totalTokens / 1000) * 60);
    return Math.max(10, cost);
  }

  // Claude / GPT-4 / DeepSeek: (Rp 200 per 1.000 tokens)
  const totalTokens = promptTokens + completionTokens;
  const cost = Math.ceil((totalTokens / 1000) * 200);
  return Math.max(25, cost);
}

/**
 * Potong saldo kredit key secara atomic di local store & sinkronkan ke Supabase
 */
export async function deductKeyBalance(keyHash: string, costIdr: number): Promise<number> {
  let remaining = 0;

  // 1. Update di local store
  const updatedRecord = await mutate((db) => {
    const rec = db.keys[keyHash];
    if (rec) {
      rec.balanceIdr = Math.max(0, rec.balanceIdr - costIdr);
      remaining = rec.balanceIdr;
      return rec;
    }
    return null;
  });

  // 2. Sinkronkan saldo baru ke Supabase
  if (updatedRecord) {
    syncKeyToSupabase(updatedRecord).catch((err) => {
      console.warn("[GATEWAY DEDUCT] Gagal sync pengurangan saldo ke Supabase:", err);
    });
  } else if (SUPABASE_URL && SUPABASE_KEY) {
    // Jika tidak ada di local store, patch langsung ke Supabase
    try {
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/keys?hash=eq.${keyHash}&select=balance_idr`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (getRes.ok) {
        const rows = await getRes.json();
        if (rows && rows.length > 0) {
          const newBal = Math.max(0, (rows[0].balance_idr || 0) - costIdr);
          remaining = newBal;
          await fetch(`${SUPABASE_URL}/rest/v1/keys?hash=eq.${keyHash}`, {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ balance_idr: newBal }),
          });
        }
      }
    } catch (err) {
      console.warn("[GATEWAY DEDUCT] Gagal patch balance di Supabase:", err);
    }
  }

  return remaining;
}
