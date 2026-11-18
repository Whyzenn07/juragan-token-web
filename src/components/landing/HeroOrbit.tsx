"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { Icon } from "@/components/ui/Icon";
import { modelsCatalog, type ModelItem } from "@/data/catalog";

type HeroModelShowcase = {
  providerId: string;
  providerName: string;
  orbitLabel: string;
  modelId: string;
  roleTag: string;
  angle: number;
};

export const HERO_SHOWCASE_ITEMS: HeroModelShowcase[] = [
  {
    providerId: "anthropic",
    providerName: "Anthropic",
    orbitLabel: "Claude",
    modelId: "claude-opus-5-5",
    roleTag: "Ngoding & Arsitektur",
    angle: 0,
  },
  {
    providerId: "openai",
    providerName: "OpenAI",
    orbitLabel: "ChatGPT",
    modelId: "chatgpt-6-astra",
    roleTag: "Arsitektur & Debug",
    angle: 60,
  },
  {
    providerId: "google",
    providerName: "Google",
    orbitLabel: "Gemini",
    modelId: "gemini-4-argon",
    roleTag: "Full-Stack & Konteks",
    angle: 120,
  },
  {
    providerId: "deepseek",
    providerName: "DeepSeek",
    orbitLabel: "DeepSeek",
    modelId: "deepseek-v4-pro",
    roleTag: "Riset & Efisiensi",
    angle: 180,
  },
  {
    providerId: "alibaba",
    providerName: "Alibaba Qwen",
    orbitLabel: "Qwen",
    modelId: "qwen3.7-max",
    roleTag: "Multi-Bahasa Hemat",
    angle: 240,
  },
  {
    providerId: "xai",
    providerName: "xAI",
    orbitLabel: "Grok",
    modelId: "grok-4",
    roleTag: "Penalaran Cepat",
    angle: 300,
  },
];

type HeroOrbitProps = {
  onExploreCatalog?: () => void;
  onSelectModel?: (model: ModelItem) => void;
};

export function HeroOrbit({ onExploreCatalog, onSelectModel }: HeroOrbitProps) {
  const [activeIndex, setActiveIndex] = useState(0);
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
      {/* Left Column: Clean 2-Line Headline + Description + Interactive Model Features */}
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
          Satu gateway, satu API Key, 66+ model AI terkemuka. Jembatani kebutuhan teknis tim IT, ngoding, riset
          mendalam, dan efisiensi operasional dalam satu ekosistem terintegrasi.
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

        {/* Highlight Features Row */}
        <div className="jt-hero-highlights">
          <span className="jt-hero-hl-item">
            <Icon name="check" size={15} />
            <span>1 Endpoint OpenAI-Compatible</span>
          </span>
          <span className="jt-hero-hl-item">
            <Icon name="check" size={15} />
            <span>Kurasi Model Ngoding, Riset &amp; Hemat</span>
          </span>
          <span className="jt-hero-hl-item">
            <Icon name="check" size={15} />
            <span>Siap Cursor, Claude Code &amp; Python</span>
          </span>
        </div>
      </div>

      {/* Right Column: Pure Centered Orbit Ring with Juragantoken Logo in Center */}
      <div className="jt-hero-visual" aria-label="Animasi orbit model AI mengelilingi Juragantoken">
        <div className="jt-orbit-stage">
          <div className="jt-orbit-glow" aria-hidden="true" />
          <div className="jt-orbit-ring jt-orbit-ring--outer" aria-hidden="true" />
          <div className="jt-orbit-ring jt-orbit-ring--inner" aria-hidden="true" />

          {/* Zero-wobble mathematical orbit track */}
          <div className="jt-orbit-track" aria-hidden="true">
            {HERO_SHOWCASE_ITEMS.map((node, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={node.orbitLabel}
                  className="jt-orbit-slot"
                  style={{
                    transform: `rotate(${node.angle}deg) translateY(calc(var(--orbit-radius) * -1)) rotate(-${node.angle}deg)`,
                  }}
                >
                  <div className="jt-orbit-counter">
                    <button
                      type="button"
                      className={`jt-orbit-pill ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setActiveIndex(idx)}
                      tabIndex={-1}
                    >
                      <ProviderLogo provider={node.providerId} size={22} />
                      <span>{node.orbitLabel}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Circle: Juragantoken Logo Only (No /v1/chat/completions) */}
          <div className="jt-orbit-core">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mark.png"
              alt="Juragantoken"
              width={54}
              height={45}
              className="jt-core-logo-mark"
            />
            <strong className="jt-core-brand">
              juragan<span className="jt-core-accent">token.</span>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
