"use client";

import { useEffect, useState } from "react";
import {
  GATEWAY_BASE_URL,
  GATEWAY_ORIGIN,
  RetailPackage,
  ModelItem,
  paymentMethods,
  unitsForBudget,
  retailPackages,
  modelsCatalog,
  isPerImage,
} from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon, BrandMark } from "@/components/ui/Icon";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { PaymentSuccessMark } from "@/components/ui/PaymentSuccessMark";

type SingaPayModalProps = {
  open: boolean;
  pkg: RetailPackage | null;
  model?: ModelItem | null;
  onClose: () => void;
  initialMode?: "new" | "topup";
  initialTargetKey?: string;
};

// Official authentic vector logos from idn-finlogos (Xendit / Midtrans standard)
function PaymentLogo({ type }: { type: string }) {
  const logoMap: Record<string, string> = {
    gopay: "/assets/payment-logos/gopay.svg",
    dana: "/assets/payment-logos/dana.svg",
    ovo: "/assets/payment-logos/ovo.svg",
    shopeepay: "/assets/payment-logos/shopeepay.svg",
    bni: "/assets/payment-logos/bni.svg",
    bri: "/assets/payment-logos/bri.svg",
    bca: "/assets/payment-logos/bca.svg",
    mandiri: "/assets/payment-logos/mandiri.svg",
    seabank: "/assets/payment-logos/seabank.png",
    permata: "/assets/payment-logos/permata.svg",
    cimb: "/assets/payment-logos/cimb.svg",
    "cimb-niaga": "/assets/payment-logos/cimb-niaga.svg",
    bsi: "/assets/payment-logos/bsi.svg",
    qris: "/assets/payment-logos/qris.svg",
    gpn: "/assets/payment-logos/gpn.svg",
    linkaja: "/assets/payment-logos/linkaja.svg",
  };

  const key = (type || "").toLowerCase().replace(/^(va-|transfer-)/, "");
  const src = logoMap[key] || logoMap[(type || "").toLowerCase()];
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={type.toUpperCase()}
        loading="eager"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.src.includes("seabank.png")) {
            img.src = "/assets/payment-logos/seabank.svg";
          }
        }}
        style={{
          maxHeight: "22px",
          maxWidth: "58px",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
    );
  }

  return (
    <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>
      {type.toUpperCase()}
    </span>
  );
}

export function SingaPayModal({
  open,
  pkg: initialPkg,
  model,
  onClose,
  initialMode = "new",
  initialTargetKey = "",
}: SingaPayModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<RetailPackage | null>(initialPkg);
  const [activeModel, setActiveModel] = useState<ModelItem | null>(model || null);
  const pkg = selectedPkg || initialPkg;
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [openCategory, setOpenCategory] = useState<"qris" | "ewallet" | "va">("qris");
  const [step, setStep] = useState<"checkout" | "payment" | "success">("checkout");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [orderToken, setOrderToken] = useState("");
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [_paidAt, setPaidAt] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 menit
  const [apiKeyGenerated, setApiKeyGenerated] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [guideTab, setGuideTab] = useState<"mbanking" | "ibanking" | "atm">("mbanking");
  const [_emailStatus, setEmailStatus] = useState<"none" | "idle" | "sending" | "sent" | "simulated" | "error">("idle");
  const [_emailMessage, setEmailMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState<{
    badge: string;
    title: string;
    subtitle: string;
  }>({
    badge: "MEMPROSES TRANSAKSI",
    title: "Menyiapkan Lembar Pembayaran...",
    subtitle: "Menerbitkan kode tagihan resmi & instruksi pembayaran...",
  });

  // Mode Top-Up Kunci yang Ada
  const [checkoutMode, setCheckoutMode] = useState<"new" | "topup">(initialMode);
  const [targetApiKey, setTargetApiKey] = useState(initialTargetKey);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [verifiedKeyData, setVerifiedKeyData] = useState<{
    maskedKey: string;
    planName: string;
    balanceIdr: number;
  } | null>(null);
  const [keyVerifyError, setKeyVerifyError] = useState("");
  const [savedKeyHint, setSavedKeyHint] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialPkg) {
        setSelectedPkg(initialPkg);
      }
      setActiveModel(model || null);
      if (initialMode) {
        setCheckoutMode(initialMode);
      }
      if (initialTargetKey) {
        setTargetApiKey(initialTargetKey);
        verifyTargetKey(initialTargetKey);
      }

      if (typeof window !== "undefined") {
        const timer = setTimeout(() => {
          try {
            const last = sessionStorage.getItem("jt_last_api_key");
            if (last) setSavedKeyHint(last);
          } catch {
            // ignore
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [open, initialPkg, initialMode, initialTargetKey, model]);

  const verifyTargetKey = async (keyToVerify: string) => {
    const clean = keyToVerify.trim();
    if (!clean) return;
    setVerifyingKey(true);
    setKeyVerifyError("");
    try {
      const res = await fetch("/api/keys/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.key) {
        setVerifiedKeyData({
          maskedKey: data.key.maskedKey,
          planName: data.key.planName,
          balanceIdr: data.key.balanceIdr,
        });
        setKeyVerifyError("");
      } else {
        setVerifiedKeyData(null);
        setKeyVerifyError(data.error || "Kunci API tidak ditemukan di server.");
      }
    } catch {
      setVerifiedKeyData(null);
      setKeyVerifyError("Gagal memverifikasi kunci. Cek koneksi internet.");
    } finally {
      setVerifyingKey(false);
    }
  };

  const adminWaNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990";

  const handleClose = () => {
    setStep("checkout");
    setOpenCategory("qris");
    setSelectedMethod("qris");
    setApiKeyGenerated("");
    setTimeLeft(15 * 60);
    setEmailStatus("idle");
    setEmailMessage("");
    setInvoiceId("");
    setOrderToken("");
    setTotalPaid(null);
    setPaidAt("");
    setIsSubmitting(false);
    setIsConfirming(false);
    setIsTransitioning(false);
    setCheckoutMode("new");
    setTargetApiKey("");
    setVerifiedKeyData(null);
    setKeyVerifyError("");
    onClose();
  };

  useEffect(() => {
    const el = document.querySelector(".classai-checkout-modal");
    if (el) {
      el.scrollTop = 0;
    }
  }, [step]);

  useEffect(() => {
    if (step !== "payment") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Polling status pesanan secara otomatis
  useEffect(() => {
    if (step !== "payment" || !invoiceId || !orderToken) return;

    let active = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${invoiceId}`, {
          headers: { "x-order-token": orderToken },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data.success || !data.order) return;

        if (data.order.status === "paid") {
          if (data.order.apiKey) {
            setApiKeyGenerated(data.order.apiKey);
            try {
              sessionStorage.setItem("jt_last_api_key", data.order.apiKey);
            } catch {
              // ignore
            }
          }
          if (data.order.paidAt) setPaidAt(data.order.paidAt);
          if (data.order.emailStatus) setEmailStatus(data.order.emailStatus);
          if (data.order.emailMessage) setEmailMessage(data.order.emailMessage);
          
          setTransitionConfig({
            badge: "PEMBAYARAN DITERIMA",
            title: "Pembayaran Terkonfirmasi!",
            subtitle: "Sinkronisasi mutasi rekening & mengaktifkan API Key universal Anda...",
          });
          setIsTransitioning(true);
          setTimeout(() => {
            setIsTransitioning(false);
            setStep("success");
          }, 1400);
        } else if (data.order.status === "expired") {
          alert("Waktu pemesanan telah kedaluwarsa. Silakan lakukan pemesanan ulang.");
          setStep("checkout");
        }
      } catch {
        // network noise during polling
      }
    }, 2500);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [step, invoiceId, orderToken]);

  const formatIdr = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const _formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const cleanPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return cleaned;
  };

  const currentMethod = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];
  const adminFee = currentMethod.feeAmount ?? 0;
  const basePrice = pkg ? pkg.priceIdr : 0;
  const totalPrice = basePrice + adminFee;

  const resolveFallbackModel = (p?: RetailPackage | null): ModelItem | null => {
    if (!p) return null;
    if (p.id === "pkt-mhs-uji") return modelsCatalog.find((m) => m.id === "deepseek-v4-flash") || null;
    if (p.id === "pkt-mhs-starter") return modelsCatalog.find((m) => m.id === "gemini-3.8-flash") || null;
    if (p.id === "pkt-skripsi-koding") return modelsCatalog.find((m) => m.id === "claude-sonnet-5-5") || null;
    if (p.id === "pkt-pro-builder") return modelsCatalog.find((m) => m.id === "claude-sonnet-5-5") || null;
    return (
      modelsCatalog.find((m) => p.recommendedModel.toLowerCase().includes(m.name.toLowerCase())) ||
      modelsCatalog[0] ||
      null
    );
  };

  const targetModel = activeModel || resolveFallbackModel(pkg);
  const currentBudget = totalPaid || totalPrice || (pkg ? pkg.priceIdr : 0);
  const estInteractions = targetModel ? unitsForBudget(targetModel, currentBudget) : 0;
  const unitLabel = targetModel && isPerImage(targetModel) ? "Gambar" : "Interaksi";
  const estText = targetModel
    ? `±${new Intl.NumberFormat("id-ID").format(estInteractions)} ${unitLabel} · ${targetModel.name}`
    : (pkg ? pkg.estToken : "Saldo Universal");

  const gatewayHost = (GATEWAY_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "https://api.tokotokenai.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");


  const isEwalletSelected = selectedMethod.startsWith("va-gopay") || selectedMethod.startsWith("va-dana") || selectedMethod.startsWith("va-ovo") || selectedMethod.startsWith("va-shopeepay");
  const isVaSelected = selectedMethod.startsWith("va-bni") || selectedMethod.startsWith("va-bri") || selectedMethod.startsWith("va-bca") || selectedMethod.startsWith("va-mandiri") || selectedMethod.startsWith("transfer-");

  // Options definition matching classai.id screenshots
  const ewalletOptions = [
    {
      id: "va-gopay",
      code: "gopay",
      name: "GoPay",
      desc: "Setujui pembayaran di aplikasi Gojek / GoPay.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-dana",
      code: "dana",
      name: "DANA",
      desc: "Setujui pembayaran di aplikasi DANA.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-ovo",
      code: "ovo",
      name: "OVO",
      desc: "Setujui pembayaran di aplikasi OVO.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-shopeepay",
      code: "shopeepay",
      name: "ShopeePay",
      desc: "Setujui pembayaran di aplikasi Shopee.",
      fee: "payment fee Bebas Biaya"
    }
  ];

  const bankOptions = [
    {
      id: "va-bni",
      code: "bni",
      name: "BNI",
      desc: "Bayar lewat BNI Mobile, ATM, atau bank lain.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-bri",
      code: "bri",
      name: "BRI",
      desc: "Bayar lewat BRImo, ATM, atau bank lain.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-bca",
      code: "bca",
      name: "BCA",
      desc: "Bayar lewat BCA Mobile, KlikBCA, atau myBCA.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-mandiri",
      code: "mandiri",
      name: "Mandiri",
      desc: "Bayar lewat Livin' by Mandiri atau ATM.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-seabank",
      code: "seabank",
      name: "SeaBank",
      desc: "Bayar lewat aplikasi SeaBank atau transfer bank.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-permata",
      code: "permata",
      name: "Permata",
      desc: "Bayar lewat PermataMobile X atau ATM.",
      fee: "payment fee Bebas Biaya"
    },
    {
      id: "va-cimb",
      code: "cimb",
      name: "CIMB Niaga",
      desc: "Bayar lewat OCTO Mobile atau ATM.",
      fee: "payment fee Bebas Biaya"
    }
  ];

  const handleProceedPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerEmail.trim() || !customerName.trim() || !pkg) {
      if (!customerName.trim()) alert("Silakan masukkan Nama Lengkap terlebih dahulu.");
      else if (!customerEmail.trim()) alert("Silakan masukkan Alamat Email untuk pengiriman bukti transaksi.");
      return;
    }

    if (checkoutMode === "topup") {
      if (!targetApiKey.trim()) {
        alert("Silakan masukkan API Key yang ingin diisi ulang (top-up).");
        return;
      }
      if (!verifiedKeyData) {
        alert("Silakan verifikasi API Key terlebih dahulu sebelum melanjutkan.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          methodId: selectedMethod,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          existingApiKey: checkoutMode === "topup" ? targetApiKey.trim() : undefined,
          modelName: targetModel ? targetModel.name : undefined,
          estToken: estText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoiceId(data.invoiceId);
        setOrderToken(data.orderToken);
        setTotalPaid(data.totalIdr);

        setTransitionConfig({
          badge: "MEMPROSES TRANSAKSI",
          title: "Menyiapkan Lembar Pembayaran...",
          subtitle: selectedMethod === "qris" 
            ? "Menerbitkan kode QRIS nasional resmi & mengamankan pesanan..." 
            : `Menghubungkan ke Virtual Account ${currentMethod.name}...`,
        });
        setIsTransitioning(true);
        await new Promise((resolve) => setTimeout(resolve, 1400));
        setIsTransitioning(false);
        setStep("payment");
      } else {
        alert(data.error || "Gagal membuat pesanan.");
      }
    } catch {
      alert("Gagal terhubung ke server pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!invoiceId || !orderToken) return;
    setIsConfirming(true);
    try {
      const confirmRes = await fetch(`/api/orders/${invoiceId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-order-token": orderToken,
        },
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        alert(confirmData.error || "Gagal memverifikasi simulasi pembayaran.");
        setIsConfirming(false);
        return;
      }

      const readRes = await fetch(`/api/orders/${invoiceId}`, {
        headers: { "x-order-token": orderToken },
      });
      const readData = await readRes.json();
      if (readRes.ok && readData.success && readData.order) {
        const order = readData.order;
        if (order.apiKey) {
          setApiKeyGenerated(order.apiKey);
          try {
            sessionStorage.setItem("jt_last_api_key", order.apiKey);
          } catch {
            // ignore
          }
        }
        if (order.paidAt) setPaidAt(order.paidAt);
        if (order.emailStatus) setEmailStatus(order.emailStatus);
        if (order.emailMessage) setEmailMessage(order.emailMessage);

        setTransitionConfig({
          badge: "VERIFIKASI REAL-TIME",
          title: "Memverifikasi Pembayaran...",
          subtitle: "Sinkronisasi mutasi rekening & mengaktifkan API Key universal Anda...",
        });
        setIsTransitioning(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsTransitioning(false);
        setStep("success");
      }
    } catch {
      alert("Gagal memproses verifikasi pembayaran.");
    } finally {
      setIsConfirming(false);
    }
  };

  const copyToClipboard = async (text: string, type: "key" | "url" | "va" | "amount" | "invoice") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else if (type === "va") {
        setCopiedVa(true);
        setTimeout(() => setCopiedVa(false), 2000);
      } else if (type === "amount") {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      } else if (type === "invoice") {
        setCopiedInvoice(true);
        setTimeout(() => setCopiedInvoice(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const openWhatsAppOrder = () => {
    if (!customerName.trim()) {
      alert("Silakan masukkan Nama Lengkap terlebih dahulu.");
      return;
    }
    const inv = invoiceId || "INV-" + Date.now().toString().slice(-6);
    const msg = `Halo Admin Juragan Token! 👋
Saya ingin memesan token API AI:
• Invoice: *${inv}*
• Paket: *${pkg?.name}* (${estText})
• Model AI: *${targetModel ? targetModel.name : "Universal"}*
• Metode: ${currentMethod.name}
• Total: *${formatIdr(totalPaid || totalPrice)}*
• Nama: *${customerName}*
• Email: *${customerEmail || "-"}*
Mohon dibantu konfirmasi ya!`;
    window.open(`https://wa.me/${cleanPhoneNumber(adminWaNumber)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!pkg) return null;

  return (
    <Dialog open={open} onClose={handleClose} label="Pembayaran Juragan Token" panelClassName="modal classai-checkout-modal">
      {/* ========================================================================= */}
      {/* SELF-CONTAINED SCOPED CSS ENGINE (IMMUNE TO CSS DROP / LOAD DELAY)        */}
      {/* ========================================================================= */}
      <style>{`
        .classai-checkout-modal {
          width: 520px !important;
          max-width: 100% !important;
          padding: 24px 24px 0 24px !important;
          border-radius: 22px !important;
          background: #ffffff !important;
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
          box-shadow: 0 20px 45px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.04) !important;
          overflow-y: auto !important;
          max-height: 92vh !important;
          position: relative !important;
          box-sizing: border-box !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #0f172a !important;
        }
        .classai-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding-bottom: 14px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          margin-bottom: 16px !important;
        }
        .classai-brand {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .classai-logo-icon {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .classai-brand-text {
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #0f172a !important;
          letter-spacing: -0.02em !important;
        }
        .classai-brand-text strong {
          color: #0a58ca !important;
          font-weight: 800 !important;
        }
        .classai-header-right {
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
        }
        .classai-billing-text {
          font-size: 13px !important;
          color: #64748b !important;
          font-weight: 500 !important;
        }
        .classai-close-icon-btn {
          width: 28px !important;
          height: 28px !important;
          border-radius: 50% !important;
          border: 1px solid #e2e8f0 !important;
          background: #f8fafc !important;
          color: #64748b !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          padding: 0 !important;
        }
        .classai-close-icon-btn:hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
        }
        .classai-disclaimer-banner {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          margin-bottom: 16px !important;
        }
        .classai-disclaimer-banner p {
          font-size: 12px !important;
          line-height: 1.5 !important;
          color: #64748b !important;
          margin: 0 !important;
        }
        .classai-order-summary-card {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          background: #f0f7ff !important;
          border: 1px solid #bfdbfe !important;
          border-radius: 14px !important;
          padding: 12px 16px !important;
          margin-bottom: 16px !important;
        }
        .cosc-left {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 12px !important;
          min-width: 0 !important;
        }
        .cosc-logo-wrap {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 44px !important;
          height: 44px !important;
          border-radius: 10px !important;
          background: #ffffff !important;
          border: 1px solid #dbeafe !important;
          flex-shrink: 0 !important;
          box-shadow: 0 1px 3px rgba(10, 88, 202, 0.06) !important;
        }
        .cosc-info {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
          min-width: 0 !important;
        }
        .cosc-pkg-name {
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #0a2540 !important;
          line-height: 1.25 !important;
        }
        .cosc-pkg-model {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #0a58ca !important;
          line-height: 1.3 !important;
        }
        .cosc-price {
          font-size: 19px !important;
          font-weight: 800 !important;
          color: #0a58ca !important;
          letter-spacing: -0.02em !important;
        }
        .classai-input-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
        }
        .cig-col {
          display: flex !important;
          flex-direction: column !important;
        }
        .cig-label {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #334155 !important;
        }
        .cig-input {
          width: 100% !important;
          height: 40px !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 9px !important;
          padding: 8px 12px !important;
          font-size: 13px !important;
          background: #ffffff !important;
          color: #0f172a !important;
          outline: none !important;
          box-sizing: border-box !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        .cig-input:focus {
          border-color: #0a58ca !important;
          box-shadow: 0 0 0 3px rgba(10, 88, 202, 0.12) !important;
        }
        .classai-methods-stack {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
        }
        .classai-method-card {
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 14px !important;
          padding: 13px 15px !important;
          background: #ffffff !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .classai-method-card:hover {
          border-color: #cbd5e1 !important;
        }
        .classai-method-card.selected {
          border-color: #0a58ca !important;
          background: #f8fbff !important;
          box-shadow: 0 0 0 1px #0a58ca !important;
        }
        .cmc-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }
        .cmc-left-group {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }
        .cmc-icon-box {
          width: 38px !important;
          height: 38px !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }
        .cmc-icon-box.qris-blue {
          background: #0a58ca !important;
        }
        .cmc-icon-box.slate-gray {
          background: #f1f5f9 !important;
        }
        .cmc-text-col {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
        }
        .cmc-title-row {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .cmc-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #0f172a !important;
        }
        .cmc-tercepat-badge {
          background: #dbeafe !important;
          color: #1e40af !important;
          font-size: 10.5px !important;
          font-weight: 750 !important;
          padding: 2px 7px !important;
          border-radius: 6px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 3px !important;
        }
        .cmc-subtitle {
          font-size: 12px !important;
          color: #64748b !important;
        }
        .cmc-expanded-list {
          margin-top: 12px !important;
          padding-top: 12px !important;
          border-top: 1px solid #e2e8f0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }
        .cmc-option-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 10px 12px !important;
          border-radius: 10px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }
        .cmc-option-row:hover {
          background: #f8fafc !important;
        }
        .cmc-option-row.active {
          border-color: #0a58ca !important;
          background: #eff6ff !important;
        }
        .cmc-option-left {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }
        .cmc-brand-badge-box {
          width: 76px !important;
          height: 36px !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 9px !important;
          padding: 3px 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
          transition: all 0.15s ease !important;
        }
        .cmc-option-text {
          display: flex !important;
          flex-direction: column !important;
        }
        .cmc-option-name {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #0f172a !important;
        }
        .cmc-option-desc {
          font-size: 11px !important;
          color: #64748b !important;
        }
        .cmc-option-fee {
          font-size: 10px !important;
          color: #10b981 !important;
          font-weight: 600 !important;
        }
        .cmc-custom-radio {
          width: 18px !important;
          height: 18px !important;
          border-radius: 50% !important;
          border: 2px solid #cbd5e1 !important;
          display: inline-block !important;
          position: relative !important;
          box-sizing: border-box !important;
        }
        .cmc-custom-radio.checked {
          border-color: #0a58ca !important;
          background: #0a58ca !important;
        }
        .cmc-custom-radio.checked::after {
          content: "" !important;
          position: absolute !important;
          inset: 4px !important;
          background: #ffffff !important;
          border-radius: 50% !important;
        }
        .classai-sticky-bottom {
          position: sticky !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          background: #ffffff !important;
          border-top: 1px solid #f1f5f9 !important;
          padding: 14px 24px 20px 24px !important;
          margin: 0 -24px !important;
          box-shadow: 0 -10px 25px rgba(15, 23, 42, 0.05) !important;
          z-index: 10 !important;
        }
        .csb-top-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 10px !important;
        }
        .csb-total-label {
          font-size: 13px !important;
          color: #64748b !important;
          font-weight: 600 !important;
        }
        .csb-total-amount {
          font-size: 18px !important;
          font-weight: 800 !important;
          color: #0a2540 !important;
        }
        .csb-btn-row {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }
        .csb-btn-kembali {
          flex: 1 !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          color: #334155 !important;
          font-size: 13.5px !important;
          font-weight: 650 !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }
        .csb-btn-kembali:hover {
          background: #f8fafc !important;
        }
        .csb-btn-bayar {
          flex: 2 !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background: #0a58ca !important;
          color: #ffffff !important;
          font-size: 14px !important;
          font-weight: 750 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer !important;
          box-shadow: 0 4px 12px rgba(10, 88, 202, 0.25) !important;
          transition: all 0.15s ease !important;
        }
        .csb-btn-bayar:hover:not(:disabled) {
          background: #084298 !important;
          transform: translateY(-1px) !important;
        }
        .csb-btn-bayar:disabled {
          opacity: 0.65 !important;
          cursor: not-allowed !important;
        }
        .cpv-timer-strip {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          background: #eff6ff !important;
          border: 1px solid #bfdbfe !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          margin-bottom: 14px !important;
        }
        .cpv-status-badge {
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #1d4ed8 !important;
        }
        .cpv-timer-count {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          font-size: 12px !important;
          color: #475569 !important;
        }
        .cpv-timer-count strong {
          font-size: 14px !important;
          color: #dc2626 !important;
          font-family: monospace !important;
        }
        .cpv-invoice-info-card {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 12px 14px !important;
          margin-bottom: 14px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }
        .cpv-info-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          font-size: 12.5px !important;
        }
        .cpv-label {
          font-size: 11px !important;
          color: #64748b !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em !important;
        }
        .cpv-val-copy {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .cpv-mini-copy-btn {
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          border-radius: 6px !important;
          padding: 2px 7px !important;
          font-size: 11px !important;
          cursor: pointer !important;
        }
        .classai-qris-display-card {
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 18px !important;
          text-align: center !important;
          margin-bottom: 16px !important;
        }
        .cqdc-national-title {
          display: block !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          color: #dc2626 !important;
          letter-spacing: 0.04em !important;
        }
        .cqdc-merchant-name {
          display: block !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          color: #0f172a !important;
        }
        .cqdc-nmid {
          display: block !important;
          font-size: 11px !important;
          color: #64748b !important;
          margin-top: 4px !important;
        }
        .classai-qris-image-wrapper {
          display: flex !important;
          justify-content: center !important;
          padding: 12px !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          max-width: 260px !important;
          margin: 14px auto !important;
        }
        .classai-qris-real-img {
          width: 230px !important;
          height: 230px !important;
          object-fit: contain !important;
        }
        .cqdc-scan-hint {
          font-size: 12px !important;
          color: #64748b !important;
          line-height: 1.5 !important;
          margin: 10px 0 !important;
        }
        .cqdc-amount-box {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 10px !important;
          margin-top: 10px !important;
        }
        .cqdc-amount-label {
          display: block !important;
          font-size: 10.5px !important;
          color: #64748b !important;
          font-weight: 700 !important;
        }
        .cqdc-amount-row {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          margin-top: 4px !important;
        }
        .cqdc-price {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0a58ca !important;
        }
        .cqdc-copy-btn {
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          border-radius: 6px !important;
          padding: 3px 8px !important;
          font-size: 11px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          cursor: pointer !important;
        }
        .classai-destination-card {
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 18px !important;
          margin-bottom: 16px !important;
        }
        .cdc-head {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 14px !important;
          padding-bottom: 10px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .cdc-tag {
          font-size: 11px !important;
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          font-weight: 700 !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
        }
        .cdc-field-label {
          display: block !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #64748b !important;
          margin-bottom: 6px !important;
        }
        .cdc-code-box {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
        .cdc-code-box code {
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          letter-spacing: 0.05em !important;
        }
        .cdc-copy-btn {
          border: 1px solid #0a58ca !important;
          background: #0a58ca !important;
          color: #ffffff !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
        }
        .cdc-holder {
          display: block !important;
          font-size: 11px !important;
          color: #64748b !important;
          margin-top: 6px !important;
        }
        .cpv-action-buttons {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          margin-top: 14px !important;
          padding-bottom: 20px !important;
        }
        .cpv-verify-btn {
          width: 100% !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background: #0a58ca !important;
          color: #ffffff !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer !important;
        }
        .cpv-back-link-btn {
          width: 100% !important;
          padding: 8px !important;
          border: none !important;
          background: transparent !important;
          color: #64748b !important;
          font-size: 12.5px !important;
          cursor: pointer !important;
          text-align: center !important;
        }
        .cpv-wa-help-btn {
          width: 100% !important;
          height: 40px !important;
          border-radius: 10px !important;
          border: 1px solid #86efac !important;
          background: #f0fdf4 !important;
          color: #166534 !important;
          font-size: 12.5px !important;
          font-weight: 650 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          cursor: pointer !important;
        }
        .classai-success-view {
          padding: 10px 0 24px 0 !important;
          text-align: center !important;
        }
        .csv-title {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #0a2540 !important;
          margin: 12px 0 6px 0 !important;
        }
        .csv-sub {
          font-size: 13px !important;
          color: #475569 !important;
          line-height: 1.5 !important;
          margin-bottom: 18px !important;
        }
        .csv-key-card {
          background: #0f172a !important;
          color: #ffffff !important;
          border-radius: 14px !important;
          padding: 16px !important;
          text-align: left !important;
          margin-bottom: 14px !important;
        }
        .csv-key-label {
          font-size: 10.5px !important;
          color: #94a3b8 !important;
          font-weight: 750 !important;
          letter-spacing: 0.05em !important;
        }
        .csv-key-display {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          margin: 8px 0 !important;
        }
        .csv-key-display code {
          font-family: monospace !important;
          font-size: 13px !important;
          color: #38bdf8 !important;
          word-break: break-all !important;
        }
        .csv-copy-key-btn {
          border: none !important;
          background: #0a58ca !important;
          color: #ffffff !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          cursor: pointer !important;
          white-space: nowrap !important;
        }
        .csv-key-note {
          display: block !important;
          font-size: 11px !important;
          color: #94a3b8 !important;
          line-height: 1.4 !important;
        }
        .csv-setup-box {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          margin-bottom: 16px !important;
        }
        .csb-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          font-size: 12px !important;
        }
        .csb-tag {
          font-weight: 750 !important;
          color: #64748b !important;
          font-size: 10.5px !important;
        }
        .csb-copy-sm {
          border: 1px solid #cbd5e1 !important;
          background: #ffffff !important;
          border-radius: 6px !important;
          padding: 2px 8px !important;
          font-size: 11px !important;
          cursor: pointer !important;
        }
        .csv-footer-btns {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          margin-top: 16px !important;
        }
        .csv-done-btn {
          width: 100% !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background: #0a58ca !important;
          color: #ffffff !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
        }
        .csv-wa-share-btn {
          width: 100% !important;
          height: 40px !important;
          border-radius: 10px !important;
          border: 1px solid #86efac !important;
          background: #f0fdf4 !important;
          color: #166534 !important;
          font-size: 13px !important;
          font-weight: 650 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          cursor: pointer !important;
        }
        @media (max-width: 540px) {
          .classai-checkout-modal {
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            padding: 18px 16px 0 16px !important;
          }
          .classai-input-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .classai-sticky-bottom {
            margin: 0 -16px 0 -16px !important;
            padding: 12px 16px 16px 16px !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* CLASSAI-STYLE TOP HEADER                                                 */}
      {/* ========================================================================= */}
      <div
        className="classai-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "14px",
          borderBottom: "1px solid #f1f5f9",
          marginBottom: "16px",
        }}
      >
        <div className="classai-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="brand-mark" aria-hidden="true" style={{ width: "28px", height: "22px", display: "inline-flex", alignItems: "center" }}>
            <BrandMark />
          </span>
          <span className="classai-brand-text" style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            juragan<span className="brand-light" style={{ color: "#0a58ca", fontWeight: 500 }}>token</span><span className="brand-dot" style={{ color: "#0284c7" }}>.</span>
          </span>
        </div>
        <div className="classai-header-right" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span className="classai-billing-text" style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
            Kredit &amp; billing
          </span>
          <button
            type="button"
            className="classai-close-icon-btn"
            onClick={handleClose}
            aria-label="Tutup"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      </div>

      {isTransitioning ? (
        <div className="cpv-transition-loader">
          <div className="cpv-loader-spinner-box">
            <div className="cpv-spinner-ring" />
            <div className="cpv-spinner-inner-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a58ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <span className="cpv-loader-badge">{transitionConfig.badge}</span>
          <h3 className="cpv-loader-title">{transitionConfig.title}</h3>
          <p className="cpv-loader-sub">{transitionConfig.subtitle}</p>
          <div className="cpv-loader-progressbar">
            <div className="cpv-loader-progressfill" />
          </div>
          <div className="cpv-loader-security-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Enkripsi Bank Grade 256-bit Terproteksi</span>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* STEP 1: CHECKOUT SCREEN (100% IDENTICAL TO CLASSAI.ID SCREENSHOTS)        */}
          {/* ========================================================================= */}
          {step === "checkout" && (
        <form onSubmit={handleProceedPayment} className="classai-checkout-form">
          {/* Top Notice Disclaimer Banner */}
          <div
            className="classai-disclaimer-banner"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "10px 14px",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontSize: "12px", lineHeight: 1.5, color: "#64748b", margin: 0 }}>
              Ketentuan: Saldo &amp; virtual key langsung aktif begitu pembayaran terkonfirmasi. Saldo berlaku selamanya (lifetime) tanpa potongan bulanan. Add-on dan saldo dapat diklaim garansi bila terjadi kendala (laporkan dalam 7 hari).
            </p>
          </div>

          {/* Package Order Info: Hanya Nama Paket, Model AI, dan Harga Saja */}
          <div
            className="classai-order-summary-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f0f7ff",
              border: "1px solid #bfdbfe",
              borderRadius: "14px",
              padding: "14px 18px",
              marginBottom: "16px",
            }}
          >
            <div className="cosc-left" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
              {targetModel ? (
                <div className="cosc-logo-wrap" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#ffffff", border: "1px solid #dbeafe", flexShrink: 0, boxShadow: "0 2px 6px rgba(10, 88, 202, 0.08)" }}>
                  <ProviderLogo provider={targetModel.providerId} size={28} />
                </div>
              ) : (
                <div className="cosc-logo-wrap" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", flexShrink: 0, boxShadow: "0 2px 6px rgba(10, 88, 202, 0.08)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a58ca" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(10, 88, 202, 0.18)" />
                  </svg>
                </div>
              )}
              <div className="cosc-info" style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <strong className="cosc-pkg-name" style={{ display: "block", fontSize: "16px", fontWeight: 800, color: "#0a2540", lineHeight: 1.25 }}>
                  {pkg ? pkg.name : "Paket Token"}
                </strong>
                <span className="cosc-pkg-model" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#0a58ca", lineHeight: 1.3 }}>
                  Model AI: {targetModel ? targetModel.name : "Universal"}
                </span>
              </div>
            </div>
            <div className="cosc-right" style={{ flexShrink: 0, paddingLeft: "16px", textAlign: "right" }}>
              <strong className="cosc-price" style={{ fontSize: "20px", fontWeight: 800, color: "#0a58ca", letterSpacing: "-0.02em" }}>
                {pkg ? formatIdr(pkg.priceIdr) : "Rp 0"}
              </strong>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* OPSI MODE: TERBITKAN KUNCI BARU VS TOP-UP KUNCI LAMA                 */}
          {/* ===================================================================== */}
          <div
            className="classai-mode-selector cosc-mode-switcher"
            style={{
              display: "flex",
              gap: "8px",
              padding: "4px",
              background: "#f1f5f9",
              borderRadius: "12px",
              marginBottom: "14px",
            }}
          >
            <button
              type="button"
              className={`cosc-mode-btn ${checkoutMode === "new" ? "active" : ""}`}
              onClick={() => {
                setCheckoutMode("new");
                setKeyVerifyError("");
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="7.5" cy="15.5" r="4.5" />
                <path d="M10.7 12.3 21 2" />
                <path d="m16 7 3 3" />
                <path d="m14 9 2 2" />
              </svg>
              <span>Terbitkan Kunci Baru</span>
            </button>
            <button
              type="button"
              className={`cosc-mode-btn ${checkoutMode === "topup" ? "active" : ""}`}
              onClick={() => {
                setCheckoutMode("topup");
                if (savedKeyHint && !targetApiKey) {
                  setTargetApiKey(savedKeyHint);
                  verifyTargetKey(savedKeyHint);
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 16V8" />
                <path d="m8.5 11.5 3.5-3.5 3.5 3.5" />
              </svg>
              <span>Top-Up Kunci yang Ada</span>
            </button>
          </div>

          {/* FORM INPUT TOP-UP */}
          {checkoutMode === "topup" && (
            <div
              className="classai-topup-card"
              style={{
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: "6px",
                }}
              >
                Kunci API yang Hendak Diisi Saldo:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="jt-live-xxxxxxxxxxxxxxxxxxxx"
                  value={targetApiKey}
                  onChange={(e) => {
                    setTargetApiKey(e.target.value);
                    setVerifiedKeyData(null);
                    setKeyVerifyError("");
                  }}
                  style={{
                    flex: 1,
                    height: "40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    padding: "8px 12px",
                    fontSize: "12.5px",
                    fontFamily: "monospace",
                    background: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  className="classai-verify-btn"
                  onClick={() => verifyTargetKey(targetApiKey)}
                  disabled={verifyingKey || !targetApiKey.trim()}
                >
                  {verifyingKey ? "Mengecek..." : "Verifikasi"}
                </button>
              </div>

              {savedKeyHint && !verifiedKeyData && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                  Kunci dari pesanan sebelumnya:{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetApiKey(savedKeyHint);
                      verifyTargetKey(savedKeyHint);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#0a58ca",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Gunakan {savedKeyHint.slice(0, 11)}...{savedKeyHint.slice(-4)}
                  </button>
                </div>
              )}

              {verifiedKeyData && (
                <div
                  style={{
                    marginTop: "10px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "#065f46",
                  }}
                >
                  <div style={{ fontWeight: 750, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>✓</span>
                    <span>Kunci Terverifikasi ({verifiedKeyData.maskedKey})</span>
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "11.5px", color: "#047857" }}>
                    Saldo saat ini: <b>{formatIdr(verifiedKeyData.balanceIdr)}</b> ➔ Setelah top-up: <b>{formatIdr(verifiedKeyData.balanceIdr + pkg.priceIdr)}</b> (+{formatIdr(pkg.priceIdr)}).
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", marginTop: "3px" }}>
                    Setting di Cursor / VS Code / Claude Code Anda tidak perlu diubah!
                  </div>
                </div>
              )}

              {keyVerifyError && (
                <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#e11d48", fontWeight: 600 }}>
                  ✕ {keyVerifyError}
                </div>
              )}
            </div>
          )}

          <div
            className="classai-input-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div className="cig-col" style={{ display: "flex", flexDirection: "column" }}>
              <label
                className="cig-label"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Nama Lengkap
                <input
                  type="text"
                  required
                  placeholder="Nama Anda / Panggilan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="cig-input"
                  style={{
                    width: "100%",
                    height: "40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>
            </div>
            <div className="cig-col" style={{ display: "flex", flexDirection: "column" }}>
              <label
                className="cig-label"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Email (Kredensial API dikirim ke sini)
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="cig-input"
                  style={{
                    width: "100%",
                    height: "40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PAYMENT METHODS ACCORDION - EXACT MATCH TO CLASSAI.ID                */}
          {/* ===================================================================== */}
          <div className="classai-methods-stack" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* 1. INSTAN (QRIS) CARD */}
            <div
              className={`classai-method-card ${selectedMethod === "qris" ? "selected" : ""}`}
              style={{
                border: selectedMethod === "qris" ? "1.5px solid #0a58ca" : "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "13px 15px",
                background: selectedMethod === "qris" ? "#f8fbff" : "#ffffff",
                boxShadow: selectedMethod === "qris" ? "0 0 0 1px #0a58ca" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setSelectedMethod("qris");
                setOpenCategory("qris");
              }}
            >
              <div className="cmc-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="cmc-left-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    className="cmc-icon-box qris-blue"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "#0a58ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <circle cx="6.5" cy="6.5" r="0.75" fill="#FFFFFF" />
                      <circle cx="17.5" cy="6.5" r="0.75" fill="#FFFFFF" />
                      <circle cx="17.5" cy="17.5" r="0.75" fill="#FFFFFF" />
                      <circle cx="6.5" cy="17.5" r="0.75" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <div className="cmc-text-col" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div className="cmc-title-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong className="cmc-title" style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                        Instan (QRIS)
                      </strong>
                      <span
                        className="cmc-tercepat-badge"
                        style={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "10.5px",
                          fontWeight: 750,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Tercepat
                      </span>
                    </div>
                    <span className="cmc-subtitle" style={{ fontSize: "12px", color: "#64748b" }}>
                      Dipilih: QRIS
                    </span>
                  </div>
                </div>
                <div className="cmc-right-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. E-WALLET CARD */}
            <div
              className={`classai-method-card ${isEwalletSelected ? "selected" : ""}`}
              style={{
                border: isEwalletSelected ? "1.5px solid #0a58ca" : "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "13px 15px",
                background: isEwalletSelected ? "#f8fbff" : "#ffffff",
                boxShadow: isEwalletSelected ? "0 0 0 1px #0a58ca" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                className="cmc-header"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => {
                  if (openCategory === "ewallet") {
                    setOpenCategory("qris");
                  } else {
                    setOpenCategory("ewallet");
                    if (!isEwalletSelected) setSelectedMethod("va-gopay");
                  }
                }}
              >
                <div className="cmc-left-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    className="cmc-icon-box slate-gray"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="cmc-text-col" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong className="cmc-title" style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      E-Wallet
                    </strong>
                    <span className="cmc-subtitle" style={{ fontSize: "12px", color: "#64748b" }}>
                      GoPay, DANA
                    </span>
                  </div>
                </div>
                <div className="cmc-right-action">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: openCategory === "ewallet" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {openCategory === "ewallet" && (
                <div className="cmc-expanded-list">
                  {ewalletOptions.map((item) => {
                    const isChecked = selectedMethod === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`cmc-option-row ${isChecked ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMethod(item.id);
                        }}
                      >
                        <div className="cmc-option-left">
                          <div className="cmc-brand-badge-box">
                            <PaymentLogo type={item.code} />
                          </div>
                          <div className="cmc-option-text">
                            <strong className="cmc-option-name">{item.name}</strong>
                            <span className="cmc-option-desc">{item.desc}</span>
                            <span className="cmc-option-fee">{item.fee}</span>
                          </div>
                        </div>
                        <div className="cmc-radio-wrap">
                          <span className={`cmc-custom-radio ${isChecked ? "checked" : ""}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. TRANSFER BANK / VIRTUAL ACCOUNT CARD */}
            <div
              className={`classai-method-card ${isVaSelected ? "selected" : ""}`}
              style={{
                border: isVaSelected ? "1.5px solid #0a58ca" : "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "13px 15px",
                background: isVaSelected ? "#f8fbff" : "#ffffff",
                boxShadow: isVaSelected ? "0 0 0 1px #0a58ca" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                className="cmc-header"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => {
                  if (openCategory === "va") {
                    setOpenCategory("qris");
                  } else {
                    setOpenCategory("va");
                    if (!isVaSelected) setSelectedMethod("va-bni");
                  }
                }}
              >
                <div className="cmc-left-group" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    className="cmc-icon-box slate-gray"
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
                    </svg>
                  </div>
                  <div className="cmc-text-col" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong className="cmc-title" style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Transfer Bank / Virtual Account
                    </strong>
                    <span className="cmc-subtitle" style={{ fontSize: "12px", color: "#64748b" }}>
                      BCA, Mandiri, BNI, BRI, SeaBank, Permata, CIMB Niaga
                    </span>
                  </div>
                </div>
                <div className="cmc-right-action">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: openCategory === "va" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {openCategory === "va" && (
                <div className="cmc-expanded-list">
                  {bankOptions.map((item) => {
                    const isChecked = selectedMethod === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`cmc-option-row ${isChecked ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMethod(item.id);
                        }}
                      >
                        <div className="cmc-option-left">
                          <div className="cmc-brand-badge-box">
                            <PaymentLogo type={item.code} />
                          </div>
                          <div className="cmc-option-text">
                            <strong className="cmc-option-name">{item.name}</strong>
                            <span className="cmc-option-desc">{item.desc}</span>
                            <span className="cmc-option-fee">{item.fee}</span>
                          </div>
                        </div>
                        <div className="cmc-radio-wrap">
                          <span className={`cmc-custom-radio ${isChecked ? "checked" : ""}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Space buffer for fixed bottom bar */}
          <div style={{ height: "90px" }} />

          {/* ===================================================================== */}
          {/* STICKY BOTTOM ACTION BAR - EXACT MATCH TO CLASSAI.ID                  */}
          {/* ===================================================================== */}
          <div
            className="classai-sticky-bottom"
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              padding: "14px 24px 20px 24px",
              margin: "0 -24px",
              boxShadow: "0 -10px 25px rgba(15, 23, 42, 0.05)",
              zIndex: 10,
            }}
          >
            <div className="csb-top-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span className="csb-total-label" style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total</span>
              <strong className="csb-total-amount" style={{ fontSize: "18px", fontWeight: 800, color: "#0a2540" }}>{formatIdr(totalPrice)}</strong>
            </div>
            <div className="csb-btn-row" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                className="csb-btn-kembali"
                onClick={handleClose}
              >
                Kembali
              </button>
              <button
                type="submit"
                className="csb-btn-bayar"
                disabled={isSubmitting}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>{isSubmitting ? "Menyiapkan..." : `Bayar ${formatIdr(totalPrice)}`}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PAYMENT INVOICE VIEW (REAL QRIS CODE DISPLAY)                     */}
      {/* ========================================================================= */}
      {step === "payment" && (
        <div className="classai-payment-view">
          {/* Timer Banner */}
          {timeLeft > 0 ? (
            <div className="cpv-timer-strip" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
              <span className="cpv-status-badge" style={{ fontSize: "12px", fontWeight: 700, color: "#1d4ed8" }}>Menunggu Pembayaran</span>
              <div className="cpv-timer-count" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                <span>Sisa Waktu:</span>
                <strong style={{ fontSize: "14px", color: "#dc2626", fontFamily: "monospace" }}>{formatTime(timeLeft)}</strong>
              </div>
            </div>
          ) : (
            <div className="cpv-timer-strip expired" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
              <span className="cpv-status-badge" style={{ fontSize: "12px", fontWeight: 700, color: "#be123c" }}>Batas Waktu Habis</span>
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(15 * 60);
                  setInvoiceId(`INV-JT-${Date.now().toString(36).toUpperCase()}`);
                }}
                style={{ background: "#ffffff", border: "1px solid #fda4af", color: "#be123c", borderRadius: "6px", padding: "4px 10px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
              >
                Perbarui Tagihan ↻
              </button>
            </div>
          )}

          {/* Invoice ID Header */}
          <div className="cpv-invoice-info-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div className="cpv-info-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span className="cpv-label" style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>NO. INVOICE</span>
              <div className="cpv-val-copy" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <code style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{invoiceId || "INV-JT-LIVE"}</code>
                <button
                  type="button"
                  className="cpv-mini-copy-btn"
                  onClick={() => copyToClipboard(invoiceId, "invoice")}
                  style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "2px 7px", fontSize: "11px", cursor: "pointer" }}
                >
                  {copiedInvoice ? "Tersalin! ✓" : "Salin"}
                </button>
              </div>
            </div>
            <div className="cpv-info-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
              <span className="cpv-label" style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.04em" }}>PAKET AI</span>
              <strong style={{ color: "#0f172a" }}>{pkg.name} ({estText})</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROFESSIONAL MIDTRANS / XENDIT STYLE QRIS & VA DISPLAY CARD               */}
          {/* ========================================================================= */}
          {selectedMethod === "qris" ? (
            <div
              className="midtrans-qris-ticket"
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "18px",
                boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              {/* Top Official Banner with QRIS & GPN Logos */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {/* Official QRIS Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/payment-logos/qris.svg"
                  alt="QRIS - Quick Response Code Indonesian Standard"
                  style={{ height: "26px", width: "auto", objectFit: "contain", display: "block" }}
                />
                {/* Official GPN Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/payment-logos/gpn.svg"
                  alt="GPN - Gerbang Pembayaran Nasional"
                  style={{ height: "24px", width: "auto", objectFit: "contain", display: "block" }}
                />
              </div>

              {/* Red-Orange Accent Line */}
              <div style={{ height: "3.5px", background: "linear-gradient(90deg, #dc2626 0%, #ea580c 100%)" }} />

              {/* Merchant & National Standard Header */}
              <div style={{ padding: "16px 20px 8px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: "#dc2626", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  STANDAR PEMBAYARAN NASIONAL
                </span>
                <h4 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 850, color: "#0f172a" }}>
                  PT JURAGAN TOKEN INDONESIA
                </h4>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "3px 10px", borderRadius: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 650, color: "#475569" }}>
                    NMID: ID1020084920194 · A01
                  </span>
                </div>
              </div>

              {/* The Scan Frame with Professional Corner Aiming Brackets (Midtrans / Xendit Style) */}
              <div style={{ padding: "10px 20px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    position: "relative",
                    background: "#ffffff",
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    width: "250px",
                    height: "250px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* 4 Red Signature Corner Brackets */}
                  <span style={{ position: "absolute", top: "6px", left: "6px", width: "18px", height: "18px", borderTop: "3px solid #dc2626", borderLeft: "3px solid #dc2626", borderTopLeftRadius: "5px" }} />
                  <span style={{ position: "absolute", top: "6px", right: "6px", width: "18px", height: "18px", borderTop: "3px solid #dc2626", borderRight: "3px solid #dc2626", borderTopRightRadius: "5px" }} />
                  <span style={{ position: "absolute", bottom: "6px", left: "6px", width: "18px", height: "18px", borderBottom: "3px solid #dc2626", borderLeft: "3px solid #dc2626", borderBottomLeftRadius: "5px" }} />
                  <span style={{ position: "absolute", bottom: "6px", right: "6px", width: "18px", height: "18px", borderBottom: "3px solid #dc2626", borderRight: "3px solid #dc2626", borderBottomRightRadius: "5px" }} />

                  {/* Real Scan-Ready QR Code */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/qris-code.png"
                    alt="QRIS Code PT Juragan Token Indonesia"
                    style={{ width: "210px", height: "210px", objectFit: "contain", display: "block" }}
                    onError={(e) => { e.currentTarget.src = "/qris.png"; }}
                  />
                </div>

                {/* Download QR Button */}
                <a
                  href="/images/qris-code.png"
                  download={`QRIS-JuraganToken-${invoiceId || "INV"}.png`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: "12px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#0a58ca",
                    padding: "7px 16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textDecoration: "none",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(10, 88, 202, 0.08)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Unduh Kode QR (Simpan Gambar)</span>
                </a>
              </div>

              {/* Total Amount Strip */}
              <div
                style={{
                  background: "#f8fafc",
                  borderTop: "1px dashed #cbd5e1",
                  borderBottom: "1px dashed #cbd5e1",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>TOTAL PEMBAYARAN</span>
                  <strong style={{ fontSize: "19px", fontWeight: 850, color: "#0a58ca" }}>{formatIdr(totalPrice)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    padding: "6px 12px",
                    fontSize: "11.5px",
                    fontWeight: 650,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="copy" size={13} />
                  <span>{copiedAmount ? "Tersalin! ✓" : "Salin Nominal"}</span>
                </button>
              </div>

              {/* Supported Payment Apps Strip (Clean, symmetrical grid) */}
              <div className="cpv-supported-apps">
                <span className="cpv-supported-label">
                  Dukungan Pembayaran Melalui Aplikasi Terdaftar:
                </span>
                <div className="cpv-bank-grid">
                  {["bca", "mandiri", "bri", "bni", "gopay", "ovo", "dana", "shopeepay", "linkaja"].map((m) => (
                    <div key={m} className="cpv-bank-badge" title={m.toUpperCase()}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/assets/payment-logos/${m === "shopeepay" ? "shopeepay.svg" : `${m}.svg`}`}
                        alt={m.toUpperCase()}
                        className="cpv-bank-badge-img"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="midtrans-va-ticket"
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "18px",
                boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              {/* Header with selected Bank Logo */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "74px",
                      height: "34px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 6px",
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <PaymentLogo type={currentMethod.channelCode || currentMethod.id} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                      {currentMethod.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Transfer Virtual Account Resmi</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    background: "#eff6ff",
                    color: "#0a58ca",
                    border: "1px solid #bfdbfe",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  Verifikasi Otomatis
                </span>
              </div>

              {/* Accent Line */}
              <div style={{ height: "3.5px", background: "linear-gradient(90deg, #0a58ca 0%, #0284c7 100%)" }} />

              {/* VA Code Field */}
              <div style={{ padding: "18px 20px" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 750, color: "#64748b", marginBottom: "6px" }}>
                  NOMOR VIRTUAL ACCOUNT:
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f8fafc",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "10px 14px",
                  }}
                >
                  <code style={{ fontSize: "17px", fontWeight: 850, color: "#0a2540", letterSpacing: "0.06em", fontFamily: "monospace" }}>
                    {currentMethod.accountNumber || "8277 0812 3456 7890"}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va")}
                    style={{
                      border: "none",
                      background: "#0a58ca",
                      color: "#ffffff",
                      borderRadius: "7px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Icon name="copy" size={13} />
                    <span>{copiedVa ? "Tersalin! ✓" : "Salin No. VA"}</span>
                  </button>
                </div>
                <span style={{ display: "block", fontSize: "11.5px", color: "#64748b", marginTop: "6px" }}>
                  Atas Nama: <strong style={{ color: "#0f172a" }}>PT JURAGAN TOKEN INDONESIA</strong>
                </span>
              </div>

              {/* Total Amount Strip */}
              <div
                style={{
                  background: "#f8fafc",
                  borderTop: "1px dashed #cbd5e1",
                  borderBottom: "1px dashed #cbd5e1",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b" }}>TOTAL TRANSFER</span>
                  <strong style={{ fontSize: "19px", fontWeight: 850, color: "#0a58ca" }}>{formatIdr(totalPrice)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    padding: "6px 12px",
                    fontSize: "11.5px",
                    fontWeight: 650,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="copy" size={13} />
                  <span>{copiedAmount ? "Tersalin! ✓" : "Salin Nominal"}</span>
                </button>
              </div>

              {/* Step-by-Step Payment Instructions - Structured Fintech Block */}
              <div className="cpv-instruction-block">
                <div className="cpv-instruction-head">
                  <div className="cpv-instruction-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>PANDUAN PEMBAYARAN RESMI</span>
                  </div>
                  <span className="cpv-instruction-sub">Pilih kanal transfer Anda:</span>
                </div>

                <div className="cpv-instruction-tabs">
                  {(["mbanking", "ibanking", "atm"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`cpv-tab-btn ${guideTab === tab ? "active" : ""}`}
                      onClick={() => setGuideTab(tab)}
                    >
                      {tab === "mbanking" ? "m-Banking" : tab === "ibanking" ? "Internet Banking" : "ATM Mesin"}
                    </button>
                  ))}
                </div>

                <div className="cpv-instruction-list">
                  {guideTab === "mbanking" && (
                    <>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">1</div>
                        <div className="cpv-step-text">
                          Buka aplikasi mobile banking bank Anda (<strong>{currentMethod.name}</strong>).
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">2</div>
                        <div className="cpv-step-text">
                          Pilih menu <strong>Transfer</strong> &gt; <strong>Virtual Account</strong> (atau Bayar Tagihan).
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">3</div>
                        <div className="cpv-step-text">
                          <span className="cpv-step-label">Masukkan nomor Virtual Account tujuan:</span>
                          <div className="cpv-step-va-box">
                            <span className="cpv-step-va-num">
                              {currentMethod.accountNumber || "8277 0812 3456 7890"}
                            </span>
                            <button
                              type="button"
                              className="cpv-step-va-copy"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va");
                              }}
                              title="Salin Nomor VA"
                            >
                              <Icon name="copy" size={12} />
                              <span>{copiedVa ? "Tersalin! ✓" : "Salin"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">4</div>
                        <div className="cpv-step-text">
                          Pastikan nama tujuan tertulis <strong>PT JURAGAN TOKEN INDONESIA</strong> dan nominal transfer tepat <strong>{formatIdr(totalPrice)}</strong>.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">5</div>
                        <div className="cpv-step-text">
                          Masukkan PIN mobile banking Anda untuk menyelesaikan transaksi secara instan.
                        </div>
                      </div>
                    </>
                  )}
                  {guideTab === "ibanking" && (
                    <>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">1</div>
                        <div className="cpv-step-text">
                          Login ke akun perbankan melalui portal resmi Internet Banking Anda.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">2</div>
                        <div className="cpv-step-text">
                          Pilih menu <strong>Pembayaran</strong> / <strong>Transfer ke Virtual Account</strong>.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">3</div>
                        <div className="cpv-step-text">
                          <span className="cpv-step-label">Pilih rekening sumber dan masukkan nomor Virtual Account:</span>
                          <div className="cpv-step-va-box">
                            <span className="cpv-step-va-num">
                              {currentMethod.accountNumber || "8277 0812 3456 7890"}
                            </span>
                            <button
                              type="button"
                              className="cpv-step-va-copy"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va");
                              }}
                              title="Salin Nomor VA"
                            >
                              <Icon name="copy" size={12} />
                              <span>{copiedVa ? "Tersalin! ✓" : "Salin"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">4</div>
                        <div className="cpv-step-text">
                          Verifikasi tagihan atas nama <strong>PT JURAGAN TOKEN INDONESIA</strong> sebesar <strong>{formatIdr(totalPrice)}</strong>.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">5</div>
                        <div className="cpv-step-text">
                          Otorisasi transaksi menggunakan token otentikasi / respon key internet banking Anda.
                        </div>
                      </div>
                    </>
                  )}
                  {guideTab === "atm" && (
                    <>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">1</div>
                        <div className="cpv-step-text">
                          Masukkan kartu ATM dan 6 digit PIN rahasia Anda pada mesin ATM.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">2</div>
                        <div className="cpv-step-text">
                          Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>Ke Rekening Virtual Account</strong>.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">3</div>
                        <div className="cpv-step-text">
                          <span className="cpv-step-label">Ketikkan nomor Virtual Account tujuan:</span>
                          <div className="cpv-step-va-box">
                            <span className="cpv-step-va-num">
                              {currentMethod.accountNumber || "8277 0812 3456 7890"}
                            </span>
                            <button
                              type="button"
                              className="cpv-step-va-copy"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va");
                              }}
                              title="Salin Nomor VA"
                            >
                              <Icon name="copy" size={12} />
                              <span>{copiedVa ? "Tersalin! ✓" : "Salin"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">4</div>
                        <div className="cpv-step-text">
                          Periksa detail konfirmasi di layar: nama <strong>PT JURAGAN TOKEN INDONESIA</strong> dan nominal <strong>{formatIdr(totalPrice)}</strong>.
                        </div>
                      </div>
                      <div className="cpv-instruction-item">
                        <div className="cpv-step-badge">5</div>
                        <div className="cpv-step-text">
                          Tekan <strong>Ya / Benar</strong> untuk memproses transaksi dan simpan struk fisik bukti pembayaran.
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="cpv-instruction-tip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    Tips: Pastikan nama penerima tertulis <strong>PT JURAGAN TOKEN INDONESIA</strong> sebelum mengonfirmasi PIN.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="cpv-action-buttons" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px", paddingBottom: "20px" }}>
            <button
              type="button"
              className="cpv-verify-btn"
              onClick={handleSimulateSuccess}
              disabled={isConfirming}
            >
              <Icon name="check" size={16} />
              <span>{isConfirming ? "Memeriksa Status..." : "Cek Status Pembayaran (Selesai)"}</span>
            </button>

            <button
              type="button"
              className="cpv-back-link-btn"
              onClick={() => setStep("checkout")}
              style={{ width: "100%", padding: "8px", border: "none", background: "transparent", color: "#64748b", fontSize: "12.5px", cursor: "pointer", textAlign: "center" }}
            >
              ← Ubah Metode Pembayaran
            </button>

            <button
              type="button"
              className="cpv-wa-help-btn"
              onClick={openWhatsAppOrder}
            >
              <Icon name="whatsapp" size={15} />
              <span>Bantuan Konfirmasi via WhatsApp Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: SUCCESS CONFIRMATION & API KEY GENERATION                         */}
      {/* ========================================================================= */}
      {step === "success" && (
        <div className="classai-success-view" style={{ padding: "10px 0 24px 0", textAlign: "center" }}>
          <div className="csv-badge-center">
            <PaymentSuccessMark />
            <h3 className="csv-title" style={{ fontSize: "20px", fontWeight: 800, color: "#0a2540", margin: "12px 0 6px 0" }}>
              {checkoutMode === "topup" ? "Saldo Berhasil Ditambahkan!" : "Pembayaran Berhasil Diterima!"}
            </h3>
            <p className="csv-sub" style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "18px" }}>
              {checkoutMode === "topup" ? (
                <>Saldo tambahan sebesar <b>{formatIdr(totalPaid || totalPrice)}</b> telah langsung aktif di API Key Anda tanpa perlu ganti setting di IDE.</>
              ) : (
                <>Saldo akun sebesar <b>{formatIdr(totalPaid || totalPrice)}</b> ({estText}) telah aktif permanen di gateway {gatewayHost}.</>
              )}
            </p>
          </div>

          <div className="csv-key-card" style={{ background: "#0f172a", color: "#ffffff", borderRadius: "14px", padding: "16px", textAlign: "left", marginBottom: "14px" }}>
            <span className="csv-key-label" style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 750, letterSpacing: "0.05em" }}>
              {checkoutMode === "topup" ? "API KEY ANDA (TETAP SAMA):" : "API KEY UNIVERSAL ANDA:"}
            </span>
            <div className="csv-key-display" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "8px 12px", margin: "8px 0" }}>
              <code style={{ fontFamily: "monospace", fontSize: "13px", color: "#38bdf8", wordBreak: "break-all" }}>
                {checkoutMode === "topup" ? (targetApiKey || "jt-live-•••••••• (Kunci Tetap)") : (apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82")}
              </code>
              <button
                type="button"
                className="csv-copy-key-btn"
                onClick={() => copyToClipboard(checkoutMode === "topup" ? targetApiKey : (apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82"), "key")}
                style={{ border: "none", background: "#0a58ca", color: "#ffffff", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <Icon name="copy" size={14} />
                <span>{copiedKey ? "Tersalin! ✓" : "Salin Kunci"}</span>
              </button>
            </div>
            <span className="csv-key-note" style={{ display: "block", fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
              {checkoutMode === "topup"
                ? `Saldo telah aktif seketika. Konfigurasi di Cursor, VS Code, atau ${targetModel ? targetModel.name : "Claude Code"} Anda tidak perlu diubah sama sekali.`
                : targetModel
                  ? `Simpan API key ini dengan aman. Key universal ini dapat langsung dipakai untuk model ${targetModel.name}, Cursor, Chatbox, dan LibreChat.`
                  : "Simpan API key ini dengan aman. Key dapat langsung dipakai untuk semua model AI di Cursor, Chatbox, Claude Code, dan LibreChat."}
            </span>
          </div>

          <div className="csv-setup-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
            <div className="csb-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontSize: "12px" }}>
              <span className="csb-tag" style={{ fontWeight: 750, color: "#64748b", fontSize: "10.5px" }}>BASE URL</span>
              <code style={{ color: "#0f172a" }}>{GATEWAY_BASE_URL}</code>
              <button
                type="button"
                className="csb-copy-sm"
                onClick={() => copyToClipboard(GATEWAY_BASE_URL, "url")}
                style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", cursor: "pointer" }}
              >
                {copiedUrl ? "✓" : "Salin"}
              </button>
            </div>
          </div>

          <div className="csv-footer-btns" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
            <button
              type="button"
              className="csv-done-btn"
              onClick={handleClose}
            >
              Selesai &amp; Kembali ke Halaman Utama
            </button>
            <button
              type="button"
              className="csv-wa-share-btn"
              onClick={openWhatsAppOrder}
            >
              <Icon name="whatsapp" size={15} />
              <span>Kirim Bukti Pembayaran ke WhatsApp</span>
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </Dialog>
  );
}

export { SingaPayModal as PaymentModal };
