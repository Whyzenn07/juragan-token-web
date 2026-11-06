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
      {/* CLASSAI-STYLE TOP HEADER                                                 */}
      {/* ========================================================================= */}
      <div className="classai-header">
        <div className="classai-brand">
          <span className="classai-logo-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0A58CA" />
              <circle cx="16" cy="16" r="6" stroke="#FFFFFF" strokeWidth="2.8" fill="none" />
              <circle cx="21" cy="11" r="2.2" fill="#38BDF8" />
            </svg>
          </span>
          <span className="classai-brand-text">
            juragan<strong>token</strong>
          </span>
          <span className="classai-router-badge">ROUTER</span>
        </div>
        <div className="classai-header-right">
          <span className="classai-billing-text">Kredit &amp; billing</span>
          <button type="button" className="classai-close-icon-btn" onClick={handleClose} aria-label="Tutup">
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
          <div className="classai-disclaimer-banner">
            <p>
              Ketentuan: Saldo &amp; virtual key langsung aktif begitu pembayaran terkonfirmasi. Saldo berlaku selamanya (lifetime) tanpa potongan bulanan. Add-on dan saldo dapat diklaim garansi bila terjadi kendala (laporkan dalam 7 hari).
            </p>
          </div>

          {/* Package Order Info & Customer Fields */}
          <div className="classai-order-summary-card">
            <div className="cosc-left">
              <span className="cosc-badge">{pkg.badge || "Pilihan Siap Pakai"}</span>
              <strong className="cosc-pkg-name">{pkg.name}</strong>
              <span className="cosc-pkg-token">{pkg.estToken} · Saldo Universal</span>
            </div>
            <div className="cosc-right">
              <strong className="cosc-price">{formatIdr(pkg.priceIdr)}</strong>
            </div>
          </div>

          <div className="classai-input-grid">
            <div className="cig-col">
              <label className="cig-label">
                Nama Lengkap
                <input
                  type="text"
                  required
                  placeholder="Nama Anda / Panggilan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="cig-input"
                />
              </label>
            </div>
            <div className="cig-col">
              <label className="cig-label">
                Email (Kredensial API dikirim ke sini)
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="cig-input"
                />
              </label>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PAYMENT METHODS ACCORDION - EXACT MATCH TO CLASSAI.ID                */}
          {/* ===================================================================== */}
          <div className="classai-methods-stack">
            {/* 1. INSTAN (QRIS) CARD */}
            <div
              className={`classai-method-card ${selectedMethod === "qris" ? "selected" : ""}`}
              onClick={() => {
                setSelectedMethod("qris");
                setOpenCategory("qris");
              }}
            >
              <div className="cmc-header">
                <div className="cmc-left-group">
                  <div className="cmc-icon-box qris-blue">
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
                  <div className="cmc-text-col">
                    <div className="cmc-title-row">
                      <strong className="cmc-title">Instan (QRIS)</strong>
                      <span className="cmc-tercepat-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Tercepat
                      </span>
                    </div>
                    <span className="cmc-subtitle">Dipilih: QRIS</span>
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
            <div className={`classai-method-card ${isEwalletSelected ? "selected" : ""}`}>
              <div
                className="cmc-header"
                onClick={() => {
                  if (openCategory === "ewallet") {
                    setOpenCategory("qris");
                  } else {
                    setOpenCategory("ewallet");
                    if (!isEwalletSelected) setSelectedMethod("va-gopay");
                  }
                }}
              >
                <div className="cmc-left-group">
                  <div className="cmc-icon-box slate-gray">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="cmc-text-col">
                    <strong className="cmc-title">E-Wallet</strong>
                    <span className="cmc-subtitle">GoPay, DANA</span>
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
            <div className={`classai-method-card ${isVaSelected ? "selected" : ""}`}>
              <div
                className="cmc-header"
                onClick={() => {
                  if (openCategory === "va") {
                    setOpenCategory("qris");
                  } else {
                    setOpenCategory("va");
                    if (!isVaSelected) setSelectedMethod("va-bni");
                  }
                }}
              >
                <div className="cmc-left-group">
                  <div className="cmc-icon-box slate-gray">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
                    </svg>
                  </div>
                  <div className="cmc-text-col">
                    <strong className="cmc-title">Transfer Bank / Virtual Account</strong>
                    <span className="cmc-subtitle">BNI, BRI, Mandiri, Permata, CIMB Niaga, SeaBank</span>
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
          <div className="classai-sticky-bottom">
            <div className="csb-top-row">
              <span className="csb-total-label">Total</span>
              <strong className="csb-total-amount">{formatIdr(totalPrice)}</strong>
            </div>
            <div className="csb-btn-row">
              <button type="button" className="csb-btn-kembali" onClick={handleClose}>
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
          <div className="cpv-timer-strip">
            <span className="cpv-status-badge">Menunggu Pembayaran</span>
            <div className="cpv-timer-count">
              <span>Sisa Waktu:</span>
              <strong>{formatTime(timeLeft)}</strong>
            </div>
          </div>

          {/* Invoice ID Header */}
          <div className="cpv-invoice-info-card">
            <div className="cpv-info-row">
              <span className="cpv-label">NO. INVOICE</span>
              <div className="cpv-val-copy">
                <code>{invoiceId || "INV-JT-LIVE"}</code>
                <button
                  type="button"
                  className="cpv-mini-copy-btn"
                  onClick={() => copyToClipboard(invoiceId, "invoice")}
                >
                  {copiedInvoice ? "Tersalin! ✓" : "Salin"}
                </button>
              </div>
            </div>
            <div className="cpv-info-row">
              <span className="cpv-label">PAKET AI</span>
              <strong>{pkg.name} ({pkg.estToken})</strong>
            </div>
          </div>

          {/* The QRIS Display Card with User's Uploaded Real QR Code */}
          {selectedMethod === "qris" ? (
            <div className="classai-qris-display-card">
              <div className="cqdc-header">
                <div className="cqdc-brand-row">
                  <span className="cqdc-national-title">QRIS Standar Pembayaran Nasional</span>
                  <span className="cqdc-merchant-name">PT JURAGAN TOKEN INDONESIA</span>
                </div>
                <span className="cqdc-nmid">NMID: ID1020084920194</span>
              </div>

              {/* REAL SCAN-READY QRIS CODE IMAGE */}
              <div className="classai-qris-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/qris-code.png"
                  alt="QRIS Code Juragan Token"
                  className="classai-qris-real-img"
                  onError={(e) => {
                    // Fallback to /qris.png if images/ subfolder path differs
                    e.currentTarget.src = "/qris.png";
                  }}
                />
              </div>

              <p className="cqdc-scan-hint">
                Scan kode QR di atas menggunakan aplikasi <b>BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, ShopeePay, atau DANA</b>.
              </p>

              {/* Amount Box */}
              <div className="cqdc-amount-box">
                <span className="cqdc-amount-label">TOTAL JUMLAH PEMBAYARAN:</span>
                <div className="cqdc-amount-row">
                  <strong className="cqdc-price">{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="cqdc-copy-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  >
                    <Icon name="copy" size={13} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="classai-destination-card">
              <div className="cdc-head">
                <strong>{currentMethod.name}</strong>
                <span className="cdc-tag">Verifikasi Otomatis</span>
              </div>

              <div className="cdc-field">
                <span className="cdc-field-label">NOMOR VIRTUAL ACCOUNT / REKENING:</span>
                <div className="cdc-code-box">
                  <code>{currentMethod.accountNumber || "8277 0812 3456 7890"}</code>
                  <button
                    type="button"
                    className="cdc-copy-btn"
                    onClick={() => copyToClipboard(currentMethod.accountNumber || "8277 0812 3456 7890", "va")}
                  >
                    {copiedVa ? "Tersalin! ✓" : "Salin No. VA"}
                  </button>
                </div>
                <span className="cdc-holder">Atas Nama: PT JURAGAN TOKEN INDONESIA</span>
              </div>

              <div className="cqdc-amount-box">
                <span className="cqdc-amount-label">TOTAL JUMLAH PEMBAYARAN:</span>
                <div className="cqdc-amount-row">
                  <strong className="cqdc-price">{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="cqdc-copy-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  >
                    <Icon name="copy" size={13} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="cpv-action-buttons">
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
        <div className="classai-success-view">
          <div className="csv-badge-center">
            <PaymentSuccessMark />
            <h3 className="csv-title">Pembayaran Berhasil Diterima!</h3>
            <p className="csv-sub">
              Saldo akun sebesar <b>{formatIdr(totalPaid || totalPrice)}</b> ({pkg.estToken}) telah aktif permanen di gateway juragantoken.co.id.
            </p>
          </div>

          <div className="csv-key-card">
            <span className="csv-key-label">API KEY UNIVERSAL ANDA:</span>
            <div className="csv-key-display">
              <code>{apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82"}</code>
              <button
                type="button"
                className="csv-copy-key-btn"
                onClick={() => copyToClipboard(apiKeyGenerated || "jt-sec-live-89f41b2c7e0941ab82", "key")}
              >
                <Icon name="copy" size={14} />
                <span>{copiedKey ? "Tersalin! ✓" : "Salin API Key"}</span>
              </button>
            </div>
            <span className="csv-key-note">
              Simpan API key ini dengan aman. Key dapat langsung dipakai di Claude Code, Cursor, Chatbox, dan LibreChat.
            </span>
          </div>

          <div className="csv-setup-box">
            <div className="csb-row">
              <span className="csb-tag">BASE URL</span>
              <code>{GATEWAY_BASE_URL}</code>
              <button
                type="button"
                className="csb-copy-sm"
                onClick={() => copyToClipboard(GATEWAY_BASE_URL, "url")}
              >
                {copiedUrl ? "✓" : "Salin"}
              </button>
            </div>
          </div>

          <div className="csv-footer-btns">
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
    </Dialog>
  );
}
