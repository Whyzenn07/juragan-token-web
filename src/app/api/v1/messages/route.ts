import { NextRequest, NextResponse } from "next/server";
import {
  acquireStreamSlot,
  authenticateGatewayKey,
  calculateUsageCost,
  checkGatewayRateLimit,
  deductKeyBalance,
  estimateMinimumRequestCost,
  estimatePromptTokens,
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

function anthropicError(status: number, type: string, message: string) {
  return NextResponse.json(
    {
      type: "error",
      error: {
        type,
        message,
      },
    },
    { status, headers: CORS_HEADERS }
  );
}

/**
 * Endpoint Anthropic Messages Native (`POST /api/v1/messages` & rewrite `POST /v1/messages`)
 * untuk kompatibilitas langsung Claude Code CLI dan Anthropic SDK resmi.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-api-key") || req.headers.get("authorization");
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1";

  const auth = await authenticateGatewayKey(authHeader, clientIp);
  if (!auth.ok || !auth.keyRecord || !auth.keyHash) {
    const status = auth.status || 401;
    const errType =
      status === 402
        ? "insufficient_quota"
        : status === 403
        ? "permission_error"
        : "authentication_error";
    return anthropicError(status, errType, auth.error || "API Key tidak valid.");
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return anthropicError(400, "invalid_request_error", "Payload JSON harus berupa objek.");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return anthropicError(400, "invalid_request_error", "Format JSON tidak valid dalam body request.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return anthropicError(
      400,
      "invalid_request_error",
      "Parameter 'messages' wajib diisi berupa array riwayat percakapan."
    );
  }

  if (body.messages.length > 200) {
    return anthropicError(
      400,
      "invalid_request_error",
      "Jumlah pesan maksimal per permintaan adalah 200 pesan."
    );
  }

  const requestedModel =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim().slice(0, 100)
      : "claude-opus-5-5";

  const estimatedInputTokens = estimatePromptTokens(body.messages);
  const minRequiredIdr = estimateMinimumRequestCost(requestedModel, estimatedInputTokens);

  if (auth.keyRecord.balanceIdr < minRequiredIdr) {
    return anthropicError(
      402,
      "insufficient_quota",
      `Saldo kredit Anda (Rp ${auth.keyRecord.balanceIdr}) tidak mencukupi estimasi biaya minimum request ini (Rp ${minRequiredIdr}). Silakan lakukan top-up di https://www.juragantoken.co.id`
    );
  }

  const rateCheck = checkGatewayRateLimit(auth.keyHash, requestedModel);
  if (rateCheck.limited) {
    return anthropicError(
      429,
      "rate_limit_error",
      `Batas laju permintaan (Rate Limit ${rateCheck.rpmLimit} req/menit) terlampaui untuk kunci API ini.`
    );
  }

  if (!acquireStreamSlot(auth.keyHash)) {
    return anthropicError(
      429,
      "rate_limit_error",
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

  if (!engineKey) {
    freeSlot();
    return anthropicError(
      503,
      "api_error",
      "Master API Key LLM (UPSTREAM_ENGINE_KEY) belum dikonfigurasi oleh tim developer."
    );
  }

  const normalizedMaxTokens =
    typeof body.max_tokens === "number" && Number.isFinite(body.max_tokens)
      ? Math.min(Math.max(1, Math.round(body.max_tokens)), 32768)
      : 4096;

  const upstreamPayload = {
    ...body,
    model: requestedModel,
    max_tokens: normalizedMaxTokens,
  };

  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${engineKey}`,
    "x-api-key": engineKey,
    "anthropic-version": req.headers.get("anthropic-version") || "2023-06-01",
    "x-juragan-client-key": auth.keyHash,
    "x-juragan-retail-origin": "juragan-token-web",
  };

  try {
    const upstreamRes = await fetch(`${engineStatus.engineUrl}/messages`, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamPayload),
    });

    if (!upstreamRes.ok) {
      freeSlot();
      const errBody = (await upstreamRes.json().catch(() => ({}))) as {
        error?: { message?: string; type?: string };
      };
      const rawMessage = sanitizeUpstreamErrorMessage(String(errBody?.error?.message || ""));
      return anthropicError(
        upstreamRes.status,
        errBody?.error?.type || "api_error",
        rawMessage || `Engine upstream mengembalikan status ${upstreamRes.status}.`
      );
    }

    const isStream = Boolean(body.stream);
    if (isStream && upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let inputTokens = estimatedInputTokens;
      let outputTokens = 0;

      const passthrough = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                const finalOut = outputTokens || Math.max(10, estimateTokensFromText(accumulatedText));
                const costIdr = calculateUsageCost(requestedModel, inputTokens, finalOut);
                const remainingBal = await deductKeyBalance(auth.keyHash!, costIdr);
                await recordUsageLog({
                  keyHash: auth.keyHash!,
                  keyLast4: auth.keyRecord!.last4,
                  model: requestedModel,
                  provider: "anthropic",
                  promptTokens: inputTokens,
                  completionTokens: finalOut,
                  totalTokens: inputTokens + finalOut,
                  costIdr,
                  remainingBalanceIdr: remainingBal,
                }).catch(() => undefined);
                controller.close();
                break;
              }
              const chunkStr = decoder.decode(value, { stream: true });
              accumulatedText += chunkStr;
              const inMatch = chunkStr.match(/"input_tokens":(\d+)/);
              if (inMatch) inputTokens = Number(inMatch[1]);
              const outMatch = chunkStr.match(/"output_tokens":(\d+)/);
              if (outMatch) outputTokens = Number(outMatch[1]);
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
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-juragan-model": requestedModel,
        },
      });
    }

    const data = (await upstreamRes.json()) as {
      usage?: { input_tokens?: number; output_tokens?: number };
      content?: Array<{ text?: string }>;
    };
    const promptTokens = data.usage?.input_tokens || estimatedInputTokens;
    const textReply = Array.isArray(data.content)
      ? data.content.map((c) => c.text || "").join("")
      : "";
    const completionTokens =
      data.usage?.output_tokens || Math.max(10, estimateTokensFromText(textReply));
    const totalTokens = promptTokens + completionTokens;
    const costIdr = calculateUsageCost(requestedModel, promptTokens, completionTokens);
    const remainingBal = await deductKeyBalance(auth.keyHash, costIdr);

    await recordUsageLog({
      keyHash: auth.keyHash,
      keyLast4: auth.keyRecord.last4,
      model: requestedModel,
      provider: "anthropic",
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
    console.error("[ANTHROPIC GATEWAY ERROR]", err);
    return anthropicError(
      502,
      "api_error",
      "Gagal terhubung ke engine upstream Anthropic. Silakan coba kembali sesaat lagi."
    );
  }
}
