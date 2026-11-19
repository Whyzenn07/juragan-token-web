"use client";

import Link from "next/link";

const METRIC_ITEMS = [
  {
    value: "100+",
    label: "Model AI di Gateway",
    detail: "54 model kurasi utama di web & 100+ pilihan aktif di model picker.",
    accent: "royal",
  },
  {
    value: "10",
    label: "Provider Global & Asia",
    detail: "OpenAI, Anthropic, Google, DeepSeek, Qwen, Grok, Kimi, MiniMax, Seed & GLM.",
    accent: "navy",
  },
  {
    value: "99.98%",
    label: "Target SLA Uptime",
    detail: "Arsitektur routing stabil dengan pemantauan latensi dan status operasional live.",
    accent: "emerald",
    href: "/status",
    linkLabel: "Cek Status Live ↗",
  },
  {
    value: "TLS 1.3",
    label: "Privasi & Zero-Training",
    detail: "Autentikasi hash SHA-256 terenkripsi penuh tanpa menyimpan isi percakapan.",
    accent: "navy",
  },
] as const;

export function PlatformMetricsBar() {
  return (
    <section
      className="jt-metrics-section"
      aria-label="Ringkasan kapabilitas infrastruktur Juragantoken"
      data-reveal="fade-up"
    >
      <div className="jt-metrics-grid">
        {METRIC_ITEMS.map((item) => (
          <article key={item.label} className="jt-metric-card">
            <div className="jt-metric-top">
              <strong className={`jt-metric-value is-${item.accent}`}>{item.value}</strong>
              {"href" in item && item.href && (
                <Link href={item.href} className="jt-metric-live-pill">
                  <span className="jt-metric-live-dot" aria-hidden="true" />
                  <span>{item.linkLabel}</span>
                </Link>
              )}
            </div>
            <h3 className="jt-metric-label">{item.label}</h3>
            <p className="jt-metric-detail">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
