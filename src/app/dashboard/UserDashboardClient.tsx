"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Order, UserProfile } from "@/lib/store";
import type { EnrichedKey } from "@/lib/admin-service";
import { GATEWAY_BASE_URL, GATEWAY_ORIGIN, modelsCatalog } from "@/data/catalog";
import { ProofUploadDropzone } from "@/components/portal/ProofUploadDropzone";
import { InvoiceDocument } from "@/components/portal/InvoiceDocument";

const POPULAR_MODEL_IDS = [
  "claude-fable-5-2",
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "gpt-6.2-astra",
  "gpt-6.1-sol",
  "gemini-4-carbon",
  "gemini-3.8-flash",
  "deepseek-v4.1-flash",
  "kimi-k3",
  "qwen3-coder-3.8-27b",
];

const POPULAR_MODELS = POPULAR_MODEL_IDS.map((id) =>
  modelsCatalog.find((m) => m.id === id)
).filter((m): m is (typeof modelsCatalog)[number] => Boolean(m));

const OTHER_MODELS = modelsCatalog.filter((m) => !POPULAR_MODEL_IDS.includes(m.id));

const formatModelNote = (modelId: string) => {
  if (!modelId) return "";
  const found = modelsCatalog.find((m) => m.id === modelId);
  return found
    ? `Aktivasi model ${found.name} (${found.id}) & Universal AI Gateway`
    : `Aktivasi model ${modelId} & Universal AI Gateway`;
};

const extractModelIdFromNote = (noteText?: string) => {
  if (!noteText) return "claude-opus-5-5";
  const match = noteText.match(/\(([a-z0-9._-]+)\)/i);
  if (match) {
    const found = modelsCatalog.find((m) => m.id === match[1]);
    if (found) return found.id;
  }
  return "claude-opus-5-5";
};

type PaymentDestination = {
  title: string;
  channel: string;
  codeLabel: string;
  codeValue: string;
  beneficiary: string;
  hint: string;
  isQris?: boolean;
};

const resolvePaymentDestination = (methodName: string): PaymentDestination => {
  switch (methodName) {
    case "BCA Virtual Account":
      return {
        title: "Transfer BCA Virtual Account",
        channel: "Bank Central Asia (BCA · Kode 014)",
        codeLabel: "No. Rekening / VA BCA",
        codeValue: "869088123990",
        beneficiary: "PT Rejeki Digital Cemerlang",
        hint: "Transfer sesuai nominal ke rekening BCA resmi di atas, lalu unggah screenshot (SS) bukti berhasil.",
      };
    case "Mandiri Virtual Account":
      return {
        title: "Transfer Mandiri Virtual Account",
        channel: "Bank Mandiri (Kode 008)",
        codeLabel: "No. Rekening / VA Mandiri",
        codeValue: "1240098812390",
        beneficiary: "PT Rejeki Digital Cemerlang",
        hint: "Transfer melalui Livin' by Mandiri atau ATM sesuai nominal tepat, lalu lampirkan SS bukti berhasil.",
      };
    case "Transfer Bank":
      return {
        title: "Transfer Bank (BI-FAST / Antar-Bank)",
        channel: "Bank BCA Corporate (Kode 014)",
        codeLabel: "Nomor Rekening Resmi",
        codeValue: "869088123990",
        beneficiary: "PT Rejeki Digital Cemerlang",
        hint: "Dukung transfer dari semua bank nasional via BI-FAST. Cantumkan nomor referensi & unggah SS transfer.",
      };
    case "Invoice B2B & Transfer PT (IDR)":
      return {
        title: "Pembayaran Invoice B2B Korporat",
        channel: "BCA Corporate (014) · Faktur Pajak Resmi",
        codeLabel: "Rekening Giro Perusahaan",
        codeValue: "869088123990",
        beneficiary: "PT Rejeki Digital Cemerlang",
        hint: "Anda dapat mengajukan pesanan terlebih dahulu untuk mencetak Invoice B2B resmi, lalu mengunggah bukti transfer PT menyusul.",
      };
    case "QRIS Instan":
    default:
      return {
        title: "Scan / Bayar via QRIS Nasional",
        channel: "Mendukung BCA, Mandiri, GoPay, OVO, DANA & ShopeePay",
        codeLabel: "NMID Merchant Resmi",
        codeValue: "ID2026081226983990",
        beneficiary: "PT Rejeki Digital Cemerlang",
        hint: "Pastikan nama merchant tampil sebagai PT Rejeki Digital Cemerlang dan transfer sesuai nominal tepat, lalu unggah SS pembayaran.",
        isQris: true,
      };
  }
};

function QrisPreviewMark() {
  return (
    <div className="usr-qris-graphic" aria-label="QRIS Merchant PT Rejeki Digital Cemerlang">
      <svg viewBox="0 0 64 64" width="58" height="58" role="img" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="8" y="8" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="3" />
        <rect x="13" y="13" width="6" height="6" fill="#0f172a" />
        <rect x="40" y="8" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="3" />
        <rect x="45" y="13" width="6" height="6" fill="#0f172a" />
        <rect x="8" y="40" width="16" height="16" rx="2" fill="none" stroke="#0f172a" strokeWidth="3" />
        <rect x="13" y="45" width="6" height="6" fill="#0f172a" />
        <rect x="29" y="9" width="5" height="5" fill="#1d63dc" />
        <rect x="29" y="18" width="5" height="6" fill="#0f172a" />
        <rect x="9" y="29" width="6" height="5" fill="#0f172a" />
        <rect x="19" y="29" width="8" height="6" fill="#1d63dc" />
        <rect x="31" y="29" width="6" height="6" fill="#0f172a" />
        <rect x="41" y="29" width="15" height="5" fill="#0f172a" />
        <rect x="29" y="40" width="6" height="6" fill="#0f172a" />
        <rect x="39" y="39" width="6" height="6" fill="#1d63dc" />
        <rect x="49" y="40" width="7" height="7" fill="#0f172a" />
        <rect x="29" y="50" width="9" height="6" fill="#0f172a" />
        <rect x="43" y="50" width="13" height="6" fill="#1d63dc" />
      </svg>
      <span>QRIS</span>
    </div>
  );
}

function PaymentDestinationBox({
  methodName,
  amountIdr,
  copiedTag,
  onCopy,
}: {
  methodName: string;
  amountIdr: number;
  copiedTag: string | null;
  onCopy: (tag: string, value: string) => void;
}) {
  const dest = resolvePaymentDestination(methodName);
  const safeAmount = Math.max(0, Math.round(amountIdr || 0));

  return (
    <div className="usr-pay-dest-card" role="region" aria-label="Tujuan Pembayaran Resmi">
      <div className="usr-pay-dest-top">
        {dest.isQris && <QrisPreviewMark />}
        <div className="usr-pay-dest-head">
          <span className="usr-pay-dest-kicker">TUJUAN PEMBAYARAN RESMI</span>
          <strong>{dest.title}</strong>
          <small>{dest.channel}</small>
        </div>
      </div>

      <div className="usr-pay-dest-grid">
        <div className="usr-pay-dest-item">
          <span className="usr-pay-item-label">Atas Nama</span>
          <strong className="usr-pay-item-val">{dest.beneficiary}</strong>
        </div>

        <div className="usr-pay-dest-item">
          <span className="usr-pay-item-label">{dest.codeLabel}</span>
          <div className="usr-pay-copy-inline">
            <code className="usr-pay-code">{dest.codeValue}</code>
            <button
              type="button"
              className="usr-mini-copy-btn"
              onClick={() => onCopy("pay-code", dest.codeValue)}
            >
              {copiedTag === "pay-code" ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
        </div>

        <div className="usr-pay-dest-item">
          <span className="usr-pay-item-label">Nominal Transfer</span>
          <div className="usr-pay-copy-inline">
            <strong className="usr-pay-amount">{formatIdr(safeAmount)}</strong>
            <button
              type="button"
              className="usr-mini-copy-btn"
              onClick={() => onCopy("pay-amount", String(safeAmount))}
            >
              {copiedTag === "pay-amount" ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
        </div>
      </div>

      <p className="usr-pay-dest-hint">{dest.hint}</p>
    </div>
  );
}

function QuickStartIntegrationPanel({
  scopeId,
  apiKeyText,
  modelId,
  onModelChange,
  copiedTag,
  onCopy,
}: {
  scopeId: string;
  apiKeyText: string;
  modelId: string;
  onModelChange: (nextModelId: string) => void;
  copiedTag: string | null;
  onCopy: (tag: string, value: string) => void;
}) {
  const selected = modelsCatalog.find((m) => m.id === modelId) ?? modelsCatalog[0];
  const supportsAnthropic = selected?.endpoints.includes("anthropic");
  const cliSnippet = supportsAnthropic
    ? `ANTHROPIC_BASE_URL=${GATEWAY_ORIGIN} ANTHROPIC_API_KEY=${apiKeyText} claude --model ${modelId}`
    : `curl ${GATEWAY_BASE_URL}/chat/completions -H "Authorization: Bearer ${apiKeyText}" -d '{"model":"${modelId}","messages":[{"role":"user","content":"Halo"}]}'`;

  return (
    <div className="usr-guide-panel">
      <div className="usr-guide-model-row">
        <label htmlFor={`guide-model-${scopeId}`}>Pilih Model Target (Semua Model Aktif di 1 Key Ini):</label>
        <select
          id={`guide-model-${scopeId}`}
          className="jt-select"
          value={modelId}
          onChange={(e) => onModelChange(e.target.value)}
        >
          <optgroup label="Model Populer">
            {POPULAR_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </optgroup>
          <optgroup label="Seluruh Model Katalog">
            {OTHER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="usr-guide-fields">
        <div className="usr-guide-field">
          <span className="usr-guide-label">1. Base URL (Cursor / Chatbox / OpenAI SDK)</span>
          <div className="usr-guide-code-row">
            <code>{GATEWAY_BASE_URL}</code>
            <button
              type="button"
              className="usr-mini-copy-btn"
              onClick={() => onCopy(`${scopeId}-url`, GATEWAY_BASE_URL)}
            >
              {copiedTag === `${scopeId}-url` ? "Tersalin ✓" : "Salin URL"}
            </button>
          </div>
        </div>

        <div className="usr-guide-field">
          <span className="usr-guide-label">2. Model ID</span>
          <div className="usr-guide-code-row">
            <code>{modelId}</code>
            <button
              type="button"
              className="usr-mini-copy-btn"
              onClick={() => onCopy(`${scopeId}-model`, modelId)}
            >
              {copiedTag === `${scopeId}-model` ? "Tersalin ✓" : "Salin Model"}
            </button>
          </div>
        </div>

        <div className="usr-guide-field">
          <span className="usr-guide-label">
            3. {supportsAnthropic ? "Perintah Terminal (Claude Code CLI)" : "Contoh Request API"}
          </span>
          <div className="usr-guide-code-row">
            <code className="is-wrap">{cliSnippet}</code>
            <button
              type="button"
              className="usr-mini-copy-btn"
              onClick={() => onCopy(`${scopeId}-cli`, cliSnippet)}
            >
              {copiedTag === `${scopeId}-cli` ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type DashboardData = {
  user: UserProfile;
  stats: {
    activeKeysCount: number;
    totalKeysCount: number;
    totalBalanceIdr: number;
    totalOrdersCount: number;
    pendingOrdersCount: number;
  };
  keys: EnrichedKey[];
  orders: Order[];
};

const formatIdr = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const getUserInitials = (fullName?: string) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export function UserDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeNav, setActiveNav] = useState<"overview" | "keys" | "orders">("overview");
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const [orderOpen, setOrderOpen] = useState(false);
  const [targetModelId, setTargetModelId] = useState("");
  const [accountTier, setAccountTier] = useState<"standard" | "enterprise">("standard");
  const [targetKeyHash, setTargetKeyHash] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("");
  const [requiresTaxInvoice, setRequiresTaxInvoice] = useState(false);
  const [npwp, setNpwp] = useState("");
  const [amount, setAmount] = useState("50000");
  const [methodName, setMethodName] = useState("QRIS Instan");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [proofUrl, setProofUrl] = useState<string | undefined>(undefined);
  const [proofName, setProofName] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const [dismissingOrderId, setDismissingOrderId] = useState<string | null>(null);
  const [revealPreviewModels, setRevealPreviewModels] = useState<Record<string, string>>({});
  const [guideKey, setGuideKey] = useState<EnrichedKey | null>(null);
  const [guideModelId, setGuideModelId] = useState("claude-opus-5-5");

  const [inspectOrderId, setInspectOrderId] = useState<string | null>(null);
  const [modalProofUrl, setModalProofUrl] = useState<string | undefined>(undefined);
  const [modalProofName, setModalProofName] = useState<string | undefined>(undefined);
  const [modalRef, setModalRef] = useState("");
  const [savingProof, setSavingProof] = useState(false);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4500);
  }, []);

  const handleCopy = useCallback(
    async (tag: string, value: string, toastMessage?: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedTag(tag);
        if (copyTimerRef.current !== null) {
          window.clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = window.setTimeout(() => {
          setCopiedTag(null);
          copyTimerRef.current = null;
        }, 2000);
        if (toastMessage) {
          showToast("success", toastMessage);
        }
      } catch {
        showToast("error", "Gagal menyalin ke clipboard.");
      }
    },
    [showToast]
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const loadData = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (opts?.manual) {
        setRefreshing(true);
      }
      try {
        const res = await fetch(`/api/user/dashboard?_ts=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (res.status === 401) {
          window.location.replace("/login?next=/dashboard");
          return;
        }
        if (!res.ok) {
          throw new Error("Gagal memuat portal akun.");
        }
        const json = await res.json();
        if (json.success) {
          setData(json);
          if (opts?.manual) {
            showToast("success", "Data portal akun berhasil diperbarui.");
          }
        } else {
          showToast("error", json.error || "Gagal memuat ulang data portal akun.");
        }
      } catch {
        showToast("error", "Gagal memuat ulang data portal akun.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get("order");
      const modelParam = params.get("model")?.trim() || "";
      const tierParam = params.get("tier")?.trim() || "";

      if (modelParam) {
        const matched = modelsCatalog.find((m) => m.id === modelParam);
        const resolvedId = matched ? matched.id : modelParam;
        setTargetModelId(resolvedId);
        setNote(formatModelNote(resolvedId));
        setOrderOpen(true);
      }

      if (tierParam === "enterprise") {
        setAccountTier("enterprise");
        setMethodName("Invoice B2B & Transfer PT (IDR)");
        setAmount("500000");
        setOrderOpen(true);
      } else if (tierParam === "standard") {
        setAccountTier("standard");
        setMethodName("QRIS Instan");
        setAmount("50000");
        setOrderOpen(true);
      }

      if (orderParam === "1") {
        setOrderOpen(true);
      }

      if (orderParam || modelParam || tierParam) {
        window.history.replaceState({}, "", "/dashboard");
      }

      void loadData();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (guideKey) setGuideKey(null);
        else if (inspectOrderId) setInspectOrderId(null);
        else if (orderOpen) setOrderOpen(false);
        else if (mobileNavOpen) setMobileNavOpen(false);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [guideKey, inspectOrderId, orderOpen, mobileNavOpen]);

  const scrollToSection = (section: "overview" | "keys" | "orders") => {
    setActiveNav(section);
    setMobileNavOpen(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (section === "overview") {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      return;
    }
    const idMap = {
      keys: "portal-keys",
      orders: "portal-orders",
    };
    const el = document.getElementById(idMap[section]);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      }).catch(() => undefined);
    } finally {
      window.location.replace("/");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const effectiveNote = note.trim() || (targetModelId ? formatModelNote(targetModelId) : "");
      const res = await fetch("/api/user/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseIdr: Number(amount),
          methodName,
          customerPhone: phone,
          note: effectiveNote,
          accountTier,
          companyName: accountTier === "enterprise" ? companyName : undefined,
          department: accountTier === "enterprise" ? department : undefined,
          requiresTaxInvoice: accountTier === "enterprise" ? requiresTaxInvoice : false,
          npwp: accountTier === "enterprise" && requiresTaxInvoice ? npwp : undefined,
          targetKeyHash: targetKeyHash || undefined,
          paymentProofUrl: proofUrl,
          paymentProofName: proofName,
          paymentReference: paymentRef,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast("error", json.error || "Gagal membuat permintaan pesanan.");
        return;
      }
      setOrderOpen(false);
      setNote("");
      setPaymentRef("");
      setProofUrl(undefined);
      setProofName(undefined);
      showToast(
        "success",
        `Pesanan ${json.order.id} berhasil diajukan dan masuk ke antrean verifikasi Admin.`
      );
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissReveal = async (orderId: string) => {
    setDismissingOrderId(orderId);
    try {
      const res = await fetch("/api/user/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dismiss_reveal",
          orderId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast("error", json.error || "Gagal mengonfirmasi penyimpanan API Key.");
        return;
      }
      showToast("success", "API Key telah dikonfirmasi tersimpan dan disembunyikan demi keamanan.");
      await loadData();
    } finally {
      setDismissingOrderId(null);
    }
  };

  const inspectedOrder = inspectOrderId
    ? data?.orders.find((o) => o.id === inspectOrderId) ?? null
    : null;

  const openOrderModal = (ord: Order) => {
    setInspectOrderId(ord.id);
    setModalProofUrl(ord.paymentProofUrl);
    setModalProofName(ord.paymentProofName);
    setModalRef(ord.paymentReference || "");
  };

  const handleUploadExistingProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedOrder || !modalProofUrl) return;
    setSavingProof(true);
    try {
      const res = await fetch("/api/user/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: inspectedOrder.id,
          paymentProofUrl: modalProofUrl,
          paymentProofName: modalProofName,
          paymentReference: modalRef,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast("error", json.error || "Gagal mengunggah bukti pembayaran.");
        return;
      }
      showToast(
        "success",
        `Bukti transaksi untuk ${inspectedOrder.id} berhasil dikirim ke Admin.`
      );
      await loadData();
    } finally {
      setSavingProof(false);
    }
  };

  if (loading || !data) {
    return <div className="jt-auth-shell">Memuat Portal Akun Anda...</div>;
  }

  const userInitials = getUserInitials(data.user.fullName);

  return (
    <div>
      <div className={`usr-nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
        <header className="usr-navbar">
          <div className="usr-nav-brand-group">
            <Link href="/" className="usr-nav-brand" aria-label="Juragantoken Beranda">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-mark.png" alt="" width={26} height={22} />
              <span className="usr-nav-brand-text">
                juragan<span>token.</span>
              </span>
            </Link>
            <span className="usr-nav-sep" aria-hidden="true" />
            <span className="usr-portal-chip">Portal</span>
          </div>

          <nav className="usr-nav-center" aria-label="Navigasi Portal">
            <div className="usr-nav-track">
              <button
                type="button"
                className={`usr-nav-pill ${activeNav === "overview" ? "is-active" : ""}`}
                onClick={() => scrollToSection("overview")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Ringkasan</span>
              </button>
              <button
                type="button"
                className={`usr-nav-pill ${activeNav === "keys" ? "is-active" : ""}`}
                onClick={() => scrollToSection("keys")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                <span>API Key</span>
              </button>
              <button
                type="button"
                className={`usr-nav-pill ${activeNav === "orders" ? "is-active" : ""}`}
                onClick={() => scrollToSection("orders")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
                <span>Pesanan</span>
              </button>
            </div>
          </nav>

          <div className="usr-nav-right">
            {data.user.role === "admin" && (
              <Link href="/admin" prefetch={false} className="usr-nav-admin-pill">
                Admin Panel
              </Link>
            )}
            <Link href="/docs" className="usr-nav-util">
              Panduan API
            </Link>
            <Link href="/" className="usr-nav-util">
              Beranda
            </Link>
            <span className="usr-nav-sep is-desktop-only" aria-hidden="true" />
            <span
              className="usr-avatar-badge"
              title={data.user.fullName || "Pengguna"}
              aria-label={data.user.fullName || "Pengguna"}
            >
              {userInitials}
            </span>
            <button
              type="button"
              className="usr-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
            <button
              type="button"
              className="usr-mobile-toggle"
              aria-label={mobileNavOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileNavOpen}
              aria-controls="usr-mobile-drawer"
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              {mobileNavOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <div id="usr-mobile-drawer" className="usr-mobile-drawer" role="region" aria-label="Menu Navigasi Portal">
            <button
              type="button"
              className={`usr-drawer-item ${activeNav === "overview" ? "is-active" : ""}`}
              onClick={() => scrollToSection("overview")}
            >
              <span>Ringkasan</span>
            </button>
            <button
              type="button"
              className={`usr-drawer-item ${activeNav === "keys" ? "is-active" : ""}`}
              onClick={() => scrollToSection("keys")}
            >
              <span>API Key ({data.keys.length})</span>
            </button>
            <button
              type="button"
              className={`usr-drawer-item ${activeNav === "orders" ? "is-active" : ""}`}
              onClick={() => scrollToSection("orders")}
            >
              <span>Pesanan ({data.orders.length})</span>
            </button>
            <div className="usr-drawer-sep" />
            {data.user.role === "admin" && (
              <Link
                href="/admin"
                prefetch={false}
                className="usr-drawer-item is-active"
                onClick={() => setMobileNavOpen(false)}
              >
                <span>Buka Admin Panel</span>
                <span>↗</span>
              </Link>
            )}
            <Link href="/docs" className="usr-drawer-item" onClick={() => setMobileNavOpen(false)}>
              <span>Panduan API</span>
              <span>↗</span>
            </Link>
            <Link href="/" className="usr-drawer-item" onClick={() => setMobileNavOpen(false)}>
              <span>Beranda</span>
              <span>↗</span>
            </Link>
            <div className="usr-drawer-sep" />
            <button
              type="button"
              className="usr-drawer-item is-danger"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
            </button>
          </div>
        )}
      </div>

      <main className="jt-user-container">
        {toast && (
          <div className={`jt-alert ${toast.type}`} role="status">
            {toast.text}
          </div>
        )}

        <div className="jt-page-head">
          <div>
            <h1>Halo, {data.user.fullName || "Pengguna"}</h1>
            <p>Kelola Universal API Key, pantau saldo kredit aktif, dan ajukan pesanan token dalam satu tempat.</p>
          </div>
          <div className="jt-head-actions">
            <button
              type="button"
              className="jt-btn-secondary-clean usr-refresh-btn"
              disabled={refreshing}
              aria-busy={refreshing}
              onClick={() => void loadData({ manual: true })}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={refreshing ? "usr-spin" : ""}
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              <span>{refreshing ? "Memuat ulang..." : "Muat Ulang"}</span>
            </button>
            <button
              type="button"
              className="jt-btn-primary-solid"
              onClick={() => setOrderOpen(true)}
            >
              + Ajukan Pesanan Token
            </button>
          </div>
        </div>

        <section id="portal-ringkasan" className="jt-kpi-grid cols-3 usr-section-anchor" aria-label="Ringkasan akun">
          <article className="jt-kpi-card usr-kpi-card">
            <div className="usr-kpi-head">
              <span className="jt-kpi-label">Total Saldo Aktif</span>
              <span className="usr-kpi-dot is-blue" aria-hidden="true" />
            </div>
            <strong className="jt-kpi-val">{formatIdr(data.stats.totalBalanceIdr)}</strong>
            <span className="jt-kpi-sub">Berlaku lintas 100+ model AI tanpa masa hangus</span>
          </article>
          <article className="jt-kpi-card usr-kpi-card">
            <div className="usr-kpi-head">
              <span className="jt-kpi-label">API Key Aktif</span>
              <span className="usr-kpi-dot is-green" aria-hidden="true" />
            </div>
            <strong className="jt-kpi-val">{data.stats.activeKeysCount}</strong>
            <span className="jt-kpi-sub">
              {data.stats.totalKeysCount > 0
                ? `dari ${data.stats.totalKeysCount} kunci terdaftar`
                : "Belum ada kunci yang aktif"}
            </span>
          </article>
          <article className="jt-kpi-card usr-kpi-card">
            <div className="usr-kpi-head">
              <span className="jt-kpi-label">Total Pesanan</span>
              <span
                className={`usr-kpi-dot ${data.stats.pendingOrdersCount > 0 ? "is-amber" : "is-slate"}`}
                aria-hidden="true"
              />
            </div>
            <strong className="jt-kpi-val">{data.stats.totalOrdersCount}</strong>
            <span className="jt-kpi-sub">
              {data.stats.pendingOrdersCount > 0
                ? `${data.stats.pendingOrdersCount} menunggu verifikasi admin`
                : data.stats.totalOrdersCount > 0
                ? "Seluruh pesanan telah diproses"
                : "Belum ada pesanan masuk"}
            </span>
          </article>
        </section>

        {/* Kartu One-Time Plaintext API Key Reveal (tampil setelah pesanan disetujui Admin) */}
        {data.orders
          .filter((o) => o.status === "paid" && Boolean(o.pendingReveal))
          .map((ord) => {
            const defaultModelId = extractModelIdFromNote(ord.adminNotes);
            const activePreviewModelId = revealPreviewModels[ord.id] || defaultModelId;
            const plaintext = ord.pendingReveal || "";
            return (
              <section
                key={ord.id}
                className="usr-reveal-card"
                aria-label={`API Key aktif untuk ${ord.id}`}
              >
                <div className="usr-reveal-head">
                  <div>
                    <div className="usr-reveal-badges">
                      <span className="usr-reveal-pill">SIAP DIGUNAKAN · TAMPIL SEKALI</span>
                      <span className="usr-invoice-pill">{ord.id}</span>
                    </div>
                    <h2>Universal API Key Anda Sudah Aktif!</h2>
                    <p>
                      Salin dan simpan API Key utuh di bawah ini. Kunci yang sama langsung berlaku untuk seluruh 100+ model AI di Gateway kami.
                    </p>
                  </div>
                </div>

                <div className="usr-reveal-keybox">
                  <code>{plaintext}</code>
                  <button
                    type="button"
                    className="jt-btn-primary-solid"
                    onClick={() =>
                      void handleCopy(
                        `reveal-${ord.id}`,
                        plaintext,
                        "Universal API Key utuh disalin ke clipboard."
                      )
                    }
                  >
                    {copiedTag === `reveal-${ord.id}` ? "Tersalin ✓" : "Salin API Key Utuh"}
                  </button>
                </div>

                <QuickStartIntegrationPanel
                  scopeId={ord.id}
                  apiKeyText={plaintext}
                  modelId={activePreviewModelId}
                  onModelChange={(nextId) =>
                    setRevealPreviewModels((prev) => ({ ...prev, [ord.id]: nextId }))
                  }
                  copiedTag={copiedTag}
                  onCopy={(tag, value) => void handleCopy(tag, value)}
                />

                <div className="usr-reveal-foot">
                  <span>
                    Demi keamanan akun, API Key utuh hanya ditampilkan satu kali di portal setelah pesanan disetujui.
                  </span>
                  <button
                    type="button"
                    className="jt-btn-primary-solid"
                    disabled={dismissingOrderId === ord.id}
                    onClick={() => void handleDismissReveal(ord.id)}
                  >
                    {dismissingOrderId === ord.id
                      ? "Menyimpan konfirmasi..."
                      : "Saya Sudah Simpan API Key Ini ✓"}
                  </button>
                </div>
              </section>
            );
          })}

        {/* Tabel API Key Terintegrasi */}
        <section id="portal-keys" className="jt-panel-card usr-section-anchor">
          <div className="jt-panel-card-head">
            <div>
              <div className="usr-card-title-row">
                <h2>Universal API Key</h2>
                <span className="usr-count-pill">{data.keys.length} kunci</span>
              </div>
              <span className="jt-cell-muted">
                Satu kunci untuk mengakses OpenAI, Claude, Gemini, DeepSeek, Qwen, dan ekosistem model AI lainnya.
              </span>
            </div>
            <Link href="/docs" className="jt-btn-secondary-clean">
              Panduan Integrasi ↗
            </Link>
          </div>
          {data.keys.length === 0 ? (
            <div className="usr-empty-state">
              <span className="usr-empty-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </span>
              <strong>Belum ada API Key aktif</strong>
              <p>
                Ajukan pesanan kredit Standard atau Enterprise B2B. Setelah pembayaran diverifikasi, Admin akan menerbitkan Universal API Key untuk akun Anda.
              </p>
              <button
                type="button"
                className="jt-btn-primary-solid"
                onClick={() => setOrderOpen(true)}
              >
                + Ajukan Pesanan Pertama
              </button>
            </div>
          ) : (
            <div className="jt-table-scroll">
              <table className="jt-table">
                <thead>
                  <tr>
                    <th>Universal API Key</th>
                    <th>Tier &amp; Label</th>
                    <th>IP Whitelist</th>
                    <th>Sisa Saldo</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th>Panduan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.keys.map((k) => (
                    <tr key={k.hash}>
                      <td>
                        <span className="usr-key-pill">{k.maskedKey}</span>
                      </td>
                      <td>
                        <div className="jt-cell-stack">
                          <span className="jt-cell-primary">
                            {k.accountTier === "enterprise" ? "Enterprise" : "Standard"} · {k.label || "Key Utama"}
                          </span>
                          <span className="jt-cell-muted">
                            {[k.companyName, k.department].filter(Boolean).join(" / ") || k.planName}
                          </span>
                        </div>
                      </td>
                      <td>
                        {k.allowedIps && k.allowedIps.length > 0 ? (
                          <span className="jt-status active">{k.allowedIps.length} IP Terdaftar</span>
                        ) : (
                          <span className="jt-cell-muted">Fleksibel (Semua IP)</span>
                        )}
                      </td>
                      <td className="jt-num">{formatIdr(k.balanceIdr)}</td>
                      <td>
                        <span className={`jt-status ${k.status}`}>
                          {k.status === "active"
                            ? "Aktif"
                            : k.status === "suspended"
                            ? "Suspended"
                            : "Revoked"}
                        </span>
                      </td>
                      <td className="jt-cell-muted">{formatDate(k.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="jt-btn-secondary-clean"
                          onClick={() => {
                            setGuideKey(k);
                            setGuideModelId(targetModelId || "claude-opus-5-5");
                          }}
                        >
                          Cara Pakai
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Riwayat Pesanan */}
        <section id="portal-orders" className="jt-panel-card usr-section-anchor">
          <div className="jt-panel-card-head">
            <div>
              <div className="usr-card-title-row">
                <h2>Riwayat Pesanan</h2>
                <span className="usr-count-pill">{data.orders.length} transaksi</span>
              </div>
              <span className="jt-cell-muted">
                Pantau status pembayaran, unggah bukti transfer (SS), dan cetak invoice resmi.
              </span>
            </div>
          </div>
          {data.orders.length === 0 ? (
            <div className="usr-empty-state">
              <span className="usr-empty-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
                  <path d="M9 8h6M9 12h6M9 16h4" />
                </svg>
              </span>
              <strong>Belum ada riwayat pesanan</strong>
              <p>
                Pesanan baru maupun top-up saldo yang Anda ajukan akan tercatat rapi beserta invoice resminya di sini.
              </p>
            </div>
          ) : (
            <div className="jt-table-scroll">
              <table className="jt-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Paket &amp; Metode</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Invoice &amp; Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span className="usr-invoice-pill">{ord.id}</span>
                      </td>
                      <td>
                        <div className="jt-cell-stack">
                          <span className="jt-cell-primary">{ord.packageName}</span>
                          <span className="jt-cell-muted">{ord.methodName}</span>
                        </div>
                      </td>
                      <td className="jt-num">{formatIdr(ord.totalIdr)}</td>
                      <td>
                        <span className={`jt-status ${ord.status}`}>
                          {ord.status === "paid"
                            ? "Lunas"
                            : ord.status === "pending"
                            ? "Menunggu Admin"
                            : "Expired"}
                        </span>
                      </td>
                      <td className="jt-cell-muted">{formatDate(ord.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="jt-btn-secondary-clean"
                          onClick={() => openOrderModal(ord)}
                        >
                          {ord.paymentProofUrl ? "Invoice & SS ✓" : "Invoice / Upload SS"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal Ajukan Pesanan Baru */}
      {orderOpen && (
        <div
          className="jt-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Ajukan Pesanan Token"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrderOpen(false);
          }}
        >
          <div className="jt-modal-dialog is-order">
            <div className="jt-modal-head">
              <h3>Ajukan Pesanan Kredit API AI</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setOrderOpen(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="jt-field">
                <label htmlFor="uo-model">Model AI Utama yang Ingin Digunakan</label>
                <select
                  id="uo-model"
                  className="jt-select"
                  value={targetModelId}
                  onChange={(e) => {
                    const nextModelId = e.target.value;
                    setTargetModelId(nextModelId);
                    if (!note.trim() || note.startsWith("Aktivasi model ")) {
                      setNote(formatModelNote(nextModelId));
                    }
                  }}
                >
                  <option value="">Semua 100+ Model AI (Claude, GPT, Gemini, DeepSeek)</option>
                  <optgroup label="Model Populer">
                    {POPULAR_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Semua Model Katalog">
                    {OTHER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="usr-universal-banner">
                <strong>1 Saldo Deposit = Akses Seluruh 100+ Model AI</strong>
                <p>
                  {targetModelId ? (
                    <>
                      Anda tidak perlu membeli saldo khusus per model. 1 Universal API Key (<code>jt-live-...</code>) dari pesanan ini langsung mengaktifkan{" "}
                      <b>{modelsCatalog.find((m) => m.id === targetModelId)?.name || targetModelId}</b>{" "}
                      (<code>{targetModelId}</code>) sekaligus Claude, GPT, Gemini, DeepSeek, dan Qwen.
                    </>
                  ) : (
                    <>
                      Anda cukup memiliki 1 Universal API Key (<code>jt-live-...</code>) dan 1 saldo kredit. Ganti model dari Claude Opus 5.5 ke GPT-6 Sol, Gemini, atau DeepSeek kapan saja cukup dengan mengganti parameter model.
                    </>
                  )}
                </p>
              </div>

              <div className="jt-field">
                <label htmlFor="uo-tier">Pilih Jalur Layanan</label>
                <select
                  id="uo-tier"
                  className="jt-select"
                  value={accountTier}
                  onChange={(e) => {
                    const next = e.target.value as "standard" | "enterprise";
                    setAccountTier(next);
                    if (next === "enterprise") {
                      setMethodName("Invoice B2B & Transfer PT (IDR)");
                      setAmount("500000");
                    } else {
                      setMethodName("QRIS Instan");
                      setAmount("50000");
                    }
                  }}
                >
                  <option value="standard">Standard (Developer / Mandiri — Fleksibel)</option>
                  <option value="enterprise">Enterprise B2B (PT Rejeki Digital Cemerlang · Faktur Pajak)</option>
                </select>
              </div>

              {data.keys.filter((k) => k.status === "active").length > 0 && (
                <div className="jt-field">
                  <label htmlFor="uo-target-key">Tujuan Pengisian</label>
                  <select
                    id="uo-target-key"
                    className="jt-select"
                    value={targetKeyHash}
                    onChange={(e) => setTargetKeyHash(e.target.value)}
                  >
                    <option value="">Terbitkan 1 Universal API Key Baru</option>
                    {data.keys
                      .filter((k) => k.status === "active")
                      .map((k) => (
                        <option key={k.hash} value={k.hash}>
                          Top-Up ke Key Eksisting ({k.maskedKey} · Saldo {formatIdr(k.balanceIdr)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {accountTier === "enterprise" && (
                <>
                  <div className="jt-form-row-2">
                    <div className="jt-field">
                      <label htmlFor="uo-company">Nama Perusahaan</label>
                      <input
                        id="uo-company"
                        type="text"
                        className="jt-input"
                        placeholder="PT Contoh Indonesia"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="jt-field">
                      <label htmlFor="uo-dept">Departemen</label>
                      <input
                        id="uo-dept"
                        type="text"
                        className="jt-input"
                        placeholder="IT / Engineering / Purchasing"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#334155", marginBottom: "10px" }}>
                    <input
                      type="checkbox"
                      checked={requiresTaxInvoice}
                      onChange={(e) => setRequiresTaxInvoice(e.target.checked)}
                    />
                    <span>Butuh Faktur Pajak Resmi (PT Rejeki Digital Cemerlang)</span>
                  </label>
                  {requiresTaxInvoice && (
                    <div className="jt-field">
                      <label htmlFor="uo-npwp">NPWP Perusahaan (Opsional)</label>
                      <input
                        id="uo-npwp"
                        type="text"
                        className="jt-input"
                        placeholder="00.000.000.0-000.000"
                        value={npwp}
                        onChange={(e) => setNpwp(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="usr-preset-row">
                {(accountTier === "enterprise" ? [250000, 500000, 1000000, 2500000] : [25000, 50000, 100000, 250000]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`jt-btn-secondary-clean usr-preset-btn ${Number(amount) === v ? "is-active" : ""}`}
                    onClick={() => setAmount(String(v))}
                  >
                    {formatIdr(v)}
                  </button>
                ))}
              </div>
              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="uo-amount">Nominal Kredit (IDR)</label>
                  <input
                    id="uo-amount"
                    type="number"
                    min={15000}
                    step={5000}
                    className="jt-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="jt-field">
                  <label htmlFor="uo-method">Metode Pembayaran</label>
                  <select
                    id="uo-method"
                    className="jt-select"
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                  >
                    <option value="QRIS Instan">QRIS Instan</option>
                    <option value="BCA Virtual Account">BCA Virtual Account</option>
                    <option value="Mandiri Virtual Account">Mandiri Virtual Account</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Invoice B2B & Transfer PT (IDR)">Invoice B2B &amp; Transfer PT (IDR)</option>
                  </select>
                </div>
              </div>

              <PaymentDestinationBox
                methodName={methodName}
                amountIdr={Number(amount) || 0}
                copiedTag={copiedTag}
                onCopy={(tag, value) => void handleCopy(tag, value)}
              />

              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="uo-phone">Nomor WhatsApp (Opsional)</label>
                  <input
                    id="uo-phone"
                    type="text"
                    className="jt-input"
                    placeholder="08..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="jt-field">
                  <label htmlFor="uo-ref">Referensi Transfer (Opsional)</label>
                  <input
                    id="uo-ref"
                    type="text"
                    className="jt-input jt-mono"
                    placeholder="Misal: QRIS BCA a.n Budi / RRN ..."
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>
              </div>
              <div className="jt-field">
                <label htmlFor="uo-note">Catatan (Opsional)</label>
                <input
                  id="uo-note"
                  type="text"
                  className="jt-input"
                  placeholder="Misal: Untuk Cursor IDE / Claude Opus 5.5"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <ProofUploadDropzone
                value={proofUrl}
                fileName={proofName}
                label="Upload Screenshot Pembayaran (Opsional — atau upload menyusul via Invoice)"
                onChange={({ url, fileName }) => {
                  setProofUrl(url ?? undefined);
                  setProofName(fileName);
                }}
              />
              <div className="jt-modal-foot">
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setOrderOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jt-btn-primary-solid"
                  disabled={submitting}
                >
                  {submitting ? "Mengirim..." : "Kirim Pesanan ke Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Invoice & Bukti Transaksi Pengguna */}
      {inspectedOrder && (
        <div
          className="jt-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Invoice & Bukti ${inspectedOrder.id}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectOrderId(null);
          }}
        >
          <div className="jt-modal-dialog is-wide">
            <div className="jt-modal-head">
              <h3>Invoice &amp; Bukti Transaksi ({inspectedOrder.id})</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setInspectOrderId(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                className="jt-btn-secondary-clean"
                onClick={() => window.print()}
              >
                Cetak / Simpan PDF Invoice
              </button>
            </div>

            <InvoiceDocument
              order={inspectedOrder}
              linkedKeyMasked={
                data.keys.find(
                  (k) =>
                    (inspectedOrder.keyHash && k.hash === inspectedOrder.keyHash) ||
                    k.orderId === inspectedOrder.id
                )?.maskedKey
              }
            />

            {inspectedOrder.paymentProofUrl && inspectedOrder.status !== "pending" && (
              <div className="jt-dropzone-preview" style={{ marginTop: "14px" }}>
                <div className="jt-dropzone-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inspectedOrder.paymentProofUrl} alt={`Bukti pembayaran ${inspectedOrder.id}`} />
                </div>
                <div className="jt-dropzone-meta">
                  <strong className="jt-dropzone-fname">
                    {inspectedOrder.paymentProofName || "bukti-pembayaran.png"}
                  </strong>
                  <span className="jt-dropzone-ready">Bukti transaksi terlampir &amp; terverifikasi</span>
                  <div className="jt-dropzone-btns">
                    <a
                      href={inspectedOrder.paymentProofUrl}
                      download={inspectedOrder.paymentProofName || `${inspectedOrder.id}-bukti.png`}
                      className="jt-btn-secondary-clean"
                    >
                      Unduh Screenshot
                    </a>
                  </div>
                </div>
              </div>
            )}

            {inspectedOrder.status === "pending" && (
              <form onSubmit={handleUploadExistingProof} style={{ marginTop: "18px" }}>
                <PaymentDestinationBox
                  methodName={inspectedOrder.methodName}
                  amountIdr={inspectedOrder.totalIdr}
                  copiedTag={copiedTag}
                  onCopy={(tag, value) => void handleCopy(tag, value)}
                />
                <ProofUploadDropzone
                  value={modalProofUrl}
                  fileName={modalProofName}
                  label="Unggah / Perbarui Screenshot Pembayaran Berhasil"
                  disabled={savingProof}
                  onChange={({ url, fileName }) => {
                    setModalProofUrl(url ?? undefined);
                    setModalProofName(fileName);
                  }}
                />
                <div className="jt-field">
                  <label htmlFor="user-modal-ref">Referensi Transfer (Opsional)</label>
                  <input
                    id="user-modal-ref"
                    type="text"
                    className="jt-input jt-mono"
                    value={modalRef}
                    onChange={(e) => setModalRef(e.target.value)}
                    placeholder="Nomor RRN / Bank Pengirim"
                  />
                </div>
                <div className="jt-modal-foot">
                  <button
                    type="button"
                    className="jt-btn-secondary-clean"
                    onClick={() => setInspectOrderId(null)}
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="jt-btn-primary-solid"
                    disabled={savingProof || !modalProofUrl}
                  >
                    {savingProof ? "Mengirim..." : "Kirim Bukti ke Admin"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Cara Pakai API Key dengan Model Pilihan */}
      {guideKey && (
        <div
          className="jt-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Panduan Pakai Universal API Key"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideKey(null);
          }}
        >
          <div className="jt-modal-dialog is-order">
            <div className="jt-modal-head">
              <h3>Panduan Pakai Universal API Key</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setGuideKey(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="usr-universal-banner">
              <strong>Key: {guideKey.maskedKey} · Saldo {formatIdr(guideKey.balanceIdr)}</strong>
              <p>
                Masukkan Base URL dan nama model di bawah ini ke aplikasi Anda (Cursor, Claude Code CLI, Chatbox, atau SDK), lalu isi API Key utuh yang Anda simpan saat aktivasi.
              </p>
            </div>
            <QuickStartIntegrationPanel
              scopeId="modal-guide"
              apiKeyText="jt-live-TOKEN-UTUH-ANDA"
              modelId={guideModelId}
              onModelChange={setGuideModelId}
              copiedTag={copiedTag}
              onCopy={(tag, value) => void handleCopy(tag, value)}
            />
            <div className="jt-modal-foot">
              <Link href="/docs" className="jt-btn-secondary-clean">
                Dokumentasi Lengkap ↗
              </Link>
              <button
                type="button"
                className="jt-btn-primary-solid"
                onClick={() => setGuideKey(null)}
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
