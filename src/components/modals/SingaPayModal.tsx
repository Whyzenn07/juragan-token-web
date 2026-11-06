"use client";

import { useEffect, useState } from "react";
import { GATEWAY_BASE_URL, RetailPackage, paymentMethods } from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";
import { PaymentSuccessMark } from "@/components/ui/PaymentSuccessMark";

type SingaPayModalProps = {
  open: boolean;
  pkg: RetailPackage | null;
  onClose: () => void;
};

// Vector Logos for authentic ClassAI checkout experience
function PaymentLogo({ type }: { type: string }) {
  switch (type) {
    case "gopay":
      return (
        <svg width="68" height="20" viewBox="0 0 68 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#00AED6" />
          <circle cx="10" cy="10" r="3.5" fill="#FFFFFF" />
          <text x="23" y="14" fill="#0F172A" fontSize="13" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">gopay</text>
        </svg>
      );
    case "dana":
      return (
        <svg width="68" height="20" viewBox="0 0 68 20" fill="none">
          <circle cx="9" cy="10" r="8" fill="#118EEA" />
          <path d="M6.5 7h3a3 3 0 0 1 0 6h-3V7z" fill="#FFFFFF" />
          <text x="22" y="14" fill="#118EEA" fontSize="13" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">DANA</text>
        </svg>
      );
    case "ovo":
      return (
        <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
          <text x="6" y="15" fill="#4C3494" fontSize="14" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="2">OVO</text>
        </svg>
      );
    case "shopeepay":
      return (
        <svg width="78" height="20" viewBox="0 0 78 20" fill="none">
          <rect x="2" y="3" width="14" height="14" rx="3" fill="#EE4D2D" />
          <path d="M9 5c-1.5 0-2.5 1-2.5 2v1h5V7c0-1-1-2-2.5-2z" stroke="#FFF" strokeWidth="1.2" fill="none" />
          <text x="20" y="14" fill="#EE4D2D" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">ShopeePay</text>
        </svg>
      );
    case "bni":
      return (
        <svg width="64" height="20" viewBox="0 0 64 20" fill="none">
          <rect x="1" y="2" width="16" height="16" rx="3" fill="#F15A24" />
          <text x="4" y="14" fill="#FFF" fontSize="11" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">46</text>
          <text x="22" y="15" fill="#005E6A" fontSize="13" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">BNI</text>
        </svg>
      );
    case "bri":
      return (
        <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
          <rect x="2" y="2" width="52" height="16" rx="4" fill="#00529C" />
          <text x="11" y="14" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="1">BRI</text>
        </svg>
      );
    case "bca":
      return (
        <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
          <rect x="2" y="2" width="52" height="16" rx="4" fill="#003580" />
          <text x="9" y="14" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="1">BCA</text>
        </svg>
      );
    case "mandiri":
      return (
        <svg width="70" height="20" viewBox="0 0 70 20" fill="none">
          <text x="3" y="14" fill="#002D62" fontSize="12" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">mandiri</text>
          <path d="M53 6c3 0 5 4 8 4-3 0-5-4-8-4z" fill="#FFB700" />
        </svg>
      );
    case "permata":
      return (
        <svg width="68" height="20" viewBox="0 0 68 20" fill="none">
          <path d="M6 10l5-6 5 6-5 6-5-6z" fill="#008444" />
          <text x="20" y="14" fill="#008444" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">Permata</text>
        </svg>
      );
    case "cimb":
      return (
        <svg width="68" height="20" viewBox="0 0 68 20" fill="none">
          <rect x="2" y="3" width="14" height="14" rx="2" fill="#ED1C24" />
          <text x="20" y="14" fill="#ED1C24" fontSize="11" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">CIMB</text>
        </svg>
      );
    default:
      return (
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#0F172A" }}>
          {type.toUpperCase()}
        </span>
      );
  }
}

export function SingaPayModal({ open, pkg, onClose }: SingaPayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [openCategory, setOpenCategory] = useState<"qris" | "ewallet" | "va">("qris");
  const [step, setStep] = useState<"checkout" | "payment" | "success">("checkout");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [orderToken, setOrderToken] = useState("");
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [paidAt, setPaidAt] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 menit
  const [apiKeyGenerated, setApiKeyGenerated] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [guideTab, setGuideTab] = useState<"mbanking" | "ibanking" | "atm">("mbanking");
  const [emailStatus, setEmailStatus] = useState<"none" | "idle" | "sending" | "sent" | "simulated" | "error">("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
          setStep("success");
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

  const formatDate = (isoString: string) => {
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
      else if (!customerEmail.trim()) alert("Silakan masukkan Alamat Email untuk pengiriman API Key.");
      return;
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
          customerPhone: customerPhone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoiceId(data.invoiceId);
        setOrderToken(data.orderToken);
        setTotalPaid(data.totalIdr);
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
• Paket: *${pkg?.name}* (${pkg?.estToken})
• Metode: ${currentMethod.name}
• Total: *${formatIdr(totalPrice)}*
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
        .classai-router-badge {
          background: #0f172a !important;
          color: #ffffff !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
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
          flex-direction: column !important;
          gap: 2px !important;
        }
        .cosc-badge {
          font-size: 10px !important;
          font-weight: 750 !important;
          color: #1d4ed8 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
        }
        .cosc-pkg-name {
          font-size: 15px !important;
          font-weight: 800 !important;
          color: #0a2540 !important;
        }
        .cosc-pkg-token {
          font-size: 12px !important;
          color: #475569 !important;
        }
        .cosc-price {
          font-size: 18px !important;
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
          width: 72px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
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
          <span className="classai-logo-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0A58CA" />
              <circle cx="16" cy="16" r="6" stroke="#FFFFFF" strokeWidth="2.8" fill="none" />
              <circle cx="21" cy="11" r="2.2" fill="#38BDF8" />
            </svg>
          </span>
          <span className="classai-brand-text" style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            juragan<strong style={{ color: "#0a58ca", fontWeight: 800 }}>token</strong>
          </span>
          <span
            className="classai-router-badge"
            style={{
              background: "#0f172a",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: "6px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ROUTER
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

          {/* Package Order Info & Customer Fields */}
          <div
            className="classai-order-summary-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f0f7ff",
              border: "1px solid #bfdbfe",
              borderRadius: "14px",
              padding: "12px 16px",
              marginBottom: "16px",
            }}
          >
            <div className="cosc-left" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span className="cosc-badge" style={{ fontSize: "10px", fontWeight: 750, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {pkg.badge || "Pilihan Siap Pakai"}
              </span>
              <strong className="cosc-pkg-name" style={{ fontSize: "15px", fontWeight: 800, color: "#0a2540" }}>
                {pkg.name}
              </strong>
              <span className="cosc-pkg-token" style={{ fontSize: "12px", color: "#475569" }}>
                {pkg.estToken} · Saldo Universal
              </span>
            </div>
            <div className="cosc-right">
              <strong className="cosc-price" style={{ fontSize: "18px", fontWeight: 800, color: "#0a58ca", letterSpacing: "-0.02em" }}>
                {formatIdr(pkg.priceIdr)}
              </strong>
            </div>
          </div>

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
                      BNI, BRI, Mandiri, Permata, CIMB Niaga, SeaBank
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
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Kembali
              </button>
              <button
                type="submit"
                className="csb-btn-bayar"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  height: "44px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#0a58ca",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 750,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(10, 88, 202, 0.25)",
                }}
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
          <div className="cpv-timer-strip" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
            <span className="cpv-status-badge" style={{ fontSize: "12px", fontWeight: 700, color: "#1d4ed8" }}>Menunggu Pembayaran</span>
            <div className="cpv-timer-count" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
              <span>Sisa Waktu:</span>
              <strong style={{ fontSize: "14px", color: "#dc2626", fontFamily: "monospace" }}>{formatTime(timeLeft)}</strong>
            </div>
          </div>

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
              <strong style={{ color: "#0f172a" }}>{pkg.name} ({pkg.estToken})</strong>
            </div>
          </div>

          {/* The QRIS Display Card with User's Uploaded Real QR Code */}
          {selectedMethod === "qris" ? (
            <div className="classai-qris-display-card" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "18px", textAlign: "center", marginBottom: "16px" }}>
              <div className="cqdc-header">
                <div className="cqdc-brand-row">
                  <span className="cqdc-national-title" style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.04em" }}>QRIS Standar Pembayaran Nasional</span>
                  <span className="cqdc-merchant-name" style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>PT JURAGAN TOKEN INDONESIA</span>
                </div>
                <span className="cqdc-nmid" style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "4px" }}>NMID: ID1020084920194</span>
              </div>

              {/* REAL SCAN-READY QRIS CODE IMAGE */}
              <div className="classai-qris-image-wrapper" style={{ display: "flex", justifyContent: "center", padding: "12px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", maxWidth: "260px", margin: "14px auto" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/qris-code.png"
                  alt="QRIS Code Juragan Token"
                  className="classai-qris-real-img"
                  style={{ width: "230px", height: "230px", objectFit: "contain" }}
                  onError={(e) => {
                    // Fallback to /qris.png if images/ subfolder path differs
                    e.currentTarget.src = "/qris.png";
                  }}
                />
              </div>

              <p className="cqdc-scan-hint" style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: "10px 0" }}>
                Scan kode QR di atas menggunakan aplikasi <b>BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, ShopeePay, atau DANA</b>.
              </p>

              {/* Amount Box */}
              <div className="cqdc-amount-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", marginTop: "10px" }}>
                <span className="cqdc-amount-label" style={{ display: "block", fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>TOTAL JUMLAH PEMBAYARAN:</span>
                <div className="cqdc-amount-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "4px" }}>
                  <strong className="cqdc-price" style={{ fontSize: "20px", fontWeight: 800, color: "#0a58ca" }}>{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="cqdc-copy-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                    style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  >
                    <Icon name="copy" size={13} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="classai-destination-card" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "18px", marginBottom: "16px" }}>
              <div className="cdc-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <strong style={{ fontSize: "15px", color: "#0f172a" }}>{currentMethod.name}</strong>
                <span className="cdc-tag" style={{ fontSize: "11px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, padding: "3px 8px", borderRadius: "6px" }}>Verifikasi Otomatis</span>
              </div>

              <div className="cdc-field" style={{ marginBottom: "12px" }}>
                <span className="cdc-field-label" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>NOMOR VIRTUAL ACCOUNT / REKENING:</span>
                <div className="cdc-code-box" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px" }}>
                  <code style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.05em" }}>{currentMethod.accountNumber || "8277 0812 3456 7890"}</code>
                  <button
                    type="button"
                    className="cdc-copy-btn"
                    onClick={() => copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va")}
                    style={{ border: "1px solid #0a58ca", background: "#0a58ca", color: "#ffffff", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {copiedVa ? "Tersalin! ✓" : "Salin No. VA"}
                  </button>
                </div>
                <span className="cdc-holder" style={{ display: "block", fontSize: "11px", color: "#64748b", marginTop: "6px" }}>Atas Nama: PT JURAGAN TOKEN INDONESIA</span>
              </div>

              <div className="cqdc-amount-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", marginTop: "10px" }}>
                <span className="cqdc-amount-label" style={{ display: "block", fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>TOTAL JUMLAH PEMBAYARAN:</span>
                <div className="cqdc-amount-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "4px" }}>
                  <strong className="cqdc-price" style={{ fontSize: "20px", fontWeight: 800, color: "#0a58ca" }}>{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="cqdc-copy-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                    style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  >
                    <Icon name="copy" size={13} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
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
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "12px",
                border: "none",
                background: "#0a58ca",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: isConfirming ? "not-allowed" : "pointer",
                opacity: isConfirming ? 0.7 : 1,
              }}
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
              style={{
                width: "100%",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #86efac",
                background: "#f0fdf4",
                color: "#166534",
                fontSize: "12.5px",
                fontWeight: 650,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
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
              Pembayaran Berhasil Diterima!
            </h3>
            <p className="csv-sub" style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, marginBottom: "18px" }}>
              Saldo akun sebesar <b>{formatIdr(totalPaid || totalPrice)}</b> ({pkg.estToken}) telah aktif permanen di gateway juragantoken.co.id.
            </p>
          </div>

          <div className="csv-key-card" style={{ background: "#0f172a", color: "#ffffff", borderRadius: "14px", padding: "16px", textAlign: "left", marginBottom: "14px" }}>
            <span className="csv-key-label" style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 750, letterSpacing: "0.05em" }}>
              API KEY UNIVERSAL ANDA:
            </span>
            <div className="csv-key-display" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "8px 12px", margin: "8px 0" }}>
              <code style={{ fontFamily: "monospace", fontSize: "13px", color: "#38bdf8", wordBreak: "break-all" }}>
                {apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82"}
              </code>
              <button
                type="button"
                className="csv-copy-key-btn"
                onClick={() => copyToClipboard(apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82", "key")}
                style={{ border: "none", background: "#0a58ca", color: "#ffffff", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <Icon name="copy" size={14} />
                <span>{copiedKey ? "Tersalin! ✓" : "Salin API Key"}</span>
              </button>
            </div>
            <span className="csv-key-note" style={{ display: "block", fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
              Simpan API key ini dengan aman. Key dapat langsung dipakai di Claude Code, Cursor, Chatbox, dan LibreChat.
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
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "12px",
                border: "none",
                background: "#0a58ca",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Selesai &amp; Kembali ke Halaman Utama
            </button>
            <button
              type="button"
              className="csv-wa-share-btn"
              onClick={openWhatsAppOrder}
              style={{
                width: "100%",
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #86efac",
                background: "#f0fdf4",
                color: "#166534",
                fontSize: "13px",
                fontWeight: 650,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Icon name="whatsapp" size={15} />
              <span>Kirim Bukti Pembayaran ke WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
