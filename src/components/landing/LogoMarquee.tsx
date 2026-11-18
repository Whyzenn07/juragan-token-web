"use client";

import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { modelsCatalog, type ModelItem } from "@/data/catalog";

type MarqueeChip = {
  id: string;
  name: string;
  providerId: string;
  specialty: string;
  tierTone: "coding" | "research" | "efficient";
};

const ROW_FRONTIER: MarqueeChip[] = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", providerId: "anthropic", specialty: "Ngoding Kompleks", tierTone: "coding" },
  { id: "chatgpt-6-astra", name: "Chat GPT 6 Astra", providerId: "openai", specialty: "Arsitektur & Debug", tierTone: "coding" },
  { id: "gemini-4-argon", name: "Gemini 4 Argon", providerId: "google", specialty: "Full-Stack Code", tierTone: "coding" },
  { id: "gpt-6-sol", name: "GPT-6 Sol", providerId: "openai", specialty: "Riset Mendalam", tierTone: "research" },
  { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", providerId: "openai", specialty: "Analisa Data", tierTone: "research" },
  { id: "gpt-6-luna", name: "GPT-6 Luna", providerId: "openai", specialty: "Penalaran Konteks", tierTone: "research" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", providerId: "anthropic", specialty: "Engineering Harian", tierTone: "coding" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", providerId: "deepseek", specialty: "Riset & Algoritma", tierTone: "research" },
];

const ROW_EFFICIENT: MarqueeChip[] = [
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", providerId: "deepseek", specialty: "Ekonomis & Cepat", tierTone: "efficient" },
  { id: "deepseek-chat-v3", name: "DeepSeek V3 Chat", providerId: "deepseek", specialty: "Hemat Operasional", tierTone: "efficient" },
  { id: "qwen3.7-max", name: "Qwen 3.7 Max", providerId: "alibaba", specialty: "Multi-Bahasa Efisien", tierTone: "efficient" },
  { id: "qwen3.6-flash", name: "Qwen 3.6 Flash", providerId: "alibaba", specialty: "Chat Throughput Tinggi", tierTone: "efficient" },
  { id: "glm-5.3-flash", name: "GLM 5.3 Flash", providerId: "zhipu", specialty: "Ringan & Responsif", tierTone: "efficient" },
  { id: "kimi-k3", name: "Kimi K3 Research", providerId: "moonshot", specialty: "Dokumen Panjang", tierTone: "research" },
  { id: "grok-4", name: "Grok 4 Reasoning", providerId: "xai", specialty: "Analisa Teknis", tierTone: "research" },
  { id: "minimax-m2.7", name: "MiniMax M2.7 Coder", providerId: "minimax", specialty: "Otomasi Kerja", tierTone: "coding" },
];

type LogoMarqueeProps = {
  onSelectModel?: (model: ModelItem) => void;
};

export function LogoMarquee({ onSelectModel }: LogoMarqueeProps) {
  const handleChipClick = (chipId: string) => {
    const found = modelsCatalog.find((m) => m.id === chipId);
    if (found && onSelectModel) {
      onSelectModel(found);
      return;
    }
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const renderTrack = (items: MarqueeChip[], reverse = false) => {
    const doubled = [...items, ...items];
    return (
      <div className="jt-marquee-viewport">
        <div className={`jt-marquee-track ${reverse ? "is-reverse" : ""}`}>
          {doubled.map((item, idx) => {
            const isClone = idx >= items.length;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                className="jt-marquee-chip"
                onClick={() => handleChipClick(item.id)}
                aria-hidden={isClone ? "true" : undefined}
                tabIndex={isClone ? -1 : undefined}
                title={`Lihat keahlian & cara pakai ${item.name}`}
              >
                <ProviderLogo provider={item.providerId} size={22} />
                <span className="jt-chip-text">
                  <strong>{item.name}</strong>
                  <small className={`jt-chip-tag jt-chip-tag--${item.tierTone}`}>{item.specialty}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="jt-marquee-section" aria-label="Daftar model AI bergerak yang didukung Juragantoken">
      <div className="jt-marquee-header">
        <span className="jt-marquee-lead">Ekosistem Model AI Terintegrasi</span>
        <span className="jt-marquee-sub">Klik model mana saja untuk melihat keahlian &amp; cara integrasi</span>
      </div>
      <div className="jt-marquee-rows">
        {renderTrack(ROW_FRONTIER, false)}
        {renderTrack(ROW_EFFICIENT, true)}
      </div>
    </section>
  );
}
