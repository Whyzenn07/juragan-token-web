"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrandMark,
  Icon,
  ModelDetailModal,
  ProviderLogo,
  RegionBadge,
  SetupGuides,
  SingaPayModal,
  TokenBalanceModal
} from "@/components";
import {
  ANSWER_INPUT_TOKENS,
  ANSWER_OUTPUT_TOKENS,
  Category,
  categories,
  compatibleApps,
  GATEWAY_ORIGIN,
  inputIdrPer1M,
  isPerImage,
  ModelItem,
  modelsCatalog,
  outputIdrPer1M,
  perImageIdr,
  PRICING_SNAPSHOT_DATE,
  providerById,
  reachScore,
  RetailPackage,
  retailPackages,
  tierOf,
  unitCostIdr,
  unitsForBudget,
  USD_RATE
} from "@/data/catalog";

type SortOption = "featured" | "cheapest" | "priciest";

const formatIdr = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
const formatNum = (val: number) => new Intl.NumberFormat("id-ID").format(val);

function useReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    targets.forEach((target) => {
      target.classList.add("reveal");
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  const [models, setModels] = useState<ModelItem[]>(modelsCatalog);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Gateway Live");
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const categoryCount = (cat: Category) =>
    cat === "Semua" ? models.length : models.filter((m) => m.category === cat).length;

  const handleSyncPricing = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/models/sync");
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
          setSyncStatus("Gateway Live");
          setSyncNotification(`Sinkronisasi Sukses: ${data.totalModels} model & kalkulasi harga IDR langsung diperbarui!`);
          setTimeout(() => setSyncNotification(null), 5000);
        }
      }
    } catch {
      setSyncStatus("Cache Lokal Aktif");
    } finally {
      setIsSyncing(false);
    }
  };

  const [activeCategory, setActiveCategory] = useState<Category>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<RetailPackage | null>(null);
  const [singaPayOpen, setSingaPayOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLElement>(null);

  const NAV_ITEMS = [
    { id: "catalog", label: "Jelajahi Token", href: "#catalog" },
    { id: "retail", label: "Paket Ritel", href: "#katalog-retail" },
    { id: "setup", label: "Panduan Setup", href: "#panduan-setup" },
    { id: "faq", label: "FAQ", href: "#faq" },
  ] as const;

  const [activeSection, setActiveSection] = useState<string>("catalog");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLElement | null>>({});

  useReveal();

  // Sliding indicator calculation: follows hovered item or active section
  useEffect(() => {
    const targetId = hoveredNav || activeSection;
    const targetEl = linkRefs.current[targetId];
    const container = navRef.current;
    if (targetEl && container) {
      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
        opacity: 1,
      });
    }
  }, [hoveredNav, activeSection]);

  // Recalculate indicator position on resize
  useEffect(() => {
    const handleResize = () => {
      const targetId = hoveredNav || activeSection;
      const targetEl = linkRefs.current[targetId];
      const container = navRef.current;
      if (targetEl && container) {
        const targetRect = targetEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setIndicatorStyle({
          left: targetRect.left - containerRect.left,
          width: targetRect.width,
          opacity: 1,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoveredNav, activeSection]);

  // Scroll spy to sync activeSection with visible viewport section
  useEffect(() => {
    const sectionIds = ["catalog", "katalog-retail", "panduan-setup", "faq"];
    const sectionMap: Record<string, string> = {
      catalog: "catalog",
      "katalog-retail": "retail",
      "panduan-setup": "setup",
      faq: "faq",
    };

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(sectionMap[sectionIds[i]]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut '/' to focus search input like ai-vouchers.com
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenDetail = (model: ModelItem) => {
    setSelectedModel(model);
    setDetailModalOpen(true);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter & Sort Logic
  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = models.filter((m) => {
      if (viewSavedOnly && !savedIds.includes(m.id)) return false;
      const matchesCategory = activeCategory === "Semua" || m.category === activeCategory;
      const p = providerById(m.providerId);
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.company.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    if (sortOption === "cheapest") return [...list].sort((a, b) => unitCostIdr(a) - unitCostIdr(b));
    if (sortOption === "priciest") return [...list].sort((a, b) => unitCostIdr(b) - unitCostIdr(a));
    // "featured": model unggulan dulu, sisanya mengikuti urutan kurasi di catalog.ts
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [models, activeCategory, searchQuery, sortOption, savedIds, viewSavedOnly]);

  // Kunci ini memicu animasi masuk kartu saat filter berganti, tapi tidak di setiap ketikan pencarian.
  const gridKey = `${activeCategory}-${sortOption}-${viewSavedOnly ? "saved" : "all"}`;

  return (
    <div className="site-canvas">
      <a href="#catalog" className="skip-link">
        Langsung ke katalog voucher
      </a>

      {/* 1. Top Announcement */}
      <div className="announcement">
        <span>✧</span>
        <span>Ide besar layak mendapatkan akses AI terbaik. Mulai Rp 15.000 tanpa kartu kredit.</span>
        <button type="button" className="announcement-link" onClick={scrollToCatalog}>
          Kenali Juragan Token ↗
        </button>
      </div>

      {/* 2. Site Header (Sesuai ai-vouchers tapi Biru + Putih) */}
      <header className="header">
        <a className="brand" href="#top" aria-label="Juragan Token Beranda">
          <span className="brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <span>
            juragan<span className="brand-light">token</span><span className="brand-dot">.</span>
          </span>
        </a>

        <nav
          ref={navRef}
          className="header-links"
          aria-label="Navigasi Utama"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isCurrent = activeSection === item.id;
            return (
              <a
                key={item.id}
                ref={(el) => {
                  linkRefs.current[item.id] = el;
                }}
                href={item.href}
                className={`header-nav-link ${isCurrent ? "active" : ""}`}
                onMouseEnter={() => setHoveredNav(item.id)}
                onClick={(e) => {
                  if (item.href.startsWith("/")) {
                    return; // Normal route change
                  }
                  if (item.id === "catalog") {
                    e.preventDefault();
                    setViewSavedOnly(false);
                    scrollToCatalog();
                  }
                  setActiveSection(item.id);
                }}
              >
                {item.label}
              </a>
            );
          })}
          <span
            className="nav-sliding-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
            aria-hidden="true"
          />
        </nav>

        <div className="header-right">
          <div className="region-indicator">
            <span className="flag-badge-svg" aria-hidden="true">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ borderRadius: "2px", overflow: "hidden", display: "block" }}>
                <rect width="18" height="6" fill="#e11d48" />
                <rect y="6" width="18" height="6" fill="#ffffff" />
                <rect width="18" height="12" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
              </svg>
            </span>
            <span>Indonesia (IDR)</span>
          </div>
          <span className="header-divider" />
          <button
            type="button"
            className="check-balance-btn"
            onClick={() => setBalanceModalOpen(true)}
          >
            <span>Cek Saldo Key</span>
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </button>
          <a
            href="#katalog-retail"
            className="company-button"
            onClick={(e) => {
              const el = document.getElementById("katalog-retail");
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <span>Beli Token</span>
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            className="mobile-menu icon-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu navigasi"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Menu navigasi mobile">
          <nav className="mobile-nav-links">
            <a
              href="#catalog"
              onClick={() => {
                setViewSavedOnly(false);
                setMobileMenuOpen(false);
              }}
            >
              Semua Token AI
            </a>
            <a href="#katalog-retail" onClick={() => setMobileMenuOpen(false)}>
              Paket Prabayar Ritel
            </a>
            <a href="#panduan-setup" onClick={() => setMobileMenuOpen(false)}>
              Panduan Setup Claude Code &amp; Cursor
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              Bantuan &amp; FAQ
            </a>
          </nav>
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="primary-button full"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToCatalog();
              }}
            >
              Temukan Token Anda ↗
            </button>
          </div>
        </div>
      )}

      {/* 3. Layout Grid: Sidebar + Main Content (Pola ai-vouchers.com) */}
      <div className="layout">
        {/* Sidebar Nav */}
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-label">Temukan</div>
          <nav className="side-nav">
            <button
              type="button"
              className={!viewSavedOnly ? "selected" : ""}
              onClick={() => {
                setViewSavedOnly(false);
                setActiveCategory("Semua");
              }}
            >
              <Icon name="search" size={16} />
              <span>Semua Token</span>
              <span className="nav-count">{models.length}</span>
            </button>
            <a href="#katalog-retail" className="side-link-btn">
              <Icon name="bag" size={16} />
              <span>Paket Multi-AI</span>
              <span className="new-label">BARU</span>
            </a>
            <button
              type="button"
              className={viewSavedOnly ? "selected" : ""}
              onClick={() => setViewSavedOnly(true)}
            >
              <Icon name="check" size={16} />
              <span>Tersimpan</span>
              <span className="nav-count">{savedIds.length}</span>
            </button>
            <button
              type="button"
              className="side-link-btn"
              onClick={() => setBalanceModalOpen(true)}
            >
              <Icon name="bag" size={16} />
              <span>Cek Saldo Key</span>
            </button>
          </nav>

          <div className="sidebar-label category-label">Kategori AI</div>
          <nav className="side-nav category-nav">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={activeCategory === cat && !viewSavedOnly ? "selected" : ""}
                onClick={() => {
                  setViewSavedOnly(false);
                  setActiveCategory(cat);
                  scrollToCatalog();
                }}
              >
                <span>{cat}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-promo">
            <div className="promo-icon">✦</div>
            <h3>Pakai di Claude Code?</h3>
            <p>Colokkan Base URL &amp; API Key tanpa kartu kredit dan tanpa batas kuota 5 jam.</p>
            <a href="#panduan-setup" className="promo-btn">
              Lihat Panduan Setup ↗
            </a>
          </div>

          <div className="sidebar-bottom">
            <span className="online-dot" />
            <span>Saldo aktif permanen tanpa masa hangus</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main>
          <div className="breadcrumb">
            <span>Marketplace</span> / <span>Temukan</span>
            <span className="demo-pill">Pratinjau · Akses Token Ritel Mahasiswa</span>
          </div>

          {/* Live Status Strip */}
          <div className="gateway-status-strip">
            <div className="gateway-status-left">
              <span className="live-pulse-dot" />
              <strong>Gateway juragantoken.co.id</strong>
              <span>· Claude Sonnet 5.5, Gemini 3.8 Flash, GPT-6, DeepSeek V4 &amp; Kimi K3 lewat satu API key</span>
            </div>
            <div className="gateway-status-right">
              <span>Masa Aktif: <b>Permanen (Lifetime)</b></span>
              <button
                type="button"
                className="link-button"
                onClick={() => setBalanceModalOpen(true)}
              >
                Cek Saldo Key ↗
              </button>
            </div>
          </div>

          {/* Hero Section (Pola ai-vouchers.com dengan Tiket Pass Biru-Putih) */}
          <section className="hero" id="top">
            <div className="hero-content">
              <div className="eyebrow">
                ✦ <span>Lebih hemat. Lebih banyak berkarya.</span>
              </div>
              <h1>
                <span>Ide besar Anda berikutnya.</span>
                <br />
                <span className="hero-accent">Dengan harga lebih ringan.</span>
              </h1>
              <p>
                Temukan token dan kredit API untuk AI favorit Anda. Berkarya, ngoding tugas kuliah, dan riset skripsi di mana pun tanpa kartu kredit internasional.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-button" onClick={scrollToCatalog}>
                  <span>Temukan Token Anda</span> ↗
                </button>
                <span className="hero-note">
                  <Icon name="check" size={16} /> Bebas kartu kredit internasional
                </span>
              </div>
              <RegionBadge />
            </div>

            {/* The Iconic Celestial Ticket Art (Desain ai-vouchers Versi Biru & Putih) */}
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✧</span>
              <div className="floating-tag">
                <span className="online-dot" /> Mulai Rp 15.000
              </div>

              {/* Ticket Back (Pass Multi-AI) */}
              <div className="art-ticket ticket-back">
                <div className="art-ticket-head">
                  ✳ MULTI-AI PASS <span>↗</span>
                </div>
                <div className="ticket-brands">
                  <span>✳</span>
                  <span>◈</span>
                  <span>ıı</span>
                </div>
                <div className="ticket-rule" />
                <div className="ticket-bottom">
                  MORE AI · MORE YOU <span>✦ ✦ ✦</span>
                </div>
              </div>

              {/* Ticket Front (Juragan Token Voucher) */}
              <div className="art-ticket ticket-front">
                <div className="art-ticket-head">
                  ✳ juragan token <span>↗</span>
                </div>
                <div className="ticket-value">
                  −90<span>%</span>
                </div>
                <div className="ticket-rule" />
                <div className="ticket-bottom">
                  <span>UNTUK IDE BESAR ANDA</span>
                  <div className="barcode" />
                </div>
              </div>

              <div className="art-caption">
                ✧ <span>Biaya ringan. Peluang tanpa batas.</span>
              </div>
            </div>
          </section>

          {/* 4. Trust Strip dengan Logo Resmi Perusahaan AI (Anthropic, OpenAI, Google, DeepSeek, dll) */}
          <div className="trust-strip">
            <span className="trust-lead">Model AI terdepan yang didukung:</span>
            <div className="provider-wordmark" title="Anthropic - Claude Sonnet 5.5">
              <ProviderLogo provider="anthropic" size={18} />
              <span className="company-brand">Anthropic</span>
              <span className="brand-dot-sep">·</span>
              <b>Claude Sonnet 5.5</b>
            </div>
            <div className="provider-wordmark" title="OpenAI - GPT-6 Sol & Luna">
              <ProviderLogo provider="openai" size={18} />
              <span className="company-brand">OpenAI</span>
              <span className="brand-dot-sep">·</span>
              <b>GPT-6 Sol &amp; Luna</b>
            </div>
            <div className="provider-wordmark" title="Google - Gemini 4 Argon">
              <ProviderLogo provider="gemini" size={18} />
              <span className="company-brand">Google</span>
              <span className="brand-dot-sep">·</span>
              <b>Gemini 4 Argon</b>
            </div>
            <div className="provider-wordmark" title="DeepSeek - DeepSeek V4">
              <ProviderLogo provider="deepseek" size={18} />
              <span className="company-brand">DeepSeek</span>
              <span className="brand-dot-sep">·</span>
              <b>DeepSeek V4</b>
            </div>
            <div className="provider-wordmark" title="Alibaba Cloud - Qwen3.7 Max">
              <ProviderLogo provider="qwen" size={18} />
              <span className="company-brand">Alibaba</span>
              <span className="brand-dot-sep">·</span>
              <b>Qwen3.7 Max</b>
            </div>
            <div className="provider-wordmark" title="xAI - Grok 4.3">
              <ProviderLogo provider="grok" size={18} />
              <span className="company-brand">xAI</span>
              <span className="brand-dot-sep">·</span>
              <b>Grok 4.3</b>
            </div>
            <div className="provider-wordmark" title="Moonshot AI - Kimi K3">
              <ProviderLogo provider="kimi" size={18} />
              <span className="company-brand">Moonshot</span>
              <span className="brand-dot-sep">·</span>
              <b>Kimi K3</b>
            </div>
            <div className="provider-wordmark" title="Anthropic - Claude Fable 5.1">
              <ProviderLogo provider="anthropic" size={20} />
              <span className="company-brand">Anthropic</span>
              <span className="brand-dot-sep">·</span>
              <b>Claude Fable 5.1</b>
            </div>
            <div className="provider-wordmark" title="Z.ai - GLM-5.3 Flash">
              <ProviderLogo provider="zhipu" size={20} />
              <span className="company-brand">Z.ai</span>
              <span className="brand-dot-sep">·</span>
              <b>GLM-5.3 Flash</b>
            </div>
            <a className="more-tools" href={`${GATEWAY_ORIGIN}/pricing`} target="_blank" rel="noreferrer">
              Semua 124 model di gateway ↗
            </a>
          </div>

          {/* 5. Catalog Section: model riil dari gateway juragantoken.co.id */}
          <section className="catalog model-catalog" id="catalog" ref={catalogRef}>
            <div className="section-heading">
              <div>
                <div className="section-kicker">Katalog model</div>
                <h2>Pilih model, lihat seberapa jauh Rp10.000 Anda</h2>
                <p>
                  Satu API key untuk semua model di bawah. Harga dihitung langsung dari tarif gateway, jadi angka di kartu sama dengan yang dipotong dari saldo.
                </p>
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setActiveCategory("Semua");
                  setSearchQuery("");
                  setViewSavedOnly(false);
                  setSortOption("featured");
                }}
              >
                Hapus filter
              </button>
            </div>

            {/* Live Gateway Auto-Update Bar */}
            <div className="gateway-sync-panel">
              <div className="gsp-left">
                <span className={`gsp-dot ${isSyncing ? "pulse-fast" : "pulse-live"}`} />
                <div className="gsp-text">
                  <div className="gsp-title-row">
                    <strong>Auto-Update Pricing Gateway</strong>
                    <span className="gsp-tag">Realtime IDR</span>
                  </div>
                  <p className="gsp-sub">
                    Model baru otomatis terdaftar dengan kalkulasi Rupiah (USD 1 = Rp {formatNum(USD_RATE)}). Status: <b>{syncStatus}</b> ({models.length} model aktif).
                  </p>
                </div>
              </div>
              <div className="gsp-right">
                <button
                  type="button"
                  className={`gsp-sync-button ${isSyncing ? "syncing" : ""}`}
                  onClick={handleSyncPricing}
                  disabled={isSyncing}
                  title="Segarkan harga dan model terbaru langsung dari gateway juragantoken.co.id"
                >
                  <span className={`gsp-icon ${isSyncing ? "spin" : ""}`}>↻</span>
                  <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Harga & Model"}</span>
                </button>
              </div>
            </div>

            {syncNotification && (
              <div className="sync-toast-banner" role="status">
                <Icon name="check" size={16} />
                <span>{syncNotification}</span>
              </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
              <label className="search">
                <Icon name="search" size={18} />
                <input
                  ref={searchInputRef}
                  id="search"
                  type="search"
                  placeholder="Cari AI, model (Claude, GPT, DeepSeek)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus kata kunci"
                  >
                    ✕
                  </button>
                ) : (
                  <kbd>/</kbd>
                )}
              </label>

              <label className="sort-label" htmlFor="sort">
                <span>Urutkan</span>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                >
                  <option value="featured">Unggulan</option>
                  <option value="cheapest">Paling hemat</option>
                  <option value="priciest">Harga tertinggi</option>
                </select>
              </label>
            </div>

            {/* Category Chips Bar */}
            <div className="category-chips" role="group" aria-label="Filter kategori model">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={activeCategory === cat && !viewSavedOnly}
                  className={`chip ${activeCategory === cat && !viewSavedOnly ? "active" : ""}`}
                  onClick={() => {
                    setViewSavedOnly(false);
                    setActiveCategory(cat);
                  }}
                >
                  {cat}
                  <span className="chip-count">{categoryCount(cat)}</span>
                </button>
              ))}
            </div>

            {/* Results Meta */}
            <div className="results-meta">
              <span>
                {viewSavedOnly ? `${filteredModels.length} model tersimpan` : `${filteredModels.length} model`}
              </span>
              <span>
                1 jawaban ≈ {formatNum(ANSWER_INPUT_TOKENS)} token masuk + {formatNum(ANSWER_OUTPUT_TOKENS)} token keluar · kurs contoh Rp{formatNum(USD_RATE)}/US$ · tarif per {PRICING_SNAPSHOT_DATE}
              </span>
            </div>

            {/* Model Cards Grid */}
            <div id="model-grid" key={gridKey} className="model-grid" aria-live="polite">
              {filteredModels.length === 0 ? (
                <div className="empty-state">
                  <h4>{viewSavedOnly ? "Belum ada model tersimpan" : "Tidak ada model yang cocok"}</h4>
                  <p>
                    {viewSavedOnly
                      ? "Tekan bintang di kartu model untuk menyimpannya di sini."
                      : `Tidak ada hasil untuk "${searchQuery}". Coba nama provider seperti Claude, Gemini, atau DeepSeek.`}
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setActiveCategory("Semua");
                      setSearchQuery("");
                      setViewSavedOnly(false);
                    }}
                  >
                    Tampilkan semua model
                  </button>
                </div>
              ) : (
                filteredModels.map((m, index) => {
                  const p = providerById(m.providerId);
                  const isSaved = savedIds.includes(m.id);
                  const perImage = isPerImage(m);
                  const tier = perImage ? null : tierOf(m);
                  return (
                    <article
                      key={m.id}
                      className="model-card"
                      data-tier={tier ?? "image"}
                      style={{ "--i": Math.min(index, 9), "--reach": reachScore(m) } as React.CSSProperties}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        e.currentTarget.style.setProperty("--cursor-x", `${e.clientX - rect.left}px`);
                        e.currentTarget.style.setProperty("--cursor-y", `${e.clientY - rect.top}px`);
                      }}
                    >
                      <button
                        type="button"
                        className="model-card-open"
                        onClick={() => handleOpenDetail(m)}
                        aria-label={`Lihat detail dan cara pakai ${m.name}`}
                      />

                      <header className="mc-head">
                        <span className="mc-logo">
                          <ProviderLogo provider={m.providerId} size={24} />
                        </span>
                        <span className="mc-provider">{p.company}</span>
                        <button
                          type="button"
                          className={`mc-save ${isSaved ? "saved" : ""}`}
                          onClick={(e) => toggleSave(m.id, e)}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? `Hapus ${m.name} dari tersimpan` : `Simpan ${m.name}`}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
                          </svg>
                        </button>
                      </header>

                      <h3 className="mc-name">{m.name}</h3>
                      <code className="mc-id">{m.id}</code>
                      <p className="mc-desc">{m.description}</p>

                      <div className="mc-reach">
                        <span className="mc-reach-label">Rp10.000 cukup untuk</span>
                        <div className="mc-reach-row">
                          <strong className="mc-reach-num">±{formatNum(unitsForBudget(m))}</strong>
                          <span className="mc-reach-unit">{perImage ? "gambar" : "jawaban"}</span>
                          <span className="mc-tier">{tier ?? "Per gambar"}</span>
                        </div>
                        {!perImage && (
                          <div className="mc-meter" aria-hidden="true">
                            <span className="mc-meter-fill" />
                          </div>
                        )}
                      </div>

                      <dl className="mc-prices">
                        {perImage ? (
                          <div>
                            <dt>Per gambar</dt>
                            <dd>{formatIdr(perImageIdr(m))}</dd>
                          </div>
                        ) : (
                          <>
                            <div>
                              <dt>Input / 1 jt token</dt>
                              <dd>{formatIdr(inputIdrPer1M(m))}</dd>
                            </div>
                            <div>
                              <dt>Output / 1 jt token</dt>
                              <dd>{formatIdr(outputIdrPer1M(m))}</dd>
                            </div>
                          </>
                        )}
                      </dl>

                      <footer className="mc-apps">
                        {compatibleApps(m).map((app) => (
                          <span key={app}>{app}</span>
                        ))}
                      </footer>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* 6. Paket Prabayar Ritel Mahasiswa Section (Pola Paket ai-vouchers) */}
          <section className="catalog" id="katalog-retail">
            <div className="section-heading">
              <div>
                <div className="section-kicker">PAKET PILIHAN MAHASISWA</div>
                <h2>Paket Prabayar Multi-AI Siap Pakai</h2>
                <p>Isi saldo nominal terjangkau mulai Rp 15.000 untuk kebutuhan kuliah dan ngoding.</p>
              </div>
            </div>

            <div className="retail-packages-grid">
              {retailPackages.map((pkg) => (
                <article
                  key={pkg.id}
                  className={`package-card ${pkg.featured ? "featured" : ""}`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--cursor-x", `${e.clientX - rect.left}px`);
                    e.currentTarget.style.setProperty("--cursor-y", `${e.clientY - rect.top}px`);
                  }}
                >
                  <div className="pkg-top-row">
                    <span className="pkg-target">{pkg.targetUser}</span>
                    {pkg.badge && <span className="card-badge">{pkg.badge}</span>}
                  </div>
                  <div className="pkg-head">
                    <h3>{pkg.name}</h3>
                    <p className="pkg-sub">{pkg.subtitle}</p>
                  </div>

                  <div className="pkg-price-block">
                    <div className="pkg-price-main">
                      <strong className="pkg-price-amount">{formatIdr(pkg.priceIdr)}</strong>
                      <span className="pkg-price-period">/&nbsp;paket</span>
                    </div>
                    <div className="pkg-token-pill">
                      <span className="token-pill-text">{pkg.estToken}</span>
                    </div>
                  </div>

                  <p className="pkg-desc">{pkg.description}</p>

                  <div className="pkg-highlights">
                    <span className="hl-label">Cocok untuk:</span>
                    <ul>
                      {pkg.popularFor.map((item, i) => (
                        <li key={i}>
                          <Icon name="check" size={14} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pkg-recommended-model">
                    <span>Rekomendasi model:</span>
                    <b>{pkg.recommendedModel}</b>
                  </div>

                  <button
                    type="button"
                    className="button-accent full"
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setSingaPayOpen(true);
                    }}
                  >
                    Beli Paket SingaPay ↗
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* 7. Bundle Banner (Pola ai-vouchers.com) */}
          <section className="bundle-banner">
            <div className="bundle-mini-art">
              <span>✳</span>
              <span>◈</span>
              <span>ıı</span>
            </div>
            <div>
              <span className="section-kicker">LEBIH BAIK BERSAMA</span>
              <h2>Lebih banyak AI. Satu harga ringan.</h2>
              <p>
                Satu saldo Juragan Token membuka akses ke Claude Sonnet 5.5, GPT-6 Sol, Gemini 3.8 Flash, DeepSeek V4, dan Kimi K3 di Cursor maupun Claude Code CLI.
              </p>
            </div>
            <a href="#panduan-setup" className="secondary-button">
              <span>Jelajahi Cara Pakai</span> ↗
            </a>
          </section>

          {/* 8. Setup Guides Section */}
          <SetupGuides />

          {/* 9. FAQ Section */}
          <section className="faq-section" id="faq" aria-labelledby="faq-heading">
            <div className="section-kicker">JURAGAN TOKEN</div>
            <h2 id="faq-heading">Pertanyaan Umum (FAQ)</h2>
            <p className="faq-section-lead">
              Semua yang perlu Anda ketahui tentang fleksibilitas saldo token, kompatibilitas aplikasi, dan keamanan data.
            </p>

            <div className="faq-grid">
              <details className="faq-card" open>
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Multi-AI Pool</span>
                    <h3 className="faq-question">Apakah 1 saldo token bisa dipakai bergantian untuk Claude, ChatGPT, Gemini, dan DeepSeek?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Bisa! Sistem kami menggunakan Multi-AI Pool (1 Saldo untuk Semua).</b>
                  </p>
                  <p>
                    Konsepnya persis seperti pulsa ponsel prabayar. Jika Anda mengisi saldo nominal berapa pun (mulai Rp 15.000), Anda <b>tidak perlu</b> membeli saldo terpisah untuk masing-masing AI. Saldo tersebut otomatis memotong biaya sesuai tarif model yang Anda panggil secara real-time—misalnya Claude Sonnet untuk coding intensif, lalu beralih ke Gemini 3.8 Flash untuk riset tugas tanpa perlu ganti akun.
                  </p>
                </div>
              </details>

              <details className="faq-card">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Kompatibilitas</span>
                    <h3 className="faq-question">Apakah bisa disambungkan langsung di website resmi chatgpt.com atau claude.ai?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Tidak bisa di web portal konsumen resmi mereka.</b> Website <code>chatgpt.com</code> dan <code>claude.ai</code> adalah produk SaaS tertutup yang sengaja tidak menyediakan input API Key pribadi karena bisnis mereka berbasis sistem langganan kartu kredit bulanan.
                  </p>
                  <p>
                    Namun, token Juragan Token <b>100% kompatibel</b> dan bekerja mulus di semua aplikasi web client gratis (NextChat, Chatbox), code editor (Cursor, Windsurf, VS Code), dan terminal Anthropic resmi (Claude Code CLI) dengan kecerdasan model dan parameter yang identik.
                  </p>
                </div>
              </details>

              <details className="faq-card">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Masa Aktif</span>
                    <h3 className="faq-question">Apakah saldo token memiliki masa kedaluwarsa atau batas waktu hangus bulanan?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Tidak ada masa kedaluwarsa (Aktif Permanen / Lifetime).</b>
                  </p>
                  <p>
                    Berbeda dengan langganan bulanan SaaS yang hangus tiap tanggal jatuh tempo meskipun tidak Anda pakai, saldo Juragan Token tetap utuh di akun Anda selamanya. Saldo hanya akan berkurang saat Anda mengirimkan prompt atau menjalankan kalkulasi token.
                  </p>
                </div>
              </details>

              <details className="faq-card">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Pembayaran</span>
                    <h3 className="faq-question">Apakah butuh kartu kredit internasional? Bagaimana cara pembayarannya?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Sama sekali tidak memerlukan kartu kredit.</b>
                  </p>
                  <p>
                    Juragan Token didesain untuk kemudahan pengguna dan mahasiswa di Indonesia. Pembayaran dilakukan 100% dalam mata uang Rupiah (IDR) menggunakan <b>QRIS SingaPay Instan</b> (bisa di-scan dari BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA) maupun Virtual Account bank lokal dengan aktivasi otomatis detik itu juga.
                  </p>
                </div>
              </details>

              <details className="faq-card">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Transparansi</span>
                    <h3 className="faq-question">Bagaimana cara mengecek sisa saldo token dan riwayat konsumsi saya?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Sangat mudah dan transparan.</b>
                  </p>
                  <p>
                    Cukup klik tombol <b>Cek Saldo Key ↗</b> di header atas website ini, lalu tempelkan API Key Anda (misal <code>jt-live-xxxxxx</code>). Sistem kami langsung menampilkan sisa saldo rupiah, estimasi kuota token yang tersisa, serta rincian pemakaian model terakhir secara transparan tanpa perlu login password yang rumit.
                  </p>
                </div>
              </details>

              <details className="faq-card">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Privasi &amp; Keamanan</span>
                    <h3 className="faq-question">Bagaimana dengan privasi percakapan dan kerahasiaan data koding saya?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Privasi dan keamanan kode Anda terlindungi 100%.</b>
                  </p>
                  <p>
                    Gateway Juragan Token menerapkan enkripsi TLS/SSL berstandar industri dan sistem direct-streaming (penerusan langsung) ke server resmi penyedia model AI (Anthropic, OpenAI, Google). Kami <b>tidak pernah</b> merekam, menyimpan, membagikan, atau menggunakan prompt maupun cuplikan kode tugas Anda untuk melatih model AI apa pun.
                  </p>
                </div>
              </details>
            </div>

            <div className="faq-footer-help">
              <span className="ffh-text">Butuh panduan teknis langkah-demi-langkah memasang token di aplikasi Anda?</span>
              <a href="#panduan-setup" className="ffh-link">
                Lihat Panduan Setup Interaktif (Cursor, Claude Code, Chatbox, Python) ↗
              </a>
            </div>
          </section>

          {/* 10. Footer */}
          <footer>
            <a className="footer-brand" href="#top">
              ✳ juragan token.
            </a>
            <span>Membuka dunia penuh peluang AI dengan harga ramah kantong mahasiswa.</span>
            <a href="#panduan-setup" className="footer-link">
              Panduan Integrasi API ↗
            </a>
            <span>© 2026 Juragan Token</span>
          </footer>
        </main>
      </div>

      {/* Model Detail Modal */}
      <ModelDetailModal
        open={detailModalOpen}
        model={selectedModel}
        onClose={() => setDetailModalOpen(false)}
        onSelectTopUp={(model) => {
          const matchedPkg =
            retailPackages.find((p) =>
              p.recommendedModel.toLowerCase().includes(model.name.split(" ")[0].toLowerCase())
            ) || retailPackages[1];
          setSelectedPackage(matchedPkg);
          setSingaPayOpen(true);
        }}
      />

      {/* SingaPay Checkout Modal (QRIS & Virtual Account) */}
      <SingaPayModal
        open={singaPayOpen}
        pkg={selectedPackage}
        onClose={() => setSingaPayOpen(false)}
      />

      {/* Token Balance Modal */}
      <TokenBalanceModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onTopUp={() => {
          setBalanceModalOpen(false);
          setSelectedPackage(retailPackages[1]);
          setSingaPayOpen(true);
        }}
      />
    </div>
  );
}
