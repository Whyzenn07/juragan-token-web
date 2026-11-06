"use client";

import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";

type CurrencyRateModalProps = {
  open: boolean;
  onClose: () => void;
  usdRate: number;
  totalModels: number;
  syncStatus: string;
  isSyncing: boolean;
  syncNotification: string | null;
  onSyncPricing: () => Promise<void>;
};

export function CurrencyRateModal({
  open,
  onClose,
  usdRate,
  totalModels,
  syncStatus,
  isSyncing,
  syncNotification,
  onSyncPricing,
}: CurrencyRateModalProps) {
  const formattedRate = new Intl.NumberFormat("id-ID").format(usdRate);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      label="Kurs Real-Time Bank Indonesia (BI)"
      panelClassName="modal currency-rate-modal"
    >
      <button
        type="button"
        className="close-button"
        onClick={onClose}
        aria-label="Tutup modal kurs"
      >
        <Icon name="close" size={16} />
      </button>

      <div className="crm-header">
        <div className="crm-icon-box" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="crm-header-text">
          <div className="crm-kicker">
            <span className="crm-flag-chip">
              <span className="flag-badge-svg" aria-hidden="true">
                <svg width="16" height="11" viewBox="0 0 18 12" fill="none" style={{ borderRadius: "2px", overflow: "hidden", display: "block" }}>
                  <rect width="18" height="6" fill="#e11d48" />
                  <rect y="6" width="18" height="6" fill="#ffffff" />
                  <rect width="18" height="12" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
                </svg>
              </span>
              <span>INDONESIA (IDR)</span>
            </span>
            <span className="crm-bi-pill">Bank Indonesia (JISDOR)</span>
          </div>
          <h3>Kurs Real-Time Bank Indonesia</h3>
          <p>
            Konversi nilai tukar resmi USD ke Rupiah secara real-time untuk perhitungan harga kredit API token tanpa markup tersembunyi.
          </p>
        </div>
      </div>

      {/* Main Exchange Rate Card */}
      <div className="crm-rate-hero">
        <div className="crm-rate-top">
          <span className="crm-rate-label">KURS TRANSAKSI BI &amp; LIVE FOREX SAAT INI</span>
          <span className="crm-live-badge">
            <span className="crm-live-dot" />
            <span>{syncStatus === "Gateway Live" ? "Gateway Live" : "Aktif"}</span>
          </span>
        </div>

        <div className="crm-rate-val-row">
          <span className="crm-usd-base">1 USD =</span>
          <strong className="crm-idr-val">Rp {formattedRate}</strong>
        </div>

        <div className="crm-rate-footer">
          <div className="crm-footer-item">
            <Icon name="check" size={14} style={{ color: "#10b981" }} />
            <span>Sinkronisasi Otomatis <b>{totalModels} Model AI</b></span>
          </div>
          <div className="crm-footer-item">
            <Icon name="globe" size={14} style={{ color: "#0284c7" }} />
            <span>Sumber: <b>Bank Indonesia / Live Forex</b></span>
          </div>
        </div>
      </div>

      {/* Transparency Feature Cards */}
      <div className="crm-transparency-grid">
        <div className="crm-trans-card">
          <div className="crm-tc-icon">⚡</div>
          <div className="crm-tc-body">
            <strong>100% Transparan Tanpa Markup</strong>
            <p>Harga kredit token per 1M token dihitung murni dari tarif USD gateway resmi dikalikan kurs BI saat ini.</p>
          </div>
        </div>

        <div className="crm-trans-card">
          <div className="crm-tc-icon">🔄</div>
          <div className="crm-tc-body">
            <strong>Sinkronisasi Instan Seluruh Model</strong>
            <p>Ketika kurs diperbarui, harga Claude, GPT-4o, Gemini Flash, hingga DeepSeek R1 otomatis terhitung ulang.</p>
          </div>
        </div>

        <div className="crm-trans-card">
          <div className="crm-tc-icon">🛡️</div>
          <div className="crm-tc-body">
            <strong>Kredit Saldo Terproteksi</strong>
            <p>Saldo Rupiah pada API Key yang sudah Anda beli tidak akan berkurang oleh fluktuasi kurs mendadak.</p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {syncNotification && (
        <div className="crm-success-toast" role="status">
          <Icon name="check" size={16} />
          <span>{syncNotification}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="crm-actions">
        <button
          type="button"
          className={`button-accent full crm-refresh-btn ${isSyncing ? "syncing" : ""}`}
          onClick={onSyncPricing}
          disabled={isSyncing}
        >
          <span className={`crm-spin-icon ${isSyncing ? "spinning" : ""}`}>↻</span>
          <span>{isSyncing ? "Menyinkronkan dengan BI & Gateway..." : "Segarkan Kurs BI & Harga Sekarang"}</span>
        </button>

        <button
          type="button"
          className="text-button crm-dismiss-btn"
          onClick={onClose}
        >
          Tutup
        </button>
      </div>
    </Dialog>
  );
}
