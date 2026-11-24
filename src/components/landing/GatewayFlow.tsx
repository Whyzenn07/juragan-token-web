"use client";

import { ProviderLogo } from "@/components/ui/ProviderLogo";

const ENDPOINT_PROVIDERS = [
  { provider: "anthropic", title: "Anthropic Claude", sub: "Fable 5.2 · Opus 5.5 · Sonnet 5.5" },
  { provider: "openai", title: "OpenAI GPT", sub: "GPT-6.2 Astra · GPT-6.1 Sol" },
  { provider: "google", title: "Google Gemini", sub: "Gemini 4 Carbon · 3.8 Flash" },
  { provider: "deepseek", title: "DeepSeek, Kimi & Qwen", sub: "V4.1 Flash · Kimi K3 · Qwen3-Coder" },
];

export function GatewayFlow() {
  return (
    <section className="jt-section" id="cara-kerja" aria-labelledby="workflow-heading">
      <div className="jt-section-head" data-reveal="fade-up">
        <span className="jt-kicker">CARA KERJA PLATFORM</span>
        <h2 id="workflow-heading">Satu Gerbang Terpadu untuk Seluruh Provider AI</h2>
        <p>
          Tim IT maupun developer cukup memelihara satu basis kode dengan standar OpenAI API, lalu mengganti model
          antar-provider kapan saja tanpa menulis ulang integrasi.
        </p>
      </div>

      {/* Unified Routing Diagram (PDF Slide 3 & 4, animated SVG lines) */}
      <div className="jt-flow-card" data-reveal="scale">
        <div className="jt-flow-left">
          <div className="jt-flow-step-pill">1 Integrasi Tunggal</div>
          <div className="jt-flow-hub">
            <span className="jt-flow-hub-badge">ENDPOINT TUNGGAL</span>
            <strong>Juragantoken API Gateway</strong>
            <code>https://api.tokotokenai.com/v1</code>
            <p>Autentikasi terpadu SHA-256 &amp; pencatatan pemakaian per request secara real-time.</p>
          </div>
        </div>

        {/* Animated signal lines (desktop/tablet) */}
        <div className="jt-flow-wires" aria-hidden="true">
          <svg viewBox="0 0 180 260" fill="none" className="jt-wires-svg">
            <path className="jt-wire-base" d="M0 130 C60 130, 80 35, 180 35" />
            <path className="jt-wire-base" d="M0 130 C70 130, 90 98, 180 98" />
            <path className="jt-wire-base" d="M0 130 C70 130, 90 162, 180 162" />
            <path className="jt-wire-base" d="M0 130 C60 130, 80 225, 180 225" />

            <path className="jt-wire-pulse" d="M0 130 C60 130, 80 35, 180 35" />
            <path className="jt-wire-pulse jt-delay-1" d="M0 130 C70 130, 90 98, 180 98" />
            <path className="jt-wire-pulse jt-delay-2" d="M0 130 C70 130, 90 162, 180 162" />
            <path className="jt-wire-pulse jt-delay-3" d="M0 130 C60 130, 80 225, 180 225" />
          </svg>
        </div>

        <div className="jt-flow-right">
          {ENDPOINT_PROVIDERS.map((p) => (
            <div key={p.title} className="jt-flow-target">
              <ProviderLogo provider={p.provider} size={26} />
              <div>
                <strong>{p.title}</strong>
                <span>{p.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Animated Step Cards (Adopted from tokenku.ai .tks-card visual micro-animations, keeping our exact text) */}
      <div className="jt-steps-grid">
        <article className="jt-step-card jt-tks-card" data-reveal="fade-up" data-delay="0">
          <span className="jt-step-num">01</span>
          <div className="tks-visual" aria-hidden="true">
            <div className="tks-key">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div className="tks-line" />
            <div className="tks-dot" />
          </div>
          <h3>Titik Integrasi Tunggal</h3>
          <p>Pengembang hanya memelihara satu konvensi SDK OpenAI tanpa perlu mengurus autentikasi masing-masing vendor.</p>
        </article>

        <article className="jt-step-card jt-tks-card" data-reveal="fade-up" data-delay="100">
          <span className="jt-step-num">02</span>
          <div className="tks-visual-fan" aria-hidden="true">
            <div className="tks-fan">
              <svg className="tks-fan-lines" viewBox="0 0 220 90" preserveAspectRatio="none">
                <path d="M36 45 C90 45, 110 14, 155 14" />
                <path d="M36 45 C95 45, 115 35, 155 35" />
                <path d="M36 45 C95 45, 115 56, 155 56" />
                <path d="M36 45 C90 45, 110 77, 155 77" />
              </svg>
              <div className="tks-core">API</div>
              <div className="tks-branch" style={{ top: "4px" }}>
                <ProviderLogo provider="anthropic" size={16} />
                <span>Claude</span>
              </div>
              <div className="tks-branch" style={{ top: "25px" }}>
                <ProviderLogo provider="openai" size={16} />
                <span>ChatGPT</span>
              </div>
              <div className="tks-branch" style={{ top: "46px" }}>
                <ProviderLogo provider="google" size={16} />
                <span>Gemini</span>
              </div>
              <div className="tks-branch" style={{ top: "67px" }}>
                <ProviderLogo provider="deepseek" size={16} />
                <span>DeepSeek</span>
              </div>
            </div>
          </div>
          <h3>Eksplorasi &amp; Pindah Model Cepat</h3>
          <p>Beralih dari Claude Fable 5.2 atau Opus 5.5 ke GPT-6.2 Astra, Gemini 4 Carbon, atau DeepSeek V4.1 Flash dalam hitungan detik.</p>
        </article>

        <article className="jt-step-card jt-tks-card" data-reveal="fade-up" data-delay="200">
          <span className="jt-step-num">03</span>
          <div className="tks-meter" aria-hidden="true">
            <div className="tks-meter-lbl">TOKENS METERED · REAL-TIME</div>
            <div className="tks-bar-track">
              <div className="tks-bar-fill" />
            </div>
            <div className="tks-meter-sub">
              <span className="tks-live-dot" />
              <span>Audit log &amp; sisa kuota transparan</span>
            </div>
          </div>
          <h3>Monitoring Terbuka &amp; Terkendali</h3>
          <p>Setiap Virtual API Key dapat dicek riwayat pemakaian serta status aktifnya kapan saja melalui fitur Cek Saldo Key.</p>
        </article>
      </div>
    </section>
  );
}
