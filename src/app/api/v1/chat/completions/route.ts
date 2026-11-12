import { NextRequest, NextResponse } from "next/server";
import {
  authenticateGatewayKey,
  resolveUpstreamModel,
  getUpstreamEngineStatus,
  calculateUsageCost,
  deductKeyBalance,
  recordUsageLog,
  acquireStreamSlot,
  releaseStreamSlot,
  checkGatewayRateLimit,
  estimatePromptTokens,
  estimateTokensFromText,
  MAX_CONCURRENT_STREAMS,
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

/**
 * Sanitasi chunk OpenAI: Hapus field non-standar Google (extra_content / thought_signature)
 * dan pastikan setiap tool_call memiliki properti `index: number` wajib.
 */
function sanitizeOpenAIChunk(parsed: any) {
  if (!parsed || !parsed.choices) return parsed;
  for (const choice of parsed.choices) {
    if (choice.delta) {
      if (choice.delta.extra_content) delete choice.delta.extra_content;
      if (Array.isArray(choice.delta.tool_calls)) {
        choice.delta.tool_calls.forEach((tc: any, idx: number) => {
          if (tc.extra_content) delete tc.extra_content;
          if (typeof tc.index !== "number") {
            tc.index = idx;
          }
        });
      }
    }
    if (choice.message) {
      if (choice.message.extra_content) delete choice.message.extra_content;
      if (Array.isArray(choice.message.tool_calls)) {
        choice.message.tool_calls.forEach((tc: any, idx: number) => {
          if (tc.extra_content) delete tc.extra_content;
          if (typeof tc.index !== "number") {
            tc.index = idx;
          }
        });
      }
    }
  }
  return parsed;
}

type StreamUsageResult = {
  usagePromptTokens?: number;
  usageCompletionTokens?: number;
  accumulatedText: string;
};

/**
 * TransformStream untuk memfilter baris SSE secara streaming tanpa merusak urutan teks,
 * sekaligus mengakumulasi token output untuk pemotongan saldo akurat di akhir stream.
 */
function createOpenAISanitizerStream(
  readableStream: ReadableStream<Uint8Array>,
  onComplete?: (result: StreamUsageResult) => void | Promise<void>,
  onFinally?: () => void
): ReadableStream<Uint8Array> {
  const reader = readableStream.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";
  let usagePromptTokens: number | undefined;
  let usageCompletionTokens: number | undefined;

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              controller.enqueue(encoder.encode(buffer));
            }
            if (onComplete) {
              try {
                await onComplete({ usagePromptTokens, usageCompletionTokens, accumulatedText });
              } catch (e) {
                console.warn("[STREAM COMPLETE HOOK ERROR]", e);
              }
            }
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed?.usage) {
                  if (typeof parsed.usage.prompt_tokens === "number") {
                    usagePromptTokens = parsed.usage.prompt_tokens;
                  }
                  if (typeof parsed.usage.completion_tokens === "number") {
                    usageCompletionTokens = parsed.usage.completion_tokens;
                  }
                }
                if (Array.isArray(parsed?.choices)) {
                  for (const ch of parsed.choices) {
                    if (typeof ch?.delta?.content === "string") {
                      accumulatedText += ch.delta.content;
                    }
                    if (Array.isArray(ch?.delta?.tool_calls)) {
                      for (const tc of ch.delta.tool_calls) {
                        if (typeof tc?.function?.arguments === "string") {
                          accumulatedText += tc.function.arguments;
                        }
                      }
                    }
                  }
                }
                const cleaned = sanitizeOpenAIChunk(parsed);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(cleaned)}\n\n`));
              } catch {
                controller.enqueue(encoder.encode(`${line}\n`));
              }
            } else if (line.trim().length > 0) {
              controller.enqueue(encoder.encode(`${line}\n`));
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        if (onFinally) onFinally();
      }
    },
    cancel() {
      if (onFinally) onFinally();
      reader.cancel().catch(() => undefined);
    },
  });
}

export async function POST(req: NextRequest) {
  // 1. Verifikasi Kredensial API Key `jt-live-...`
  const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key");
  const auth = await authenticateGatewayKey(authHeader);

  if (!auth.ok || !auth.keyRecord || !auth.keyHash) {
    return NextResponse.json(
      {
        error: {
          message: auth.error,
          type: "invalid_request_error",
          code: auth.status === 402 ? "insufficient_quota" : "invalid_api_key",
        },
      },
      { status: auth.status || 401, headers: CORS_HEADERS }
    );
  }

  // 2. Baca Body Request
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "Format JSON tidak valid dalam body request.",
          type: "invalid_request_error",
          code: "invalid_json",
        },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      {
        error: {
          message: "Parameter 'messages' wajib diisi berupa array riwayat percakapan.",
          type: "invalid_request_error",
          code: "missing_messages",
        },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // 3. Tentukan Target Upstream Provider & Model + Proteksi Rate-Limit & Konkurensi (PRD 8.2)
  const requestedModel = body.model || "gemini-3.5-flash";
  const rateCheck = checkGatewayRateLimit(auth.keyHash, requestedModel);
  if (rateCheck.limited) {
    return NextResponse.json(
      {
        error: {
          message: `Batas laju permintaan (Rate Limit ${rateCheck.rpmLimit} req/menit) terlampaui untuk kunci API ini. Tunggu beberapa detik lalu coba kembali.`,
          type: "rate_limit_error",
          code: "rate_limit_exceeded",
        },
      },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  if (!acquireStreamSlot(auth.keyHash)) {
    return NextResponse.json(
      {
        error: {
          message: `Batas konkurensi maksimal (${MAX_CONCURRENT_STREAMS} stream simultan per API Key) tercapai. Tunggu respons aktif selesai terlebih dahulu.`,
          type: "rate_limit_error",
          code: "concurrency_limit_exceeded",
        },
      },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  let slotReleased = false;
  const freeSlot = () => {
    if (!slotReleased && auth.keyHash) {
      slotReleased = true;
      releaseStreamSlot(auth.keyHash);
    }
  };

  let { provider, targetModel } = resolveUpstreamModel(requestedModel);

  // 4. Siapkan Upstream URL & Authorization
  let upstreamUrl = "";
  let upstreamAuthHeader = "";

  if (provider === "gemini") {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey) {
      freeSlot();
      return NextResponse.json(
        {
          error: {
            message:
              "Master Key Google Gemini (GEMINI_API_KEY) belum dikonfigurasi di server Juragan Token. Silakan tambahkan GEMINI_API_KEY di .env.local untuk mengaktifkan gateway.",
            type: "server_configuration_error",
            code: "missing_gemini_api_key",
          },
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }
    // Menggunakan endpoint OpenAI-compatible resmi dari Google AI Studio
    upstreamUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    upstreamAuthHeader = `Bearer ${geminiKey}`;
  } else {
    // Pass-Through Engine ke https://api.tokotokenai.com/v1
    const engineStatus = getUpstreamEngineStatus();
    const engineKey =
      process.env.UPSTREAM_ENGINE_KEY?.trim() ||
      process.env.TOKOTOKENAI_API_KEY?.trim() ||
      process.env.ADMIN_SECRET?.trim() ||
      "";

    upstreamUrl = `${engineStatus.engineUrl}/chat/completions`;
    upstreamAuthHeader = engineKey ? `Bearer ${engineKey}` : (authHeader || "");
  }

  // 5. Buat Payload yang Diteruskan & Multi-Tier Resilience Engine
  const sanitizeGemini = (p: any, m: string) => {
    // Parameter yang tidak didukung atau memicu 400 di Google OpenAI endpoint:
    const {
      frequency_penalty: _frequency_penalty,
      presence_penalty: _presence_penalty,
      logit_bias: _logit_bias,
      logprobs: _logprobs,
      top_logprobs: _top_logprobs,
      user: _user,
      seed: _seed,
      store: _store,
      metadata: _metadata,
      service_tier: _service_tier,
      ...rest
    } = p;

    const sanitized: any = { ...rest, model: m };

    // Hapus 'strict: true' jika ada di response_format karena sering ditolak Google
    if (sanitized.response_format && typeof sanitized.response_format === "object") {
      const { strict: _strict, ...rfRest } = sanitized.response_format;
      sanitized.response_format = rfRest;
    }

    return sanitized;
  };

  const fetchWithGeminiResilience = async (
    url: string,
    keyConfig: string,
    payload: any,
    reqModel: string
  ): Promise<{ res: Response | null; modelUsed: string }> => {
    // Mendukung key rotation jika GEMINI_API_KEY berisi lebih dari satu kunci dipisah koma
    const keyPool = keyConfig.split(",").map((k) => k.trim()).filter(Boolean);
    const activeKey = keyPool[Math.floor(Math.random() * keyPool.length)] || keyConfig;

    // Urutan prioritas model untuk keandalan maksimal tanpa 503 spike:
    // 1. gemini-3.5-flash-lite (paling tahan banting & sangat cepat)
    // 2. gemini-flash-lite-latest (versi rolling production)
    // 3. gemini-3.5-flash (flash standar)
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
    ];

    if (reqModel.toLowerCase().includes("pro")) {
      candidateModels.unshift("gemini-pro-latest");
    }

    let lastRes: Response | null = null;
    let lastModel = candidateModels[0];

    for (const model of candidateModels) {
      const sanitized = sanitizeGemini(payload, model);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${activeKey}`,
            },
            body: JSON.stringify(sanitized),
          });

          lastRes = res;
          lastModel = model;

          if (res.ok) {
            return { res, modelUsed: model };
          }

          console.warn(`[GEMINI RESILIENCE] Model '${model}' attempt ${attempt + 1} status ${res.status}.`);

          // Jika 400 (Bad request), kemungkinan payload ada field tidak valid, coba model lain
          if (res.status === 400) {
            break;
          }

          // Jika 503 (Overload) atau 429 (Rate limit), jeda sejenak sebelum percobaan berikutnya
          await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        } catch (err: any) {
          console.warn(`[GEMINI RESILIENCE] Network error saat menghubungi ${model}:`, err?.message);
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }

    return { res: lastRes, modelUsed: lastModel };
  };

  const upstreamPayload = {
    ...body,
    model: targetModel,
  };

  const isStream = Boolean(body.stream);

  try {
    let upstreamRes: Response | null = null;

    if (provider === "engine") {
      try {
        upstreamRes = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: upstreamAuthHeader,
            "x-juragan-client-key": auth.keyHash,
            "x-juragan-retail-origin": "juragan-token-web",
          },
          body: JSON.stringify(upstreamPayload),
        });
      } catch (engineErr: any) {
        console.warn("[GATEWAY NOTICE] Central engine offline, auto-falling back to Gemini:", engineErr?.message);
        upstreamRes = null;
      }

      // Jika Central Engine offline / belum ada DNS, otomatis failover ke Gemini dengan multi-tier resilience
      if (!upstreamRes || !upstreamRes.ok) {
        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        if (geminiKey) {
          console.warn(`[GATEWAY GRACEFUL FALLBACK] Mengalihkan ke Google Gemini Resilience Engine...`);
          upstreamUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          provider = "gemini";
          const result = await fetchWithGeminiResilience(
            upstreamUrl,
            geminiKey,
            upstreamPayload,
            requestedModel
          );
          upstreamRes = result.res;
          targetModel = result.modelUsed;
        }
      }
    } else {
      const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
      const result = await fetchWithGeminiResilience(
        upstreamUrl,
        geminiKey,
        upstreamPayload,
        targetModel
      );
      upstreamRes = result.res;
      targetModel = result.modelUsed;
    }

    if (!upstreamRes) {
      freeSlot();
      return NextResponse.json(
        {
          error: {
            message: "Gagal terhubung ke engine upstream. Silakan coba kembali sesaat lagi.",
            type: "upstream_error",
            code: "upstream_unavailable",
          },
        },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    if (!upstreamRes.ok) {
      freeSlot();
      const errBody = await upstreamRes.json().catch(() => ({}));
      const rawMessage = Array.isArray(errBody)
        ? errBody[0]?.error?.message
        : errBody?.error?.message;
      const rawCode = Array.isArray(errBody)
        ? errBody[0]?.error?.code
        : errBody?.error?.code;

      console.warn(`[GATEWAY UPSTREAM ERROR] ${provider} status ${upstreamRes.status}:`, errBody);
      return NextResponse.json(
        {
          error: {
            message:
              rawMessage ||
              (provider === "engine"
                ? `Engine Utama (api.tokotokenai.com) mengembalikan status ${upstreamRes.status}. Coba gunakan model Google Gemini ('gemini-3.5-flash-lite').`
                : `Gagal mendapatkan respons dari provider ${provider} (Status: ${upstreamRes.status}).`),
            type: "upstream_error",
            code: rawCode || "upstream_failure",
          },
        },
        { status: upstreamRes.status, headers: CORS_HEADERS }
      );
    }

    const estimatedInputTokens = estimatePromptTokens(body.messages);

    // 6A. Penanganan Streaming (Server-Sent Events) dengan Metering Token Dinamis
    if (isStream && upstreamRes.body) {
      const sanitizedStream = createOpenAISanitizerStream(
        upstreamRes.body,
        async ({ usagePromptTokens, usageCompletionTokens, accumulatedText }) => {
          const promptTokens = usagePromptTokens || estimatedInputTokens;
          const completionTokens = usageCompletionTokens || Math.max(10, estimateTokensFromText(accumulatedText));
          const totalTokens = promptTokens + completionTokens;
          const costIdr = calculateUsageCost(targetModel, promptTokens, completionTokens);
          const remainingBal = await deductKeyBalance(auth.keyHash!, costIdr);
          await recordUsageLog({
            keyHash: auth.keyHash!,
            keyLast4: auth.keyRecord!.last4,
            model: targetModel,
            provider,
            promptTokens,
            completionTokens,
            totalTokens,
            costIdr,
            remainingBalanceIdr: remainingBal,
          });
        },
        freeSlot
      );

      return new Response(sanitizedStream, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-juragan-model": targetModel,
        },
      });
    }

    // 6B. Penanganan Non-Streaming (JSON standar)
    const rawData = await upstreamRes.json();
    const data = sanitizeOpenAIChunk(rawData);

    const promptTokens = data.usage?.prompt_tokens || estimatedInputTokens;
    const completionTokens =
      data.usage?.completion_tokens ||
      Math.max(10, estimateTokensFromText(data.choices?.[0]?.message?.content || ""));
    const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;
    const costIdr = calculateUsageCost(targetModel, promptTokens, completionTokens);

    const remainingBal = await deductKeyBalance(auth.keyHash, costIdr);

    await recordUsageLog({
      keyHash: auth.keyHash,
      keyLast4: auth.keyRecord.last4,
      model: targetModel,
      provider,
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
        "x-juragan-model": targetModel,
        "x-juragan-cost-idr": String(costIdr),
        "x-juragan-balance-remaining-idr": String(remainingBal),
      },
    });
  } catch (err: any) {
    freeSlot();
    console.error("[GATEWAY FATAL ERROR]", err);
    const friendlyMessage =
      provider === "engine"
        ? "Engine Utama Central (https://api.tokotokenai.com) saat ini belum online atau DNS belum terhubung. Silakan gunakan model Google Gemini ('gemini-3.5-flash') untuk pengujian saat ini."
        : `Koneksi ke provider Google Gemini terputus: ${err?.message || "Internal Network Error"}`;

    return NextResponse.json(
      {
        error: {
          message: friendlyMessage,
          type: "gateway_network_error",
          code: "gateway_network_error",
        },
      },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
