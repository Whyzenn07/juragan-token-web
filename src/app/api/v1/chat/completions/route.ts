import { NextRequest, NextResponse } from "next/server";
import {
  authenticateGatewayKey,
  resolveUpstreamModel,
  calculateUsageCost,
  deductKeyBalance,
  recordUsageLog,
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

  // 3. Tentukan Target Upstream Provider & Model
  const requestedModel = body.model || "gemini-3.5-flash";
  let { provider, targetModel } = resolveUpstreamModel(requestedModel);

  // 4. Siapkan Upstream URL & Authorization
  let upstreamUrl = "";
  let upstreamAuthHeader = "";

  if (provider === "gemini") {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey) {
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
    // Pass-Through Engine ke juragantoken.co.id
    const engineUrl =
      process.env.UPSTREAM_ENGINE_URL?.trim() ||
      "https://gateway.juragantoken.co.id/v1";
    const engineKey =
      process.env.UPSTREAM_ENGINE_KEY?.trim() ||
      process.env.ADMIN_SECRET?.trim() ||
      "";

    upstreamUrl = `${engineUrl.replace(/\/+$/, "")}/chat/completions`;
    upstreamAuthHeader = engineKey ? `Bearer ${engineKey}` : (authHeader || "");
  }

  // 5. Buat Payload yang Diteruskan
  let upstreamPayload = {
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

      // Jika Central Engine offline / belum ada DNS, otomatis fallback ke Gemini
      if (!upstreamRes || !upstreamRes.ok) {
        const geminiKey = process.env.GEMINI_API_KEY?.trim();
        if (geminiKey) {
          console.warn(`[GATEWAY GRACEFUL FALLBACK] Mengalihkan model '${targetModel}' ke Google Gemini agar chat tetap berhasil...`);
          upstreamUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          upstreamAuthHeader = `Bearer ${geminiKey}`;
          targetModel = "gemini-3.5-flash";
          provider = "gemini";
          upstreamPayload = {
            ...body,
            model: "gemini-3.5-flash",
          };
          upstreamRes = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: upstreamAuthHeader,
            },
            body: JSON.stringify(upstreamPayload),
          });
        }
      }
    } else {
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

      // Otomatis failover ke gemini-3.5-flash jika model pilihan sedang spike 503
      if (upstreamRes.status === 503 && targetModel !== "gemini-3.5-flash") {
        console.warn(`[GATEWAY 503 FAILOVER] ${targetModel} sibuk, mengalihkan ke gemini-3.5-flash...`);
        targetModel = "gemini-3.5-flash";
        upstreamPayload.model = "gemini-3.5-flash";
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
      }
    }

    if (!upstreamRes.ok) {
      const errBody = await upstreamRes.json().catch(() => ({}));
      console.warn(`[GATEWAY UPSTREAM ERROR] ${provider} status ${upstreamRes.status}:`, errBody);
      return NextResponse.json(
        {
          error: {
            message:
              errBody?.error?.message ||
              (provider === "engine"
                ? `Engine Utama (juragantoken.co.id) mengembalikan status ${upstreamRes.status}. Coba gunakan model Google Gemini ('gemini-3.5-flash').`
                : `Gagal mendapatkan respons dari provider ${provider} (Status: ${upstreamRes.status}).`),
            type: "upstream_error",
            code: errBody?.error?.code || "upstream_failure",
          },
        },
        { status: upstreamRes.status, headers: CORS_HEADERS }
      );
    }

    // 6A. Penanganan Streaming (Server-Sent Events)
    if (isStream && upstreamRes.body) {
      // Potong estimasi nominal ringan secara background untuk sesi streaming
      const estCost = calculateUsageCost(targetModel, 150, 350);
      deductKeyBalance(auth.keyHash, estCost)
        .then((remainingBal) => {
          recordUsageLog({
            keyHash: auth.keyHash!,
            keyLast4: auth.keyRecord!.last4,
            model: targetModel,
            provider,
            promptTokens: 150,
            completionTokens: 350,
            totalTokens: 500,
            costIdr: estCost,
            remainingBalanceIdr: remainingBal,
          });
        })
        .catch((err) => {
          console.warn("[GATEWAY DEDUCT STREAM] Error:", err);
        });

      return new Response(upstreamRes.body, {
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
    const data = await upstreamRes.json();

    const promptTokens = data.usage?.prompt_tokens || 100;
    const completionTokens = data.usage?.completion_tokens || 150;
    const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;
    const costIdr = calculateUsageCost(targetModel, promptTokens, completionTokens);

    const remainingBal = await deductKeyBalance(auth.keyHash, costIdr);

    recordUsageLog({
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

    return NextResponse.json(data, {
      headers: {
        ...CORS_HEADERS,
        "x-juragan-model": targetModel,
        "x-juragan-cost-idr": String(costIdr),
        "x-juragan-balance-remaining-idr": String(remainingBal),
      },
    });
  } catch (err: any) {
    console.error("[GATEWAY FATAL ERROR]", err);
    const friendlyMessage =
      provider === "engine"
        ? "Engine Utama Central (https://gateway.juragantoken.co.id) saat ini belum online atau DNS belum terhubung. Silakan gunakan model Google Gemini ('gemini-3.5-flash') untuk pengujian saat ini."
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
