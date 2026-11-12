import { rateLimited, sha256 } from "./keys";
import { query, mutate, type KeyRecord } from "./store";
import { syncKeyToSupabase, syncUsageLogToSupabase, getSupabaseConfig, fetchKeyFromSupabase } from "./supabase-sync";

export const MAX_CONCURRENT_STREAMS = 5;
const activeStreams = new Map<string, number>();

/**
 * Batas konkurensi: maksimal 5 stream/request simultan per API Key (PRD Bagian 8.2)
 */
export function acquireStreamSlot(keyHash: string): boolean {
  const current = activeStreams.get(keyHash) ?? 0;
  if (current >= MAX_CONCURRENT_STREAMS) {
    return false;
  }
  activeStreams.set(keyHash, current + 1);
  return true;
}

export function releaseStreamSlot(keyHash: string): void {
  const current = activeStreams.get(keyHash) ?? 0;
  if (current <= 1) {
    activeStreams.delete(keyHash);
  } else {
    activeStreams.set(keyHash, current - 1);
  }
}

/**
 * Rate-Limiting per API Key (PRD Bagian 8.2):
 * - 60 RPM untuk model umum (Gemini Flash/Pro)
 * - 20 RPM untuk model frontier reasoning (Claude, GPT-4o, DeepSeek)
 */
export function checkGatewayRateLimit(keyHash: string, model: string): { limited: boolean; rpmLimit: number } {
  const m = (model || "").toLowerCase();
  const isFrontier = !m.includes("gemini") && m !== "default" && m !== "gpt-3.5-turbo";
  const rpmLimit = isFrontier ? 20 : 60;
  const bucketKey = `gw:${isFrontier ? "frontier" : "general"}:${keyHash}`;
  return {
    limited: rateLimited(bucketKey, rpmLimit, 60_000),
    rpmLimit,
  };
}

/**
 * Estimasi jumlah token berdasarkan panjang teks (~4 karakter per token)
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimatePromptTokens(messages: unknown[]): number {
  if (!Array.isArray(messages)) return 32;
  let totalChars = 0;
  for (const msg of messages) {
    if (msg && typeof msg === "object") {
      const content = (msg as Record<string, unknown>).content;
      if (typeof content === "string") {
        totalChars += content.length + 12;
      } else if (Array.isArray(content)) {
        totalChars += JSON.stringify(content).length;
      }
    }
  }
  return Math.max(10, Math.ceil(totalChars / 4));
}

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

  // 2. Di serverless Vercel atau jika belum ada di lokal, hydrate dari Supabase Cloud
  if (!record || process.env.VERCEL) {
    const remote = await fetchKeyFromSupabase(hash);
    if (remote) {
      record = remote;
      await mutate((db) => {
        db.keys[hash] = remote;
      });
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

export type UpstreamEngineStatus = {
  engineUrl: string;
  hasEngineMasterKey: boolean;
  hasGeminiDirectKey: boolean;
  routeAllToCentralEngine: boolean;
  mode: "live_central_engine" | "hybrid_gemini_fallback" | "awaiting_dev_key";
};

/**
 * Status kesiapan koneksi ke Master LLM Engine (https://api.tokotokenai.com/v1).
 * Begitu tim developer mengisi UPSTREAM_ENGINE_KEY di .env / Vercel, mode langsung berubah ke "live_central_engine".
 */
export function getUpstreamEngineStatus(): UpstreamEngineStatus {
  const engineUrl = (process.env.UPSTREAM_ENGINE_URL || "https://api.tokotokenai.com/v1").trim().replace(/\/+$/, "");
  const engineKey = (
    process.env.UPSTREAM_ENGINE_KEY ||
    process.env.TOKOTOKENAI_API_KEY ||
    ""
  ).trim();
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const routeAll = (process.env.UPSTREAM_ROUTE_ALL || "false").toLowerCase() === "true";

  let mode: UpstreamEngineStatus["mode"] = "awaiting_dev_key";
  if (engineKey) {
    mode = "live_central_engine";
  } else if (geminiKey) {
    mode = "hybrid_gemini_fallback";
  }

  return {
    engineUrl,
    hasEngineMasterKey: Boolean(engineKey),
    hasGeminiDirectKey: Boolean(geminiKey),
    routeAllToCentralEngine: routeAll || (Boolean(engineKey) && !geminiKey),
    mode,
  };
}

/**
 * Normalisasi nama model ke provider upstream yang sesuai.
 * - Jika UPSTREAM_ENGINE_KEY (https://api.tokotokenai.com/v1) sudah diisi dan UPSTREAM_ROUTE_ALL="true" (atau GEMINI_API_KEY kosong),
 *   semua model termasuk Gemini diarahkan langsung ke Central Engine https://api.tokotokenai.com/v1.
 * - Model Claude, GPT-4o, DeepSeek, Qwen, Grok, Kimi, MiniMax selalu diarahkan ke Pass-Through Engine (https://api.tokotokenai.com/v1).
 */
export function resolveUpstreamModel(inputModel: string): {
  provider: "gemini" | "engine";
  targetModel: string;
} {
  const m = (inputModel || "gemini-3.5-flash").toLowerCase().trim();
  const engineStatus = getUpstreamEngineStatus();

  if (engineStatus.routeAllToCentralEngine) {
    return {
      provider: "engine",
      targetModel: inputModel || "gemini-3.5-flash",
    };
  }

  // Mapping Google Gemini (bisa diproses lokal mandiri via GEMINI_API_KEY)
  if (
    m.includes("gemini") ||
    m === "default" ||
    m === "gpt-3.5-turbo" // fallback umum untuk client lama
  ) {
    if (m.includes("pro")) return { provider: "gemini", targetModel: "gemini-pro-latest" };
    return { provider: "gemini", targetModel: "gemini-flash-lite-latest" };
  }

  // Model lainnya (Claude Opus/Sonnet, GPT-4o/Astra, DeepSeek) diarahkan ke Pass-Through Engine (https://api.tokotokenai.com/v1)
  return {
    provider: "engine",
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
 * Potong saldo kredit key secara atomic di Supabase (via RPC atau upsert) & local store
 */
export async function deductKeyBalance(keyHash: string, costIdr: number): Promise<number> {
  let remaining = 0;
  const { url: sbUrl, key: sbKey, isConfigured: sbConfigured } = getSupabaseConfig();

  // 1. Coba eksekusi RPC atomik di Supabase jika tersedia
  let rpcHandled = false;
  if (sbConfigured) {
    try {
      const rpcRes = await fetch(`${sbUrl}/rest/v1/rpc/deduct_token_balance`, {
        method: "POST",
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_key_hash: keyHash,
          deduct_amount: costIdr,
        }),
      });
      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (row && typeof row.new_balance !== "undefined") {
          remaining = Math.max(0, Number(row.new_balance));
          rpcHandled = true;
        }
      }
    } catch {
      // Fallback ke metode standar jika fungsi RPC belum dibuat di database
    }
  }

  // 2. Update di local store
  const updatedRecord = await mutate((db) => {
    const rec = db.keys[keyHash];
    if (rec) {
      rec.balanceIdr = rpcHandled ? remaining : Math.max(0, rec.balanceIdr - costIdr);
      remaining = rec.balanceIdr;
      return rec;
    }
    return null;
  });

  // 3. Jika RPC belum aktif di Supabase, sinkronkan saldo baru via REST upsert / PATCH
  if (!rpcHandled) {
    if (updatedRecord) {
      await syncKeyToSupabase(updatedRecord).catch((err) => {
        console.warn("[GATEWAY DEDUCT] Gagal sync pengurangan saldo ke Supabase:", err);
      });
    } else if (sbConfigured) {
      try {
        const remote = await fetchKeyFromSupabase(keyHash);
        if (remote) {
          remote.balanceIdr = Math.max(0, remote.balanceIdr - costIdr);
          remaining = remote.balanceIdr;
          await syncKeyToSupabase(remote);
          await mutate((db) => {
            db.keys[keyHash] = remote;
          });
        }
      } catch (err) {
        console.warn("[GATEWAY DEDUCT] Gagal patch balance di Supabase:", err);
      }
    }
  }

  return remaining;
}

export type RecordUsageParams = {
  keyHash: string;
  keyLast4: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costIdr: number;
  remainingBalanceIdr: number;
};

/**
 * Catat riwayat inferensi chat ke memory store lokal dan Supabase public.usage_logs
 */
export async function recordUsageLog(params: RecordUsageParams): Promise<void> {
  const logId = `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  // 1. Simpan di local store
  await mutate((db) => {
    if (!db.usageLogs) db.usageLogs = [];
    db.usageLogs.unshift({
      id: logId,
      ...params,
      createdAt: now,
    });
    if (db.usageLogs.length > 200) db.usageLogs = db.usageLogs.slice(0, 200);
  }).catch(() => undefined);

  // 2. Kirim ke Supabase public.usage_logs
  await syncUsageLogToSupabase({
    ...params,
    createdAt: now,
  }).catch(() => undefined);
}
