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
  const remoteModels: ModelItem[] = [];
  let source = "gateway_cache";
  let activeUsdRate = USD_RATE;
  let rateSource = "local_snapshot";

  // 1. Fetch live real-time USD/IDR exchange rate
  try {
    const rateController = new AbortController();
    const rateTimeoutId = setTimeout(() => rateController.abort(), 2500);

    const rateRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: rateController.signal,
      next: { revalidate: 60 }
    });
    clearTimeout(rateTimeoutId);

    if (rateRes.ok) {
      const rateData = await rateRes.json();
      if (rateData?.rates?.IDR && typeof rateData.rates.IDR === "number" && rateData.rates.IDR > 10000) {
        activeUsdRate = Math.round(rateData.rates.IDR);
        rateSource = "live_forex_market";
      }
    }
  } catch {
    rateSource = "snapshot_fallback";
  }

  // 2. Fetch remote pricing models from live gateway (api.tokotokenai.com)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res = await fetch("https://api.tokotokenai.com/api/pricing", {
      signal: controller.signal,
      next: { revalidate: 300 }
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      const list: (RemotePricingItem & { model_name?: string; model_ratio?: number })[] = Array.isArray(data) ? data : (data?.data || []);

      if (list.length > 0) {
        source = "gateway_live";
        // Update live pricing ratios for curated models from gateway
        const ratioMap = new Map<string, { ratio: number; completionRatio: number }>();
        list.forEach((item) => {
          const modelId = (item.model_name || item.id || item.model || item.name || "").toLowerCase().trim();
          if (!modelId) return;
          const ratio = item.model_ratio ?? item.ratio ?? 1;
          const completionRatio = item.completion_ratio ?? item.completionRatio ?? 3;
          ratioMap.set(modelId, { ratio, completionRatio });
        });

        modelsCatalog.forEach((m) => {
          const matched = ratioMap.get(m.id.toLowerCase());
          if (matched) {
            remoteModels.push({
              ...m,
              ratio: matched.ratio,
              completionRatio: matched.completionRatio
            });
          } else {
            remoteModels.push({ ...m });
          }
        });
      }
    }
  } catch {
    source = "gateway_fallback";
  }

  // Use the synchronized models list (or fallback to catalog if remote sync wasn't populated)
  const baseModels = remoteModels.length > 0 ? remoteModels : modelsCatalog;
  const finalModels = baseModels.map((m) => {
    const isImg = isPerImage(m);
    return {
      ...m,
      pricing: {
        inputIdr: isImg ? 0 : inputIdrPer1M(m, activeUsdRate),
        outputIdr: isImg ? 0 : outputIdrPer1M(m, activeUsdRate),
        perImageIdr: isImg ? perImageIdr(m, activeUsdRate) : null,
        unitCostIdr: unitCostIdr(m, activeUsdRate),
        ratio: m.ratio,
        completionRatio: m.completionRatio,
        unitsPer10k: unitsForBudget(m, 10_000, activeUsdRate),
        reachScore: reachScore(m)
      }
    };
  });

  return NextResponse.json({
    status: "success",
    source,
    rateSource,
    lastSynced: syncTimestamp,
    usdRate: activeUsdRate,
    gatewayOrigin: process.env.NEXT_PUBLIC_APP_URL || "https://api.tokotokenai.com",
    totalModels: finalModels.length,
    models: finalModels
  });
}
