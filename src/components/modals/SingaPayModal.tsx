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

export function SingaPayModal({ open, pkg, onClose }: SingaPayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("qris");
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
  const [emailStatus, setEmailStatus] = useState<"none" | "idle" | "sending" | "sent" | "simulated" | "error">("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const adminWaNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990";

  const handleClose = () => {
    setStep("checkout");
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

  const getWhatsAppOrderText = (inv: string) => {
    if (!pkg) return "";
    const m = paymentMethods.find((item) => item.id === selectedMethod) || paymentMethods[0];
    const total = pkg.priceIdr + (m.feeAmount ?? 0);
    return `Halo Admin Juragan Token! 👋
Saya ingin memesan token API AI prabayar:

🧾 *Rincian Pesanan:*
• No. Invoice: *${inv}*
• Paket: *${pkg.name}* (${pkg.estToken})
• Metode Bayar: ${m.name}
• Total Bayar: *${formatIdr(total)}*

👤 *Data Pemesan:*
• Nama: *${customerName || "-"}*
• Email: *${customerEmail || "-"}*
${customerPhone ? `• No. WhatsApp: *${customerPhone}*` : ""}

Mohon diproses untuk aktivasi kunci API saya. Terima kasih!`;
  };

  const getWhatsAppCredentialsText = (key: string, inv: string) => {
    if (!pkg) return "";
    const m = paymentMethods.find((item) => item.id === selectedMethod) || paymentMethods[0];
    const total = pkg.priceIdr + (m.feeAmount ?? 0);
    const dateStr = formatDate(paidAt || new Date().toISOString());

    return `✨ *BUKTI PEMBAYARAN & KREDENSIAL JURAGAN TOKEN* ✨
====================================
Status: *LUNAS ✓*
No. Invoice: *${inv}*
Waktu: ${dateStr}
Paket: *${pkg.name}*
Total Bayar: *${formatIdr(total)}* (${m.name})
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
      // 1. Konfirmasi pesanan di server (mode demo)
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

      // 2. Ambil kredensial unik resmi yang diterbitkan server
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
      alert("Gagal memproses simulasi pembayaran.");
    } finally {
      setIsConfirming(false);
    }
  };

  const copyToClipboard = async (text: string, type: "key" | "url" | "va" | "amount") => {
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
      }
    } catch {
      // fallback
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  if (!pkg) return null;

  const currentMethod = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];
  const adminFee = currentMethod.feeAmount ?? 0;
  const basePrice = pkg.priceIdr;
  const totalPrice = basePrice + adminFee;

  const getVaInfo = (id: string) => {
    switch (id) {
      case "va-bca":
        return { code: "3901 0812 3456 7890", raw: "3901081234567890", bank: "BCA Virtual Account" };
      case "va-mandiri":
        return { code: "88708 0812 3456 7890", raw: "88708081234567890", bank: "Mandiri Virtual Account" };
      case "va-bri":
        return { code: "12800 0812 3456 7890", raw: "12800081234567890", bank: "BRI Virtual Account (BRIVA)" };
      default:
        return { code: "88019 0812 3456 7890", raw: "88019081234567890", bank: "SingaPay Virtual Account" };
    }
  };

  const vaInfo = getVaInfo(selectedMethod);

  return (
    <Dialog open={open} onClose={handleClose} label="Bukti Pembayaran Resmi" panelClassName="modal singapay-modal">
      <button className="close-button" onClick={handleClose} aria-label="Tutup pembayaran">
        <Icon name="close" />
      </button>

      {/* Header Pembayaran Resmi */}
      <div className="singapay-header">
        <div className="singapay-logo-badge" style={{ gap: "8px" }}>
          <strong style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 800 }}>
            Juragan<span style={{ color: "var(--blue)", fontWeight: 600 }}>Token</span>
          </strong>
          <small style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, padding: "2px 7px", borderRadius: "4px" }}>
            {step === "success" ? "Invoice Lunas" : "Pembayaran Resmi"}
          </small>
        </div>
        <span className="secure-badge">
          <Icon name="check" size={14} /> Terverifikasi QRIS Nasional
        </span>
      </div>

      {step === "checkout" && (
        <form onSubmit={handleProceedPayment} className="sp-step-content">
          <div className="sp-package-summary">
            <div>
              <span className="summary-badge">{pkg.badge || "Pilihan Ritel"}</span>
              <h3>{pkg.name}</h3>
              <p>{pkg.description}</p>
            </div>
            <div className="sp-price-box">
              <strong>{formatIdr(pkg.priceIdr)}</strong>
              <span>{pkg.estToken}</span>
            </div>
          </div>

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
            <label>
              Nomor WhatsApp (Opsional / untuk konfirmasi cepat)
              <input
                type="tel"
                placeholder="Contoh: 08123456789 atau 628..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
          </div>

          <div className="sp-methods-section">
            <div className="methods-header-row">
              <p className="methods-title">Pilih Metode Pembayaran SingaPay:</p>
              <span className="methods-hint">Admin fee otomatis terhitung</span>
            </div>
            <div className="methods-list">
              {paymentMethods.map((m) => (
                <label
                  key={m.id}
                  className={`method-item ${selectedMethod === m.id ? "selected" : ""}`}
                  onClick={() => setSelectedMethod(m.id)}
                  onMouseMove={handleMouseMove}
                >
                  <input
                    type="radio"
                    name="singapay_method"
                    value={m.id}
                    checked={selectedMethod === m.id}
                    onChange={() => setSelectedMethod(m.id)}
                  />
                  <div className="method-info">
                    <div className="method-name-row">
                      <strong>{m.name}</strong>
                      {m.feeAmount > 0 && <span className="method-fee-badge">Admin +{formatIdr(m.feeAmount)}</span>}
                      {m.feeAmount === 0 && <span className="method-fee-free">Gratis Admin</span>}
                    </div>
                    <span>{m.provider}</span>
                  </div>
                  <span className="method-fee">{m.fee}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sp-footer-action">
            {/* Dynamic Price Breakdown */}
            <div className="sp-breakdown-card">
              <div className="sp-breakdown-row">
                <span className="row-label">Harga Paket ({pkg.name})</span>
                <span className="row-value">{formatIdr(basePrice)}</span>
              </div>
              <div className="sp-breakdown-row">
                <span className="row-label">Biaya Admin ({currentMethod.name})</span>
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
              onMouseMove={handleMouseMove}
              disabled={isSubmitting}
            >
              <span className="pay-btn-text">
                {isSubmitting ? (
                  "Membuat Pesanan..."
                ) : (
                  <>
                    Bayar <strong>{formatIdr(totalPrice)}</strong> via {currentMethod.name}
                  </>
                )}
              </span>
              <Icon name="arrow" size={18} />
            </button>

            <div className="sp-or-divider">
              <span>atau untuk testing / pemesanan manual</span>
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

      {step === "payment" && (
        <div className="sp-step-content payment-waiting">
          <div className="timer-bar">
            <span>Selesaikan pembayaran sebelum:</span>
            <strong className="timer-text">{formatTime(timeLeft)}</strong>
          </div>

          {selectedMethod === "qris" ? (
            <div className="qris-box">
              <div className="qris-badge-top">QRIS Standar Pembayaran Nasional</div>
              
              {/* Dynamic QR illustration */}
              <div className="qris-qr-code" aria-label="QRIS Code">
                <svg viewBox="0 0 160 160" width="170" height="170" fill="none" className="qr-svg">
                  <rect width="160" height="160" fill="white" />
                  {/* Top-left locator */}
                  <rect x="15" y="15" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="25" y="25" width="20" height="20" fill="#0a2442" />
                  {/* Top-right locator */}
                  <rect x="105" y="15" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="115" y="25" width="20" height="20" fill="#0a2442" />
                  {/* Bottom-left locator */}
                  <rect x="15" y="105" width="40" height="40" stroke="#0a2442" strokeWidth="6" fill="none" />
                  <rect x="25" y="115" width="20" height="20" fill="#0a2442" />
                  {/* Mock QR data pixels */}
                  <rect x="65" y="20" width="8" height="8" fill="#0a2442" />
                  <rect x="80" y="20" width="12" height="8" fill="#0a2442" />
                  <rect x="65" y="35" width="16" height="8" fill="#0a2442" />
                  <rect x="90" y="35" width="8" height="8" fill="#0a2442" />
                  <rect x="65" y="50" width="8" height="16" fill="#0a2442" />
                  <rect x="80" y="60" width="16" height="8" fill="#0a2442" />
                  <rect x="20" y="65" width="30" height="8" fill="#0a2442" />
                  <rect x="30" y="80" width="12" height="12" fill="#0a2442" />
                  <rect x="65" y="80" width="30" height="10" fill="#ee7d39" />
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

              <p className="qris-hint">
                Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, ShopeePay, Dana) lalu scan QR di atas.
              </p>
              <div className="qris-amount">
                <span>Total Bayar:</span>
                <strong>{formatIdr(totalPrice)}</strong>
              </div>
            </div>
          ) : (
            <div className="va-box">
              <div className="va-box-header">
                <p className="va-title">Nomor {vaInfo.bank}:</p>
                <span className="va-status-pill">Otomatis Terverifikasi</span>
              </div>
              <div className="va-number-row">
                <code>{vaInfo.code}</code>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => copyToClipboard(vaInfo.raw, "va")}
                >
                  {copiedVa ? "Tersalin!" : "Salin VA"}
                </button>
              </div>

              <div className="va-amount-breakdown">
                <div className="va-amount-row">
                  <span>Nominal Transfer Persis:</span>
                  <div className="va-amount-actions">
                    <strong className="va-highlight-price">{formatIdr(totalPrice)}</strong>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                    >
                      {copiedAmount ? "Tersalin!" : "Salin Nominal"}
                    </button>
                  </div>
                </div>
                <div className="va-detail-note">
                  (Paket: {formatIdr(basePrice)} + Biaya Admin {currentMethod.name}: {formatIdr(adminFee)})
                </div>
              </div>

              <p className="va-instructions">
                Transfer via ATM, Mobile Banking ({currentMethod.provider}), atau Internet Banking ke nomor virtual account di atas dengan nominal persis.
              </p>
            </div>
          )}

          {/* Tombol Konfirmasi WhatsApp Admin */}
          <div className="wa-payment-confirm-wrap">
            <button
              type="button"
              className="sp-wa-action-btn"
              onClick={openWhatsAppConfirmation}
            >
              <Icon name="whatsapp" size={18} />
              <span>Konfirmasi Bayar ke WhatsApp Admin</span>
              <Icon name="external" size={14} />
            </button>
            <p className="wa-confirm-hint">
              Kirim bukti transfer/QRIS langsung ke nomor WhatsApp admin untuk verifikasi cepat.
            </p>
          </div>

          <div className="simulation-control">
            <p className="sim-text">
              Mode Simulasi: Klik tombol di bawah untuk menyimulasikan pembayaran berhasil.
            </p>
            <button
              type="button"
              className="button-accent full"
              onClick={handleSimulateSuccess}
              disabled={isConfirming}
            >
              {isConfirming ? "Memverifikasi Pembayaran..." : "Simulasikan Pembayaran Berhasil"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="sp-step-content payment-success" style={{ textAlign: "center", paddingTop: "8px" }}>
          <PaymentSuccessMark size={76} />
          
          <h3 style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>
            Pembayaran Berhasil!
          </h3>
          <p className="success-desc" style={{ maxWidth: "420px", margin: "0 auto 20px", color: "#536b85", fontSize: "13px" }}>
            Paket <b>{pkg.name}</b> telah aktif. Bukti transaksi resmi dan kredensial API Key telah dikirimkan ke email Anda.
          </p>

          {/* Official Fintech Receipt Card */}
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
              <div className="frc-meta-item">
                <span className="frc-meta-label">NO. INVOICE</span>
                <span className="frc-meta-value"><code>{invoiceId}</code></span>
              </div>
              <div className="frc-meta-item">
                <span className="frc-meta-label">METODE PEMBAYARAN</span>
                <span className="frc-meta-value">{currentMethod.name}</span>
              </div>
              <div className="frc-meta-item">
                <span className="frc-meta-label">PAKET TOKEN AI</span>
                <span className="frc-meta-value"><b>{pkg.name}</b></span>
              </div>
              <div className="frc-meta-item">
                <span className="frc-meta-label">WAKTU TRANSAKSI</span>
                <span className="frc-meta-value">{formatDate(paidAt || new Date().toISOString())}</span>
              </div>
              <div className="frc-meta-item">
                <span className="frc-meta-label">NAMA PEMESAN</span>
                <span className="frc-meta-value">{customerName || "Pelanggan"}</span>
              </div>
              <div className="frc-meta-item">
                <span className="frc-meta-label">EMAIL TUJUAN</span>
                <span className="frc-meta-value" style={{ color: "var(--blue)", wordBreak: "break-all" }}>{customerEmail}</span>
              </div>
            </div>

            {/* Tampilan API Key Langsung di Layar */}
            {apiKeyGenerated && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  background: "#0a2442",
                  borderRadius: "8px",
                  color: "#ffffff",
                  textAlign: "left",
                  border: "1px solid #1e3a5f",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "#93c5fd", textTransform: "uppercase" }}>
                    Kunci Virtual API Key Anda
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(apiKeyGenerated, "key")}
                    style={{
                      background: copiedKey ? "#16a34a" : "#0a58ca",
                      color: "#ffffff",
                      border: "none",
                      padding: "5px 12px",
                      borderRadius: "5px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <Icon name={copiedKey ? "check" : "copy"} size={13} />
                    <span>{copiedKey ? "Tersalin!" : "Salin Kunci"}</span>
                  </button>
                </div>
                <code
                  style={{
                    display: "block",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    color: "#60a5fa",
                    wordBreak: "break-all",
                    background: "rgba(255,255,255,0.06)",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: 600,
                  }}
                >
                  {apiKeyGenerated}
                </code>
              </div>
            )}

            {/* Notifikasi Pengiriman Kredensial via Gmail */}
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "12px",
                color: "#166534",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "#16a34a", marginTop: "2px", flexShrink: 0 }}>
                <Icon name="check" size={16} />
              </span>
              <div>
                <strong style={{ display: "block", color: "#14532d", marginBottom: "2px" }}>
                  Kredensial API Telah Dikirim ke Gmail
                </strong>
                <span>
                  Kunci <b>Virtual API Key</b> (<code>jt-live-...</code>) dan <b>Base URL Gateway</b> resmi telah dikirim ke <b>{customerEmail}</b>. Silakan cek kotak masuk atau folder spam email Anda.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Direct to Gmail & Selesai */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                height: "46px",
                background: "#0a58ca",
                color: "#ffffff",
                textDecoration: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(10,88,202,0.25)",
              }}
            >
              <Icon name="mail" size={16} />
              <span>Buka Inbox Gmail ↗</span>
            </a>
            <button
              type="button"
              className="button-primary"
              onClick={handleClose}
              style={{
                flex: 1,
                height: "46px",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
              }}
            >
              <span>Selesai</span>
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
