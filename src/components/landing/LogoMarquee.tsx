"use client";

import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { modelsCatalog, type ModelItem } from "@/data/catalog";

type MarqueeBrand = {
  providerId: string;
  label: string;
  sampleModelId: string;
};

const AI_BRANDS: MarqueeBrand[] = [
  { providerId: "anthropic", label: "Claude", sampleModelId: "claude-opus-5-5" },
  { providerId: "openai", label: "OpenAI", sampleModelId: "chatgpt-6-astra" },
  { providerId: "google", label: "Gemini", sampleModelId: "gemini-4-argon" },
  { providerId: "xai", label: "Grok", sampleModelId: "grok-4" },
  { providerId: "deepseek", label: "DeepSeek", sampleModelId: "deepseek-v4-pro" },
  { providerId: "alibaba", label: "Qwen", sampleModelId: "qwen3.7-max" },
  { providerId: "moonshot", label: "Kimi", sampleModelId: "kimi-k3" },
  { providerId: "minimax", label: "MiniMax", sampleModelId: "minimax-m2.7" },
  { providerId: "zhipu", label: "GLM", sampleModelId: "glm-5.3-flash" },
  { providerId: "bytedance", label: "ByteDance", sampleModelId: "seed-2.0-pro" },
];

type LogoMarqueeProps = {
  onSelectModel?: (model: ModelItem) => void;
};

export function LogoMarquee({ onSelectModel }: LogoMarqueeProps) {
  const handleBrandClick = (sampleModelId: string) => {
    const found = modelsCatalog.find((m) => m.id === sampleModelId);
    if (found && onSelectModel) {
      onSelectModel(found);
      return;
    }
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const doubled = [...AI_BRANDS, ...AI_BRANDS];

  return (
    <section className="jt-marquee-section" aria-label="Provider AI yang didukung Juragantoken" data-reveal="fade-in">
      <div className="jt-marquee-viewport">
        <div className="jt-marquee-track">
          {doubled.map((item, idx) => {
            const isClone = idx >= AI_BRANDS.length;
            return (
              <button
                key={`${item.providerId}-${idx}`}
                type="button"
                className="jt-marquee-brand"
                onClick={() => handleBrandClick(item.sampleModelId)}
                aria-hidden={isClone ? "true" : undefined}
                tabIndex={isClone ? -1 : undefined}
                title={item.label}
              >
                <ProviderLogo provider={item.providerId} size={28} />
                <span className="jt-brand-name">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
