"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminAuditLog, Order, UserProfile } from "@/lib/store";
import type { EnrichedKey, EnrichedUser } from "@/lib/admin-service";

type AdminTab = "overview" | "orders" | "users-keys" | "audit";

type OverviewStats = {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenueIdr: number;
  totalKeys: number;
  activeKeys: number;
  totalBalanceIdr: number;
  totalUsers: number;
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

export function AdminDashboardClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);

  const [stats, setStats] = useState<OverviewStats>({
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenueIdr: 0,
    totalKeys: 0,
    activeKeys: 0,
    totalBalanceIdr: 0,
    totalUsers: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [keys, setKeys] = useState<EnrichedKey[]>([]);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [keyStatusFilter, setKeyStatusFilter] = useState<string>("all");
  const [userKeySearch, setUserKeySearch] = useState("");

  // Action feedback & modals
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [revealedKey, setRevealedKey] = useState<{ key: string; email: string; context: string } | null>(null);
  const [copiedReveal, setCopiedReveal] = useState(false);

  // Modal: Provision Key to Gmail
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provEmail, setProvEmail] = useState("");
  const [provLabel, setProvLabel] = useState("1 Key Universal (Semua AI)");
  const [provPlan, setProvPlan] = useState("Universal Gateway 100+ AI");
  const [provBalance, setProvBalance] = useState("50000");
  const [provTier, setProvTier] = useState<"standard" | "enterprise">("standard");
  const [provCompany, setProvCompany] = useState("");
  const [provDept, setProvDept] = useState("");
  const [provIps, setProvIps] = useState("");
  const [provSendEmail, setProvSendEmail] = useState(true);

  // Modal: IP Whitelist & Enterprise Tier Control
  const [ipTarget, setIpTarget] = useState<EnrichedKey | null>(null);
  const [ipInput, setIpInput] = useState("");
  const [ipTier, setIpTier] = useState<"standard" | "enterprise">("standard");
  const [ipCompany, setIpCompany] = useState("");
  const [ipDept, setIpDept] = useState("");

  // Modal: Create Manual Order
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [moEmail, setMoEmail] = useState("");
  const [moName, setMoName] = useState("");
  const [moPhone, setMoPhone] = useState("");
  const [moPackageName, setMoPackageName] = useState("Paket Developer Pro");
  const [moAmount, setMoAmount] = useState("50000");
  const [moMethod, setMoMethod] = useState("Transfer Bank / QRIS");
  const [moNotes, setMoNotes] = useState("");
  const [moAutoApprove, setMoAutoApprove] = useState(false);

  // Modal: Adjust Balance
  const [balanceTarget, setBalanceTarget] = useState<EnrichedKey | null>(null);
  const [balanceDelta, setBalanceDelta] = useState("50000");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const loadAll = useCallback(async () => {
    try {
      const [ovRes, ordRes, keyRes, usrRes] = await Promise.all([
        fetch("/api/admin/overview", { cache: "no-store" }),
        fetch("/api/admin/orders", { cache: "no-store" }),
        fetch("/api/admin/keys", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      if (ovRes.status === 401) {
        router.replace("/login?next=/admin");
        return;
      }
      if (ovRes.status === 403) {
        setAuthError("Akun Anda tidak memiliki hak akses Administrator.");
        setLoading(false);
        return;
      }

      const [ovData, ordData, keyData, usrData] = await Promise.all([
        ovRes.json(),
        ordRes.json(),
        keyRes.json(),
        usrRes.json(),
      ]);

      if (ovData.success) {
        setAdminUser(ovData.admin);
        setStats(ovData.stats);
        setAuditLogs(ovData.recentAuditLogs || []);
      }
      if (ordData.success) setOrders(ordData.orders || []);
      if (keyData.success) setKeys(keyData.keys || []);
      if (usrData.success) setUsers(usrData.users || []);
    } catch {
      showToast("error", "Gagal memuat data panel admin.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadAll]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleApproveOrder = async (order: Order) => {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal menyetujui pesanan.");
        return;
      }
      if (data.issuedKey) {
        setRevealedKey({
          key: data.issuedKey,
          email: order.customerEmail,
          context: `Pesanan ${order.id} berhasil disetujui & API Key terintegrasi ke akun Gmail pelanggan.`,
        });
      }
      showToast("success", `Pesanan ${order.id} disetujui.`);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleExpireOrder = async (order: Order) => {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expire" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal memperbarui status pesanan.");
        return;
      }
      showToast("success", `Pesanan ${order.id} ditandai expired.`);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId("manual-order");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: moEmail,
          customerName: moName,
          customerPhone: moPhone,
          packageName: moPackageName,
          baseIdr: Number(moAmount),
          methodName: moMethod,
          adminNotes: moNotes,
          autoApprove: moAutoApprove,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal membuat pesanan.");
        return;
      }
      setManualOrderOpen(false);
      setMoEmail("");
      setMoName("");
      setMoPhone("");
      setMoNotes("");
      if (data.issuedKey) {
        setRevealedKey({
          key: data.issuedKey,
          email: data.order.customerEmail,
          context: `Pesanan ${data.order.id} dibuat & langsung diaktifkan dengan API Key baru.`,
        });
      }
      showToast("success", `Pesanan ${data.order.id} berhasil ditambahkan.`);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleProvisionKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId("provision-key");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: provEmail,
          label: provLabel,
          planName: provPlan,
          balanceIdr: Number(provBalance),
          accountTier: provTier,
          companyName: provCompany,
          department: provDept,
          allowedIps: provIps,
          sendEmail: provSendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal menerbitkan API Key.");
        return;
      }
      setProvisionOpen(false);
      setRevealedKey({
        key: data.plaintextKey,
        email: provEmail,
        context: `API Key baru berhasil diintegrasikan ke akun Gmail ${provEmail}.`,
      });
      showToast("success", `API Key baru diterbitkan untuk ${provEmail}.`);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleKeyAction = async (
    keyItem: EnrichedKey,
    action: "suspend" | "activate" | "revoke" | "rotate"
  ) => {
    if (action === "revoke" && !window.confirm(`Cabut permanen API Key ••••${keyItem.last4}?`)) {
      return;
    }
    if (
      action === "rotate" &&
      !window.confirm(`Rotasi API Key ••••${keyItem.last4}? Kunci lama dicabut dan saldo dipindahkan ke kunci baru.`)
    ) {
      return;
    }

    setBusyId(keyItem.hash);
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(keyItem.hash)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal memproses API Key.");
        return;
      }
      if (data.rotatedPlaintextKey) {
        setRevealedKey({
          key: data.rotatedPlaintextKey,
          email: keyItem.ownerEmail,
          context: `API Key lama (••••${keyItem.last4}) telah dirotasi. Salin kunci baru di bawah.`,
        });
      }
      showToast("success", `Status API Key ••••${keyItem.last4} berhasil diperbarui.`);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceTarget) return;
    setBusyId(balanceTarget.hash);
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(balanceTarget.hash)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust_balance", deltaIdr: Number(balanceDelta) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal mengubah saldo.");
        return;
      }
      showToast("success", `Saldo API Key ••••${balanceTarget.last4} diperbarui.`);
      setBalanceTarget(null);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveIpWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipTarget) return;
    setBusyId(ipTarget.hash);
    try {
      const res = await fetch(`/api/admin/keys/${encodeURIComponent(ipTarget.hash)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_ip_whitelist",
          allowedIps: ipInput,
          accountTier: ipTier,
          companyName: ipCompany,
          department: ipDept,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal menyimpan IP Whitelist.");
        return;
      }
      showToast("success", `Pengaturan Tier & IP Whitelist ••••${ipTarget.last4} disimpan.`);
      setIpTarget(null);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
    if (!orderSearch.trim()) return true;
    const q = orderSearch.trim().toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.packageName.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userKeySearch.trim()) return true;
    const q = userKeySearch.trim().toLowerCase();
    return u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q);
  });

  const filteredKeys = keys.filter((k) => {
    if (keyStatusFilter !== "all" && k.status !== keyStatusFilter) return false;
    if (!userKeySearch.trim()) return true;
    const q = userKeySearch.trim().toLowerCase();
    return (
      k.ownerEmail.toLowerCase().includes(q) ||
      k.ownerName.toLowerCase().includes(q) ||
      k.last4.toLowerCase().includes(q) ||
      (k.label || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="jt-auth-shell">Memuat Panel Admin Juragantoken...</div>;
  }

  if (authError) {
    return (
      <div className="jt-auth-shell">
        <div className="jt-auth-card" style={{ textAlign: "center" }}>
          <h1 className="jt-auth-title">Akses Dibatasi</h1>
          <p className="jt-auth-sub">{authError}</p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <Link href="/dashboard" className="jt-btn-primary-solid">
              Ke Portal Pengguna
            </Link>
            <Link href="/" className="jt-btn-secondary-clean">
              Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="jt-admin-shell">
      {/* Sidebar Navigasi Minimalis */}
      <aside className="jt-admin-sidebar" aria-label="Navigasi Panel Admin">
        <Link href="/" className="jt-sidebar-brand">
          <span className="jt-auth-brand-text">
            juragan<span>token.</span>
          </span>
          <span className="jt-sidebar-role-tag">Admin</span>
        </Link>

        <nav className="jt-sidebar-nav">
          <button
            type="button"
            className={`jt-sidebar-item ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span>Ringkasan</span>
          </button>

          <button
            type="button"
            className={`jt-sidebar-item ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span>Pesanan Masuk</span>
            <span className={`jt-sidebar-count ${stats.pendingOrders > 0 ? "is-alert" : ""}`}>
              {stats.pendingOrders > 0 ? `${stats.pendingOrders} baru` : stats.totalOrders}
            </span>
          </button>

          <button
            type="button"
            className={`jt-sidebar-item ${activeTab === "users-keys" ? "is-active" : ""}`}
            onClick={() => setActiveTab("users-keys")}
          >
            <span>User Gmail &amp; API Key</span>
            <span className="jt-sidebar-count">{stats.activeKeys}</span>
          </button>

          <button
            type="button"
            className={`jt-sidebar-item ${activeTab === "audit" ? "is-active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <span>Audit Log</span>
            <span className="jt-sidebar-count">{auditLogs.length}</span>
          </button>
        </nav>

        <div className="jt-sidebar-footer">
          {adminUser && (
            <div className="jt-account-box">
              <span className="jt-account-name">{adminUser.fullName}</span>
              <span className="jt-account-email">{adminUser.email}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: "6px" }}>
            <Link href="/" className="jt-btn-secondary-clean" style={{ flex: 1 }}>
              ← Web Utama
            </Link>
            <button type="button" className="jt-btn-secondary-clean" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Konten Utama Panel Admin */}
      <main className="jt-admin-main">
        {toast && (
          <div className={`jt-alert ${toast.type}`} role="status">
            {toast.text}
          </div>
        )}

        {/* Header Dinamis */}
        <header className="jt-page-head">
          <div>
            <h1>
              {activeTab === "overview" && "Ringkasan Operasional"}
              {activeTab === "orders" && "Manajemen Pesanan Masuk"}
              {activeTab === "users-keys" && "Akun Gmail & Integrasi API Key"}
              {activeTab === "audit" && "Log Audit Aktivitas Admin"}
            </h1>
            <p>
              {activeTab === "overview" &&
                "Pantau pesanan masuk, status pembayaran, dan API Key terintegrasi di seluruh akun Gmail pengguna."}
              {activeTab === "orders" &&
                "Setujui pesanan untuk menerbitkan Virtual API Key otomatis atau buat pesanan manual."}
              {activeTab === "users-keys" &&
                "Kelola setiap akun Gmail yang terdaftar, terbitkan API Key baru, sesuaikan saldo, dan kontrol status akses."}
              {activeTab === "audit" &&
                "Rekam jejak seluruh perubahan pesanan, saldo, dan siklus hidup API Key oleh administrator."}
            </p>
          </div>

          <div className="jt-head-actions">
            <button
              type="button"
              className="jt-btn-secondary-clean"
              onClick={() => loadAll()}
            >
              Muat Ulang
            </button>
            <button
              type="button"
              className="jt-btn-secondary-clean"
              onClick={() => setManualOrderOpen(true)}
            >
              + Pesanan Manual
            </button>
            <button
              type="button"
              className="jt-btn-primary-solid"
              onClick={() => {
                setProvEmail(users[0]?.email || "");
                setProvisionOpen(true);
              }}
            >
              + Integrasikan API Key
            </button>
          </div>
        </header>

        {/* TAB 1: RINGKASAN (OVERVIEW) */}
        {activeTab === "overview" && (
          <>
            <section className="jt-kpi-grid" aria-label="Metrik utama">
              <article className="jt-kpi-card">
                <span className="jt-kpi-label">Pesanan Menunggu</span>
                <strong className="jt-kpi-val">{stats.pendingOrders}</strong>
                <span className="jt-kpi-sub">dari total {stats.totalOrders} pesanan masuk</span>
              </article>
              <article className="jt-kpi-card">
                <span className="jt-kpi-label">Total Transaksi Lunas</span>
                <strong className="jt-kpi-val">{formatIdr(stats.totalRevenueIdr)}</strong>
                <span className="jt-kpi-sub">{stats.paidOrders} pesanan terkonfirmasi</span>
              </article>
              <article className="jt-kpi-card">
                <span className="jt-kpi-label">API Key Aktif</span>
                <strong className="jt-kpi-val">{stats.activeKeys}</strong>
                <span className="jt-kpi-sub">Total saldo aktif {formatIdr(stats.totalBalanceIdr)}</span>
              </article>
              <article className="jt-kpi-card">
                <span className="jt-kpi-label">Akun Gmail Terdaftar</span>
                <strong className="jt-kpi-val">{stats.totalUsers}</strong>
                <span className="jt-kpi-sub">Tersinkron dengan {stats.totalKeys} Virtual Key</span>
              </article>
            </section>

            {/* Pesanan Pending yang Memerlukan Tindakan */}
            <section className="jt-panel-card">
              <div className="jt-panel-card-head">
                <h2>Pesanan Menunggu Persetujuan ({pendingOrders.length})</h2>
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setActiveTab("orders")}
                >
                  Lihat Semua Pesanan →
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="jt-empty-box">
                  Semua pesanan telah diproses. Tidak ada pesanan yang menunggu konfirmasi saat ini.
                </div>
              ) : (
                <div className="jt-table-scroll">
                  <table className="jt-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Akun Gmail &amp; Pelanggan</th>
                        <th>Paket</th>
                        <th>Nominal</th>
                        <th>Waktu</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.slice(0, 6).map((ord) => (
                        <tr key={ord.id}>
                          <td className="jt-mono">{ord.id}</td>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-cell-primary">{ord.customerName}</span>
                              <span className="jt-cell-muted jt-mono">{ord.customerEmail}</span>
                            </div>
                          </td>
                          <td>{ord.packageName}</td>
                          <td className="jt-num">{formatIdr(ord.totalIdr)}</td>
                          <td className="jt-cell-muted">{formatDate(ord.createdAt)}</td>
                          <td>
                            <div className="jt-row-actions">
                              <button
                                type="button"
                                className="jt-btn-primary-solid"
                                style={{ padding: "6px 11px", fontSize: "12px" }}
                                disabled={busyId === ord.id}
                                onClick={() => handleApproveOrder(ord)}
                              >
                                {busyId === ord.id ? "Memproses..." : "Setujui & Terbitkan Key"}
                              </button>
                              <button
                                type="button"
                                className="jt-btn-secondary-clean"
                                disabled={busyId === ord.id}
                                onClick={() => handleExpireOrder(ord)}
                              >
                                Expired
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Ringkasan Akun Gmail & Integrasi API Key */}
            <section className="jt-panel-card">
              <div className="jt-panel-card-head">
                <h2>Akun Gmail Terbaru &amp; API Key Terintegrasi</h2>
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setActiveTab("users-keys")}
                >
                  Kelola Semua User &amp; Key →
                </button>
              </div>
              <div className="jt-table-scroll">
                <table className="jt-table">
                  <thead>
                    <tr>
                      <th>Pengguna &amp; Gmail</th>
                      <th>Peran</th>
                      <th>API Key Aktif</th>
                      <th>Total Saldo</th>
                      <th>Pesanan</th>
                      <th>Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="jt-cell-stack">
                            <span className="jt-cell-primary">{u.fullName || "Pengguna"}</span>
                            <span className="jt-cell-muted jt-mono">{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`jt-status ${u.role === "admin" ? "active" : "expired"}`}>
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="jt-num">{u.activeKeysCount} key</td>
                        <td className="jt-num">{formatIdr(u.totalBalanceIdr)}</td>
                        <td className="jt-cell-muted">{u.ordersCount} transaksi</td>
                        <td>
                          <button
                            type="button"
                            className="jt-btn-secondary-clean"
                            onClick={() => {
                              setProvEmail(u.email);
                              setProvisionOpen(true);
                            }}
                          >
                            + Terbitkan Key
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: MANAJEMEN PESANAN MASUK */}
        {activeTab === "orders" && (
          <section className="jt-panel-card">
            <div className="jt-panel-card-head">
              <div className="jt-filter-pills" role="tablist" aria-label="Filter status pesanan">
                {[
                  { id: "all", label: `Semua (${orders.length})` },
                  { id: "pending", label: `Pending (${stats.pendingOrders})` },
                  { id: "paid", label: `Paid (${stats.paidOrders})` },
                  { id: "expired", label: "Expired" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`jt-filter-pill ${orderStatusFilter === f.id ? "is-active" : ""}`}
                    onClick={() => setOrderStatusFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="jt-toolbar">
                <input
                  type="search"
                  className="jt-input"
                  style={{ width: "260px" }}
                  placeholder="Cari invoice, Gmail, atau nama..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="jt-empty-box">Tidak ada pesanan yang cocok dengan filter saat ini.</div>
            ) : (
              <div className="jt-table-scroll">
                <table className="jt-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Pelanggan &amp; Gmail</th>
                      <th>Paket &amp; Metode</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Tanggal</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="jt-mono">{ord.id}</td>
                        <td>
                          <div className="jt-cell-stack">
                            <span className="jt-cell-primary">{ord.customerName}</span>
                            <span className="jt-cell-muted jt-mono">{ord.customerEmail}</span>
                          </div>
                        </td>
                        <td>
                          <div className="jt-cell-stack">
                            <span>{ord.packageName}</span>
                            <span className="jt-cell-muted">
                              {ord.accountTier === "enterprise" ? "Enterprise B2B" : "Standard"} · {ord.methodName}
                              {ord.requiresTaxInvoice ? " · Faktur Pajak" : ""}
                            </span>
                            {(ord.companyName || ord.department) && (
                              <span className="jt-cell-muted">
                                {[ord.companyName, ord.department].filter(Boolean).join(" / ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="jt-num">{formatIdr(ord.totalIdr)}</td>
                        <td>
                          <span className={`jt-status ${ord.status}`}>
                            {ord.status === "paid"
                              ? "Lunas"
                              : ord.status === "pending"
                              ? "Menunggu"
                              : "Expired"}
                          </span>
                        </td>
                        <td className="jt-cell-muted">{formatDate(ord.createdAt)}</td>
                        <td>
                          {ord.status === "pending" ? (
                            <div className="jt-row-actions">
                              <button
                                type="button"
                                className="jt-btn-primary-solid"
                                style={{ padding: "6px 11px", fontSize: "12px" }}
                                disabled={busyId === ord.id}
                                onClick={() => handleApproveOrder(ord)}
                              >
                                Setujui &amp; Terbitkan Key
                              </button>
                              <button
                                type="button"
                                className="jt-btn-secondary-clean"
                                disabled={busyId === ord.id}
                                onClick={() => handleExpireOrder(ord)}
                              >
                                Expired
                              </button>
                            </div>
                          ) : (
                            <span className="jt-cell-muted">
                              {ord.paidAt ? `Lunas ${formatDate(ord.paidAt)}` : "Selesai"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: USER GMAIL & API KEY TERINTEGRASI */}
        {activeTab === "users-keys" && (
          <>
            <section className="jt-panel-card">
              <div className="jt-panel-card-head">
                <h2>Akun Gmail Terdaftar ({filteredUsers.length})</h2>
                <div className="jt-toolbar">
                  <input
                    type="search"
                    className="jt-input"
                    style={{ width: "260px" }}
                    placeholder="Cari email Gmail, nama, atau 4 digit key..."
                    value={userKeySearch}
                    onChange={(e) => setUserKeySearch(e.target.value)}
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="jt-empty-box">Belum ada akun Gmail yang cocok dengan pencarian.</div>
              ) : (
                <div className="jt-table-scroll">
                  <table className="jt-table">
                    <thead>
                      <tr>
                        <th>Akun Gmail &amp; Nama</th>
                        <th>Role</th>
                        <th>API Key Terhubung</th>
                        <th>Saldo Aktif</th>
                        <th>Terdaftar</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-cell-primary">{u.fullName || "Pengguna"}</span>
                              <span className="jt-cell-muted jt-mono">{u.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`jt-status ${u.role === "admin" ? "active" : "expired"}`}>
                              {u.role === "admin" ? "Admin" : "User"}
                            </span>
                          </td>
                          <td>
                            {u.keys.length === 0 ? (
                              <span className="jt-cell-muted">Belum ada API Key</span>
                            ) : (
                              <div className="jt-cell-stack">
                                {u.keys.slice(0, 2).map((k) => (
                                  <span key={k.hash} className="jt-mono">
                                    {k.maskedKey} ({k.status})
                                  </span>
                                ))}
                                {u.keys.length > 2 && (
                                  <span className="jt-cell-muted">+{u.keys.length - 2} key lainnya</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="jt-num">{formatIdr(u.totalBalanceIdr)}</td>
                          <td className="jt-cell-muted">{formatDate(u.createdAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="jt-btn-primary-solid"
                              style={{ padding: "6px 11px", fontSize: "12px" }}
                              onClick={() => {
                                setProvEmail(u.email);
                                setProvisionOpen(true);
                              }}
                            >
                              + Terbitkan Key
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="jt-panel-card">
              <div className="jt-panel-card-head">
                <h2>Daftar API Key Terintegrasi ({filteredKeys.length})</h2>
                <div className="jt-filter-pills">
                  {[
                    { id: "all", label: "Semua" },
                    { id: "active", label: "Aktif" },
                    { id: "suspended", label: "Suspended" },
                    { id: "revoked", label: "Revoked" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`jt-filter-pill ${keyStatusFilter === f.id ? "is-active" : ""}`}
                      onClick={() => setKeyStatusFilter(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredKeys.length === 0 ? (
                <div className="jt-empty-box">Belum ada API Key pada filter ini.</div>
              ) : (
                <div className="jt-table-scroll">
                  <table className="jt-table">
                    <thead>
                      <tr>
                        <th>1 Universal API Key (100+ AI)</th>
                        <th>Pemilik (Gmail)</th>
                        <th>Tier &amp; Departemen</th>
                        <th>IP Whitelist</th>
                        <th>Saldo</th>
                        <th>Status</th>
                        <th>Kontrol Akses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeys.map((k) => (
                        <tr key={k.hash}>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-mono">{k.maskedKey}</span>
                              <span className="jt-cell-muted">{k.label || "Universal Key"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-cell-primary">{k.ownerName}</span>
                              <span className="jt-cell-muted jt-mono">{k.ownerEmail}</span>
                            </div>
                          </td>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-cell-primary">
                                {k.accountTier === "enterprise" ? "Enterprise" : "Standard"}
                              </span>
                              <span className="jt-cell-muted">
                                {[k.companyName, k.department].filter(Boolean).join(" · ") || k.planName}
                              </span>
                            </div>
                          </td>
                          <td>
                            {k.allowedIps && k.allowedIps.length > 0 ? (
                              <span className="jt-status active" title={k.allowedIps.join(", ")}>
                                {k.allowedIps.length} IP Aktif
                              </span>
                            ) : (
                              <span className="jt-cell-muted">Bebas (Standard)</span>
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
                          <td>
                            <div className="jt-row-actions">
                              {k.status !== "revoked" && (
                                <>
                                  <button
                                    type="button"
                                    className="jt-btn-secondary-clean"
                                    disabled={busyId === k.hash}
                                    onClick={() => {
                                      setBalanceTarget(k);
                                      setBalanceDelta("50000");
                                    }}
                                  >
                                    ± Saldo
                                  </button>
                                  <button
                                    type="button"
                                    className="jt-btn-secondary-clean"
                                    disabled={busyId === k.hash}
                                    onClick={() => {
                                      setIpTarget(k);
                                      setIpInput((k.allowedIps || []).join(", "));
                                      setIpTier(k.accountTier === "enterprise" ? "enterprise" : "standard");
                                      setIpCompany(k.companyName || "");
                                      setIpDept(k.department || "");
                                    }}
                                  >
                                    IP / Tier
                                  </button>
                                  {k.status === "active" ? (
                                    <button
                                      type="button"
                                      className="jt-btn-secondary-clean"
                                      disabled={busyId === k.hash}
                                      onClick={() => handleKeyAction(k, "suspend")}
                                    >
                                      Suspend
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="jt-btn-secondary-clean"
                                      disabled={busyId === k.hash}
                                      onClick={() => handleKeyAction(k, "activate")}
                                    >
                                      Aktifkan
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="jt-btn-secondary-clean"
                                    disabled={busyId === k.hash}
                                    onClick={() => handleKeyAction(k, "rotate")}
                                  >
                                    Rotasi
                                  </button>
                                  <button
                                    type="button"
                                    className="jt-btn-danger-ghost"
                                    disabled={busyId === k.hash}
                                    onClick={() => handleKeyAction(k, "revoke")}
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}
                              {k.status === "revoked" && (
                                <span className="jt-cell-muted">Dicabut permanen</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === "audit" && (
          <section className="jt-panel-card">
            <div className="jt-panel-card-head">
              <h2>Riwayat Aktivitas Administrator ({auditLogs.length})</h2>
            </div>
            {auditLogs.length === 0 ? (
              <div className="jt-empty-box">Belum ada catatan aktivitas admin.</div>
            ) : (
              <div className="jt-table-scroll">
                <table className="jt-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Admin</th>
                      <th>Aksi</th>
                      <th>Target</th>
                      <th>Ringkasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="jt-cell-muted">{formatDate(log.createdAt)}</td>
                        <td className="jt-mono">{log.adminEmail}</td>
                        <td>
                          <span className="jt-status active">{log.action}</span>
                        </td>
                        <td className="jt-mono">
                          {log.targetType}: {log.targetId}
                        </td>
                        <td className="jt-cell-muted jt-mono">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL 1: INTEGRASIKAN API KEY BARU KE AKUN GMAIL */}
      {provisionOpen && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Integrasikan API Key ke Gmail">
          <div className="jt-modal-dialog">
            <div className="jt-modal-head">
              <h3>Integrasikan API Key ke Akun Gmail</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setProvisionOpen(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleProvisionKey}>
              <div className="jt-field">
                <label htmlFor="prov-email">Akun Gmail Pengguna</label>
                <input
                  id="prov-email"
                  list="registered-gmails"
                  type="email"
                  className="jt-input"
                  placeholder="user@gmail.com"
                  value={provEmail}
                  onChange={(e) => setProvEmail(e.target.value)}
                  required
                />
                <datalist id="registered-gmails">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.fullName}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="jt-field">
                <label htmlFor="prov-label">Label Kunci</label>
                <input
                  id="prov-label"
                  type="text"
                  className="jt-input"
                  value={provLabel}
                  onChange={(e) => setProvLabel(e.target.value)}
                  placeholder="Misal: Cursor IDE Tim / Production API"
                />
              </div>
              <div className="jt-field">
                <label htmlFor="prov-plan">Nama Paket / Kuota</label>
                <input
                  id="prov-plan"
                  type="text"
                  className="jt-input"
                  value={provPlan}
                  onChange={(e) => setProvPlan(e.target.value)}
                />
              </div>
              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="prov-tier">Tipe Akun</label>
                  <select
                    id="prov-tier"
                    className="jt-select"
                    value={provTier}
                    onChange={(e) => setProvTier(e.target.value as "standard" | "enterprise")}
                  >
                    <option value="standard">Standard (Fleksibel)</option>
                    <option value="enterprise">Enterprise B2B</option>
                  </select>
                </div>
                <div className="jt-field">
                  <label htmlFor="prov-balance">Saldo Awal (IDR)</label>
                  <input
                    id="prov-balance"
                    type="number"
                    min={0}
                    max={100000000}
                    step={5000}
                    className="jt-input"
                    value={provBalance}
                    onChange={(e) => setProvBalance(e.target.value)}
                    required
                  />
                </div>
              </div>
              {provTier === "enterprise" && (
                <div className="jt-form-row-2">
                  <div className="jt-field">
                    <label htmlFor="prov-company">Nama Perusahaan</label>
                    <input
                      id="prov-company"
                      type="text"
                      className="jt-input"
                      placeholder="PT Contoh Nusantara"
                      value={provCompany}
                      onChange={(e) => setProvCompany(e.target.value)}
                    />
                  </div>
                  <div className="jt-field">
                    <label htmlFor="prov-dept">Departemen</label>
                    <input
                      id="prov-dept"
                      type="text"
                      className="jt-input"
                      placeholder="IT / Engineering / Riset"
                      value={provDept}
                      onChange={(e) => setProvDept(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="jt-field">
                <label htmlFor="prov-ips">IP Whitelist Opsional (Kosong = Bebas Akses)</label>
                <input
                  id="prov-ips"
                  type="text"
                  className="jt-input"
                  placeholder="Contoh Enterprise: 103.45.12.88, 202.150.10.0/24"
                  value={provIps}
                  onChange={(e) => setProvIps(e.target.value)}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={provSendEmail}
                  onChange={(e) => setProvSendEmail(e.target.checked)}
                />
                <span>Kirim kredensial API Key otomatis ke email Gmail pengguna</span>
              </label>

              <div className="jt-modal-foot">
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setProvisionOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jt-btn-primary-solid"
                  disabled={busyId === "provision-key"}
                >
                  {busyId === "provision-key" ? "Menerbitkan..." : "Terbitkan API Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUAT PESANAN MANUAL */}
      {manualOrderOpen && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Buat Pesanan Manual">
          <div className="jt-modal-dialog">
            <div className="jt-modal-head">
              <h3>Catat Pesanan Masuk Manual</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setManualOrderOpen(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateManualOrder}>
              <div className="jt-field">
                <label htmlFor="mo-email">Email Gmail Pelanggan</label>
                <input
                  id="mo-email"
                  list="registered-gmails-order"
                  type="email"
                  className="jt-input"
                  placeholder="pelanggan@gmail.com"
                  value={moEmail}
                  onChange={(e) => {
                    setMoEmail(e.target.value);
                    const matched = users.find((u) => u.email.toLowerCase() === e.target.value.toLowerCase());
                    if (matched && !moName) setMoName(matched.fullName);
                  }}
                  required
                />
                <datalist id="registered-gmails-order">
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.fullName}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="jt-field">
                <label htmlFor="mo-name">Nama Pelanggan</label>
                <input
                  id="mo-name"
                  type="text"
                  className="jt-input"
                  value={moName}
                  onChange={(e) => setMoName(e.target.value)}
                  required
                />
              </div>
              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="mo-pkg">Nama Paket</label>
                  <input
                    id="mo-pkg"
                    type="text"
                    className="jt-input"
                    value={moPackageName}
                    onChange={(e) => setMoPackageName(e.target.value)}
                  />
                </div>
                <div className="jt-field">
                  <label htmlFor="mo-amount">Nominal (IDR)</label>
                  <input
                    id="mo-amount"
                    type="number"
                    min={5000}
                    step={5000}
                    className="jt-input"
                    value={moAmount}
                    onChange={(e) => setMoAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="mo-method">Metode Bayar</label>
                  <input
                    id="mo-method"
                    type="text"
                    className="jt-input"
                    value={moMethod}
                    onChange={(e) => setMoMethod(e.target.value)}
                  />
                </div>
                <div className="jt-field">
                  <label htmlFor="mo-phone">WhatsApp (Opsional)</label>
                  <input
                    id="mo-phone"
                    type="text"
                    className="jt-input"
                    value={moPhone}
                    onChange={(e) => setMoPhone(e.target.value)}
                    placeholder="08..."
                  />
                </div>
              </div>
              <div className="jt-field">
                <label htmlFor="mo-notes">Catatan Admin (Opsional)</label>
                <input
                  id="mo-notes"
                  type="text"
                  className="jt-input"
                  value={moNotes}
                  onChange={(e) => setMoNotes(e.target.value)}
                  placeholder="Referensi transfer / kebutuhan khusus"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={moAutoApprove}
                  onChange={(e) => setMoAutoApprove(e.target.checked)}
                />
                <span>Langsung setujui &amp; terbitkan API Key ke akun Gmail</span>
              </label>

              <div className="jt-modal-foot">
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setManualOrderOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jt-btn-primary-solid"
                  disabled={busyId === "manual-order"}
                >
                  {busyId === "manual-order" ? "Menyimpan..." : "Simpan Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SESUAIKAN SALDO API KEY */}
      {balanceTarget && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Sesuaikan Saldo API Key">
          <div className="jt-modal-dialog">
            <div className="jt-modal-head">
              <h3>Sesuaikan Saldo ({balanceTarget.maskedKey})</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setBalanceTarget(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p className="jt-auth-sub" style={{ marginBottom: "12px" }}>
              Pemilik: <span className="jt-mono">{balanceTarget.ownerEmail}</span> · Saldo saat ini:{" "}
              <strong>{formatIdr(balanceTarget.balanceIdr)}</strong>
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
              {[25000, 50000, 100000, 250000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setBalanceDelta(String(amt))}
                >
                  +{formatIdr(amt)}
                </button>
              ))}
            </div>
            <form onSubmit={handleAdjustBalance}>
              <div className="jt-field">
                <label htmlFor="adj-delta">Nominal Penyesuaian (positif untuk top-up, negatif untuk koreksi)</label>
                <input
                  id="adj-delta"
                  type="number"
                  className="jt-input"
                  value={balanceDelta}
                  onChange={(e) => setBalanceDelta(e.target.value)}
                  required
                />
              </div>
              <div className="jt-modal-foot">
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setBalanceTarget(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jt-btn-primary-solid"
                  disabled={busyId === balanceTarget.hash}
                >
                  Simpan Perubahan Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3B: PENGATURAN TIER & IP WHITELIST ENTERPRISE */}
      {ipTarget && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Pengaturan Tier dan IP Whitelist">
          <div className="jt-modal-dialog">
            <div className="jt-modal-head">
              <h3>Tier &amp; IP Whitelist ({ipTarget.maskedKey})</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => setIpTarget(null)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p className="jt-auth-sub" style={{ marginBottom: "12px" }}>
              Kosongkan daftar IP agar fleksibel (Standard). Isi alamat IP kantor/server (dipisah koma atau baris baru) untuk mengunci akses khusus Enterprise di Gateway.
            </p>
            <form onSubmit={handleSaveIpWhitelist}>
              <div className="jt-field">
                <label htmlFor="ip-tier">Tipe Akun</label>
                <select
                  id="ip-tier"
                  className="jt-select"
                  value={ipTier}
                  onChange={(e) => setIpTier(e.target.value as "standard" | "enterprise")}
                >
                  <option value="standard">Standard (Fleksibel)</option>
                  <option value="enterprise">Enterprise B2B</option>
                </select>
              </div>
              <div className="jt-form-row-2">
                <div className="jt-field">
                  <label htmlFor="ip-company">Perusahaan (Opsional)</label>
                  <input
                    id="ip-company"
                    type="text"
                    className="jt-input"
                    value={ipCompany}
                    onChange={(e) => setIpCompany(e.target.value)}
                    placeholder="PT ..."
                  />
                </div>
                <div className="jt-field">
                  <label htmlFor="ip-dept">Departemen (Opsional)</label>
                  <input
                    id="ip-dept"
                    type="text"
                    className="jt-input"
                    value={ipDept}
                    onChange={(e) => setIpDept(e.target.value)}
                    placeholder="Tim IT / Data"
                  />
                </div>
              </div>
              <div className="jt-field">
                <label htmlFor="ip-list">Daftar IP Diizinkan (IPv4 / CIDR /24)</label>
                <textarea
                  id="ip-list"
                  rows={3}
                  className="jt-textarea jt-mono"
                  placeholder="103.45.12.88, 202.150.10.0/24"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                />
              </div>
              <div className="jt-modal-foot">
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => setIpTarget(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jt-btn-primary-solid"
                  disabled={busyId === ipTarget.hash}
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ONE-TIME REVEAL API KEY (ZERO-KNOWLEDGE) */}
      {revealedKey && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Kunci API Baru Diterbitkan">
          <div className="jt-modal-dialog">
            <div className="jt-modal-head">
              <h3>Virtual API Key Diterbitkan</h3>
              <button
                type="button"
                className="jt-modal-close"
                onClick={() => {
                  setRevealedKey(null);
                  setCopiedReveal(false);
                }}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <p className="jt-auth-sub" style={{ marginBottom: "8px" }}>
              {revealedKey.context}
            </p>
            <div className="jt-alert info" style={{ marginBottom: "8px" }}>
              Demi keamanan Zero-Knowledge, kunci utuh hanya ditampilkan <strong>satu kali</strong>. Hanya hash SHA-256 yang disimpan di server.
            </div>
            <div className="jt-key-reveal-box">{revealedKey.key}</div>
            <div className="jt-modal-foot">
              <button
                type="button"
                className="jt-btn-secondary-clean"
                onClick={async () => {
                  await navigator.clipboard.writeText(revealedKey.key);
                  setCopiedReveal(true);
                  setTimeout(() => setCopiedReveal(false), 2000);
                }}
              >
                {copiedReveal ? "Tersalin ✓" : "Salin API Key"}
              </button>
              <button
                type="button"
                className="jt-btn-primary-solid"
                onClick={() => {
                  setRevealedKey(null);
                  setCopiedReveal(false);
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
