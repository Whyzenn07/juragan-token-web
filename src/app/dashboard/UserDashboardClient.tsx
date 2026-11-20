"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Order, UserProfile } from "@/lib/store";
import type { EnrichedKey } from "@/lib/admin-service";
import { ProofUploadDropzone } from "@/components/portal/ProofUploadDropzone";
import { InvoiceDocument } from "@/components/portal/InvoiceDocument";

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

export function UserDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const [orderOpen, setOrderOpen] = useState(false);
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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
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
      void loadData();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (inspectOrderId) setInspectOrderId(null);
        else if (orderOpen) setOrderOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectOrderId, orderOpen]);

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
      const res = await fetch("/api/user/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseIdr: Number(amount),
          methodName,
          customerPhone: phone,
          note,
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

  return (
    <div>
      <header className="jt-user-topbar">
        <div className="jt-user-topbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/" className="jt-auth-brand" style={{ marginBottom: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-mark.png" alt="" width={26} height={22} />
              <span className="jt-auth-brand-text">
                juragan<span>token.</span>
              </span>
            </Link>
            <span className="jt-sidebar-role-tag">Portal Akun</span>
          </div>

          <div className="usr-topbar-right">
            {data.user.role === "admin" && (
              <Link
                href="/admin"
                prefetch={false}
                className="jt-btn-primary-solid"
                style={{ padding: "7px 12px", fontSize: "12.5px" }}
              >
                Admin Panel
              </Link>
            )}
            <Link href="/docs" className="jt-btn-secondary-clean">
              Panduan API
            </Link>
            <Link href="/" className="jt-btn-secondary-clean">
              Beranda
            </Link>
            <button
              type="button"
              className="jt-btn-secondary-clean"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      </header>

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

        <section className="jt-kpi-grid cols-3" aria-label="Ringkasan akun">
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

        {/* Tabel API Key Terintegrasi */}
        <section className="jt-panel-card">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Riwayat Pesanan */}
        <section className="jt-panel-card">
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
          <div className="jt-modal-dialog">
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
                <label htmlFor="uo-note">Catatan (Opsional)</label>
                <input
                  id="uo-note"
                  type="text"
                  className="jt-input"
                  placeholder="Misal: Untuk Cursor IDE / Tim Engineering"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
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
              <ProofUploadDropzone
                value={proofUrl}
                fileName={proofName}
                label="Upload Screenshot Pembayaran (Opsional)"
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
    </div>
  );
}
