"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { modelsCatalog, type ModelItem } from "@/data/catalog";

type HeroModelShowcase = {
  providerId: string;
  providerName: string;
  modelId: string;
  roleTag: string;
  latency: string;
};

export const HERO_SHOWCASE_ITEMS: HeroModelShowcase[] = [
  {
    providerId: "openai",
    providerName: "OpenAI",
    modelId: "chatgpt-6-astra",
    roleTag: "Ngoding & Debug",
    latency: "360 ms",
  },
  {
    providerId: "anthropic",
    providerName: "Anthropic",
    modelId: "claude-opus-5-5",
    roleTag: "Arsitektur Kode",
    latency: "410 ms",
  },
  {
    providerId: "google",
    providerName: "Google",
    modelId: "gemini-4-argon",
    roleTag: "Full-Stack & Konteks",
    latency: "320 ms",
  },
  {
    providerId: "deepseek",
    providerName: "DeepSeek",
    modelId: "deepseek-v4-pro",
    roleTag: "Riset & Penalaran",
    latency: "295 ms",
  },
  {
    providerId: "alibaba",
    providerName: "Alibaba Qwen",
    modelId: "qwen3.7-max",
    roleTag: "Multi-Bahasa Hemat",
    latency: "270 ms",
  },
  {
    providerId: "zhipu",
    providerName: "Z.ai GLM",
    modelId: "glm-5.3-flash",
    roleTag: "Efisiensi Tinggi",
    latency: "240 ms",
  },
];

type HeroOrbitProps = {
  onExploreCatalog?: () => void;
  onSelectModel?: (model: ModelItem) => void;
};

export function HeroOrbit({ onExploreCatalog, onSelectModel }: HeroOrbitProps) {
  const [activeIndex, setActiveIndex] = useState(1); // Default Claude Opus 5.5
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SHOWCASE_ITEMS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const current = HERO_SHOWCASE_ITEMS[activeIndex];

  const handleOpenActiveModel = () => {
    const found = modelsCatalog.find((m) => m.id === current.modelId);
    if (found && onSelectModel) {
      onSelectModel(found);
      return;
    }
    onExploreCatalog?.();
  };

  return (
    <section
      className="jt-hero-stage"
      id="top"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Column: Clean 2-Line Headline + Provider Switcher + Model Pill */}
      <div className="jt-hero-left">
        <div className="jt-hero-pill-badge">
          <span className="jt-badge-spark" aria-hidden="true">✦</span>
          <span>Gerbang utama API AI terpadu untuk developer &amp; enterprise di Indonesia</span>
        </div>

        <h1 className="jt-hero-headline">
          Semua model AI
          <br />
          dalam satu platform.
        </h1>

        <p className="jt-hero-subtitle">
          Satu gateway, satu API Key, 66+ model AI terkemuka. Jembatani kebutuhan teknis tim IT, ngoding, dan riset
          mendalam dalam satu ekosistem terintegrasi.
        </p>

        {/* Provider Quick-Switch Icons */}
        <div className="jt-provider-strip" role="tablist" aria-label="Pilih provider model AI">
          {HERO_SHOWCASE_ITEMS.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.providerId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`jt-provider-tile ${isSelected ? "is-selected" : ""}`}
                onClick={() => setActiveIndex(idx)}
                title={`${item.providerName} · ${item.modelId}`}
              >
                <ProviderLogo provider={item.providerId} size={22} />
              </button>
            );
          })}
        </div>

        {/* Active Model Pill (Click to inspect model specs) */}
        <button
          type="button"
          className="jt-active-model-pill"
          onClick={handleOpenActiveModel}
          title="Klik untuk melihat detail & cara pakai model ini"
        >
          <span className="jt-amp-label">MODEL</span>
          <span className="jt-amp-name">
            {current.providerName} · <strong>{current.modelId}</strong>
          </span>
          <span className="jt-amp-role">{current.roleTag}</span>
        </button>

        {/* CTA Buttons */}
        <div className="jt-hero-cta-row">
          <button type="button" className="jt-btn-primary" onClick={onExploreCatalog}>
            <span>Jelajahi Katalog Model</span>
            <span aria-hidden="true">↗</span>
          </button>
          <Link href="/docs" className="jt-btn-secondary">
            <span>Lihat Dokumentasi</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Frosted Light Console Window Illustration */}
      <div className="jt-console-window" aria-label="Ilustrasi konsol request API Juragantoken">
        <div className="jt-cw-topbar">
          <div className="jt-cw-left">
            <span className="jt-cw-dots" aria-hidden="true">
              <i className="dot-soft-1" />
              <i className="dot-soft-2" />
              <i className="dot-blue" />
            </span>
            <span className="jt-cw-title">console · Juragantoken</span>
          </div>
          <span className="jt-cw-tag">contoh · ilustrasi</span>
        </div>

        <div className="jt-cw-canvas">
          {/* Request Floating Card */}
          <div className="jt-cw-request-card">
            <div className="jt-cw-req-head">
              <span className="jt-cw-dots-sm" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>request</span>
            </div>
            <div className="jt-cw-req-code">
              <div>
                <span className="req-method">POST</span> /v1/chat/completions
              </div>
              <div>
                <span className="req-key">&quot;model&quot;</span>:{" "}
                <span className="req-val">&quot;{current.modelId}&quot;</span>
              </div>
            </div>
          </div>

          {/* 200 OK Status Pill */}
          <div className="jt-cw-status-pill">
            <span className="jt-cw-status-dot" aria-hidden="true" />
            <strong>200 OK</strong>
            <span>· {current.latency}</span>
          </div>

          {/* Bottom Gateway Hub -> Provider Grid */}
          <div className="jt-cw-routing-row">
            <div className="jt-cw-hub-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-mark.png"
                alt="Juragantoken"
                width={28}
                height={24}
                className="jt-cw-hub-logo"
              />
              <code>api.tokotokenai.com/v1</code>
            </div>

            <div className="jt-cw-connector" aria-hidden="true">
              <span className="jt-cw-pulse-dot" />
            </div>

            <div className="jt-cw-provider-grid">
              {HERO_SHOWCASE_ITEMS.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={item.providerId}
                    type="button"
                    className={`jt-cw-grid-tile ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Pilih ${item.providerName}`}
                  >
                    <ProviderLogo provider={item.providerId} size={22} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
