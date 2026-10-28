import { NextResponse } from "next/server";
import {
  modelsCatalog,
  USD_RATE,
  inputIdrPer1M,
  outputIdrPer1M,
  perImageIdr,
  isPerImage,
  unitCostIdr,
  unitsForBudget,
  reachScore,
  ModelItem
} from "@/data/catalog";

interface RemotePricingItem {
  id?: string;
  name?: string;
  model?: string;
  ratio?: number;
  completion_ratio?: number;
  completionRatio?: number;
  type?: string;
}

export async function GET() {
  const syncTimestamp = new Date().toISOString();
  let remoteModels: ModelItem[] = [];
  let source = "gateway_cache";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://www.juragantoken.co.id/api/pricing", {
      signal: controller.signal,
      next: { revalidate: 300 }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const list: RemotePricingItem[] = Array.isArray(data) ? data : (data?.data || []);

      if (list.length > 0) {
        source = "gateway_live";
        // Map newly discovered models from live gateway
        list.forEach((item) => {
          const modelId = item.id || item.model || item.name;
          if (!modelId) return;

          const existing = modelsCatalog.find((m) => m.id.toLowerCase() === modelId.toLowerCase());
          const ratio = item.ratio ?? 1;
          const completionRatio = item.completion_ratio ?? item.completionRatio ?? 3;

          if (existing) {
            remoteModels.push({
              ...existing,
              ratio,
              completionRatio
            });
          } else {
            // Auto-generate metadata for new model deployed to gateway
            const perImage = item.type === "image" || modelId.includes("image") || modelId.includes("flux");
            const isCode = modelId.includes("code") || modelId.includes("sonnet") || modelId.includes("opus");
            remoteModels.push({
              id: modelId,
              name: modelId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              providerId: modelId.includes("claude")
                ? "anthropic"
                : modelId.includes("gemini")
                ? "google"
                : modelId.includes("deepseek")
                ? "deepseek"
                : modelId.includes("qwen")
                ? "alibaba"
                : "openai",
              category: perImage ? "Gambar" : isCode ? "Ngoding" : "Tugas & Riset",
              description: `Model baru terdeteksi di gateway Juragan Token. Pricing dihitung otomatis dengan rasio gateway ${ratio}x.`,
              inputs: perImage ? ["teks"] : ["teks", "gambar"],
              endpoints: perImage ? ["image"] : ["openai", "anthropic"],
              contextTokens: 500_000,
              ratio,
              completionRatio: perImage ? 1 : completionRatio
            });
          }
        });
      }
    }
  } catch {
    source = "gateway_fallback";
  }

  // Ensure curated top-tier models (ChatGPT 6 Astra, Gemini 4 Argon, Claude Opus 5.5, Fable 5.1) are always present
  const combinedMap = new Map<string, ModelItem>();
  modelsCatalog.forEach((m) => combinedMap.set(m.id, m));
  remoteModels.forEach((m) => combinedMap.set(m.id, { ...combinedMap.get(m.id), ...m }));

  const finalModels = Array.from(combinedMap.values()).map((m) => {
    const isImg = isPerImage(m);
    return {
      ...m,
      pricing: {
        inputIdr: isImg ? 0 : inputIdrPer1M(m),
        outputIdr: isImg ? 0 : outputIdrPer1M(m),
        perImageIdr: isImg ? perImageIdr(m) : null,
        unitCostIdr: unitCostIdr(m),
        ratio: m.ratio,
        completionRatio: m.completionRatio,
        unitsPer10k: unitsForBudget(m),
        reachScore: reachScore(m)
      }
    };
  });

  return NextResponse.json({
    status: "success",
    source,
    lastSynced: syncTimestamp,
    usdRate: USD_RATE,
    gatewayOrigin: "https://www.juragantoken.co.id",
    totalModels: finalModels.length,
    models: finalModels
  });
}
