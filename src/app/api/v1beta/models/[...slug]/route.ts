import { NextRequest, NextResponse } from "next/server";
import {
  acquireStreamSlot,
  authenticateGatewayKey,
  calculateUsageCost,
  checkGatewayRateLimit,
  deductKeyBalance,
  estimateMinimumRequestCost,
  estimateTokensFromText,
  getUpstreamEngineStatus,
  MAX_CONCURRENT_STREAMS,
  recordUsageLog,
  releaseStreamSlot,
  sanitizeUpstreamErrorMessage,
} from "@/lib/gateway";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function geminiError(code: number, status: string, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
      },
    },
    { status: code, headers: CORS_HEADERS }
  );
}

/**
 * Endpoint Google Gemini Native (`POST /api/v1beta/models/{model}:generateContent`, `:streamGenerateContent`, `:countTokens`,
 * serta rewrite `POST /v1beta/models/...`).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  const rawSlug = (slug || []).join("/");
  const [rawModelPart, rawAction = "generateContent"] = rawSlug.split(":");
  const requestedModel = (rawModelPart || "gemini-4-carbon").trim().slice(0, 100);
  const action = rawAction.trim() || "generateContent";

  const authHeader =
    req.headers.get("x-goog-api-key") ||
    req.headers.get("authorization") ||
    req.nextUrl.searchParams.get("key");
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  const auth = await authenticateGatewayKey(authHeader, clientIp);
  if (!auth.ok || !auth.keyRecord || !auth.keyHash) {
    const code = auth.status || 401;
    const statusLabel =
      code === 402 ? "RESOURCE_EXHAUSTED" : code === 403 ? "PERMISSION_DENIED" : "UNAUTHENTICATED";
    return geminiError(code, statusLabel, auth.error || "API Key tidak valid.");
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return geminiError(400, "INVALID_ARGUMENT", "Payload JSON harus berupa objek.");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return geminiError(400, "INVALID_ARGUMENT", "Format JSON tidak valid dalam body request.");
  }

  if (!Array.isArray(body.contents) || body.contents.length === 0) {
    return geminiError(
      400,
      "INVALID_ARGUMENT",
      "Parameter 'contents' wajib diisi berupa array konten Gemini."
    );
  }

  const estimatedInputTokens = Math.max(10, Math.ceil(JSON.stringify(body.contents).length / 4));
  const minRequiredIdr = estimateMinimumRequestCost(requestedModel, estimatedInputTokens);

  if (auth.keyRecord.balanceIdr < minRequiredIdr) {
    return geminiError(
      402,
      "RESOURCE_EXHAUSTED",
      `Saldo kredit Anda (Rp ${auth.keyRecord.balanceIdr}) tidak mencukupi estimasi biaya minimum request ini (Rp ${minRequiredIdr}). Silakan lakukan top-up di https://www.juragantoken.co.id`
    );
  }

  const rateCheck = checkGatewayRateLimit(auth.keyHash, requestedModel);
  if (rateCheck.limited) {
    return geminiError(
      429,
      "RESOURCE_EXHAUSTED",
      `Batas laju permintaan (Rate Limit ${rateCheck.rpmLimit} req/menit) terlampaui untuk kunci API ini.`
    );
  }

  if (!acquireStreamSlot(auth.keyHash)) {
    return geminiError(
      429,
      "RESOURCE_EXHAUSTED",
      `Batas konkurensi maksimal (${MAX_CONCURRENT_STREAMS} stream simultan per API Key) tercapai.`
    );
  }

  let slotReleased = false;
  const freeSlot = () => {
    if (!slotReleased && auth.keyHash) {
      slotReleased = true;
      releaseStreamSlot(auth.keyHash);
    }
  };

  const engineStatus = getUpstreamEngineStatus();
  const engineKey =
    process.env.UPSTREAM_ENGINE_KEY?.trim() ||
    process.env.TOKOTOKENAI_API_KEY?.trim() ||
    "";
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";

  if (!geminiKey && !engineKey) {
    freeSlot();
    return geminiError(
      503,
      "UNAVAILABLE",
      "Master Key Google Gemini (GEMINI_API_KEY / UPSTREAM_ENGINE_KEY) belum dikonfigurasi di server Juragan Token."
    );
  }

  const targetActionUrl = `${requestedModel}:${action}`;
  const isDirectGemini = Boolean(geminiKey) && !engineStatus.routeAllToCentralEngine;
  const upstreamUrl = isDirectGemini
    ? `https://generativelanguage.googleapis.com/v1beta/models/${targetActionUrl}`
    : `${engineStatus.engineUrl}/v1beta/models/${targetActionUrl}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (isDirectGemini) {
    const keyPool = geminiKey.split(",").map((k) => k.trim()).filter(Boolean);
    headers["x-goog-api-key"] = keyPool[Math.floor(Math.random() * keyPool.length)] || geminiKey;
  } else {
    headers["Authorization"] = `Bearer ${engineKey}`;
    headers["x-goog-api-key"] = engineKey;
    headers["x-juragan-client-key"] = auth.keyHash;
    headers["x-juragan-retail-origin"] = "juragan-token-web";
  }

  try {
    const querySuffix = req.nextUrl.searchParams.get("alt")
      ? `?alt=${encodeURIComponent(req.nextUrl.searchParams.get("alt")!)}`
      : "";
    const upstreamRes = await fetch(`${upstreamUrl}${querySuffix}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      freeSlot();
      const errBody = (await upstreamRes.json().catch(() => ({}))) as {
        error?: { message?: string; status?: string };
      };
      const rawMessage = sanitizeUpstreamErrorMessage(String(errBody?.error?.message || ""));
      return geminiError(
        upstreamRes.status,
        errBody?.error?.status || "INTERNAL",
        rawMessage || `Engine Gemini mengembalikan status ${upstreamRes.status}.`
      );
    }

    const isStream = action === "streamGenerateContent";
    if (isStream && upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      const passthrough = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                const outTokens = Math.max(10, estimateTokensFromText(accumulatedText));
                const costIdr = calculateUsageCost(requestedModel, estimatedInputTokens, outTokens);
                const remainingBal = await deductKeyBalance(auth.keyHash!, costIdr);
                await recordUsageLog({
                  keyHash: auth.keyHash!,
                  keyLast4: auth.keyRecord!.last4,
                  model: requestedModel,
                  provider: "gemini",
                  promptTokens: estimatedInputTokens,
                  completionTokens: outTokens,
                  totalTokens: estimatedInputTokens + outTokens,
                  costIdr,
                  remainingBalanceIdr: remainingBal,
                }).catch(() => undefined);
                controller.close();
                break;
              }
              accumulatedText += decoder.decode(value, { stream: true });
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          } finally {
            freeSlot();
          }
        },
        cancel() {
          freeSlot();
          reader.cancel().catch(() => undefined);
        },
      });

      return new Response(passthrough, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": upstreamRes.headers.get("content-type") || "text/event-stream",
          "Cache-Control": "no-cache",
          "x-juragan-model": requestedModel,
        },
      });
    }

    const data = (await upstreamRes.json()) as {
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const promptTokens = data.usageMetadata?.promptTokenCount || estimatedInputTokens;
    const replyText =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const completionTokens =
      data.usageMetadata?.candidatesTokenCount || Math.max(10, estimateTokensFromText(replyText));
    const totalTokens = promptTokens + completionTokens;
    const costIdr = calculateUsageCost(requestedModel, promptTokens, completionTokens);
    const remainingBal = await deductKeyBalance(auth.keyHash, costIdr);

    await recordUsageLog({
      keyHash: auth.keyHash,
      keyLast4: auth.keyRecord.last4,
      model: requestedModel,
      provider: "gemini",
      promptTokens,
      completionTokens,
      totalTokens,
      costIdr,
      remainingBalanceIdr: remainingBal,
    }).catch(() => undefined);

    freeSlot();

    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        "x-juragan-model": requestedModel,
        "x-juragan-cost-idr": String(costIdr),
        "x-juragan-balance-remaining-idr": String(remainingBal),
      },
    });
  } catch (err) {
    freeSlot();
    console.error("[GEMINI NATIVE GATEWAY ERROR]", err);
    return geminiError(
      502,
      "UNAVAILABLE",
      "Gagal terhubung ke engine Google Gemini. Silakan coba kembali sesaat lagi."
    );
  }
}
