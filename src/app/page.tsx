"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BackToTop,
  CurrencyRateModal,
  GatewayFlow,
  HeroOrbit,
  Icon,
  LogoMarquee,
  ModelDetailModal,
  ModelExpertiseShowcase,
  PlatformMetricsBar,
  PreFooterCta,
  ProviderLogo,
  SetupGuides,
  PaymentModal,
  TokenBalanceModal,
  UseCasesGrid,
  WhyChooseUs
} from "@/components";
import {
  ENABLE_CHECKOUT,
  SHOW_CATALOG_PRICING,
  WHATSAPP_RAW
} from "@/lib/site-config";
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

type SortOption = "featured" | "provider" | "name" | "cheapest" | "priciest";

const formatIdr = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
const formatNum = (val: number) => new Intl.NumberFormat("id-ID").format(val);

function useScrollEffects(depsKey?: string) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const progressBar = document.querySelector<HTMLElement>(".scroll-progress-bar");

    const updateScrollMetrics = () => {
      const scrollY = window.scrollY;
      const nextScrolled = scrollY > 20;
      if (nextScrolled !== scrolledRef.current) {
        scrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      if (progressBar) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = totalHeight > 0 ? Math.min(1, Math.max(0, scrollY / totalHeight)) : 0;
        progressBar.style.transform = `scaleX(${progress})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollMetrics);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollMetrics();

    const rootEl = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rootEl.classList.remove("jt-scroll-anim");
      targets.forEach((el) => {
        el.classList.remove("from-top", "from-bottom");
        el.classList.add("is-revealed");
      });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    // Tetapkan arah awal (atas/bawah viewport) sebelum mengaktifkan animasi scroll dua arah
    const vh = window.innerHeight || 800;
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < vh * 0.96 && rect.bottom > vh * 0.04;
      if (inView) {
        el.classList.remove("from-top", "from-bottom");
        el.classList.add("is-revealed");
      } else if (rect.bottom <= vh * 0.04) {
        el.classList.remove("is-revealed", "from-bottom");
        el.classList.add("from-top");
      } else {
        el.classList.remove("is-revealed", "from-top");
        el.classList.add("from-bottom");
      }
    });

    rootEl.classList.add("jt-scroll-anim");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
          } else {
            el.classList.remove("is-revealed");
            if (entry.boundingClientRect.top < 0) {
              // Terlewat di atas viewport -> saat scroll ke atas, masuk halus dari atas + fade
              el.classList.remove("from-bottom");
              el.classList.add("from-top");
            } else {
              // Berada di bawah viewport -> saat scroll ke bawah, masuk halus dari bawah + fade
              el.classList.remove("from-top");
              el.classList.add("from-bottom");
            }
          }
        });
      },
      { threshold: 0.04, rootMargin: "-20px 0px -20px 0px" }
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [depsKey]);

  return { isScrolled };
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
  const [checkoutModel, setCheckoutModel] = useState<ModelItem | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [checkoutInitialMode, setCheckoutInitialMode] = useState<"new" | "topup">("new");
  const [checkoutInitialKey, setCheckoutInitialKey] = useState<string>("");
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const [authUser, setAuthUser] = useState<{ email: string; fullName: string; role: "user" | "admin" } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setAuthUser({
            email: data.user.email,
            fullName: data.user.fullName,
            role: data.user.role === "admin" ? "admin" : "user",
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const handleNavbarLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAuthUser(null);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLElement>(null);

  const NAV_ITEMS = [
    { id: "expertise", label: "Solusi", href: "#keahlian-model" },
    { id: "workflow", label: "Integrasi", href: "#cara-kerja" },
    { id: "why", label: "Keunggulan", href: "#kenapa-kami" },
    { id: "setup", label: "Panduan", href: "#panduan-setup" },
    { id: "faq", label: "FAQ", href: "#faq" },
  ] as const;

  const [activeSection, setActiveSection] = useState<string>("expertise");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLElement | null>>({});

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
    const sectionIds = ["keahlian-model", "cara-kerja", "kenapa-kami", "panduan-setup", "faq"];
    const sectionMap: Record<string, string> = {
      "keahlian-model": "expertise",
      "cara-kerja": "workflow",
      "kenapa-kami": "why",
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
    const mName = `${model.name} ${model.id}`.toLowerCase();
    let matched = retailPackages[1]; // default Paket Produktivitas
    if (tierOf(model) === "Premium" || mName.includes("opus") || mName.includes("astra") || mName.includes("argon")) {
      matched = retailPackages.find((p) => p.id === "pkt-pro-builder") || retailPackages[3];
    } else if (
      mName.includes("sonnet") ||
      mName.includes("sol") ||
      mName.includes("luna") ||
      mName.includes("m2.5") ||
      mName.includes("m2.7") ||
      mName.includes("k2.7") ||
      mName.includes("qwen 3.6")
    ) {
      matched = retailPackages.find((p) => p.id === "pkt-skripsi-koding") || retailPackages[2];
    } else if (
      mName.includes("flash") ||
      mName.includes("qwen") ||
      mName.includes("haiku") ||
      mName.includes("seed")
    ) {
      matched = retailPackages.find((p) => p.id === "pkt-mhs-uji") || retailPackages[0];
    }
    setSelectedPackage(matched);
    setCheckoutModel(model);
    setCheckoutInitialMode("new");
    setCheckoutInitialKey("");
    setPaymentModalOpen(true);
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
    if (sortOption === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (SHOW_CATALOG_PRICING && sortOption === "cheapest") return [...list].sort((a, b) => unitCostIdr(a) - unitCostIdr(b));
    if (SHOW_CATALOG_PRICING && sortOption === "priciest") return [...list].sort((a, b) => unitCostIdr(b) - unitCostIdr(a));
    return list;
  }, [models, activeCategory, selectedProvider, searchQuery, sortOption, savedIds, viewSavedOnly]);

  // Kunci ini memicu animasi masuk kartu saat filter berganti, tapi tidak di setiap ketikan pencarian.
  const gridKey = `${activeCategory}-${selectedProvider}-${sortOption}-${viewSavedOnly ? "saved" : "all"}`;
  const { isScrolled } = useScrollEffects(gridKey);

  // Tampilkan seluruh model terkurasi di grid agar simetris penuh 3 kolom tanpa slot kosong
  const displayedModels = filteredModels;

  return (
    <div className="site-canvas">
      {/* Scroll-driven top reading progress bar */}
      <div
        className="scroll-progress-bar"
        style={{ transform: "scaleX(0)" }}
        aria-hidden="true"
      />

      <a href="#catalog" className="skip-link">
        Langsung ke katalog model AI
      </a>

      {/* Floating Pill Navbar (Desain bersih ala gambar referensi tokotokenai) */}
      <header className={`jt-pill-header-wrap ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="jt-pill-navbar">
          <a className="jt-pill-brand" href="#top" aria-label="Juragantoken Beranda">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-mark.png"
              alt=""
              width={30}
              height={25}
              className="jt-pill-brand-icon"
            />
            <span className="jt-pill-brand-text">
              juragan<span className="jt-pill-brand-blue">token</span><span className="jt-pill-brand-dot">.</span>
            </span>
          </a>

          <nav
            ref={navRef}
            className="jt-pill-nav-links"
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
                  className={`jt-pill-nav-link ${isCurrent ? "is-active" : ""}`}
                  onMouseEnter={() => setHoveredNav(item.id)}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="jt-pill-actions">
            <a
              href="#catalog"
              className="jt-pill-util-link"
              onClick={(e) => {
                e.preventDefault();
                setViewSavedOnly(false);
                scrollToCatalog();
              }}
            >
              Katalog Model
            </a>
            <button
              type="button"
              className="jt-pill-util-link"
              onClick={() => setBalanceModalOpen(true)}
            >
              Cek Saldo
            </button>
            <Link href="/docs" className="jt-pill-util-link">
              Docs
            </Link>
            {authUser ? (
              <>
                <Link
                  href={authUser.role === "admin" ? "/admin" : "/dashboard"}
                  className="jt-pill-cta-btn"
                  title={authUser.email}
                >
                  {authUser.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Link>
                <button
                  type="button"
                  className="jt-pill-signin-btn"
                  onClick={handleNavbarLogout}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="jt-pill-signin-btn">
                  Sign In
                </Link>
                <Link href="/signup" className="jt-pill-cta-btn">
                  Sign Up
                </Link>
              </>
            )}
            <button
              type="button"
              className="mobile-menu icon-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu navigasi"
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-label="Menu navigasi mobile">
          <nav className="mobile-nav-links">
            <a href="#keahlian-model" onClick={() => setMobileMenuOpen(false)}>
              Solusi &amp; Keahlian AI
            </a>
            <a href="#cara-kerja" onClick={() => setMobileMenuOpen(false)}>
              Integrasi Gateway
            </a>
            <a
              href="#catalog"
              onClick={() => {
                setViewSavedOnly(false);
                setMobileMenuOpen(false);
              }}
            >
              Katalog Semua Model ({models.length})
            </a>
            {ENABLE_CHECKOUT && (
              <a href="#katalog-retail" onClick={() => setMobileMenuOpen(false)}>
                Paket Prabayar Ritel
              </a>
            )}
            <a href="#kenapa-kami" onClick={() => setMobileMenuOpen(false)}>
              Keunggulan Kami
            </a>
            <button
              type="button"
              className="mobile-link-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                setBalanceModalOpen(true);
              }}
            >
              <span>🔑 Cek Saldo Virtual Key</span>
              <span aria-hidden="true">↗</span>
            </button>
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)}>
              Dokumentasi API (Docs) ↗
            </Link>
            <Link href="/status" onClick={() => setMobileMenuOpen(false)}>
              Status Sistem (Live) ↗
            </Link>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
              Bantuan &amp; FAQ
            </a>
          </nav>
          <div className="mobile-drawer-footer" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {authUser ? (
              <>
                <Link
                  href={authUser.role === "admin" ? "/admin" : "/dashboard"}
                  className="primary-button full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {authUser.role === "admin" ? "Admin Panel" : "Dashboard"}
                </Link>
                <button
                  type="button"
                  className="secondary-button full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNavbarLogout();
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="secondary-button full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="primary-button full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Content Container - Full Width Company Profile Layout */}
      <div className="company-container">
        <main className="company-main">
          {/* Hero Section (Gaya bersih sesuai referensi gambar 1 + sinkron PRD/PDF) */}
          <HeroOrbit
            onExploreCatalog={scrollToCatalog}
            onSelectModel={handleOpenDetail}
          />

          {/* Animated Moving LLM Showcase (Original Marquee Inspired by Industry Patterns) */}
          <LogoMarquee onSelectModel={handleOpenDetail} />

          {/* Ringkasan Kapabilitas & Metrik Infrastruktur Gateway */}
          <PlatformMetricsBar />

          {/* Model Expertise by Use Case (Coding, Research, Cost Efficiency) */}
          <ModelExpertiseShowcase
            onSelectModel={handleOpenDetail}
            onBrowseCategory={(cat) => {
              setViewSavedOnly(false);
              setSelectedProvider("all");
              setActiveCategory(cat);
              scrollToCatalog();
            }}
          />

          {/* Gateway Architecture & How It Works */}
          <GatewayFlow />

          {/* 5. Catalog Section: model riil dari gateway api.tokotokenai.com */}
          <section className="catalog model-catalog" id="catalog" ref={catalogRef}>
            {/* 5. Catalog Section Header Card */}
            <div className="dps-banner-card" data-reveal="scale">
              {/* Left Column: Heading & Primary Action */}
              <div className="dps-banner-left">
                <div className="dps-pill-header">
                  <span className="dps-pill-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </span>
                  <span className="dps-pill-title">Katalog Lengkap Model AI</span>
                  <span className="dps-pill-badge green">{models.length} MODEL</span>
                  <span className="dps-pill-sub">1 API Key Universal</span>
                </div>

                <h2 className="dps-banner-title">
                  {SHOW_CATALOG_PRICING ? (
                    <>
                      Pilih model, lihat seberapa jauh{" "}
                      <span className="hero-gradient-text">Rp10.000</span> Anda.
                    </>
                  ) : (
                    <>
                      Temukan model AI tepat untuk{" "}
                      <span className="hero-gradient-text">setiap tugas.</span>
                    </>
                  )}
                </h2>

                <p className="dps-banner-desc">
                  {SHOW_CATALOG_PRICING
                    ? "Satu API key untuk seluruh model terbaik dunia (Claude 3.7, GPT-4o, Gemini 2.0, DeepSeek R1). Harga dihitung langsung dari kurs resmi Bank Indonesia tanpa markup — hanya bayar token riil yang Anda gunakan."
                    : "Bandingkan kapabilitas, fokus keahlian (Ngoding, Riset, Chat Hemat, hingga Gambar), dan protokol endpoint dari OpenAI, Anthropic, Google, DeepSeek, Qwen, dan puluhan model lainnya dalam satu gerbang terpadu."}
                </p>

                <div className="dps-action-row">
                  <button
                    type="button"
                    className="dps-btn-primary"
                    onClick={() => {
                      searchInputRef.current?.focus();
                      const el = document.getElementById("search");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    <span>Jelajahi &amp; Cari Model</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <span className="dps-meta-text">
                    <span>Claude Code</span>
                    <span className="dps-meta-dot">·</span>
                    <span>Cursor</span>
                    <span className="dps-meta-dot">·</span>
                    <span>Chatbox</span>
                    <span className="dps-meta-dot">·</span>
                    <span>Web SDK</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Comparison Stack */}
              <div className="dps-banner-right">
                {SHOW_CATALOG_PRICING ? (
                  <>
                    <div className="dps-compare-card">
                      <div className="dps-card-kicker">
                        <span className="dps-card-dot gray" aria-hidden="true" />
                        <span>API GATEWAY BIASA</span>
                      </div>
                      <p className="dps-card-body">
                        Tarif USD fluktuatif, kena biaya konversi bank 3–5%, dan harus deposit minimal $5–$20 terpisah di tiap provider.
                      </p>
                    </div>

                    <div className="dps-compare-card highlight">
                      <div className="dps-card-kicker">
                        <span className="dps-card-dot blue" aria-hidden="true" />
                        <span>JURAGAN TOKEN GATEWAY</span>
                      </div>
                      <p className="dps-card-body">
                        Tarif Rupiah transparan. Rp 10.000 cukup untuk puluhan hingga ratusan jawaban cerdas, terpotong presisi per token tanpa deposit besar.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="dps-compare-card">
                      <div className="dps-card-kicker">
                        <span className="dps-card-dot gray" aria-hidden="true" />
                        <span>INTEGRASI TERPISAH</span>
                      </div>
                      <p className="dps-card-body">
                        Mengelola banyak SDK, endpoint, dan kunci akses berbeda untuk OpenAI, Anthropic, Google, dan model terbuka lainnya.
                      </p>
                    </div>

                    <div className="dps-compare-card highlight">
                      <div className="dps-card-kicker">
                        <span className="dps-card-dot blue" aria-hidden="true" />
                        <span>JURAGANTOKEN GATEWAY</span>
                      </div>
                      <p className="dps-card-body">
                        Satu endpoint OpenAI-compatible untuk memanggil Claude Opus 5.5, Chat GPT 6 Astra, Gemini 4 Argon, DeepSeek V4, hingga Qwen secara fleksibel.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Unified Catalog Control Toolbar (Clean, Executive, Anti-Slop) */}
            <div className="catalog-toolbar-panel" data-reveal="fade-up">
              {/* Top Row: Search input + Provider & Sort Dropdowns */}
              <div className="toolbar-top-row">
                <div className="toolbar-search-wrapper">
                  <Icon name="search" size={17} />
                  <input
                    ref={searchInputRef}
                    id="search"
                    type="search"
                    placeholder="Cari model AI, provider (Claude, GPT, DeepSeek)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Cari model AI"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus kata kunci pencarian"
                    >
                      ✕
                    </button>
                  ) : (
                    <kbd className="search-kbd">/</kbd>
                  )}
                </div>

                <div className="toolbar-selects-group">
                  {/* Provider Select Dropdown */}
                  <div className="toolbar-select-box">
                    <label htmlFor="provider-filter" className="ts-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span>Provider:</span>
                    </label>
                    <select
                      id="provider-filter"
                      value={selectedProvider}
                      onChange={(e) => {
                        setSelectedProvider(e.target.value);
                        setActiveCategory("Semua");
                      }}
                      aria-label="Filter berdasarkan AI Provider"
                    >
                      <option value="all">Semua Provider ({models.length})</option>
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
                          <option key={p.id} value={p.id}>
                            {displayLabel} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Sort Select Dropdown */}
                  <div className="toolbar-select-box">
                    <label htmlFor="sort-select" className="ts-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="21" y1="10" x2="7" y2="10" />
                        <line x1="21" y1="6" x2="3" y2="6" />
                        <line x1="21" y1="14" x2="11" y2="14" />
                        <line x1="21" y1="18" x2="15" y2="18" />
                      </svg>
                      <span>Urutkan:</span>
                    </label>
                    <select
                      id="sort-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      aria-label="Urutan tampilan katalog model"
                    >
                      <option value="provider">Per Provider (OpenAI, Claude, Qwen...)</option>
                      <option value="featured">Pilihan Unggulan</option>
                      <option value="name">Nama Model (A–Z)</option>
                      {SHOW_CATALOG_PRICING && (
                        <>
                          <option value="cheapest">Paling hemat</option>
                          <option value="priciest">Harga tertinggi</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Divider Line */}
              <div className="toolbar-divider" aria-hidden="true" />

              {/* Bottom Row: Segmented Category Tabs + Tersimpan + Reset Button */}
              <div className="toolbar-bottom-row">
                <div className="category-segmented-control" role="group" aria-label="Filter kategori model">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat && !viewSavedOnly;
                    return (
                      <button
                        key={cat}
                        type="button"
                        aria-pressed={isActive}
                        className={`segmented-tab ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setViewSavedOnly(false);
                          setActiveCategory(cat);
                        }}
                      >
                        <span>{cat}</span>
                        <span className="tab-badge">{categoryCount(cat)}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="toolbar-actions-group">
                  <button
                    type="button"
                    aria-pressed={viewSavedOnly}
                    className={`saved-toggle-btn ${viewSavedOnly ? "active" : ""}`}
                    onClick={() => setViewSavedOnly(!viewSavedOnly)}
                    title={viewSavedOnly ? "Tampilkan semua model" : "Hanya tampilkan model yang Anda simpan"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={viewSavedOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Tersimpan</span>
                    <span className="saved-badge">{savedIds.length}</span>
                  </button>

                  {(searchQuery || selectedProvider !== "all" || activeCategory !== "Semua" || viewSavedOnly) && (
                    <button
                      type="button"
                      className="reset-filters-btn"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedProvider("all");
                        setActiveCategory("Semua");
                        setViewSavedOnly(false);
                      }}
                      title="Reset semua filter ke tampilan default"
                    >
                      <span>Reset Filter</span>
                      <span aria-hidden="true">✕</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results Meta */}
            <div className="results-meta">
              <span>
                {filteredModels.length === 0 ? (
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>0 model ditemukan</span>
                ) : viewSavedOnly ? (
                  <span>Menampilkan <b>{displayedModels.length} dari {filteredModels.length} model tersimpan</b></span>
                ) : (
                  <span>Menampilkan <b>{displayedModels.length} dari {filteredModels.length} model AI</b></span>
                )}
              </span>
              <span>
                {SHOW_CATALOG_PRICING
                  ? `1 jawaban ≈ ${formatNum(ANSWER_INPUT_TOKENS)} token masuk + ${formatNum(ANSWER_OUTPUT_TOKENS)} token keluar · kurs realtime Rp${formatNum(usdRate)}/US$ · tarif gateway per ${PRICING_SNAPSHOT_DATE}`
                  : "Klik kartu model untuk melihat keahlian, protokol endpoint, dan contoh konfigurasi aplikasi"}
              </span>
            </div>

            {/* Model Cards Grid */}
            <div
              id="model-grid"
              key={gridKey}
              className="model-grid"
              data-count={displayedModels.length}
              aria-live="polite"
            >
              {filteredModels.length === 0 ? (
                <div className="empty-state" data-reveal="scale">
                  <div className="empty-state-icon" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>

                  {viewSavedOnly ? (
                    <>
                      <span className="empty-state-badge">Daftar Tersimpan Kosong</span>
                      <h4>Belum Ada Model yang Anda Simpan</h4>
                      <p>
                        Klik ikon bintang pada kartu model AI mana saja di katalog untuk menyimpannya ke daftar favorit agar mudah ditemukan kembali.
                      </p>
                      <div className="empty-state-actions">
                        <button
                          type="button"
                          className="empty-state-btn-primary"
                          onClick={() => setViewSavedOnly(false)}
                        >
                          <span>Jelajahi Semua Model AI</span> ↗
                        </button>
                      </div>
                    </>
                  ) : searchQuery ? (
                    <>
                      <span className="empty-state-badge">Pencarian Tidak Ditemukan</span>
                      <h4>Tidak Ada Hasil untuk &ldquo;{searchQuery}&rdquo;</h4>
                      <p>
                        Tidak ada model yang cocok dengan kata kunci pencarian. Coba kata kunci lain atau cari provider populer seperti <b>Claude</b>, <b>GPT</b>, <b>Gemini</b>, atau <b>DeepSeek</b>.
                      </p>
                      <div className="empty-state-actions">
                        <button
                          type="button"
                          className="empty-state-btn-primary"
                          onClick={() => {
                            setSearchQuery("");
                            setActiveCategory("Semua");
                            setSelectedProvider("all");
                          }}
                        >
                          <span>Hapus Pencarian &amp; Tampilkan Semua</span> ✕
                        </button>
                      </div>
                    </>
                  ) : selectedProvider !== "all" && activeCategory !== "Semua" ? (
                    <>
                      <span className="empty-state-badge">Filter Kombinasi Kosong</span>
                      <h4>
                        Tidak Ada Model {providerById(selectedProvider).company} di Kategori &ldquo;{activeCategory}&rdquo;
                      </h4>
                      <p>
                        Provider <b>{providerById(selectedProvider).company}</b> saat ini memiliki total{" "}
                        <b>{models.filter((m) => m.providerId === selectedProvider).length} model</b> di kategori lainnya. Anda dapat beralih untuk melihat seluruh model provider ini atau mereset filter.
                      </p>
                      <div className="empty-state-actions">
                        <button
                          type="button"
                          className="empty-state-btn-primary"
                          onClick={() => setActiveCategory("Semua")}
                        >
                          <span>Lihat Semua Model {providerById(selectedProvider).company} ({models.filter((m) => m.providerId === selectedProvider).length})</span> ↗
                        </button>
                        <button
                          type="button"
                          className="empty-state-btn-secondary"
                          onClick={() => {
                            setActiveCategory("Semua");
                            setSelectedProvider("all");
                            setSearchQuery("");
                          }}
                        >
                          <span>Reset Semua Filter</span> ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="empty-state-badge">Katalog Kosong</span>
                      <h4>Tidak Ada Model yang Cocok</h4>
                      <p>
                        Kombinasi filter yang Anda pilih saat ini tidak menghasilkan model AI. Silakan reset filter untuk kembali menampilkan seluruh {models.length} model AI kami.
                      </p>
                      <div className="empty-state-actions">
                        <button
                          type="button"
                          className="empty-state-btn-primary"
                          onClick={() => {
                            setActiveCategory("Semua");
                            setSelectedProvider("all");
                            setSearchQuery("");
                            setViewSavedOnly(false);
                          }}
                        >
                          <span>Tampilkan Semua {models.length} Model</span> ↗
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                displayedModels.map((m, index) => {
                  const p = providerById(m.providerId);
                  const isSaved = savedIds.includes(m.id);
                  const perImage = isPerImage(m);
                  const tier = perImage ? null : tierOf(m);
                  return (
                    <article
                      key={m.id}
                      className="model-card"
                      data-reveal="fade-up"
                      data-delay={Math.min((index % 4) * 60, 240)}
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

                      {SHOW_CATALOG_PRICING ? (
                        <>
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
                        </>
                      ) : (
                        <div className="mc-capabilities">
                          <span className="mc-cap-pill is-tier">
                            {m.category}
                          </span>
                          <span className="mc-cap-pill">
                            {perImage ? "Generasi Gambar" : tier === "Hemat" ? "Efisiensi Biaya" : tier === "Premium" ? "Performa Tinggi" : "Seimbang"}
                          </span>
                          <span className="mc-cap-pill">
                            Input: {m.inputs.join(" + ")}
                          </span>
                        </div>
                      )}

                      <footer className="mc-apps">
                        {compatibleApps(m).map((app) => (
                          <span key={app}>{app}</span>
                        ))}
                      </footer>

                      <div className="mc-action-row">
                        {ENABLE_CHECKOUT ? (
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
                            <span className="mc-buy-arrow" aria-hidden="true">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="mc-buy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(m);
                            }}
                            aria-label={`Lihat detail dan cara pakai ${m.name}`}
                          >
                            <span>Lihat Keahlian &amp; Cara Pakai</span>
                            <span className="mc-buy-arrow" aria-hidden="true">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {/* Satu CTA Putih terpadu menuju 100+ Model Picker Gateway */}
            {filteredModels.length > 0 && (
              <div className="catalog-pagination-wrap" data-reveal="fade-up">
                <div className="cpe-actions-row">
                  <a
                    href="https://api.tokotokenai.com/model-picker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cpe-btn-white"
                    aria-label="Tampilkan 100+ model AI lainnya di api.tokotokenai.com/model-picker"
                  >
                    <span>Tampilkan 100+ Model Lainnya</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Catalog Suggestions Strip when only 1 or 2 models match current filter */}
            {filteredModels.length > 0 && filteredModels.length <= 2 && (
              <div className="catalog-suggestions-strip" data-reveal="fade-up">
                <div className="css-left">
                  <span className="css-sparkle">✦</span>
                  <span>
                    Menampilkan <b>{filteredModels.length} model</b> untuk filter ini. Ingin melihat lebih banyak pilihan?
                  </span>
                </div>
                <div className="css-actions">
                  {selectedProvider !== "all" && (
                    <button
                      type="button"
                      className="css-pill-btn"
                      onClick={() => setSelectedProvider("all")}
                    >
                      Buka Semua Provider ({models.length}) ↗
                    </button>
                  )}
                  {activeCategory !== "Semua" && (
                    <button
                      type="button"
                      className="css-pill-btn"
                      onClick={() => setActiveCategory("Semua")}
                    >
                      Buka Semua Kategori ({models.length}) ↗
                    </button>
                  )}
                  <button
                    type="button"
                    className="css-pill-btn-outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedProvider("all");
                      setActiveCategory("Semua");
                      setViewSavedOnly(false);
                    }}
                  >
                    Reset Filter ✕
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 6. Paket Prabayar Ritel (Hanya tampil bila flag ENABLE_CHECKOUT aktif) */}
          {ENABLE_CHECKOUT && (
          <>
          <section className="catalog" id="katalog-retail">
            {/* 6. Paket Prabayar Ritel Mahasiswa - DPSBuddy Style */}
            <div className="dps-banner-card" data-reveal="scale">
              {/* Left Column: Heading & Primary Action */}
              <div className="dps-banner-left">
                <div className="dps-pill-header">
                  <span className="dps-pill-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </span>
                  <span className="dps-pill-title">Paket Ritel &amp; Bisnis</span>
                  <span className="dps-pill-badge blue">PRABAYAR</span>
                  <span className="dps-pill-sub">Mulai Rp 15.000</span>
                </div>

                <h2 className="dps-banner-title">
                  Satu saldo prabayar,{" "}
                  <span className="hero-gradient-text">bebas semua AI</span>.
                </h2>

                <p className="dps-banner-desc">
                  Untuk siapa saja, mulai dari pemilik usaha, profesional, hingga developer. Kami siapkan saldo prabayar fleksibel mulai Rp 15.000 tanpa kartu kredit — langsung siap pakai untuk operasional bisnis, analisis data, koding Cursor, dan asisten kerja harian.
                </p>

                <div className="dps-action-row">
                  <button
                    type="button"
                    className="dps-btn-primary"
                    onClick={() => {
                      const el = document.querySelector(".retail-packages-grid");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Pilih Paket Sekarang</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <span className="dps-meta-text">
                    <span>QRIS Instan</span>
                    <span className="dps-meta-dot">·</span>
                    <span>Saldo No Expiry</span>
                    <span className="dps-meta-dot">·</span>
                    <span>Garansi 100%</span>
                  </span>
                </div>
              </div>

              {/* Right Column: DPSBuddy Comparison Stack */}
              <div className="dps-banner-right">
                <div className="dps-compare-card">
                  <div className="dps-card-kicker">
                    <span className="dps-card-dot gray" aria-hidden="true" />
                    <span>LANGGANAN AI BIASA</span>
                  </div>
                  <p className="dps-card-body">
                    Wajib bayar $20/bln (Rp 330.000) per provider, wajib kartu kredit luar negeri, dan kuota sisa hangus tiap akhir bulan.
                  </p>
                </div>

                <div className="dps-compare-card highlight">
                  <div className="dps-card-kicker">
                    <span className="dps-card-dot blue" aria-hidden="true" />
                    <span>JURAGAN TOKEN PRABAYAR</span>
                  </div>
                  <p className="dps-card-body">
                    Cukup isi Rp 15.000 via QRIS. 1 saldo untuk semua model AI (Claude, GPT, DeepSeek). Saldo aktif selamanya tanpa kedaluwarsa.
                  </p>
                </div>
              </div>
            </div>

            <div className="retail-packages-grid">
              {retailPackages.map((pkg, index) => (
                <article
                  key={pkg.id}
                  className={`package-card ${pkg.featured ? "featured" : ""}`}
                  data-reveal="fade-up"
                  data-delay={Math.min(index * 80, 240)}
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
                      setCheckoutModel(null);
                      setCheckoutInitialMode("new");
                      setCheckoutInitialKey("");
                      setPaymentModalOpen(true);
                    }}
                  >
                    Beli Paket ↗
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* 7. Bundle Banner (Pola ai-vouchers.com) */}
          <section className="bundle-banner" data-reveal="scale">
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
          </>
          )}

          {/* 7. Skenario Penerapan Nyata per Segmen Tim */}
          <UseCasesGrid
            onSelectCategory={(cat) => {
              setViewSavedOnly(false);
              setSelectedProvider("all");
              setActiveCategory(cat);
              scrollToCatalog();
            }}
          />

          {/* 8. Why Choose Juragantoken & Neutral Integration Comparison */}
          <WhyChooseUs />

          {/* 8. Setup Guides Section */}
          <SetupGuides />

          {/* 9. FAQ Section */}
          <section className="faq-section" id="faq" aria-labelledby="faq-heading">
            <div data-reveal="fade-up">
              <div className="section-kicker">JURAGANTOKEN</div>
              <h2 id="faq-heading">Pertanyaan Umum (FAQ)</h2>
              <p className="faq-section-lead">
                Informasi lengkap mengenai arsitektur gateway, pemilihan model AI sesuai keahlian, kompatibilitas aplikasi, dan keamanan data.
              </p>
            </div>

            <div className="faq-grid">
              <details className="faq-card" open data-reveal="fade-up" data-delay="0">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Multi-AI Gateway</span>
                    <h3 className="faq-question">Apakah 1 Virtual API Key bisa dipakai bergantian untuk Claude, ChatGPT, Gemini, DeepSeek, dan Qwen?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Bisa! Juragantoken menggunakan arsitektur Unified Multi-AI Gateway.</b>
                  </p>
                  <p>
                    Anda cukup memasang satu Base URL (<code>https://api.tokotokenai.com/v1</code>) dan satu Virtual API Key (<code>jt-live-...</code>). Untuk berpindah dari Claude Opus 5.5 ke Chat GPT 6 Astra, Gemini 4 Argon, atau DeepSeek V4, Anda hanya perlu mengubah nilai parameter <code>model</code> pada request tanpa mengganti SDK maupun konfigurasi autentikasi.
                  </p>
                </div>
              </details>

              <details className="faq-card" data-reveal="fade-up" data-delay="80">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Pemilihan Model</span>
                    <h3 className="faq-question">Model AI mana yang paling cocok untuk Ngoding, Riset, dan Efisiensi Biaya?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Berikut rekomendasi kurasi berdasarkan beban kerja:</b>
                  </p>
                  <p>
                    • <b>Ngoding &amp; Arsitektur Sistem:</b> Gunakan <b>Claude Opus 5.5</b>, <b>Chat GPT 6 Astra</b>, atau <b>Gemini 4 Argon</b> (serta <b>Claude Sonnet 5.5</b> untuk coding harian).<br />
                    • <b>Riset &amp; Penalaran Mendalam:</b> Gunakan <b>GPT-6 Sol</b>, <b>GPT-5.6 Terra</b>, <b>GPT-6 Luna</b>, atau <b>DeepSeek V4 Pro</b>.<br />
                    • <b>Operasional Cepat &amp; Hemat Biaya:</b> Gunakan <b>DeepSeek V4 Flash</b>, <b>DeepSeek V3 Chat</b>, <b>Qwen 3.7 Max</b>, <b>Qwen 3.6 Flash</b>, atau model ekosistem Asia lainnya seperti <b>GLM 5.3 Flash</b> dan <b>Kimi</b>.
                  </p>
                </div>
              </details>

              <details className="faq-card" data-reveal="fade-up" data-delay="0">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Kompatibilitas</span>
                    <h3 className="faq-question">Aplikasi dan bahasa pemrograman apa saja yang didukung?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>100% kompatibel dengan ekosistem standar OpenAI API &amp; Anthropic CLI.</b>
                  </p>
                  <p>
                    Endpoint Juragantoken bekerja langsung di code editor modern (<b>Cursor IDE, Windsurf, VS Code Cline/Continue</b>), terminal <b>Claude Code CLI</b>, aplikasi desktop/mobile (<b>Chatbox, NextChat</b>), serta SDK resmi <code>openai</code> di Python, Node.js/TypeScript, Go, dan cURL.
                  </p>
                </div>
              </details>

              <details className="faq-card" data-reveal="fade-up" data-delay="80">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Masa Aktif</span>
                    <h3 className="faq-question">Apakah kuota pada Virtual API Key memiliki batas kedaluwarsa bulanan?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Tidak ada sistem hangus bulanan.</b>
                  </p>
                  <p>
                    Kuota pada Virtual API Key tetap tersimpan aman dan hanya terpakai ketika aplikasi atau tim Anda mengirimkan request inferensi ke model AI yang dipilih.
                  </p>
                </div>
              </details>

              <details className="faq-card" data-reveal="fade-up" data-delay="0">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Monitoring</span>
                    <h3 className="faq-question">Bagaimana cara memantau status kunci dan riwayat pemakaian model?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Transparan secara real-time.</b>
                  </p>
                  <p>
                    Klik tombol <b>Cek Saldo Key ↗</b> di bagian atas halaman ini dan masukkan kode Virtual API Key Anda (<code>jt-live-...</code>) untuk melihat status aktif serta rincian 10 pemakaian model terakhir secara instan.
                  </p>
                </div>
              </details>

              <details className="faq-card" data-reveal="fade-up" data-delay="80">
                <summary className="faq-summary">
                  <div className="faq-summary-content">
                    <span className="faq-badge">Privasi &amp; Keamanan</span>
                    <h3 className="faq-question">Bagaimana perlindungan privasi kode sumber dan dokumen riset kami?</h3>
                  </div>
                  <span className="faq-chevron" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>
                    <b>Arsitektur Zero-Knowledge &amp; Zero-Training.</b>
                  </p>
                  <p>
                    Kunci akses disimpan menggunakan hashing satu arah SHA-256 dan seluruh trafik dienkripsi melalui TLS. Gateway hanya meneruskan request inferensi secara langsung tanpa menyimpan isi percakapan atau menggunakan kode Anda untuk melatih model AI.
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

          {/* 10. Final CTA Banner Penutup Sebelum Footer */}
          <PreFooterCta onOpenBalanceModal={() => setBalanceModalOpen(true)} />

        </main>
      </div>

      {/* 11. Footer Global Multi-Kolom Profesional (Full Width) */}
      <footer className="site-pro-footer" data-reveal="fade-in">
        <div className="spf-container">
          <div className="spf-main-grid">
            {/* Kolom 1: Brand & Profil Platform */}
            <div className="spf-col spf-col-brand">
              <a className="footer-brand" href="#top" aria-label="Juragantoken Beranda">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-juragantoken-tight.png"
                  alt="Juragantoken — One Gateway. Every Intelligence."
                  className="footer-logo-img"
                  width={175}
                  height={34}
                />
              </a>
              <p className="spf-desc">
                Gerbang API AI terpadu di Indonesia. Akses model frontier Claude Opus 5.5, Chat GPT 6 Astra, Gemini 4 Argon, DeepSeek V4, dan Qwen melalui satu integrasi OpenAI-compatible.
              </p>
              <div className="spf-meta-info">
                One Gateway. Every Intelligence. • SLA Uptime 99.98%
              </div>
              <Link href="/status" className="spf-live-status">
                <span className="spf-live-dot" aria-hidden="true" />
                <span>Semua Sistem Operasional</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            {/* Kolom 2: Produk & Layanan */}
            <div className="spf-col">
              <div className="spf-col-heading">Platform &amp; Model</div>
              <ul className="spf-links">
                <li>
                  <a href="#keahlian-model">Rekomendasi Keahlian AI</a>
                </li>
                <li>
                  <a href="#cara-kerja">Cara Kerja Gateway</a>
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
              &copy; 2026 Juragantoken Indonesia. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div className="spf-bottom-meta">
              <span>Zero-Training Guarantee</span>
              <span className="spf-sep">•</span>
              <span>Enkripsi Transit TLS 1.3</span>
              <span className="spf-sep">•</span>
              <span>OpenAI-Compatible (/v1)</span>
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
        onSelectTopUp={
          ENABLE_CHECKOUT
            ? (model) => {
                handleBuyTokenForModel(model);
              }
            : undefined
        }
      />

      {/* Payment Checkout Modal (Disembunyikan saat ENABLE_CHECKOUT = false, kode tetap utuh) */}
      {ENABLE_CHECKOUT && (
        <PaymentModal
          open={paymentModalOpen}
          pkg={selectedPackage}
          model={checkoutModel}
          initialMode={checkoutInitialMode}
          initialTargetKey={checkoutInitialKey}
          onClose={() => {
            setPaymentModalOpen(false);
            setCheckoutInitialMode("new");
            setCheckoutInitialKey("");
          }}
        />
      )}

      {/* Token Balance Modal */}
      <TokenBalanceModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        onTopUp={
          ENABLE_CHECKOUT
            ? (key) => {
                setBalanceModalOpen(false);
                setSelectedPackage(retailPackages[1]);
                setCheckoutModel(null);
                setCheckoutInitialMode("topup");
                setCheckoutInitialKey(key || "");
                setPaymentModalOpen(true);
              }
            : undefined
        }
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

      {/* Tombol Kembali ke Atas (muncul saat scroll melewati Hero) */}
      <BackToTop />
    </div>
  );
}
