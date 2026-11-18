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
  headlineWord: string;
  xFactor: number;
  yFactor: number;
};

export const HERO_SHOWCASE_ITEMS: HeroModelShowcase[] = [
  {
    providerId: "anthropic",
    providerName: "Anthropic",
    orbitLabel: "Claude",
    modelId: "claude-opus-5-5",
    roleTag: "Ngoding & Arsitektur",
    headlineWord: "platform.",
    xFactor: 0,
    yFactor: -1,
  },
  {
    providerId: "openai",
    providerName: "OpenAI",
    orbitLabel: "ChatGPT",
    modelId: "chatgpt-6-astra",
    roleTag: "Arsitektur & Debug",
    headlineWord: "gateway.",
    xFactor: 0.866025,
    yFactor: -0.5,
  },
  {
    providerId: "google",
    providerName: "Google",
    orbitLabel: "Gemini",
    modelId: "gemini-4-argon",
    roleTag: "Full-Stack & Konteks",
    headlineWord: "ekosistem.",
    xFactor: 0.866025,
    yFactor: 0.5,
  },
  {
    providerId: "deepseek",
    providerName: "DeepSeek",
    orbitLabel: "DeepSeek",
    modelId: "deepseek-v4-pro",
    roleTag: "Riset & Efisiensi",
    headlineWord: "integrasi.",
    xFactor: 0,
    yFactor: 1,
  },
  {
    providerId: "alibaba",
    providerName: "Alibaba Qwen",
    orbitLabel: "Qwen",
    modelId: "qwen3.7-max",
    roleTag: "Multi-Bahasa Hemat",
    headlineWord: "kendali.",
    xFactor: -0.866025,
    yFactor: 0.5,
  },
  {
    providerId: "xai",
    providerName: "xAI",
    orbitLabel: "Grok",
    modelId: "grok-4",
    roleTag: "Penalaran Cepat",
    headlineWord: "platform.",
    xFactor: -0.866025,
    yFactor: -0.5,
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
      {/* Left Column: Clean 2-Line Headline with Slide-Down Cycling Word + Interactive Model Features */}
      <div className="jt-hero-left landing-animate-fade-up">
        <div className="jt-hero-pill-badge">
          <span className="jt-badge-spark" aria-hidden="true">✦</span>
          <span>Gerbang utama API AI terpadu untuk developer &amp; enterprise di Indonesia</span>
        </div>

        <h1 className="jt-hero-headline">
          Semua model AI
          <br />
          dalam satu{" "}
          <span key={current.headlineWord + activeIndex} className="jt-slide-word">
            {current.headlineWord}
          </span>
        </h1>

        <p className="jt-hero-subtitle">
          Satu gateway, satu API Key, 50 model AI terkurasi (100+ model di gateway). Jembatani kebutuhan teknis tim IT,
          ngoding, riset mendalam, dan efisiensi operasional dalam satu ekosistem terintegrasi.
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

        {/* Active Model Pill with Slide-Down Disappear/Appear Transition */}
        <div className="jt-amp-slot">
          <button
            key={current.modelId}
            type="button"
            className="jt-active-model-pill jt-slide-down-item"
            onClick={handleOpenActiveModel}
            title="Klik untuk melihat detail & cara pakai model ini"
          >
            <span className="jt-amp-label">MODEL</span>
            <span className="jt-amp-name">
              {current.providerName} · <strong>{current.modelId}</strong>
            </span>
            <span className="jt-amp-role">{current.roleTag}</span>
          </button>
        </div>

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

      {/* Right Column: Balanced Motion Frame housing the Centered Orbit Ring */}
      <div className="jt-hero-visual landing-animate-scale-in" aria-label="Animasi orbit model AI mengelilingi Juragantoken">
        <div className="jt-motion-frame">
          <div className="jt-mf-topbar">
            <span className="jt-mf-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="jt-mf-title">juragantoken · multi-model hub</span>
            <span className="jt-mf-live">
              <span className="jt-mf-live-dot" /> Aktif
            </span>
          </div>

          <div className="jt-orbit-stage">
            <div className="jt-orbit-glow" aria-hidden="true" />

            {/* SVG Orbital Rings with Animated Signal Arc */}
            <svg className="jt-orbit-svg" viewBox="0 0 400 400" fill="none" aria-hidden="true">
              <circle cx="200" cy="200" r="144" className="jt-orbit-svg-outer" />
              <circle cx="200" cy="200" r="144" className="jt-orbit-svg-pulse" />
              <circle cx="200" cy="200" r="100" className="jt-orbit-svg-inner" />
            </svg>

            {/* Direct (x,y) polar placement on the r=144px circle — zero wobble */}
            <div className="jt-orbit-track" aria-hidden="true">
              {HERO_SHOWCASE_ITEMS.map((node, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={node.orbitLabel}
                    type="button"
                    className={`jt-orbit-pill ${isSelected ? "is-selected" : ""}`}
                    style={
                      {
                        left: `calc(50% + var(--orbit-radius) * ${node.xFactor})`,
                        top: `calc(50% + var(--orbit-radius) * ${node.yFactor})`,
                      } as React.CSSProperties
                    }
                    onClick={() => setActiveIndex(idx)}
                    tabIndex={-1}
                  >
                    <ProviderLogo provider={node.providerId} size={20} />
                    <span>{node.orbitLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Center Circle: Juragantoken Logo Only */}
            <div className="jt-orbit-core">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-mark.png"
                alt="Juragantoken"
                width={52}
                height={43}
                className="jt-core-logo-mark"
              />
              <strong className="jt-core-brand">
                juragan<span className="jt-core-accent">token.</span>
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
