"use client";

import { useEffect, useState } from "react";
import { GATEWAY_BASE_URL, RetailPackage, paymentMethods } from "@/data/catalog";
import type { PaymentMethod } from "@/types";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";
import { PaymentSuccessMark } from "@/components/ui/PaymentSuccessMark";

type SingaPayModalProps = {
  open: boolean;
  pkg: RetailPackage | null;
  onClose: () => void;
};

export function SingaPayModal({ open, pkg, onClose }: SingaPayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [activeCategory, setActiveCategory] = useState<"qris" | "va_ewallet" | "bank_transfer">("qris");
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
    setActiveCategory("qris");
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
    const el = document.querySelector(".singapay-modal");
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

  // Polling status pesanan dari server secara otomatis setiap 2.5 detik
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
        timeZone: "Asia/Jakarta",
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

  const getWhatsAppOrderText = (inv: string) => {
    if (!pkg) return "";
    return `Halo Admin Juragan Token! 👋
Saya ingin memesan token API AI prabayar:

🧾 *Rincian Pesanan:*
• No. Invoice: *${inv}*
• Paket: *${pkg.name}* (${pkg.estToken})
• Metode Bayar: ${currentMethod.name}
• Total Bayar: *${formatIdr(totalPrice)}*

👤 *Data Pemesan:*
• Nama: *${customerName || "-"}*
• Email: *${customerEmail || "-"}*
${customerPhone ? `• No. WhatsApp: *${customerPhone}*` : ""}

Mohon diproses untuk aktivasi kunci API saya. Terima kasih!`;
  };

  const getWhatsAppCredentialsText = (key: string, inv: string) => {
    if (!pkg) return "";
    const dateStr = formatDate(paidAt || new Date().toISOString());

    return `✨ *BUKTI PEMBAYARAN & KREDENSIAL JURAGAN TOKEN* ✨
====================================
Status: *LUNAS ✓*
No. Invoice: *${inv}*
Waktu: ${dateStr}
Paket: *${pkg.name}*
Total Bayar: *${formatIdr(totalPaid || totalPrice)}* (${currentMethod.name})
Pembeli: *${customerName || "Sahabat Token"}*

🔑 *Virtual API Key Anda:*
\`${key}\`

🌐 *Base URL Gateway:*
\`${GATEWAY_BASE_URL}\`

🚀 *Panduan Colok Kilat:*
1. Web Chatbox: https://web.chatboxai.app
2. Cursor AI: Settings > Models > OpenAI API Key & Base URL
3. Claude Code CLI:
   $env:ANTHROPIC_API_KEY="${key}"

*Catatan:* Token aktif permanen tanpa masa kedaluwarsa bulanan. Simpan pesan ini dengan aman!`;
  };

  const openWhatsAppOrder = async () => {
    if (!customerName.trim()) {
      alert("Silakan masukkan Nama Lengkap terlebih dahulu.");
      return;
    }
    if (!customerEmail.trim()) {
      alert("Silakan masukkan Email Anda terlebih dahulu.");
      return;
    }
    if (!pkg) return;

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
        const msg = getWhatsAppOrderText(data.invoiceId);
        const url = `https://wa.me/${cleanPhoneNumber(adminWaNumber)}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        setStep("payment");
      } else {
        alert(data.error || "Gagal membuat pesanan.");
      }
    } catch {
      alert("Gagal terhubung ke server pemesanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    const inv = invoiceId;
    const msg = getWhatsAppOrderText(inv);
    const url = `https://wa.me/${cleanPhoneNumber(adminWaNumber)}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openWhatsAppCredentials = (target: "self" | "admin") => {
    const inv = invoiceId;
    const msg = getWhatsAppCredentialsText(apiKeyGenerated, inv);
    let url = "";
    if (target === "admin") {
      url = `https://wa.me/${cleanPhoneNumber(adminWaNumber)}?text=${encodeURIComponent(msg)}`;
    } else {
      const targetPhone = customerPhone ? cleanPhoneNumber(customerPhone) : "";
      url = targetPhone
        ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim() || !customerName.trim() || !pkg) return;

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
      // fallback
    }
  };

  if (!pkg) return null;

  // Filter list by category
  const vaEwalletMethods = paymentMethods.filter((m) => m.category === "va_ewallet" && m.id !== "ewallet");
  const bankTransferMethods = paymentMethods.filter((m) => m.category === "bank_transfer");

  const getInstructions = (channel: PaymentMethod, tab: "mbanking" | "ibanking" | "atm") => {
    const acc = channel.accountNumber || "3901 0812 3456 7890";
    const name = channel.accountName || "PT JURAGAN TOKEN INDONESIA";
    const cName = channel.name;

    if (tab === "mbanking") {
      if (channel.category === "bank_transfer") {
        return [
          `Buka aplikasi Mobile Banking Anda lalu pilih menu Transfer > Transfer Antar Bank / Sesama.`,
          `Pilih bank tujuan: ${cName}.`,
          `Masukkan nomor rekening tujuan: ${acc}.`,
          `Pastikan nama penerima adalah ${name}.`,
          `Masukkan nominal persis ${formatIdr(totalPrice)} lalu masukkan PIN transaksi Anda.`
        ];
      }
      return [
        `Buka aplikasi Mobile Banking / e-Wallet Anda (${channel.provider}).`,
        `Pilih menu Pembayaran / Bayar > Virtual Account / E-Commerce.`,
        `Masukkan nomor kode bayar / VA: ${acc}.`,
        `Periksa rincian: nama penerima ${name} dan nominal ${formatIdr(totalPrice)}.`,
        `Konfirmasi dan masukkan PIN transaksi Anda.`
      ];
    } else if (tab === "ibanking") {
      return [
        `Login ke situs Internet Banking bank Anda.`,
        `Masuk ke menu Transfer Dana > Virtual Account / Transfer Rekening.`,
        `Pilih rekening sumber dan masukkan nomor tujuan: ${acc}.`,
        `Masukkan nominal transfer persis ${formatIdr(totalPrice)}.`,
        `Verifikasi dengan token otentikasi (KeyBCA/Token Mandiri/smsOTP) dan selesaikan transaksi.`
      ];
    } else {
      return [
        `Masukkan kartu ATM dan 6 digit PIN Anda di mesin ATM terdekat.`,
        `Pilih menu Transaksi Lainnya > Pembayaran / Transfer > Virtual Account.`,
        `Masukkan nomor tujuan ${acc}.`,
        `Periksa informasi pada layar ATM, pastikan nama penerima ${name}.`,
        `Pilih Ya/Benar untuk menyelesaikan pembayaran dan simpan struk transaksi.`
      ];
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} label="Bukti Pembayaran Resmi" panelClassName="modal singapay-modal">
      <button className="close-button" onClick={handleClose} aria-label="Tutup pembayaran">
        <Icon name="close" />
      </button>

      {/* Modern Fintech Header */}
      <div className="singapay-header">
        <div className="singapay-logo-badge">
          <strong className="sp-brand-text">
            Juragan<span className="sp-brand-accent">Token</span>
          </strong>
          <span className="sp-badge-pill">
            {step === "success" ? "Invoice Lunas ✓" : step === "payment" ? "Invoice Resmi" : "Checkout Resmi"}
          </span>
        </div>
        <div className="sp-header-security">
          <span className="secure-badge">
            <Icon name="check" size={13} /> Terverifikasi QRIS &amp; BI
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: FORMULIR & PILIH METODE (DENGAN ACCORDION SCROLL HALUS)          */}
      {/* ========================================================================= */}
      {step === "checkout" && (
        <form onSubmit={handleProceedPayment} className="sp-step-content">
          {/* Ringkasan Paket Terpilih */}
          <div className="sp-package-summary">
            <div className="sp-pkg-left">
              <span className="summary-badge">{pkg.badge || "Pilihan Ritel"}</span>
              <h3>{pkg.name}</h3>
              <p>{pkg.description}</p>
            </div>
            <div className="sp-price-box">
              <strong>{formatIdr(pkg.priceIdr)}</strong>
              <span>{pkg.estToken}</span>
            </div>
          </div>

          {/* Input Data Pemesan */}
          <div className="sp-form-section">
            <label>
              Nama Lengkap
              <input
                type="text"
                required
                placeholder="Nama Anda / Panggilan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label>
              Email (Kredensial API dikirim ke sini)
              <input
                type="email"
                required
                placeholder="nama@kampus.ac.id atau email pribadi"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </label>
            <label className="sp-form-full">
              Nomor WhatsApp (Opsional / untuk konfirmasi cepat)
              <input
                type="tel"
                placeholder="Contoh: 08123456789 atau 628..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
          </div>

          {/* Opsi Pembayaran Interaktif dengan Accordion */}
          <div className="sp-methods-section">
            <div className="methods-header-row">
              <p className="methods-title">Pilih Metode Pembayaran:</p>
              <span className="methods-hint">Pilihan Otomatis &amp; Real-time</span>
            </div>

            <div className="payment-accordion-group">
              {/* 1. KATEGORI QRIS */}
              <div
                className={`accordion-card ${activeCategory === "qris" ? "active" : ""}`}
                onClick={() => {
                  setActiveCategory("qris");
                  setSelectedMethod("qris");
                }}
              >
                <div className="accordion-header">
                  <div className="accordion-title-wrap">
                    <span className="accordion-icon-chip qris-chip">QRIS</span>
                    <div>
                      <div className="accordion-title-row">
                        <strong>QRIS Instan (Semua Bank &amp; e-Wallet)</strong>
                        <span className="accordion-free-badge">Gratis Biaya Admin</span>
                      </div>
                      <span className="accordion-sub">BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA</span>
                    </div>
                  </div>
                  <div className="accordion-action-wrap">
                    <input
                      type="radio"
                      name="payment_accordion"
                      checked={activeCategory === "qris" && selectedMethod === "qris"}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* 2. KATEGORI VIRTUAL ACCOUNT & E-WALLET */}
              <div className={`accordion-card ${activeCategory === "va_ewallet" ? "active" : ""}`}>
                <div
                  className="accordion-header"
                  onClick={() => {
                    if (activeCategory === "va_ewallet") {
                      // toggle
                      setActiveCategory("qris");
                      setSelectedMethod("qris");
                    } else {
                      setActiveCategory("va_ewallet");
                      if (!selectedMethod.startsWith("va-")) {
                        setSelectedMethod("va-bca");
                      }
                    }
                  }}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-icon-chip va-chip">VA / EW</span>
                    <div>
                      <div className="accordion-title-row">
                        <strong>Virtual Account &amp; e-Wallet</strong>
                        <span className="accordion-count-badge">8 Pilihan</span>
                      </div>
                      <span className="accordion-sub">DANA, ShopeePay, OVO, GoPay, BCA, Mandiri, BRI, BNI</span>
                    </div>
                  </div>
                  <div className="accordion-action-wrap">
                    <span className="accordion-chevron">{activeCategory === "va_ewallet" ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Sub-Options List with smooth slide down animation */}
                {activeCategory === "va_ewallet" && (
                  <div className="accordion-content-panel">
                    <div className="sub-methods-grid">
                      {vaEwalletMethods.map((m) => {
                        const isSelected = selectedMethod === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`sub-method-card ${isSelected ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMethod(m.id);
                            }}
                          >
                            <input
                              type="radio"
                              name="singapay_sub_method"
                              value={m.id}
                              checked={isSelected}
                              onChange={() => setSelectedMethod(m.id)}
                            />
                            <div className="sub-method-info">
                              <div className="sub-method-title">
                                <strong>{m.name}</strong>
                                {m.badge && <span className="sub-badge">{m.badge}</span>}
                              </div>
                              <span className="sub-provider">{m.provider}</span>
                            </div>
                            <span className={`sub-fee ${m.feeAmount === 0 ? "free" : ""}`}>{m.fee}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. KATEGORI TRANSFER BANK */}
              <div className={`accordion-card ${activeCategory === "bank_transfer" ? "active" : ""}`}>
                <div
                  className="accordion-header"
                  onClick={() => {
                    if (activeCategory === "bank_transfer") {
                      setActiveCategory("qris");
                      setSelectedMethod("qris");
                    } else {
                      setActiveCategory("bank_transfer");
                      if (!selectedMethod.startsWith("transfer-")) {
                        setSelectedMethod("transfer-bca");
                      }
                    }
                  }}
                >
                  <div className="accordion-title-wrap">
                    <span className="accordion-icon-chip bank-chip">BANK</span>
                    <div>
                      <div className="accordion-title-row">
                        <strong>Transfer Bank (Verifikasi Cepat)</strong>
                        <span className="accordion-free-badge">Bebas Admin</span>
                      </div>
                      <span className="accordion-sub">Bank BCA, Mandiri, BRI, BNI, BSI (Syariah)</span>
                    </div>
                  </div>
                  <div className="accordion-action-wrap">
                    <span className="accordion-chevron">{activeCategory === "bank_transfer" ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Sub-Options List for Bank Transfer */}
                {activeCategory === "bank_transfer" && (
                  <div className="accordion-content-panel">
                    <div className="sub-methods-grid">
                      {bankTransferMethods.map((m) => {
                        const isSelected = selectedMethod === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`sub-method-card ${isSelected ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMethod(m.id);
                            }}
                          >
                            <input
                              type="radio"
                              name="singapay_sub_method"
                              value={m.id}
                              checked={isSelected}
                              onChange={() => setSelectedMethod(m.id)}
                            />
                            <div className="sub-method-info">
                              <div className="sub-method-title">
                                <strong>{m.name}</strong>
                                {m.badge && <span className="sub-badge">{m.badge}</span>}
                              </div>
                              <span className="sub-provider">{m.provider}</span>
                            </div>
                            <span className="sub-fee free">{m.fee}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Breakdown & Action */}
          <div className="sp-footer-action">
            <div className="sp-breakdown-card">
              <div className="sp-breakdown-row">
                <span className="row-label">Harga Paket ({pkg.name})</span>
                <span className="row-value">{formatIdr(basePrice)}</span>
              </div>
              <div className="sp-breakdown-row">
                <span className="row-label">Biaya Layanan ({currentMethod.name})</span>
                <span className={`row-value ${adminFee === 0 ? "free-text" : "fee-text"}`}>
                  {adminFee === 0 ? "Gratis (Rp 0)" : `+ ${formatIdr(adminFee)}`}
                </span>
              </div>
              <div className="sp-breakdown-divider" />
              <div className="sp-breakdown-row total-row">
                <div>
                  <strong className="total-label">Total Pembayaran</strong>
                  <span className="total-subtext">Menggunakan {currentMethod.name}</span>
                </div>
                <strong className="sp-total-amount">{formatIdr(totalPrice)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="button-accent full dynamic-pay-button"
              disabled={isSubmitting}
            >
              <span className="pay-btn-text">
                {isSubmitting ? "Menyiapkan Invoice..." : `Lanjut Pembayaran · ${formatIdr(totalPrice)}`}
              </span>
              <Icon name="arrow" size={18} />
            </button>

            <div className="sp-or-divider">
              <span>atau pemesanan langsung</span>
            </div>

            <button
              type="button"
              className="sp-wa-direct-btn"
              onClick={openWhatsAppOrder}
              disabled={isSubmitting}
            >
              <Icon name="whatsapp" size={18} />
              <span>{isSubmitting ? "Menghubungkan..." : "Pesan & Chat Langsung via WhatsApp Admin"}</span>
              <Icon name="external" size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: INVOICE PEMBAYARAN ELEGAN (STANDAR TRAVELOKA / TIKET.COM)         */}
      {/* ========================================================================= */}
      {step === "payment" && (
        <div className="sp-step-content traveloka-invoice-view">
          {/* Status Banner & Countdown Timer */}
          <div className="invoice-timer-card">
            <div className="itc-header">
              <span className="itc-status-pill">
                <span className="itc-pulse-dot" /> Menunggu Pembayaran
              </span>
              <div className="itc-countdown">
                <span>Batas Waktu Bayar:</span>
                <strong className="itc-timer-digit">{formatTime(timeLeft)}</strong>
              </div>
            </div>
            <div className="itc-progress-track">
              <div
                className="itc-progress-fill"
                style={{ width: `${Math.max(0, (timeLeft / (15 * 60)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Traveloka Style Invoice Identity Card */}
          <div className="invoice-meta-card">
            <div className="imc-row">
              <span className="imc-label">NO. INVOICE / ID PESANAN</span>
              <div className="imc-val-wrap">
                <code className="imc-code">{invoiceId || "INV-JT-20261106-9812"}</code>
                <button
                  type="button"
                  className="imc-copy-btn"
                  onClick={() => copyToClipboard(invoiceId, "invoice")}
                >
                  <Icon name="copy" size={13} />
                  <span>{copiedInvoice ? "Tersalin! ✓" : "Salin"}</span>
                </button>
              </div>
            </div>
            <div className="imc-row">
              <span className="imc-label">PAKET DIPILIH</span>
              <span className="imc-value">
                <strong>{pkg.name}</strong> · {pkg.estToken} (Saldo Permanen)
              </span>
            </div>
            <div className="imc-row">
              <span className="imc-label">WAKTU PEMESANAN</span>
              <span className="imc-value">{formatDate(new Date().toISOString())}</span>
            </div>
          </div>

          {/* Primary Payment Card (The Core Copyable Destination) */}
          {selectedMethod === "qris" ? (
            <div className="invoice-qris-card">
              <div className="iqc-header">
                <div className="iqc-badge-wrap">
                  <span className="iqc-national-badge">QRIS Standar Nasional</span>
                  <span className="iqc-merchant-title">PT JURAGAN TOKEN INDONESIA</span>
                </div>
                <span className="iqc-nmid">NMID: ID1020084920194</span>
              </div>

              {/* Crisp High-Res QRIS SVG */}
              <div className="qris-qr-code" aria-label="QRIS Code">
                <svg viewBox="0 0 160 160" width="180" height="180" fill="none" className="qr-svg">
                  <rect width="160" height="160" fill="white" />
                  <rect x="15" y="15" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="25" y="25" width="20" height="20" fill="#0a2442" />
                  <rect x="105" y="15" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="115" y="25" width="20" height="20" fill="#0a2442" />
                  <rect x="15" y="105" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="25" y="115" width="20" height="20" fill="#0a2442" />
                  <rect x="65" y="20" width="8" height="8" fill="#0a2442" />
                  <rect x="80" y="20" width="12" height="8" fill="#0a2442" />
                  <rect x="65" y="35" width="16" height="8" fill="#0a2442" />
                  <rect x="90" y="35" width="8" height="8" fill="#0a2442" />
                  <rect x="65" y="50" width="8" height="16" fill="#0a2442" />
                  <rect x="80" y="60" width="16" height="8" fill="#0a2442" />
                  <rect x="20" y="65" width="30" height="8" fill="#0a2442" />
                  <rect x="30" y="80" width="12" height="12" fill="#0a2442" />
                  <rect x="65" y="80" width="30" height="10" fill="#0a58ca" />
                  <rect x="110" y="65" width="12" height="16" fill="#0a2442" />
                  <rect x="130" y="70" width="15" height="8" fill="#0a2442" />
                  <rect x="110" y="90" width="35" height="10" fill="#0a2442" />
                  <rect x="65" y="105" width="12" height="12" fill="#0a2442" />
                  <rect x="85" y="115" width="20" height="8" fill="#0a2442" />
                  <rect x="70" y="130" width="35" height="15" fill="#0a2442" />
                  <rect x="115" y="125" width="12" height="15" fill="#0a2442" />
                  <rect x="135" y="130" width="10" height="10" fill="#0a2442" />
                </svg>
                <div className="qris-center-badge">QRIS</div>
              </div>

              <p className="qris-instruction-text">
                Scan QR di atas menggunakan aplikasi <b>BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, ShopeePay, atau DANA</b>.
              </p>

              {/* Total Bayar Copyable */}
              <div className="invoice-amount-box">
                <span className="iab-label">TOTAL JUMLAH PEMBAYARAN:</span>
                <div className="iab-row">
                  <strong className="iab-price">{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="copy-field-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  >
                    <Icon name="copy" size={14} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="invoice-destination-card">
              <div className="idc-header">
                <div className="idc-title-wrap">
                  <span className="idc-badge">{currentMethod.name}</span>
                  <span className="idc-status-pill">Otomatis Terverifikasi</span>
                </div>
                <span className="idc-speed-pill">{currentMethod.speed}</span>
              </div>

              {/* Nomor Rekening / Virtual Account (Large Copyable Number) */}
              <div className="idc-field-block">
                <span className="idc-field-label">
                  {currentMethod.category === "bank_transfer" ? "NOMOR REKENING TUJUAN:" : "NOMOR VIRTUAL ACCOUNT:"}
                </span>
                <div className="idc-number-box">
                  <code className="idc-code">
                    {currentMethod.accountNumber || "3901 0812 3456 7890"}
                  </code>
                  <button
                    type="button"
                    className="copy-field-btn accent"
                    onClick={() => copyToClipboard((currentMethod.accountNumber || "3901081234567890").replace(/\s/g, ""), "va")}
                  >
                    <Icon name="copy" size={14} />
                    <span>{copiedVa ? "Tersalin! ✓" : "Salin Nomor"}</span>
                  </button>
                </div>
              </div>

              <div className="idc-field-block">
                <span className="idc-field-label">NAMA REKENING / PENERIMA:</span>
                <strong className="idc-recipient-name">
                  {currentMethod.accountName || "PT JURAGAN TOKEN INDONESIA"}
                </strong>
              </div>

              {/* Total Jumlah Transfer (Copyable Exact Amount seperti Traveloka) */}
              <div className="invoice-amount-box">
                <div className="iab-meta">
                  <span className="iab-label">TOTAL JUMLAH TRANSFER PERSIS:</span>
                  <span className="iab-sub">
                    (Paket: {formatIdr(basePrice)} {adminFee > 0 ? `+ Biaya Layanan: ${formatIdr(adminFee)}` : "+ Bebas Admin"})
                  </span>
                </div>
                <div className="iab-row">
                  <strong className="iab-price">{formatIdr(totalPrice)}</strong>
                  <button
                    type="button"
                    className="copy-field-btn"
                    onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                  >
                    <Icon name="copy" size={14} />
                    <span>{copiedAmount ? "Tersalin! ✓" : "Salin Jumlah"}</span>
                  </button>
                </div>
              </div>

              <div className="invoice-warning-pill">
                <span>⚠️</span>
                <span>
                  <b>PENTING:</b> Mohon transfer tepat hingga nominal rupiah terakhir agar sistem dapat mendeteksi pembayaran Anda secara otomatis.
                </span>
              </div>
            </div>
          )}

          {/* Petunjuk Pembayaran Step-by-Step (Traveloka & Tiket.com Standard) */}
          <div className="invoice-guide-card">
            <div className="igc-header">
              <strong>Petunjuk Cara Pembayaran:</strong>
              <div className="igc-tabs">
                <button
                  type="button"
                  className={`igc-tab-btn ${guideTab === "mbanking" ? "active" : ""}`}
                  onClick={() => setGuideTab("mbanking")}
                >
                  m-Banking
                </button>
                <button
                  type="button"
                  className={`igc-tab-btn ${guideTab === "ibanking" ? "active" : ""}`}
                  onClick={() => setGuideTab("ibanking")}
                >
                  i-Banking
                </button>
                <button
                  type="button"
                  className={`igc-tab-btn ${guideTab === "atm" ? "active" : ""}`}
                  onClick={() => setGuideTab("atm")}
                >
                  ATM
                </button>
              </div>
            </div>

            <ol className="igc-steps-list">
              {getInstructions(currentMethod, guideTab).map((stepTxt, idx) => (
                <li key={idx}>{stepTxt}</li>
              ))}
            </ol>
          </div>

          {/* Action CTAs */}
          <div className="invoice-actions-block">
            <button
              type="button"
              className="button-accent full invoice-verify-btn"
              onClick={handleSimulateSuccess}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <span className="btn-spinner" /> Memverifikasi Pembayaran...
                </>
              ) : (
                <>
                  <Icon name="check" size={18} />
                  <span>Saya Sudah Bayar (Cek Status Pembayaran)</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="sp-wa-action-btn"
              onClick={openWhatsAppConfirmation}
            >
              <Icon name="whatsapp" size={18} />
              <span>Bantuan &amp; Konfirmasi Cepat via WhatsApp</span>
              <Icon name="external" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: SUKSES & INVOICE LUNAS (KREDENSIAL API KEY RESMI)                 */}
      {/* ========================================================================= */}
      {step === "success" && (
        <div className="sp-step-content payment-success" style={{ textAlign: "center", paddingTop: "8px" }}>
          <PaymentSuccessMark size={76} />

          <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>
            Pembayaran Berhasil!
          </h3>
          <p className="success-desc" style={{ maxWidth: "420px", margin: "0 auto 20px", color: "#536b85", fontSize: "13px" }}>
            Paket <b>{pkg.name}</b> telah aktif. Bukti invoice resmi dan kredensial API Key Anda telah terbit dan dikirimkan ke email Anda.
          </p>

          {/* Official Fintech Receipt Card (BCA / GoPay / Traveloka standard) */}
          <div className="fintech-receipt-card" style={{ textAlign: "left" }}>
            <div className="frc-header">
              <div className="frc-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Bukti Pembayaran Resmi</strong>
              </div>
              <span className="frc-status-pill">
                <Icon name="check" size={12} /> LUNAS &amp; TERVERIFIKASI
              </span>
            </div>

            <div className="frc-amount-box">
              <span className="frc-amount-label">TOTAL PEMBAYARAN</span>
              <span className="frc-amount-val">{formatIdr(totalPaid || totalPrice)}</span>
            </div>

            <div className="frc-meta-grid">
              <div className="frc-row">
                <span className="frc-label">No. Invoice</span>
                <span className="frc-val">{invoiceId || "INV-JT-20261106-9812"}</span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Waktu Transaksi</span>
                <span className="frc-val">{formatDate(paidAt || new Date().toISOString())}</span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Metode Pembayaran</span>
                <span className="frc-val">{currentMethod.name}</span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Paket Kredit</span>
                <span className="frc-val">
                  <strong>{pkg.name}</strong> ({pkg.estToken})
                </span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Nama Pembeli</span>
                <span className="frc-val">{customerName || "Sahabat Token"}</span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Email Penerima</span>
                <span className="frc-val">{customerEmail || "-"}</span>
              </div>
              <div className="frc-row">
                <span className="frc-label">Masa Aktif Saldo</span>
                <span className="frc-val" style={{ color: "#059669", fontWeight: 700 }}>
                  Permanen (Tanpa Masa Hangus)
                </span>
              </div>
            </div>
          </div>

          {/* Email Delivery Notification Banner */}
          {emailStatus === "sent" && (
            <div className="email-status-banner email-sent">
              <Icon name="mail" size={18} />
              <div>
                <strong>Bukti Transaksi &amp; API Key Telah Terkirim ke Gmail!</strong>
                <p>Kredensial resmi telah dikirim ke <b>{customerEmail}</b>. Silakan periksa kotak masuk atau spam.</p>
              </div>
            </div>
          )}

          {emailStatus === "simulated" && (
            <div className="email-status-banner email-simulated">
              <Icon name="mail" size={18} />
              <div>
                <strong>Bukti Transaksi Siap (Mode Simulasi)</strong>
                <p>Notifikasi email simulasi untuk <b>{customerEmail}</b> berhasil diverifikasi.</p>
              </div>
            </div>
          )}

          {emailStatus === "error" && (
            <div className="email-status-banner email-error">
              <Icon name="alert" size={18} />
              <div>
                <strong>Pengiriman Email Tertunda</strong>
                <p>{emailMessage || "Kredensial tetap dapat disalin langsung dari kotak di bawah ini."}</p>
              </div>
            </div>
          )}

          {/* Virtual API Key Output Card */}
          <div className="key-credential-card">
            <div className="kcc-header">
              <div className="kcc-title">
                <Icon name="key" size={16} />
                <span>Virtual API Key Anda:</span>
              </div>
              <span className="kcc-badge">Siap Pakai</span>
            </div>
            <div className="kcc-key-row">
              <code>{apiKeyGenerated || "jt-live-7d9a1b4c3e8f2095a1c84b72e0"}</code>
              <button
                type="button"
                className="button-accent copy-btn"
                onClick={() => copyToClipboard(apiKeyGenerated || "jt-live-7d9a1b4c3e8f2095a1c84b72e0", "key")}
              >
                <Icon name="copy" size={15} />
                <span>{copiedKey ? "Tersalin! ✓" : "Salin Kunci"}</span>
              </button>
            </div>
            <p className="kcc-warning">
              Kunci ini bersifat rahasia. Jangan membagikannya ke publik atau repositori publik GitHub.
            </p>
          </div>

          {/* Base URL Card */}
          <div className="base-url-card">
            <span className="buc-label">Universal OpenAI Base URL:</span>
            <div className="buc-row">
              <code>{GATEWAY_BASE_URL}</code>
              <button
                type="button"
                className="link-button"
                onClick={() => copyToClipboard(GATEWAY_BASE_URL, "url")}
              >
                {copiedUrl ? "Tersalin!" : "Salin URL"}
              </button>
            </div>
          </div>

          {/* WhatsApp Backup Button */}
          <div className="wa-backup-section">
            <button
              type="button"
              className="sp-wa-action-btn"
              onClick={() => openWhatsAppCredentials(customerPhone ? "self" : "admin")}
            >
              <Icon name="whatsapp" size={18} />
              <span>Simpan &amp; Cadangkan Kredensial ke WhatsApp</span>
              <Icon name="external" size={14} />
            </button>
            <p className="wa-backup-hint">
              {customerPhone
                ? "Kirim kredensial ini langsung ke nomor WhatsApp Anda sendiri agar tidak hilang."
                : "Cadangkan kredensial ke WhatsApp Anda agar aman."}
            </p>
          </div>

          <button type="button" className="primary-button full" onClick={handleClose}>
            Tutup &amp; Mulai Menggunakan API ↗
          </button>
        </div>
      )}
    </Dialog>
  );
}
