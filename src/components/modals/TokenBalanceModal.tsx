"use client";

import { useEffect, useState } from "react";
import { GATEWAY_BASE_URL } from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";

type TokenBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  onTopUp: (key?: string) => void;
};

type KeyCheckResult = {
  maskedKey: string;
  planName: string;
  estPackage: string;
  balanceIdr: number;
  status: "active" | "suspended" | "revoked";
  createdAt: string;
};

export function TokenBalanceModal({ open, onClose, onTopUp }: TokenBalanceModalProps) {
  const [inputKey, setInputKey] = useState("");
  const [checkedData, setCheckedData] = useState<KeyCheckResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPurchasedKey, setLastPurchasedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        try {
          const saved = sessionStorage.getItem("jt_last_api_key");
          if (saved) setLastPurchasedKey(saved);
        } catch {
          // Abaikan jika storage dinonaktifkan
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  const handleCheck = async (e?: React.FormEvent, directKey?: string) => {
    if (e) e.preventDefault();
    const cleanKey = (directKey ?? inputKey).trim();
    if (!cleanKey) return;

    setLoading(true);
    setErrorMessage("");
    setHasSearched(true);

    try {
      const res = await fetch("/api/keys/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.key) {
        setCheckedData(data.key);
        setErrorMessage("");
      } else {
        setCheckedData(null);
        setErrorMessage(data.error || "API Key tidak ditemukan di server Juragan Token.");
      }
    } catch {
      setCheckedData(null);
      setErrorMessage("Gagal terhubung ke server verifikasi. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  const applyKey = (key: string) => {
    setInputKey(key);
    handleCheck(undefined, key);
  };

  const handleClose = () => {
    setInputKey("");
    setCheckedData(null);
    setHasSearched(false);
    setErrorMessage("");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} label="Cek Saldo Token API" panelClassName="modal balance-modal">
      <button className="close-button" onClick={handleClose} aria-label="Tutup cek saldo">
        <Icon name="close" />
      </button>

      <div className="balance-header">
        <div className="balance-icon-box">
          <Icon name="bag" size={24} />
        </div>
        <div>
          <h3>Cek Saldo &amp; Kuota API Key</h3>
          <p>Masukkan Kunci API Anda untuk mengecek sisa saldo dan status keaktifan di server Juragan Token.</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="balance-search-form">
        <div className="balance-input-wrap">
          <input
            type="text"
            placeholder="Contoh: jt-live-xxxxxxxxxxxxxxxxxxxx"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="balance-input"
            autoComplete="off"
            spellCheck="false"
            disabled={loading}
          />
          <button type="submit" className="button-primary-sm" disabled={loading || !inputKey.trim()}>
            {loading ? (
              <>
                <span className="balance-spinner" aria-hidden="true" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Cek Saldo ↗</span>
            )}
          </button>
        </div>

        {lastPurchasedKey && (
          <div className="demo-key-hints">
            <span>Kunci dari pesanan terakhir:</span>
            <button
              type="button"
              onClick={() => applyKey(lastPurchasedKey)}
              disabled={loading}
              title="Gunakan API Key yang baru saja Anda beli"
            >
              Tempel Kunci ({lastPurchasedKey.slice(0, 11)}...{lastPurchasedKey.slice(-4)})
            </button>
          </div>
        )}
      </form>

      {hasSearched && !loading && (
        <div className="balance-results">
          {checkedData ? (
            <div className="balance-card">
              <div className="balance-card-head">
                <div>
                  <span className="balance-status-badge">
                    <span className="online-dot" /> Terverifikasi Server (Aktif Permanen)
                  </span>
                  <h4>{checkedData.planName}</h4>
                  <code className="key-code">{checkedData.maskedKey}</code>
                </div>
                <div className="balance-amount-box">
                  <span className="balance-label">Sisa Saldo</span>
                  <strong className="balance-value">{formatIdr(checkedData.balanceIdr)}</strong>
                  <span className="token-est-label">{checkedData.estPackage}</span>
                </div>
              </div>

              <div className="balance-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Tanggal Diterbitkan</span>
                  <strong>{formatDate(checkedData.createdAt)}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Masa Berlaku</span>
                  <strong className="lifetime-strong">Aktif Permanen Tanpa Kedaluwarsa</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gateway Endpoint</span>
                  <code>{GATEWAY_BASE_URL}</code>
                </div>
              </div>

              <div className="usage-breakdown-box">
                <h5>Histori Pemakaian:</h5>
                <div className="usage-list">
                  <div className="usage-row">
                    <span className="usage-model">Penggunaan Gateway</span>
                    <span className="usage-tokens">Belum ada pemakaian token</span>
                    <strong className="usage-cost">Rp 0</strong>
                  </div>
                </div>
                <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                  Saldo Anda masih 100% utuh dan siap digunakan di Claude Code, Cursor AI, atau Web Chatbox.
                </p>
              </div>

              <div className="balance-actions-row">
                <button
                  type="button"
                  className="button-accent full"
                  onClick={() => {
                    const keyToTopUp = inputKey.trim();
                    handleClose();
                    onTopUp(keyToTopUp);
                  }}
                >
                  Top-Up Saldo Kunci Ini Sekarang ↗
                </button>
              </div>
            </div>
          ) : (
            <div className="balance-not-found">
              <span className="error-icon">✕</span>
              <h4>Kunci API Tidak Ditemukan</h4>
              <p>
                {errorMessage ||
                  "Pastikan Anda memasukkan format kunci yang valid (dimulai dengan prefix jt-live-) dan telah menyelesaikan pembayaran."}
              </p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

