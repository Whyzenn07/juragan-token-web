"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminAuditLog, Order, UserProfile } from "@/lib/store";
import type { EnrichedKey, EnrichedUser } from "@/lib/admin-service";
import { Icon } from "@/components/ui/Icon";
import { ProofUploadDropzone } from "@/components/portal/ProofUploadDropzone";
import { InvoiceDocument } from "@/components/portal/InvoiceDocument";

type AdminTab = "overview" | "orders" | "users-keys" | "audit";
type OrderDrawerTab = "proof" | "invoice";
type UserKeySubTab = "keys" | "users";

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

type MenuState = {
  kind: "order" | "key";
  id: string;
  top: number;
  right: number;
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

function getInitials(name?: string, email?: string): string {
  const src = (name || email || "JT").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

function formatAuditMeta(action: string): { label: string; tone: "active" | "pending" | "suspended" } {
  const map: Record<string, { label: string; tone: "active" | "pending" | "suspended" }> = {
    "order.approve": { label: "Pesanan Disetujui", tone: "active" },
    "order.create_manual": { label: "Pesanan Manual", tone: "pending" },
    "order.update_paid": { label: "Tandai Lunas", tone: "active" },
    "order.update_expired": { label: "Tandai Expired", tone: "suspended" },
    "order.update_pending": { label: "Kembalikan Pending", tone: "pending" },
    "order.upload_proof": { label: "Upload Bukti SS", tone: "active" },
    "order.remove_proof": { label: "Hapus Bukti SS", tone: "suspended" },
    "order.update_proof_meta": { label: "Update Info Transaksi", tone: "pending" },
    "key.provision_gmail": { label: "Terbitkan API Key", tone: "active" },
    "key.adjust_balance": { label: "Sesuaikan Saldo", tone: "active" },
    "key.update_ip_whitelist": { label: "Atur IP / Tier", tone: "active" },
    "key.suspend": { label: "Suspend Key", tone: "suspended" },
    "key.activate": { label: "Aktifkan Key", tone: "active" },
    "key.rotate": { label: "Rotasi Key", tone: "pending" },
    "key.revoke": { label: "Cabut Key Permanen", tone: "suspended" },
    "user.update_role": { label: "Ubah Role User", tone: "pending" },
  };
  return map[action] || { label: action, tone: "pending" };
}

function formatAuditChips(details: Record<string, unknown>): { key: string; value: string }[] {
  const labelMap: Record<string, string> = {
    customerEmail: "Email",
    userEmail: "Gmail",
    totalIdr: "Nominal",
    balanceIdr: "Saldo",
    deltaIdr: "Perubahan",
    nextBalance: "Saldo Baru",
    carriedBalanceIdr: "Saldo Dipindah",
    keyLast4: "Key",
    label: "Label",
    accountTier: "Tier",
    allowedIpsCount: "Jml IP",
    paymentProofName: "Bukti SS",
    paymentReference: "Ref",
    nextStatus: "Status",
    previousStatus: "Sebelumnya",
    isTopUp: "Top-Up",
    sendEmail: "Kirim Email",
    autoApprove: "Auto-Approve",
    role: "Role",
  };

  const chips: { key: string; value: string }[] = [];
  for (const [k, raw] of Object.entries(details || {})) {
    if (raw === null || raw === undefined || raw === "" || k === "allowedIps") continue;
    let formatted = String(raw);
    if (typeof raw === "number" && (k.includes("Idr") || k.toLowerCase().includes("balance"))) {
      formatted = formatIdr(raw);
    } else if (typeof raw === "boolean") {
      formatted = raw ? "Ya" : "Tidak";
    }
    chips.push({ key: labelMap[k] || k, value: formatted });
  }
  return chips;
}

function NavGlyph({ name }: { name: AdminTab }) {
  switch (name) {
    case "overview":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "orders":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "users-keys":
      return <Icon name="key" size={16} />;
    case "audit":
      return <Icon name="terminal" size={16} />;
  }
}

export function AdminDashboardClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [userKeySubTab, setUserKeySubTab] = useState<UserKeySubTab>("keys");
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

  // Action feedback & Inspector Drawer
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [revealedKey, setRevealedKey] = useState<{ key: string; email: string; context: string } | null>(null);
  const [copiedReveal, setCopiedReveal] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<OrderDrawerTab>("proof");
  const [draftProofUrl, setDraftProofUrl] = useState<string | null | undefined>(undefined);
  const [draftProofName, setDraftProofName] = useState<string>("");
  const [draftRef, setDraftRef] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [copiedInvoiceId, setCopiedInvoiceId] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuState | null>(null);

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
  const [moRef, setMoRef] = useState("");
  const [moNotes, setMoNotes] = useState("");
  const [moProofUrl, setMoProofUrl] = useState<string | undefined>(undefined);
  const [moProofName, setMoProofName] = useState<string | undefined>(undefined);
  const [moAutoApprove, setMoAutoApprove] = useState(false);

  // Modal: Adjust Balance
  const [balanceTarget, setBalanceTarget] = useState<EnrichedKey | null>(null);
  const [balanceDelta, setBalanceDelta] = useState("50000");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4500);
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

  // Dismiss menus / lightbox / drawer with Escape or outside interaction
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxUrl) setLightboxUrl(null);
        else if (openMenu) setOpenMenu(null);
        else if (selectedOrderId) setSelectedOrderId(null);
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".adm-menu-pop") || target?.closest("[data-menu-trigger]")) return;
      setOpenMenu(null);
    };
    const onScrollOrResize = () => setOpenMenu(null);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [lightboxUrl, openMenu, selectedOrderId]);

  const switchTab = (tab: AdminTab) => {
    setOpenMenu(null);
    setActiveTab(tab);
  };

  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId]
  );

  const selectedLinkedKey = useMemo(() => {
    if (!selectedOrder) return undefined;
    const match = keys.find(
      (k) =>
        (selectedOrder.keyHash && k.hash === selectedOrder.keyHash) ||
        k.orderId === selectedOrder.id
    );
    return match?.maskedKey;
  }, [keys, selectedOrder]);

  const openOrderInspector = (order: Order, initialTab: OrderDrawerTab = "proof") => {
    setOpenMenu(null);
    setSelectedOrderId(order.id);
    setDrawerTab(initialTab);
    setDraftProofUrl(order.paymentProofUrl ?? undefined);
    setDraftProofName(order.paymentProofName ?? "");
    setDraftRef(order.paymentReference ?? order.gatewayReference ?? "");
    setDraftNotes(order.adminNotes ?? "");
    setCopiedInvoiceId(false);
  };

  const toggleRowMenu = (kind: "order" | "key", id: string, triggerEl: HTMLElement) => {
    if (openMenu?.kind === kind && openMenu.id === id) {
      setOpenMenu(null);
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const estHeight = kind === "key" ? 210 : 120;
    const flipUp = window.innerHeight - rect.bottom < estHeight;
    setOpenMenu({
      kind,
      id,
      top: flipUp ? Math.max(12, rect.top - estHeight) : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleApproveOrder = async (order: Order, customNotes?: string) => {
    setBusyId(order.id);
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", adminNotes: customNotes }),
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
          context: `Pesanan ${order.id} disetujui & API Key terintegrasi ke akun Gmail pelanggan.`,
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
    setOpenMenu(null);
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

  const handleSaveProofAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setBusyId(`proof-${selectedOrder.id}`);
    try {
      let proofPayload: string | null | undefined;
      if (draftProofUrl === null) {
        proofPayload = selectedOrder.paymentProofUrl ? null : undefined;
      } else if (draftProofUrl && draftProofUrl !== selectedOrder.paymentProofUrl) {
        proofPayload = draftProofUrl;
      }

      const res = await fetch(`/api/admin/orders/${encodeURIComponent(selectedOrder.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_proof",
          paymentProofUrl: proofPayload,
          paymentProofName: draftProofName || undefined,
          paymentReference: draftRef,
          adminNotes: draftNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("error", data.error || "Gagal menyimpan bukti transaksi.");
        return;
      }
      setDraftProofUrl(data.order.paymentProofUrl ?? undefined);
      setDraftProofName(data.order.paymentProofName ?? "");
      showToast("success", `Bukti & catatan transaksi ${selectedOrder.id} disimpan.`);
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
          paymentReference: moRef,
          paymentProofUrl: moProofUrl,
          paymentProofName: moProofName,
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
      setMoRef("");
      setMoNotes("");
      setMoProofUrl(undefined);
      setMoProofName(undefined);
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
    setOpenMenu(null);
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

  const withProofCount = useMemo(
    () => orders.filter((o) => Boolean(o.paymentProofUrl)).length,
    [orders]
  );

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "with-proof") {
      if (!o.paymentProofUrl) return false;
    } else if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) {
      return false;
    }
    if (!orderSearch.trim()) return true;
    const q = orderSearch.trim().toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.packageName.toLowerCase().includes(q) ||
      (o.paymentReference || "").toLowerCase().includes(q)
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
      (k.label || "").toLowerCase().includes(q) ||
      (k.companyName || "").toLowerCase().includes(q)
    );
  });

  const menuOrder =
    openMenu?.kind === "order" ? orders.find((o) => o.id === openMenu.id) ?? null : null;
  const menuKey =
    openMenu?.kind === "key" ? keys.find((k) => k.hash === openMenu.id) ?? null : null;

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
    <div className="adm-shell">
      {/* Sidebar Navigasi */}
      <aside className="adm-sidebar" aria-label="Navigasi Panel Admin">
        <Link href="/" className="adm-brand-row" aria-label="Juragantoken Beranda">
          <span className="adm-brand-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-mark.png" alt="" width={26} height={22} className="adm-brand-logo" />
            <span className="adm-brand-word">
              juragan<span>token.</span>
            </span>
          </span>
          <span className="adm-role-chip">Admin</span>
        </Link>

        <nav className="adm-nav">
          <button
            type="button"
            className={`adm-nav-btn ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => switchTab("overview")}
          >
            <span className="adm-nav-label">
              <NavGlyph name="overview" />
              <span>Ringkasan</span>
            </span>
          </button>

          <button
            type="button"
            className={`adm-nav-btn ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => switchTab("orders")}
          >
            <span className="adm-nav-label">
              <NavGlyph name="orders" />
              <span>Pesanan &amp; Invoice</span>
            </span>
            <span className={`adm-nav-badge ${stats.pendingOrders > 0 ? "is-alert" : ""}`}>
              {stats.pendingOrders > 0 ? `${stats.pendingOrders} baru` : stats.totalOrders}
            </span>
          </button>

          <button
            type="button"
            className={`adm-nav-btn ${activeTab === "users-keys" ? "is-active" : ""}`}
            onClick={() => switchTab("users-keys")}
          >
            <span className="adm-nav-label">
              <NavGlyph name="users-keys" />
              <span>User &amp; API Key</span>
            </span>
            <span className="adm-nav-badge">{stats.activeKeys}</span>
          </button>

          <button
            type="button"
            className={`adm-nav-btn ${activeTab === "audit" ? "is-active" : ""}`}
            onClick={() => switchTab("audit")}
          >
            <span className="adm-nav-label">
              <NavGlyph name="audit" />
              <span>Audit Log</span>
            </span>
            <span className="adm-nav-badge">{auditLogs.length}</span>
          </button>
        </nav>

        <div className="adm-sidebar-foot">
          {adminUser && (
            <div className="adm-admin-card">
              <span className="adm-avatar is-admin" aria-hidden="true">
                {getInitials(adminUser.fullName, adminUser.email)}
              </span>
              <div className="adm-admin-meta">
                <strong>{adminUser.fullName}</strong>
                <span>{adminUser.email}</span>
              </div>
            </div>
          )}
          <div className="adm-foot-btns">
            <Link href="/" className="jt-btn-secondary-clean">
              ← Web Utama
            </Link>
            <button type="button" className="jt-btn-secondary-clean" onClick={handleLogout}>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Workspace Utama */}
      <main className="adm-main">
        {toast && (
          <div className={`jt-alert ${toast.type}`} role="status">
            {toast.text}
          </div>
        )}

        <header className="adm-topbar">
          <div className="adm-topbar-copy">
            <h1>
              {activeTab === "overview" && "Ringkasan Operasional"}
              {activeTab === "orders" && "Pesanan, Invoice & Bukti Transaksi"}
              {activeTab === "users-keys" && "Akun Gmail & Integrasi API Key"}
              {activeTab === "audit" && "Log Audit Aktivitas Admin"}
            </h1>
            <p>
              {activeTab === "overview" &&
                "Verifikasi bukti pembayaran, terbitkan Virtual API Key, dan pantau saldo aktif pelanggan."}
              {activeTab === "orders" &&
                "Periksa screenshot bukti transfer, cetak invoice resmi, dan setujui aktivasi API Key."}
              {activeTab === "users-keys" &&
                "Kelola 1 Universal API Key per akun, sesuaikan saldo IDR, dan atur IP Whitelist Enterprise."}
              {activeTab === "audit" &&
                "Rekam jejak seluruh verifikasi bukti transaksi, persetujuan pesanan, saldo, dan kontrol API Key."}
            </p>
          </div>

          <div className="adm-topbar-actions">
            <button type="button" className="jt-btn-secondary-clean" onClick={() => loadAll()}>
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
              + Terbitkan Key
            </button>
          </div>
        </header>

        {/* TAB 1: RINGKASAN */}
        {activeTab === "overview" && (
          <>
            <section className="adm-kpi-grid" aria-label="Metrik utama">
              <article className={`adm-kpi-card ${stats.pendingOrders > 0 ? "is-highlight" : ""}`}>
                <div className="adm-kpi-top">
                  <span>Menunggu Verifikasi</span>
                  <span className="adm-kpi-dot is-warn" aria-hidden="true" />
                </div>
                <strong className="adm-kpi-val">{stats.pendingOrders}</strong>
                <span className="adm-kpi-sub">dari total {stats.totalOrders} pesanan masuk</span>
              </article>

              <article className="adm-kpi-card">
                <div className="adm-kpi-top">
                  <span>Transaksi Lunas</span>
                  <span className="adm-kpi-dot is-ok" aria-hidden="true" />
                </div>
                <strong className="adm-kpi-val">{formatIdr(stats.totalRevenueIdr)}</strong>
                <span className="adm-kpi-sub">
                  {stats.paidOrders} pesanan · {withProofCount} bukti SS
                </span>
              </article>

              <article className="adm-kpi-card">
                <div className="adm-kpi-top">
                  <span>API Key Aktif</span>
                  <span className="adm-kpi-dot is-blue" aria-hidden="true" />
                </div>
                <strong className="adm-kpi-val">{stats.activeKeys}</strong>
                <span className="adm-kpi-sub">Total saldo aktif {formatIdr(stats.totalBalanceIdr)}</span>
              </article>

              <article className="adm-kpi-card">
                <div className="adm-kpi-top">
                  <span>Akun Gmail Terdaftar</span>
                  <span className="adm-kpi-dot" aria-hidden="true" />
                </div>
                <strong className="adm-kpi-val">{stats.totalUsers}</strong>
                <span className="adm-kpi-sub">Tersinkron dengan {stats.totalKeys} Virtual Key</span>
              </article>
            </section>

            {/* Antrean Pesanan Pending */}
            <section className="adm-card">
              <div className="adm-card-head">
                <div className="adm-card-title-group">
                  <h2>Antrean Verifikasi Pesanan ({pendingOrders.length})</h2>
                  <span>Klik &ldquo;Periksa&rdquo; untuk melihat bukti screenshot transfer atau invoice.</span>
                </div>
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => switchTab("orders")}
                >
                  Lihat Semua Pesanan →
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="jt-empty-box">
                  Seluruh pesanan telah diproses. Tidak ada antrean konfirmasi saat ini.
                </div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Invoice &amp; Waktu</th>
                        <th>Pelanggan</th>
                        <th>Paket</th>
                        <th>Bukti SS</th>
                        <th>Nominal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrders.slice(0, 6).map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="adm-id-pill">{ord.id}</span>
                              <span className="adm-sub-line">{formatDate(ord.createdAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="adm-user-cell">
                              <span className="adm-avatar" aria-hidden="true">
                                {getInitials(ord.customerName, ord.customerEmail)}
                              </span>
                              <div className="jt-cell-stack adm-min-w-0">
                                <span className="jt-cell-primary adm-truncate">{ord.customerName}</span>
                                <span className="adm-sub-line adm-mono-nowrap adm-truncate">{ord.customerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="jt-cell-stack adm-pkg-cell">
                              <span className="jt-cell-primary">{ord.packageName}</span>
                              <span className="adm-sub-line">{ord.methodName}</span>
                            </div>
                          </td>
                          <td>
                            {ord.paymentProofUrl ? (
                              <button
                                type="button"
                                className="adm-proof-btn"
                                onClick={() => openOrderInspector(ord, "proof")}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ord.paymentProofUrl} alt="" className="adm-proof-mini-thumb" />
                                <span>Lihat SS ✓</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="adm-proof-empty-btn"
                                onClick={() => openOrderInspector(ord, "proof")}
                              >
                                + Upload SS
                              </button>
                            )}
                          </td>
                          <td className="jt-num adm-mono-nowrap">{formatIdr(ord.totalIdr)}</td>
                          <td>
                            <div className="adm-row-actions">
                              <button
                                type="button"
                                className="adm-btn-xs"
                                onClick={() => openOrderInspector(ord, "invoice")}
                              >
                                Periksa
                              </button>
                              <button
                                type="button"
                                className="adm-btn-xs is-primary"
                                disabled={busyId === ord.id}
                                onClick={() => handleApproveOrder(ord)}
                              >
                                {busyId === ord.id ? "Memproses..." : "Setujui"}
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

            {/* Akun Gmail Terbaru */}
            <section className="adm-card">
              <div className="adm-card-head">
                <div className="adm-card-title-group">
                  <h2>Akun Gmail Terbaru &amp; Saldo Terintegrasi</h2>
                  <span>Ringkasan kepemilikan key dan riwayat transaksi pengguna.</span>
                </div>
                <button
                  type="button"
                  className="jt-btn-secondary-clean"
                  onClick={() => switchTab("users-keys")}
                >
                  Kelola User &amp; Key →
                </button>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Pengguna</th>
                      <th>Peran</th>
                      <th>Key Aktif</th>
                      <th>Saldo Aktif</th>
                      <th>Transaksi</th>
                      <th>Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            <span className={`adm-avatar ${u.role === "admin" ? "is-admin" : ""}`} aria-hidden="true">
                              {getInitials(u.fullName, u.email)}
                            </span>
                            <div className="jt-cell-stack adm-min-w-0">
                              <span className="jt-cell-primary adm-truncate">{u.fullName || "Pengguna"}</span>
                              <span className="adm-sub-line adm-mono-nowrap adm-truncate">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`jt-status ${u.role === "admin" ? "active" : "expired"}`}>
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="jt-num">{u.activeKeysCount} key</td>
                        <td className="jt-num adm-mono-nowrap">{formatIdr(u.totalBalanceIdr)}</td>
                        <td className="jt-cell-muted">{u.ordersCount} transaksi</td>
                        <td>
                          <button
                            type="button"
                            className="adm-btn-xs"
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

        {/* TAB 2: PESANAN, INVOICE & BUKTI TRANSAKSI */}
        {activeTab === "orders" && (
          <section className="adm-card">
            <div className="adm-controls">
              <div className="jt-filter-pills" role="tablist" aria-label="Filter status pesanan">
                {[
                  { id: "all", label: `Semua (${orders.length})` },
                  { id: "pending", label: `Menunggu (${stats.pendingOrders})` },
                  { id: "paid", label: `Lunas (${stats.paidOrders})` },
                  { id: "with-proof", label: `Ada Bukti SS (${withProofCount})` },
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

              <div className="adm-search-box">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  placeholder="Cari nomor invoice, Gmail, nama, atau referensi..."
                  aria-label="Cari pesanan masuk"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="jt-empty-box">Tidak ada pesanan yang cocok dengan filter atau kata kunci.</div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Invoice &amp; Waktu</th>
                      <th>Pelanggan</th>
                      <th>Paket &amp; Jalur</th>
                      <th>Bukti Transaksi</th>
                      <th>Total &amp; Status</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <div className="jt-cell-stack">
                            <span className="adm-id-pill">{ord.id}</span>
                            <span className="adm-sub-line">{formatDate(ord.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="adm-user-cell">
                            <span className="adm-avatar" aria-hidden="true">
                              {getInitials(ord.customerName, ord.customerEmail)}
                            </span>
                            <div className="jt-cell-stack adm-min-w-0">
                              <span className="jt-cell-primary adm-truncate">{ord.customerName}</span>
                              <span className="adm-sub-line adm-mono-nowrap adm-truncate">{ord.customerEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="jt-cell-stack adm-pkg-cell">
                            <span className="jt-cell-primary">{ord.packageName}</span>
                            <div className="adm-meta-row">
                              <span className={`adm-tier-tag ${ord.accountTier === "enterprise" ? "is-ent" : ""}`}>
                                {ord.accountTier === "enterprise" ? "Enterprise B2B" : "Standard"}
                              </span>
                              <span className="adm-sub-line">{ord.methodName}</span>
                              {ord.requiresTaxInvoice && <span className="adm-tier-tag is-tax">Faktur Pajak</span>}
                            </div>
                            {(ord.companyName || ord.department || ord.paymentReference) && (
                              <span className="adm-sub-line adm-wrap-text">
                                {[ord.companyName, ord.department, ord.paymentReference].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {ord.paymentProofUrl ? (
                            <button
                              type="button"
                              className="adm-proof-btn"
                              onClick={() => openOrderInspector(ord, "proof")}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ord.paymentProofUrl} alt="" className="adm-proof-mini-thumb" />
                              <span>Lihat SS ✓</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="adm-proof-empty-btn"
                              onClick={() => openOrderInspector(ord, "proof")}
                            >
                              + Upload SS
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="jt-cell-stack">
                            <span className="jt-num adm-mono-nowrap">{formatIdr(ord.totalIdr)}</span>
                            <div>
                              <span className={`jt-status ${ord.status}`}>
                                {ord.status === "paid" ? "Lunas" : ord.status === "pending" ? "Menunggu" : "Expired"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="adm-row-actions">
                            <button
                              type="button"
                              className="adm-btn-xs"
                              onClick={() => openOrderInspector(ord, "invoice")}
                            >
                              Invoice
                            </button>
                            {ord.status === "pending" && (
                              <button
                                type="button"
                                className="adm-btn-xs is-primary"
                                disabled={busyId === ord.id}
                                onClick={() => handleApproveOrder(ord)}
                              >
                                {busyId === ord.id ? "Memproses..." : "Setujui"}
                              </button>
                            )}
                            <button
                              type="button"
                              data-menu-trigger="true"
                              className="adm-btn-xs"
                              aria-haspopup="menu"
                              aria-expanded={openMenu?.kind === "order" && openMenu.id === ord.id}
                              aria-label={`Opsi pesanan ${ord.id}`}
                              onClick={(e) => toggleRowMenu("order", ord.id, e.currentTarget)}
                            >
                              •••
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
        )}

        {/* TAB 3: USER GMAIL & API KEY (SUB-TABBED & RAPIH) */}
        {activeTab === "users-keys" && (
          <section className="adm-card">
            <div className="adm-controls">
              <div className="adm-subtabs" role="tablist" aria-label="Pilih tampilan User atau API Key">
                <button
                  type="button"
                  role="tab"
                  aria-selected={userKeySubTab === "keys"}
                  className={`adm-subtab ${userKeySubTab === "keys" ? "is-active" : ""}`}
                  onClick={() => {
                    setOpenMenu(null);
                    setUserKeySubTab("keys");
                  }}
                >
                  API Key Terintegrasi ({filteredKeys.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={userKeySubTab === "users"}
                  className={`adm-subtab ${userKeySubTab === "users" ? "is-active" : ""}`}
                  onClick={() => {
                    setOpenMenu(null);
                    setUserKeySubTab("users");
                  }}
                >
                  Akun Gmail Terdaftar ({filteredUsers.length})
                </button>
              </div>

              <div className="jt-toolbar">
                {userKeySubTab === "keys" && (
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
                )}

                <div className="adm-search-box">
                  <Icon name="search" size={15} />
                  <input
                    type="search"
                    placeholder="Cari email Gmail, nama, atau 4 digit terakhir key..."
                    aria-label="Cari akun Gmail atau API Key"
                    value={userKeySearch}
                    onChange={(e) => setUserKeySearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {userKeySubTab === "keys" ? (
              filteredKeys.length === 0 ? (
                <div className="jt-empty-box">Belum ada API Key yang cocok dengan filter ini.</div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>API Key</th>
                        <th>Pemilik (Gmail)</th>
                        <th>Tier &amp; Paket</th>
                        <th>IP Whitelist</th>
                        <th>Saldo &amp; Status</th>
                        <th>Kelola</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeys.map((k) => (
                        <tr key={k.hash}>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="adm-id-pill">{k.maskedKey}</span>
                              <span className="adm-sub-line">{k.label || "Universal Key"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="adm-user-cell">
                              <span className="adm-avatar" aria-hidden="true">
                                {getInitials(k.ownerName, k.ownerEmail)}
                              </span>
                              <div className="jt-cell-stack adm-min-w-0">
                                <span className="jt-cell-primary adm-truncate">{k.ownerName}</span>
                                <span className="adm-sub-line adm-mono-nowrap adm-truncate">{k.ownerEmail}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="jt-cell-stack adm-tier-cell">
                              <div>
                                <span className={`adm-tier-tag ${k.accountTier === "enterprise" ? "is-ent" : ""}`}>
                                  {k.accountTier === "enterprise" ? "Enterprise B2B" : "Standard"}
                                </span>
                              </div>
                              <span className="adm-sub-line">
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
                              <span className="adm-sub-line">Bebas (Standard)</span>
                            )}
                          </td>
                          <td>
                            <div className="jt-cell-stack">
                              <span className="jt-num adm-mono-nowrap">{formatIdr(k.balanceIdr)}</span>
                              <div>
                                <span className={`jt-status ${k.status}`}>
                                  {k.status === "active"
                                    ? "Aktif"
                                    : k.status === "suspended"
                                    ? "Suspended"
                                    : "Revoked"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {k.status === "revoked" ? (
                              <span className="adm-sub-line">Dicabut permanen</span>
                            ) : (
                              <div className="adm-row-actions">
                                <button
                                  type="button"
                                  className="adm-btn-xs"
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
                                  data-menu-trigger="true"
                                  className="adm-btn-xs"
                                  aria-haspopup="menu"
                                  aria-expanded={openMenu?.kind === "key" && openMenu.id === k.hash}
                                  disabled={busyId === k.hash}
                                  onClick={(e) => toggleRowMenu("key", k.hash, e.currentTarget)}
                                >
                                  Kelola ▾
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredUsers.length === 0 ? (
              <div className="jt-empty-box">Belum ada akun Gmail yang cocok dengan pencarian.</div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
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
                          <div className="adm-user-cell">
                            <span className={`adm-avatar ${u.role === "admin" ? "is-admin" : ""}`} aria-hidden="true">
                              {getInitials(u.fullName, u.email)}
                            </span>
                            <div className="jt-cell-stack adm-min-w-0">
                              <span className="jt-cell-primary adm-truncate">{u.fullName || "Pengguna"}</span>
                              <span className="adm-sub-line adm-mono-nowrap adm-truncate">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`jt-status ${u.role === "admin" ? "active" : "expired"}`}>
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td>
                          {u.keys.length === 0 ? (
                            <span className="adm-sub-line">Belum ada API Key</span>
                          ) : (
                            <div className="jt-cell-stack">
                              {u.keys.slice(0, 2).map((k) => (
                                <span key={k.hash} className="adm-mono-nowrap">
                                  {k.maskedKey} ({k.status})
                                </span>
                              ))}
                              {u.keys.length > 2 && (
                                <span className="adm-sub-line">+{u.keys.length - 2} key lainnya</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="jt-num adm-mono-nowrap">{formatIdr(u.totalBalanceIdr)}</td>
                        <td className="adm-sub-line">{formatDate(u.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="adm-btn-xs is-primary"
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
        )}

        {/* TAB 4: AUDIT LOG */}
        {activeTab === "audit" && (
          <section className="adm-card">
            <div className="adm-card-head">
              <div className="adm-card-title-group">
                <h2>Riwayat Aktivitas Administrator ({auditLogs.length})</h2>
                <span>Setiap perubahan status pesanan, bukti transaksi, saldo, dan IP Whitelist tercatat otomatis.</span>
              </div>
            </div>
            {auditLogs.length === 0 ? (
              <div className="jt-empty-box">Belum ada catatan aktivitas admin.</div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Admin</th>
                      <th>Aktivitas</th>
                      <th>Target</th>
                      <th>Rincian Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const meta = formatAuditMeta(log.action);
                      const chips = formatAuditChips(log.details);
                      return (
                        <tr key={log.id}>
                          <td className="adm-sub-line">{formatDate(log.createdAt)}</td>
                          <td className="adm-mono-nowrap">{log.adminEmail}</td>
                          <td>
                            <span className={`jt-status ${meta.tone}`}>{meta.label}</span>
                          </td>
                          <td>
                            <span className="adm-id-pill">
                              {log.targetType.toUpperCase()} · {log.targetId}
                            </span>
                          </td>
                          <td>
                            {chips.length === 0 ? (
                              <span className="adm-sub-line">—</span>
                            ) : (
                              <div className="adm-audit-chips">
                                {chips.map((c) => (
                                  <span key={c.key} className="adm-audit-chip">
                                    <strong>{c.key}:</strong> {c.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* FLOATING POPOVER MENU (••• & Kelola ▾) */}
      {openMenu && menuOrder && (
        <div
          className="adm-menu-pop"
          role="menu"
          style={{ top: `${openMenu.top}px`, right: `${openMenu.right}px` }}
        >
          <button
            type="button"
            className="adm-menu-item"
            onClick={() => openOrderInspector(menuOrder, "proof")}
          >
            <span>{menuOrder.paymentProofUrl ? "Lihat / Ganti Bukti SS" : "Upload Bukti Pembayaran"}</span>
          </button>
          <button
            type="button"
            className="adm-menu-item"
            onClick={() => openOrderInspector(menuOrder, "invoice")}
          >
            <span>Buka &amp; Cetak Invoice</span>
          </button>
          {menuOrder.status === "pending" && (
            <>
              <div className="adm-menu-sep" />
              <button
                type="button"
                className="adm-menu-item is-danger"
                onClick={() => handleExpireOrder(menuOrder)}
              >
                <span>Tandai Expired</span>
              </button>
            </>
          )}
        </div>
      )}

      {openMenu && menuKey && (
        <div
          className="adm-menu-pop"
          role="menu"
          style={{ top: `${openMenu.top}px`, right: `${openMenu.right}px` }}
        >
          <button
            type="button"
            className="adm-menu-item"
            onClick={() => {
              setOpenMenu(null);
              setIpTarget(menuKey);
              setIpInput((menuKey.allowedIps || []).join(", "));
              setIpTier(menuKey.accountTier === "enterprise" ? "enterprise" : "standard");
              setIpCompany(menuKey.companyName || "");
              setIpDept(menuKey.department || "");
            }}
          >
            <span>Atur IP Whitelist &amp; Tier</span>
          </button>
          <button
            type="button"
            className="adm-menu-item"
            onClick={() => handleKeyAction(menuKey, menuKey.status === "active" ? "suspend" : "activate")}
          >
            <span>{menuKey.status === "active" ? "Suspend Sementara" : "Aktifkan Kembali"}</span>
          </button>
          <button
            type="button"
            className="adm-menu-item"
            onClick={() => handleKeyAction(menuKey, "rotate")}
          >
            <span>Rotasi API Key</span>
          </button>
          <div className="adm-menu-sep" />
          <button
            type="button"
            className="adm-menu-item is-danger"
            onClick={() => handleKeyAction(menuKey, "revoke")}
          >
            <span>Cabut Permanen (Revoke)</span>
          </button>
        </div>
      )}

      {/* SIGNATURE 760PX SLIDE-OVER DRAWER: INVOICE & BUKTI TRANSAKSI */}
      {selectedOrder && (
        <div
          className="adm-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail Invoice & Bukti ${selectedOrder.id}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderId(null);
          }}
        >
          <aside className="adm-drawer">
            <div className="adm-drawer-head">
              <div>
                <div className="adm-drawer-title-row">
                  <h3>{selectedOrder.id}</h3>
                  <span className={`jt-status ${selectedOrder.status}`}>
                    {selectedOrder.status === "paid"
                      ? "Lunas"
                      : selectedOrder.status === "pending"
                      ? "Menunggu Verifikasi"
                      : "Expired"}
                  </span>
                  <span className={`adm-tier-tag ${selectedOrder.accountTier === "enterprise" ? "is-ent" : ""}`}>
                    {selectedOrder.accountTier === "enterprise" ? "Enterprise B2B" : "Standard"}
                  </span>
                </div>
                <p className="adm-drawer-sub">
                  {selectedOrder.customerName} ({selectedOrder.customerEmail}) ·{" "}
                  <strong>{formatIdr(selectedOrder.totalIdr)}</strong> via {selectedOrder.methodName}
                </p>
              </div>
              <button
                type="button"
                className="jt-modal-close"
                aria-label="Tutup inspector"
                onClick={() => setSelectedOrderId(null)}
              >
                ✕
              </button>
            </div>

            <div className="adm-drawer-tabs" role="tablist" aria-label="Pilih tab detail transaksi">
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === "proof"}
                className={`adm-drawer-tab ${drawerTab === "proof" ? "is-active" : ""}`}
                onClick={() => setDrawerTab("proof")}
              >
                <span>Bukti Pembayaran (SS)</span>
                {selectedOrder.paymentProofUrl && <span className="adm-nav-badge">Ada ✓</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === "invoice"}
                className={`adm-drawer-tab ${drawerTab === "invoice" ? "is-active" : ""}`}
                onClick={() => setDrawerTab("invoice")}
              >
                <span>Invoice Resmi</span>
              </button>
            </div>

            <div className="adm-drawer-body">
              {drawerTab === "proof" ? (
                <>
                  <div className="adm-drawer-section">
                    <div className="adm-drawer-section-head">
                      <h4>Screenshot Pembayaran Berhasil</h4>
                      {selectedOrder.paymentProofUrl && (
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            className="adm-btn-xs"
                            onClick={() => setLightboxUrl(selectedOrder.paymentProofUrl || null)}
                          >
                            Perbesar Penuh
                          </button>
                          <a
                            href={selectedOrder.paymentProofUrl}
                            download={selectedOrder.paymentProofName || `${selectedOrder.id}-bukti.png`}
                            className="adm-btn-xs"
                            style={{ textDecoration: "none" }}
                          >
                            Unduh SS
                          </a>
                        </div>
                      )}
                    </div>

                    {selectedOrder.paymentProofUrl ? (
                      <div className="adm-proof-frame">
                        <button
                          type="button"
                          className="adm-proof-img-btn"
                          onClick={() => setLightboxUrl(selectedOrder.paymentProofUrl || null)}
                          title="Klik untuk memperbesar screenshot"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedOrder.paymentProofUrl}
                            alt={`Bukti pembayaran ${selectedOrder.id}`}
                          />
                        </button>
                        <div className="adm-proof-bar">
                          <span>
                            File: <strong>{selectedOrder.paymentProofName || "bukti-transfer.png"}</strong> ·{" "}
                            Sumber:{" "}
                            {selectedOrder.paymentProofUploadedBy === "admin" ? "Admin" : "Pelanggan"}
                          </span>
                          <span>Diunggah: {formatDate(selectedOrder.paymentProofUploadedAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="jt-empty-box" style={{ background: "#f8fafc", borderRadius: "10px", padding: "22px" }}>
                        Belum ada screenshot bukti transfer terlampir pada transaksi ini. Pelanggan atau Admin dapat mengunggahnya melalui form di bawah.
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveProofAndNotes} className="adm-drawer-section">
                    <div className="adm-drawer-section-head">
                      <h4>Unggah / Perbarui Bukti &amp; Referensi</h4>
                    </div>

                    <ProofUploadDropzone
                      value={draftProofUrl ?? undefined}
                      fileName={draftProofName}
                      disabled={busyId === `proof-${selectedOrder.id}`}
                      onChange={({ url, fileName }) => {
                        setDraftProofUrl(url);
                        if (fileName) setDraftProofName(fileName);
                      }}
                    />

                    <div className="jt-form-row-2">
                      <div className="jt-field" style={{ marginBottom: 0 }}>
                        <label htmlFor="drw-ref">Referensi Transfer / RRN / Bank</label>
                        <input
                          id="drw-ref"
                          type="text"
                          className="jt-input jt-mono"
                          placeholder="Misal: RRN 261118094122 · QRIS BCA"
                          value={draftRef}
                          onChange={(e) => setDraftRef(e.target.value)}
                        />
                      </div>
                      <div className="jt-field" style={{ marginBottom: 0 }}>
                        <label htmlFor="drw-notes">Catatan Verifikasi Admin</label>
                        <input
                          id="drw-notes"
                          type="text"
                          className="jt-input"
                          placeholder="Misal: Mutasi bank terkonfirmasi masuk"
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        className="jt-btn-primary-solid"
                        disabled={busyId === `proof-${selectedOrder.id}`}
                      >
                        {busyId === `proof-${selectedOrder.id}`
                          ? "Menyimpan..."
                          : "Simpan Bukti & Catatan"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="adm-drawer-section">
                    <div className="adm-drawer-section-head">
                      <h4>Pratinjau Invoice Resmi</h4>
                      <div className="adm-row-actions">
                        <button
                          type="button"
                          className="jt-btn-secondary-clean"
                          onClick={async () => {
                            await navigator.clipboard.writeText(selectedOrder.id);
                            setCopiedInvoiceId(true);
                            window.setTimeout(() => setCopiedInvoiceId(false), 1800);
                          }}
                        >
                          {copiedInvoiceId ? "No. Invoice Tersalin ✓" : "Salin No. Invoice"}
                        </button>
                        <button
                          type="button"
                          className="jt-btn-primary-solid"
                          onClick={() => window.print()}
                        >
                          Cetak / Simpan PDF
                        </button>
                      </div>
                    </div>
                  </div>
                  <InvoiceDocument order={selectedOrder} linkedKeyMasked={selectedLinkedKey} />
                </>
              )}
            </div>

            <div className="adm-drawer-foot">
              <span className="adm-sub-line">
                {selectedOrder.paidAt
                  ? `Dilunasi pada ${formatDate(selectedOrder.paidAt)}`
                  : `Dibuat pada ${formatDate(selectedOrder.createdAt)}`}
              </span>
              <div className="adm-drawer-foot-right">
                {selectedOrder.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="jt-btn-danger-ghost"
                      disabled={busyId === selectedOrder.id}
                      onClick={() => handleExpireOrder(selectedOrder)}
                    >
                      Tandai Expired
                    </button>
                    <button
                      type="button"
                      className="jt-btn-primary-solid"
                      disabled={busyId === selectedOrder.id}
                      onClick={() => handleApproveOrder(selectedOrder, draftNotes)}
                    >
                      {busyId === selectedOrder.id
                        ? "Memproses..."
                        : "Setujui & Terbitkan API Key"}
                    </button>
                  </>
                )}
                {selectedOrder.status !== "pending" && (
                  <button
                    type="button"
                    className="jt-btn-secondary-clean"
                    onClick={() => setSelectedOrderId(null)}
                  >
                    Tutup Panel
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX UNTUK ZOOM SS */}
      {lightboxUrl && (
        <div
          className="adm-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Perbesar bukti transaksi"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Tangkapan layar bukti transaksi penuh"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="adm-lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <a
              href={lightboxUrl}
              download="bukti-pembayaran-juragantoken.png"
              className="jt-btn-secondary-clean"
            >
              Unduh Gambar
            </a>
            <button
              type="button"
              className="jt-btn-primary-solid"
              onClick={() => setLightboxUrl(null)}
            >
              Tutup Zoom (Esc)
            </button>
          </div>
        </div>
      )}

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

      {/* MODAL 2: BUAT PESANAN MANUAL + OPSIONAL BUKTI SS */}
      {manualOrderOpen && (
        <div className="jt-modal-backdrop" role="dialog" aria-modal="true" aria-label="Buat Pesanan Manual">
          <div className="jt-modal-dialog is-wide">
            <div className="jt-modal-head">
              <h3>Catat Pesanan &amp; Bukti Transaksi Manual</h3>
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
              <div className="jt-form-row-2">
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
                  <label htmlFor="mo-ref">Referensi Transfer / RRN (Opsional)</label>
                  <input
                    id="mo-ref"
                    type="text"
                    className="jt-input jt-mono"
                    value={moRef}
                    onChange={(e) => setMoRef(e.target.value)}
                    placeholder="Misal: QRIS-261120..."
                  />
                </div>
              </div>
              <div className="jt-form-row-2">
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
                <div className="jt-field">
                  <label htmlFor="mo-notes">Catatan Admin (Opsional)</label>
                  <input
                    id="mo-notes"
                    type="text"
                    className="jt-input"
                    value={moNotes}
                    onChange={(e) => setMoNotes(e.target.value)}
                    placeholder="Keterangan mutasi / kebutuhan"
                  />
                </div>
              </div>

              <ProofUploadDropzone
                value={moProofUrl}
                fileName={moProofName}
                label="Lampiran SS Pembayaran (Opsional)"
                onChange={({ url, fileName }) => {
                  setMoProofUrl(url ?? undefined);
                  setMoProofName(fileName);
                }}
              />

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

      {/* MODAL 4: ONE-TIME REVEAL API KEY */}
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
                  window.setTimeout(() => setCopiedReveal(false), 2000);
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
