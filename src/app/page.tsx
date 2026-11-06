"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BrandMark,
  CurrencyRateModal,
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
  providers,
  reachScore,
  RetailPackage,
  retailPackages,
  tierOf,
  unitCostIdr,
  unitsForBudget,
  USD_RATE
} from "@/data/catalog";

type SortOption = "featured" | "provider" | "cheapest" | "priciest";

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
  const [usdRate, setUsdRate] = useState<number>(USD_RATE);
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
          if (data.usdRate && typeof data.usdRate === "number") {
            setUsdRate(data.usdRate);
          }
          setSyncStatus("Gateway Live");
          const formattedRate = new Intl.NumberFormat("id-ID").format(data.usdRate || USD_RATE);
          setSyncNotification(`Sinkronisasi Sukses: ${data.totalModels} model & kurs realtime USD/IDR (Rp ${formattedRate}) langsung aktif!`);
          setTimeout(() => setSyncNotification(null), 5000);
        }
      }
    } catch {
      setSyncStatus("Cache Lokal Aktif");
    } finally {
      setIsSyncing(false);
    }
  };

  // Sinkronisasi otomatis saat komponen dimuat (real-time forex & pricing)
  useEffect(() => {
    fetch("/api/models/sync")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.models && Array.isArray(data.models)) {
          setModels(data.models);
          if (data.usdRate && typeof data.usdRate === "number") {
            setUsdRate(data.usdRate);
          }
        }
      })
      .catch(() => {
        // Gunakan rate fallback lokal
      });
  }, []);

  const [activeCategory, setActiveCategory] = useState<Category>("Semua");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("provider");
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<RetailPackage | null>(null);
  const [singaPayOpen, setSingaPayOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
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

  const handleBuyTokenForModel = (model: ModelItem) => {
    const mName = model.name.toLowerCase();
    let matched = retailPackages[1]; // default Starter Kuliah
    if (mName.includes("opus") || mName.includes("astra") || mName.includes("argon")) {
      matched = retailPackages.find((p) => p.id === "pkt-pro-builder") || retailPackages[3];
    } else if (
      mName.includes("sonnet") ||
      mName.includes("sol") ||
      mName.includes("m2.5") ||
      mName.includes("m2.7") ||
      mName.includes("k2.7") ||
      mName.includes("qwen 3.6")
    ) {
      matched = retailPackages.find((p) => p.id === "pkt-skripsi-koding") || retailPackages[2];
    } else if (
      mName.includes("luna") ||
      mName.includes("flash") ||
      mName.includes("qwen") ||
      mName.includes("haiku") ||
      mName.includes("seed")
    ) {
      matched = retailPackages.find((p) => p.id === "pkt-mhs-uji") || retailPackages[0];
    }
    setSelectedPackage(matched);
    setSingaPayOpen(true);
  };

  // Filter & Sort Logic
  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = models.filter((m) => {
      if (viewSavedOnly && !savedIds.includes(m.id)) return false;
      const matchesCategory = activeCategory === "Semua" || m.category === activeCategory;
      const matchesProvider = selectedProvider === "all" || m.providerId === selectedProvider;
      const p = providerById(m.providerId);
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.company.toLowerCase().includes(query);
      return matchesCategory && matchesProvider && matchesSearch;
    });
    if (sortOption === "provider" || sortOption === "featured") {
      const providerOrder = ["openai", "anthropic", "alibaba", "minimax", "google", "xai", "moonshot", "deepseek", "bytedance", "zhipu"];
      return [...list].sort((a, b) => {
        const pA = providerOrder.indexOf(a.providerId);
        const pB = providerOrder.indexOf(b.providerId);
        if (pA !== pB) return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
        return 0; // Mempertahankan urutan tier kurasi di catalog.ts (Luna -> Terra -> Sol -> Astra)
      });
    }
    if (sortOption === "cheapest") return [...list].sort((a, b) => unitCostIdr(a) - unitCostIdr(b));
    if (sortOption === "priciest") return [...list].sort((a, b) => unitCostIdr(b) - unitCostIdr(a));
    return list;
  }, [models, activeCategory, selectedProvider, searchQuery, sortOption, savedIds, viewSavedOnly]);

  // Kunci ini memicu animasi masuk kartu saat filter berganti, tapi tidak di setiap ketikan pencarian.
  const gridKey = `${activeCategory}-${selectedProvider}-${sortOption}-${viewSavedOnly ? "saved" : "all"}`;

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
          {/* Interactive Indonesia (IDR) Trigger -> Opens Bank Indonesia Live Rate Modal */}
          <button
            type="button"
            className="region-indicator interactive"
            onClick={() => setCurrencyModalOpen(true)}
            title="Klik untuk melihat kurs real-time Bank Indonesia (BI) & segarkan harga"
            aria-label="Lihat Kurs Real-Time Bank Indonesia"
          >
            <span className="flag-badge-svg" aria-hidden="true">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" style={{ borderRadius: "2px", overflow: "hidden", display: "block" }}>
                <rect width="18" height="6" fill="#e11d48" />
                <rect y="6" width="18" height="6" fill="#ffffff" />
                <rect width="18" height="12" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
              </svg>
            </span>
            <span>Indonesia (IDR)</span>
            <span className="currency-pill-badge" aria-hidden="true">BI Live</span>
          </button>
          <span className="header-divider" />
          <Link href="/docs" className="header-docs-link">
            <span>Dokumentasi API</span>
          </Link>
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
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)}>
              Dokumentasi API &amp; Panduan ↗
            </Link>
            <Link href="/status" onClick={() => setMobileMenuOpen(false)}>
              Status Sistem (Live) ↗
            </Link>
            <a href="#panduan-setup" onClick={() => setMobileMenuOpen(false)}>
              Panduan Setup Claude Code &amp; Cursor
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              Bantuan &amp; FAQ
            </a>
            <button
              type="button"
              className="mobile-currency-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrencyModalOpen(true);
              }}
            >
              <span className="flag-badge-svg" aria-hidden="true">
                <svg width="16" height="11" viewBox="0 0 18 12" fill="none">
                  <rect width="18" height="6" fill="#e11d48" />
                  <rect y="6" width="18" height="6" fill="#ffffff" />
                  <rect width="18" height="12" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
                </svg>
              </span>
              <span>Kurs Real-Time BI (Rp {formatNum(usdRate)}) ↗</span>
            </button>
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

      {/* 3. Main Content Container - Full Width Company Profile Layout */}
      <div className="company-container">
        <main className="company-main">
          {/* Breadcrumb & Live Status Strip */}
          <div className="breadcrumb">
            <span>Marketplace</span> / <span>Temukan</span>
            <span className="demo-pill">Pratinjau · Akses Token Ritel Mahasiswa</span>
          </div>

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

          {/* Hero Section (Pola Asli Juragan Token dengan Tiket Pass & Animasi Kreatif) */}
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

            {/* The Iconic Celestial Ticket Art dengan Animasi Bergerak Kreatif */}
            <div className="hero-art" aria-hidden="true">
              <div className="hero-aurora-glow" />
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
            <div className="provider-wordmark" title="MiniMax - MiniMax M2.5">
              <ProviderLogo provider="minimax" size={18} />
              <span className="company-brand">MiniMax</span>
              <span className="brand-dot-sep">·</span>
              <b>MiniMax M2.5</b>
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
            {/* 5. Catalog Section Header Card - Modern Executive Corporate Banner */}
            <div
              className="catalog-header-card"
              style={{
                position: "relative",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                border: "1px solid #dce6f2",
                borderRadius: "18px",
                padding: "38px 44px",
                marginTop: "44px",
                marginBottom: "38px",
                boxShadow: "0 4px 20px -2px rgba(10, 88, 202, 0.06), 0 1px 3px rgba(15, 23, 42, 0.03)",
                overflow: "hidden",
              }}
            >
              {/* Subtle top accent gradient line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #0a58ca 0%, #0284c7 50%, #38bdf8 100%)",
                }}
                aria-hidden="true"
              />

              {/* Badges / Status row */}
              <div
                className="catalog-kicker-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <span
                  className="chc-kicker-pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    padding: "5px 13px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                  </svg>
                  <span>Katalog Frontier AI</span>
                </span>

                <span
                  className="chc-status-pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    padding: "5px 13px",
                    borderRadius: "9999px",
                    fontSize: "11.5px",
                    fontWeight: 650,
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#16a34a",
                      boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.25)",
                      display: "inline-block",
                    }}
                    aria-hidden="true"
                  />
                  <span>36 Model Gateway Terverifikasi</span>
                </span>

                <span
                  className="chc-badge-pill"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    padding: "5px 13px",
                    borderRadius: "9999px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 2l-2 2m-2-2l2 2m0 0l-5 5 2 2-7 7H3v-6l7-7 2 2 5-5z" />
                  </svg>
                  <span>1 API Key Universal</span>
                </span>
              </div>

              {/* Main Headline */}
              <h2
                className="catalog-hero-title"
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.25,
                  color: "#0a2540",
                  margin: "0 0 12px 0",
                }}
              >
                Pilih model, lihat seberapa jauh{" "}
                <span
                  style={{
                    color: "#0a58ca",
                    background: "linear-gradient(135deg, #0a58ca 0%, #0284c7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 900,
                  }}
                >
                  Rp10.000
                </span>{" "}
                Anda
              </h2>

              {/* Subtitle */}
              <p
                className="catalog-hero-subtitle"
                style={{
                  fontSize: "14.5px",
                  lineHeight: 1.65,
                  color: "#475569",
                  maxWidth: "860px",
                  margin: "0 0 24px 0",
                }}
              >
                Satu API key untuk seluruh model terbaik dunia (Claude 3.7/3.5, GPT-4o, Gemini 2.0, DeepSeek R1).
                Harga dihitung langsung dari tarif resmi gateway ke Rupiah secara transparan — angka yang tertera adalah nilai riil yang dipotong dari saldo Anda.
              </p>

              {/* Features Guarantee Bar - Enterprise SVG Icons */}
              <div
                className="catalog-hero-features"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "28px",
                  paddingTop: "22px",
                  borderTop: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                }}
              >
                {/* 1. Payment QRIS & VA */}
                <div
                  className="chf-item"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#0a58ca",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2.5" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </span>
                  <span>Bayar Fleksibel via QRIS Instan &amp; Virtual Account</span>
                </div>

                {/* 2. Bank Indonesia Live Rate */}
                <div
                  className="chf-item"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#16a34a",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
                    </svg>
                  </span>
                  <span>Kurs Real-Time Bank Indonesia (Tanpa Markup)</span>
                </div>

                {/* 3. Claude Code & Cursor Developer Tooling */}
                <div
                  className="chf-item"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background: "#faf5ff",
                      border: "1px solid #e9d5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#7e22ce",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </span>
                  <span>Kompatibel Claude Code, Cursor, Cline &amp; SDK Resmi</span>
                </div>
              </div>
            </div>

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
                  <option value="provider">Per Provider (OpenAI, Claude, Qwen...)</option>
                  <option value="featured">Pilihan Unggulan</option>
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
              <button
                type="button"
                aria-pressed={viewSavedOnly}
                className={`chip ${viewSavedOnly ? "active" : ""}`}
                onClick={() => setViewSavedOnly(!viewSavedOnly)}
              >
                <Icon name="check" size={13} />
                <span>Tersimpan</span>
                <span className="chip-count">{savedIds.length}</span>
              </button>
            </div>

            {/* Provider Quick Filter Strip */}
            <div className="provider-filter-strip" role="group" aria-label="Filter berdasarkan AI Provider">
              <span className="pfs-label">Provider:</span>
              <div className="pfs-list">
                <button
                  type="button"
                  className={`chip provider-chip ${selectedProvider === "all" ? "active" : ""}`}
                  onClick={() => setSelectedProvider("all")}
                >
                  Semua
                  <span className="chip-count">{models.length}</span>
                </button>
                {providers.map((p) => {
                  const count = models.filter((m) => m.providerId === p.id).length;
                  if (count === 0) return null;
                  const displayLabel =
                    p.id === "alibaba"
                      ? "Qwen (Alibaba)"
                      : p.id === "bytedance"
                      ? "ByteDance (Seed)"
                      : p.id === "openai"
                      ? "OpenAI (GPT)"
                      : p.id === "anthropic"
                      ? "Anthropic (Claude)"
                      : p.company;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`chip provider-chip ${selectedProvider === p.id ? "active" : ""}`}
                      onClick={() => setSelectedProvider(selectedProvider === p.id ? "all" : p.id)}
                      title={`Tampilkan hanya model dari ${displayLabel}`}
                    >
                      <ProviderLogo provider={p.id} size={14} />
                      <span>{displayLabel}</span>
                      <span className="chip-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Meta */}
            <div className="results-meta">
              <span>
                {viewSavedOnly ? `${filteredModels.length} model tersimpan` : `${filteredModels.length} model`}
              </span>
              <span>
                1 jawaban ≈ {formatNum(ANSWER_INPUT_TOKENS)} token masuk + {formatNum(ANSWER_OUTPUT_TOKENS)} token keluar · kurs realtime Rp{formatNum(usdRate)}/US$ · tarif gateway per {PRICING_SNAPSHOT_DATE}
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
                        <span className="mc-provider">
                          {p.id === "alibaba" ? "Alibaba Qwen" : p.id === "bytedance" ? "ByteDance Seed" : p.company}
                        </span>
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
                          <strong className="mc-reach-num">±{formatNum(unitsForBudget(m, 10_000, usdRate))}</strong>
                          <span className="mc-reach-unit">{perImage ? "gambar" : "jawaban"}</span>
                          <span className="mc-tier">{perImage ? (m.id.includes("pro") ? "Pro Studio" : "Per gambar") : tier}</span>
                        </div>
                        <div className="mc-meter" aria-hidden="true">
                          <span className="mc-meter-fill" />
                        </div>
                      </div>

                      <dl className="mc-prices">
                        {perImage ? (
                          <>
                            <div>
                              <dt>Biaya per gambar</dt>
                              <dd>{formatIdr(perImageIdr(m, usdRate))}</dd>
                            </div>
                            <div>
                              <dt>Resolusi &amp; Format</dt>
                              <dd>{m.id.includes("pro") ? "2K HD Studio · PNG" : "1024px · WebP / PNG"}</dd>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <dt>Input / 1 jt token</dt>
                              <dd>{formatIdr(inputIdrPer1M(m, usdRate))}</dd>
                            </div>
                            <div>
                              <dt>Output / 1 jt token</dt>
                              <dd>{formatIdr(outputIdrPer1M(m, usdRate))}</dd>
                            </div>
                          </>
                        )}
                      </dl>

                      <footer className="mc-apps">
                        {compatibleApps(m).map((app) => (
                          <span key={app}>{app}</span>
                        ))}
                      </footer>

                      <div className="mc-action-row">
                        <button
                          type="button"
                          className="mc-buy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyTokenForModel(m);
                          }}
                          aria-label={`Beli token untuk ${m.name}`}
                        >
                          <span>Beli Token</span>
                          <span className="mc-buy-arrow">→</span>
                        </button>
                      </div>
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
                    Beli Paket ↗
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

        </main>
      </div>

      {/* 11. Footer Global Multi-Kolom Profesional (Full Width) */}
      <footer className="site-pro-footer">
        <div className="spf-container">
          <div className="spf-main-grid">
            {/* Kolom 1: Brand & Profil Platform */}
            <div className="spf-col spf-col-brand">
              <a className="footer-brand" href="#top" aria-label="Juragan Token Beranda">
                <span className="brand-mark" aria-hidden="true">
                  <BrandMark />
                </span>
                <span>
                  juragan<span className="brand-light">token</span><span className="brand-dot">.</span>
                </span>
              </a>
              <p className="spf-desc">
                Platform marketplace dan Universal AI Gateway prabayar resmi di Indonesia. Akses model frontier Claude, GPT, Gemini, dan DeepSeek via satu API key terpadu tanpa kartu kredit internasional.
              </p>
              <div className="spf-meta-info">
                Masa aktif saldo permanen • SLA Uptime 99.98%
              </div>
            </div>

            {/* Kolom 2: Produk & Layanan */}
            <div className="spf-col">
              <div className="spf-col-heading">Produk &amp; Layanan</div>
              <ul className="spf-links">
                <li>
                  <a href="#katalog-retail">Paket Token Ritel</a>
                </li>
                <li>
                  <a href="#catalog">Katalog Model AI</a>
                </li>
                <li>
                  <button
                    type="button"
                    className="spf-link-btn"
                    onClick={() => setBalanceModalOpen(true)}
                  >
                    Cek Saldo API Key
                  </button>
                </li>
                <li>
                  <a href="#panduan-setup">Panduan Setup Cepat</a>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Developer & Dokumentasi */}
            <div className="spf-col">
              <div className="spf-col-heading">Dokumentasi API</div>
              <ul className="spf-links">
                <li>
                  <Link href="/docs">Dokumentasi Resmi</Link>
                </li>
                <li>
                  <Link href="/docs">Integrasi Cursor &amp; Windsurf</Link>
                </li>
                <li>
                  <Link href="/docs">Integrasi Claude Code CLI</Link>
                </li>
                <li>
                  <Link href="/status">Status Sistem &amp; Latensi</Link>
                </li>
              </ul>
            </div>

            {/* Kolom 4: Legal & Kontak */}
            <div className="spf-col">
              <div className="spf-col-heading">Legal &amp; Kontak</div>
              <ul className="spf-links">
                <li>
                  <Link href="/terms">Syarat &amp; Ketentuan</Link>
                </li>
                <li>
                  <Link href="/privacy">Kebijakan Privasi</Link>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990").replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Halo Admin Juragan Token, saya butuh informasi / bantuan teknis.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bantuan WhatsApp
                  </a>
                </li>
                <li>
                  <a href="https://t.me/juragantoken" target="_blank" rel="noopener noreferrer">
                    Komunitas Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="spf-bottom-bar">
            <div className="spf-copy">
              &copy; 2026 Juragan Token Indonesia. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div className="spf-bottom-meta">
              <span>Zero-Training Guarantee</span>
              <span className="spf-sep">•</span>
              <span>Enkripsi Transit TLS 1.3</span>
              <span className="spf-sep">•</span>
              <span>QRIS Standar Nasional</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Model Detail Modal */}
      <ModelDetailModal
        open={detailModalOpen}
        model={selectedModel}
        onClose={() => setDetailModalOpen(false)}
        usdRate={usdRate}
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

      {/* Bank Indonesia Real-Time Currency Rate Modal */}
      <CurrencyRateModal
        open={currencyModalOpen}
        onClose={() => setCurrencyModalOpen(false)}
        usdRate={usdRate}
        totalModels={models.length}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        syncNotification={syncNotification}
        onSyncPricing={handleSyncPricing}
      />
    </div>
  );
}
