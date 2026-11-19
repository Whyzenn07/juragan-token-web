"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GATEWAY_BASE_URL } from "@/data/catalog";
import type { Order, UserProfile } from "@/lib/store";
import type { EnrichedKey } from "@/lib/admin-service";

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
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [orderOpen, setOrderOpen] = useState(false);
  const [amount, setAmount] = useState("50000");
  const [methodName, setMethodName] = useState("QRIS Instan");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/user/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login?next=/dashboard");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
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
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setToast({ type: "error", text: json.error || "Gagal membuat permintaan pesanan." });
        return;
      }
      setOrderOpen(false);
      setNote("");
      setToast({
        type: "success",
        text: `Pesanan ${json.order.id} berhasil diajukan dan masuk ke antrean verifikasi Admin.`,
      });
      await loadData();
    } finally {
      setSubmitting(false);
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
            <button type="button" className="jt-btn-secondary-clean" onClick={handleLogout}>
              Keluar
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
            <h2>Virtual API Key Terintegrasi ({data.keys.length})</h2>
            <Link href="/docs" className="jt-btn-secondary-clean">
              Panduan Integrasi API ↗
            </Link>
          </div>
          {data.keys.length === 0 ? (
            <div className="jt-empty-box">
              Belum ada API Key terhubung ke akun Gmail Anda. Ajukan pesanan token baru agar Admin menerbitkan Virtual API Key Anda.
            </div>
          ) : (
            <div className="jt-table-scroll">
              <table className="jt-table">
                <thead>
                  <tr>
                    <th>API Key</th>
                    <th>Label &amp; Paket</th>
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
                          <span className="jt-cell-primary">{k.label || "Key Utama"}</span>
                          <span className="jt-cell-muted">{k.planName}</span>
                        </div>
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
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="jt-mono">{ord.id}</td>
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
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                {[25000, 50000, 100000, 250000].map((v) => (
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
    </div>
  );
}
