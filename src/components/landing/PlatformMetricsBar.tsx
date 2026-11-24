"use client";

import Link from "next/link";

const METRIC_ITEMS = [
  {
    value: "100+",
    label: "Model AI Frontier",
    detail: "54 model kurasi utama dalam 1 API Key universal.",
    accent: "royal",
  },
  {
    value: "10+",
    label: "Provider Global & Asia",
    detail: "Claude, OpenAI, Gemini, DeepSeek, Qwen, Grok & lainnya.",
    accent: "navy",
  },
  {
    value: "99.98%",
    label: "SLA & Pemantauan Live",
    detail: "Routing stabil dengan status operasional real-time.",
    accent: "emerald",
    href: "/status",
    linkLabel: "Live ↗",
  },
  {
    value: "PT Lokal",
    label: "Legalitas & Zero-Training",
    detail: "PT Rejeki Digital Cemerlang · Faktur Pajak & TLS 1.3.",
    accent: "navy",
  },
] as const;

export function PlatformMetricsBar() {
  return (
    <section
      className="jt-metrics-section"
      aria-label="Ringkasan kapabilitas infrastruktur Juragantoken"
    >
      <div className="jt-metrics-grid">
        {METRIC_ITEMS.map((item, idx) => (
          <article
            key={item.label}
            className="jt-metric-card"
            data-reveal="fade-up"
            data-delay={idx * 50}
          >
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
