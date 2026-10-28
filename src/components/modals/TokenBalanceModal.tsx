"use client";

import { useState } from "react";
import { GATEWAY_BASE_URL } from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";

type TokenBalanceModalProps = {
  open: boolean;
  onClose: () => void;
  onTopUp: () => void;
};

type KeyData = {
  key: string;
  planName: string;
  balanceIdr: number;
  estTokensRemaining: string;
  status: "active" | "expired" | "not_found";
  createdAt: string;
  usageHistory: { model: string; tokens: string; cost: string }[];
};

const MOCK_KEYS: Record<string, KeyData> = {
  "jt-live-starter-demo": {
    key: "jt-live-starter-demo",
    planName: "Paket Starter Kuliah",
    balanceIdr: 24500,
    estTokensRemaining: "± 11.200.000 Token",
    status: "active",
    createdAt: "24 Okt 2026",
    usageHistory: [
      { model: "Claude Sonnet 5.5", tokens: "420.000 token", cost: "Rp 20.160" },
      { model: "Gemini 3.8 Flash", tokens: "1.200.000 token", cost: "Rp 6.000" },
      { model: "Kimi K2.7 Code", tokens: "250.000 token", cost: "Rp 3.750" }
    ]
  },
  "jt-live-coba-demo": {
    key: "jt-live-coba-demo",
    planName: "Paket Coba-Coba",
    balanceIdr: 12800,
    estTokensRemaining: "± 3.800.000 Token",
    status: "active",
    createdAt: "25 Okt 2026",
    usageHistory: [
      { model: "Gemini 3.8 Flash", tokens: "400.000 token", cost: "Rp 2.000" },
      { model: "DeepSeek V4 Flash", tokens: "80.000 token", cost: "Rp 360" }
    ]
  }
};

export function TokenBalanceModal({ open, onClose, onTopUp }: TokenBalanceModalProps) {
  const [inputKey, setInputKey] = useState("");
  const [checkedData, setCheckedData] = useState<KeyData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const formatIdr = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey) return;

    setHasSearched(true);
    if (MOCK_KEYS[cleanKey]) {
      setCheckedData(MOCK_KEYS[cleanKey]);
    } else if (cleanKey.startsWith("jt-live-")) {
      // Dynamic simulated result for freshly generated keys from checkout
      setCheckedData({
        key: cleanKey,
        planName: "Paket Ritel Aktif",
        balanceIdr: 29000,
        estTokensRemaining: "± 14.500.000 Token",
        status: "active",
        createdAt: "Hari ini (Baru Diaktivasi)",
        usageHistory: [
          { model: "Node Gateway", tokens: "0 token terpakai", cost: "Rp 0" }
        ]
      });
    } else {
      setCheckedData(null);
    }
  };

  const loadDemoKey = (keyName: string) => {
    setInputKey(keyName);
    setHasSearched(true);
    setCheckedData(MOCK_KEYS[keyName]);
  };

  const handleClose = () => {
    setInputKey("");
    setCheckedData(null);
    setHasSearched(false);
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
          <p>Masukkan API Key Juragan Token Anda untuk mengecek sisa saldo dan histori pemakaian.</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="balance-search-form">
        <div className="balance-input-wrap">
          <input
            type="text"
            placeholder="Contoh: jt-live-xxxxxxxxxxxxxx"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="balance-input"
          />
          <button type="submit" className="button-primary-sm">
            Cek Saldo ↗
          </button>
        </div>
        <div className="demo-key-hints">
          <span>Belum punya key? Coba simulasi:</span>
          <button type="button" onClick={() => loadDemoKey("jt-live-starter-demo")}>
            jt-live-starter-demo
          </button>
          <button type="button" onClick={() => loadDemoKey("jt-live-coba-demo")}>
            jt-live-coba-demo
          </button>
        </div>
      </form>

      {hasSearched && (
        <div className="balance-results">
          {checkedData ? (
            <div className="balance-card">
              <div className="balance-card-head">
                <div>
                  <span className="balance-status-badge">
                    <span className="online-dot" /> Aktif Permanen (Lifetime)
                  </span>
                  <h4>{checkedData.planName}</h4>
                  <code className="key-code">{checkedData.key}</code>
                </div>
                <div className="balance-amount-box">
                  <span className="balance-label">Sisa Saldo</span>
                  <strong className="balance-value">{formatIdr(checkedData.balanceIdr)}</strong>
                  <span className="token-est-label">{checkedData.estTokensRemaining}</span>
                </div>
              </div>

              <div className="balance-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Tanggal Terbit</span>
                  <strong>{checkedData.createdAt}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Masa Berlaku</span>
                  <strong className="lifetime-strong">Tidak Pernah Hangus</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gateway Endpoint</span>
                  <code>{GATEWAY_BASE_URL}</code>
                </div>
              </div>

              <div className="usage-breakdown-box">
                <h5>Histori Pemakaian Terakhir:</h5>
                <div className="usage-list">
                  {checkedData.usageHistory.map((u, i) => (
                    <div key={i} className="usage-row">
                      <span className="usage-model">{u.model}</span>
                      <span className="usage-tokens">{u.tokens}</span>
                      <strong className="usage-cost">{u.cost}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="balance-actions-row">
                <button
                  type="button"
                  className="button-accent full"
                  onClick={() => {
                    handleClose();
                    onTopUp();
                  }}
                >
                  Top Up Saldo SingaPay ↗
                </button>
              </div>
            </div>
          ) : (
            <div className="balance-not-found">
              <span className="error-icon">✕</span>
              <h4>API Key Tidak Ditemukan</h4>
              <p>Pastikan Anda memasukkan format key yang benar (dimulai dengan <code>jt-live-</code>).</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
