"use client";

import { useEffect, useState } from "react";
import { GATEWAY_BASE_URL, RetailPackage, paymentMethods } from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";

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
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 menit
  const [apiKeyGenerated, setApiKeyGenerated] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "simulated" | "error">("idle");
  const [emailMessage, setEmailMessage] = useState("");

  const handleClose = () => {
    setStep("checkout");
    setApiKeyGenerated("");
    setTimeLeft(15 * 60);
    setEmailStatus("idle");
    setEmailMessage("");
    onClose();
  };

  useEffect(() => {
    if (step !== "payment") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatIdr = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleProceedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerName) return;
    setStep("payment");
  };

  const triggerSendReceipt = async (key: string) => {
    if (!pkg || !customerEmail) return;
    setEmailStatus("sending");
    const currentM = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];
    try {
      const res = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          packageName: pkg.name,
          priceIdr: pkg.priceIdr + (currentM.feeAmount ?? 0),
          paymentMethod: currentM.name,
          apiKey: key,
          gatewayUrl: GATEWAY_BASE_URL,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.simulated) {
          setEmailStatus("simulated");
          setEmailMessage(data.message || `Mode simulasi: email siap dikirim ke ${customerEmail}`);
        } else {
          setEmailStatus("sent");
          setEmailMessage(`Bukti pembayaran & API Key telah dikirim ke ${customerEmail}`);
        }
      } else {
        setEmailStatus("error");
        setEmailMessage(data.error || "Gagal mengirim email tanda terima.");
      }
    } catch {
      setEmailStatus("error");
      setEmailMessage("Gagal terhubung ke layanan pengiriman email.");
    }
  };

  const handleSimulateSuccess = () => {
    const randomKey = `jt-live-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKeyGenerated(randomKey);
    setStep("success");
    triggerSendReceipt(randomKey);
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
    <Dialog open={open} onClose={handleClose} label="Checkout SingaPay" panelClassName="modal singapay-modal">
      <button className="close-button" onClick={handleClose} aria-label="Tutup pembayaran">
        <Icon name="close" />
      </button>

      {/* Header SingaPay */}
      <div className="singapay-header">
        <div className="singapay-logo-badge">
          <span className="brand-dot-sp" />
          <strong>SingaPay</strong>
          <small>Payment Gateway</small>
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
            >
              <span className="pay-btn-text">
                Bayar <strong>{formatIdr(totalPrice)}</strong> via {currentMethod.name}
              </span>
              <Icon name="arrow" size={18} />
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
                <div className="qris-center-badge">SingaPay</div>
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

          <div className="simulation-control">
            <p className="sim-text">
              <Icon name="bolt" size={13} style={{ marginRight: "4px", color: "var(--blue)" }} />
              Lingkungan Demo SingaPay: Klik tombol di bawah untuk menyimulasikan pembayaran berhasil.
            </p>
            <button type="button" className="button-accent full" onClick={handleSimulateSuccess}>
              Simulasikan Pembayaran Berhasil
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="sp-step-content payment-success">
          <div className="success-icon-wrap">
            <Icon name="check" size={32} />
          </div>
          <span className="success-tag">Pembayaran Dikonfirmasi oleh SingaPay</span>
          <h3>Token API Anda Siap Digunakan!</h3>
          <p className="success-desc">
            Paket <b>{pkg.name}</b> telah aktif. Kredensial telah diterbitkan dan tidak pernah kedaluwarsa.
          </p>

          {/* Email Delivery Confirmation Card */}
          <div className={`email-status-card status-${emailStatus}`}>
            <div className="esc-header">
              <span className="esc-icon" aria-hidden="true">
                {emailStatus === "sending" && <span className="esc-spinner" />}
                {emailStatus === "sent" && <Icon name="check" size={15} />}
                {emailStatus === "simulated" && <Icon name="info" size={15} />}
                {emailStatus === "error" && <Icon name="alert" size={15} />}
                {emailStatus === "idle" && <Icon name="info" size={15} />}
              </span>
              <div className="esc-text">
                <strong>
                  {emailStatus === "sending" && "Mengirimkan bukti pembayaran & API Key ke email..."}
                  {emailStatus === "sent" && "Bukti Bayar & API Key Terkirim via Gmail"}
                  {emailStatus === "simulated" && "Sistem Email Terhubung (Mode Simulasi)"}
                  {emailStatus === "error" && "Kendala Pengiriman Email"}
                  {emailStatus === "idle" && "Email Pengiriman Bukti Pembayaran"}
                </strong>
                <p>
                  {emailMessage || (
                    <>Bukti transaksi resmi dan kredensial API Key dikirimkan ke <b>{customerEmail}</b>.</>
                  )}
                </p>
              </div>
            </div>
            {emailStatus === "error" && (
              <button
                type="button"
                className="esc-retry-btn"
                onClick={() => triggerSendReceipt(apiKeyGenerated)}
              >
                Kirim Ulang
              </button>
            )}
          </div>

          <div className="credential-card">
            <div className="cred-field">
              <label>Virtual API Key Anda</label>
              <div className="cred-copy-row">
                <code>{apiKeyGenerated}</code>
                <button
                  type="button"
                  className="button-primary-sm"
                  onClick={() => copyToClipboard(apiKeyGenerated, "key")}
                >
                  {copiedKey ? "Tersalin!" : "Salin Key"}
                </button>
              </div>
            </div>

            <div className="cred-field">
              <label>Base URL Gateway</label>
              <div className="cred-copy-row">
                <code>{GATEWAY_BASE_URL}</code>
                <button
                  type="button"
                  className="button-primary-sm"
                  onClick={() => copyToClipboard(GATEWAY_BASE_URL, "url")}
                >
                  {copiedUrl ? "Tersalin!" : "Salin URL"}
                </button>
              </div>
            </div>
          </div>

          <div className="quick-start-box">
            <h4>Bisa langsung dicolok ke:</h4>
            <ul>
              <li><b>Web Chatbox:</b> Buka <a href="https://web.chatboxai.app/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontWeight: 700 }}>web.chatboxai.app ↗</a> <i>(bukan chat-box.ai)</i></li>
              <li><b>NextChat Web:</b> Buka <a href="https://app.nextchat.dev/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontWeight: 700 }}>app.nextchat.dev ↗</a></li>
              <li><b>Claude Code CLI:</b> <code>$env:ANTHROPIC_API_KEY=&quot;{apiKeyGenerated}&quot;</code></li>
              <li><b>Cursor AI:</b> Masukkan di <i>Settings &gt; Models &gt; Custom API Key</i></li>
            </ul>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <a
                href="https://web.chatboxai.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary-sm"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", gap: "5px" }}
              >
                <Icon name="globe" size={13} />
                <span>Buka Web Chatbox</span>
                <Icon name="external" size={11} />
              </a>
              <a
                href="https://app.nextchat.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary-sm"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 12px", background: "#f0f6fc", color: "var(--blue)", border: "1px solid #c8dcf4", gap: "5px" }}
              >
                <Icon name="globe" size={13} />
                <span>Buka NextChat</span>
                <Icon name="external" size={11} />
              </a>
            </div>
          </div>

          <button type="button" className="button-primary full" onClick={handleClose}>
            Selesai &amp; Kembali ke Katalog
          </button>
        </div>
      )}
    </Dialog>
  );
}
