"use client";

import { ProviderLogo } from "@/components/ui/ProviderLogo";

type OrbitNode = {
  provider: string;
  label: string;
  angle: number;
};

const OUTER_NODES: OrbitNode[] = [
  { provider: "anthropic", label: "Claude", angle: 0 },
  { provider: "openai", label: "ChatGPT", angle: 60 },
  { provider: "google", label: "Gemini", angle: 120 },
  { provider: "deepseek", label: "DeepSeek", angle: 180 },
  { provider: "qwen", label: "Qwen", angle: 240 },
  { provider: "grok", label: "Grok", angle: 300 },
];

export function HeroOrbit() {
  return (
    <div className="jt-hero-visual" aria-label="Visualisasi gerbang terpadu multi-model LLM Juragantoken">
      <div className="jt-orbit-stage">
        <div className="jt-orbit-glow" aria-hidden="true" />
        <div className="jt-orbit-ring jt-orbit-ring--outer" aria-hidden="true" />
        <div className="jt-orbit-ring jt-orbit-ring--inner" aria-hidden="true" />

        {/* Rotating orbital nodes with counter-rotation so brand logos stay upright */}
        <div className="jt-orbit-track" aria-hidden="true">
          {OUTER_NODES.map((node) => (
            <div
              key={node.label}
              className="jt-orbit-arm"
              style={{ "--orbit-angle": `${node.angle}deg` } as React.CSSProperties}
            >
              <div className="jt-orbit-node">
                <div className="jt-orbit-node-inner">
                  <ProviderLogo provider={node.provider} size={22} />
                  <span>{node.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center Gateway Hub */}
        <div className="jt-orbit-core">
          <span className="jt-core-kicker">API GATEWAY</span>
          <strong className="jt-core-brand">
            juragan<span className="jt-core-accent">token.</span>
          </strong>
          <span className="jt-core-endpoint">/v1/chat/completions</span>
        </div>
      </div>

      {/* Live Routing Console Preview (Original Design) */}
      <div className="jt-console-card" role="region" aria-label="Pratinjau integrasi endpoint tunggal">
        <div className="jt-console-head">
          <div className="jt-console-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="jt-console-title">Unified AI Endpoint</span>
          <span className="jt-console-status">
            <span className="live-pulse-dot" /> 1 Key · Multi-LLM
          </span>
        </div>
        <pre className="jt-console-code">
          <code>
            <span className="c-dim">POST</span> /v1/chat/completions{"\n"}
            {"{"}{"\n"}
            {"  "}&quot;model&quot;: <span className="c-cyan">&quot;claude-opus-5-5&quot;</span>, <span className="c-cmt">{"// Ngoding"}</span>{"\n"}
            {"  "}<span className="c-cmt">{"// atau \"gpt-6-sol\" (Riset), \"deepseek-v4-flash\" (Hemat)"}</span>{"\n"}
            {"}"}
          </code>
        </pre>
      </div>
    </div>
  );
}
