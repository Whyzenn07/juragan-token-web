"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GATEWAY_BASE_URL } from "@/data/catalog";
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/dashboard?_ts=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        window.location.replace("/login?next=/dashboard");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        setToast({ type: "error", text: json.error || "Gagal membuat permintaan pesanan." });
        return;
      }
      setOrderOpen(false);
      setNote("");
      setPaymentRef("");
      setProofUrl(undefined);
      setProofName(undefined);
      setToast({
        type: "success",
        text: `Pesanan ${json.order.id} berhasil diajukan dan masuk ke antrean verifikasi Admin.`,
      });
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
        setToast({ type: "error", text: json.error || "Gagal mengunggah bukti pembayaran." });
        return;
      }
      setToast({
        type: "success",
        text: `Bukti transaksi untuk ${inspectedOrder.id} berhasil dikirim ke Admin.`,
      });
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="jt-cell-muted jt-mono">{data.user.email}</span>
            {data.user.role === "admin" && (
              <Link href="/admin" className="jt-btn-primary-solid" style={{ padding: "7px 12px", fontSize: "12.5px" }}>
                Buka Admin Panel
              </Link>
            )}
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
            <h1>Halo, {data.user.fullName || data.user.email.split("@")[0]}</h1>
            <p>Pantau Virtual API Key yang terintegrasi ke akun Gmail Anda dan riwayat pesanan token.</p>
          </div>
          <div className="jt-head-actions">
            <button
              type="button"
              className="jt-btn-secondary-clean"
              onClick={async () => {
                await navigator.clipboard.writeText(GATEWAY_BASE_URL);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              }}
            >
              {copiedUrl ? "Base URL Tersalin ✓" : `Salin Base URL (${GATEWAY_BASE_URL})`}
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
          <article className="jt-kpi-card">
            <span className="jt-kpi-label">Total Saldo Aktif</span>
            <strong className="jt-kpi-val">{formatIdr(data.stats.totalBalanceIdr)}</strong>
            <span className="jt-kpi-sub">Berlaku lintas 100+ model AI tanpa hangus</span>
          </article>
          <article className="jt-kpi-card">
            <span className="jt-kpi-label">API Key Terintegrasi</span>
            <strong className="jt-kpi-val">{data.stats.activeKeysCount}</strong>
            <span className="jt-kpi-sub">dari {data.stats.totalKeysCount} kunci di akun Gmail ini</span>
          </article>
          <article className="jt-kpi-card">
            <span className="jt-kpi-label">Riwayat Pesanan</span>
            <strong className="jt-kpi-val">{data.stats.totalOrdersCount}</strong>
            <span className="jt-kpi-sub">{data.stats.pendingOrdersCount} menunggu konfirmasi admin</span>
          </article>
        </section>

        {/* Tabel API Key Terintegrasi */}
        <section className="jt-panel-card">
          <div className="jt-panel-card-head">
            <div>
              <h2>1 Universal API Key Anda ({data.keys.length})</h2>
              <span className="jt-cell-muted">
                Satu kunci langsung membuka akses OpenAI, Claude, Gemini, DeepSeek, Qwen &amp; 100+ model AI.
              </span>
            </div>
            <Link href="/docs" className="jt-btn-secondary-clean">
              Panduan Integrasi API ↗
            </Link>
          </div>
          {data.keys.length === 0 ? (
            <div className="jt-empty-box">
              Belum ada API Key terhubung ke akun Gmail Anda. Ajukan pesanan token baru (Standard maupun Enterprise) agar Admin menerbitkan Virtual API Key universal Anda.
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
                      <td className="jt-mono">{k.maskedKey}</td>
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
                          <span className="jt-cell-muted">Bebas (Fleksibel)</span>
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
            <h2>Riwayat Pesanan Anda ({data.orders.length})</h2>
          </div>
          {data.orders.length === 0 ? (
            <div className="jt-empty-box">Belum ada riwayat pesanan pada akun ini.</div>
          ) : (
            <div className="jt-table-scroll">
              <table className="jt-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Paket</th>
                    <th>Metode</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Invoice &amp; Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="jt-mono" style={{ whiteSpace: "nowrap" }}>{ord.id}</td>
                      <td>{ord.packageName}</td>
                      <td className="jt-cell-muted">{ord.methodName}</td>
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
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Ajukan Pesanan Token">
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

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                {(accountTier === "enterprise" ? [250000, 500000, 1000000, 2500000] : [25000, 50000, 100000, 250000]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="jt-btn-secondary-clean"
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
                <label htmlFor="uo-note">Catatan Kebutuhan (Opsional)</label>
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
                <label htmlFor="uo-ref">Referensi Transfer / Bank Pengirim (Opsional)</label>
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
                label="Upload SS Bukti Pembayaran (Opsional)"
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
