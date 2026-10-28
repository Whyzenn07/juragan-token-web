"use client";

import { useState } from "react";
import {
  ANSWER_INPUT_TOKENS,
  ANSWER_OUTPUT_TOKENS,
  compatibleApps,
  GATEWAY_BASE_URL,
  GATEWAY_ORIGIN,
  inputIdrPer1M,
  isPerImage,
  ModelItem,
  outputIdrPer1M,
  perImageIdr,
  PRICING_SNAPSHOT_DATE,
  providerById,
  unitCostIdr,
  unitsForBudget
} from "@/data/catalog";
import { Dialog } from "./Dialog";
import { Icon } from "@/components/ui/Icon";
import { ProviderLogo } from "@/components/ui/ProviderLogo";

type ModelDetailModalProps = {
  open: boolean;
  model: ModelItem | null;
  onClose: () => void;
  onSelectTopUp?: (model: ModelItem) => void;
};

export function ModelDetailModal({ open, model, onClose, onSelectTopUp }: ModelDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"quickstart" | "specs" | "pricing">("quickstart");

  if (!model) return null;
  const p = providerById(model.providerId);
  const perImage = isPerImage(model);
  const unit = perImage ? "gambar" : "jawaban";

  const formatIdr = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  const formatNum = (val: number) => new Intl.NumberFormat("id-ID").format(val);

  const copyText = async (text: string, type: "key" | "url" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handleCopyAll = () => {
    copyText(`Base URL: ${GATEWAY_BASE_URL}\nModel: ${model.id}`, "all");
  };

  return (
    <Dialog open={open} onClose={onClose} label={`Detail ${model.name}`} panelClassName="modal model-detail-modal">
      <button className="close-button" onClick={onClose} aria-label="Tutup detail modal">
        <Icon name="close" />
      </button>

      {/* Modal Top Hero */}
      <div className="modal-model-hero">
        <div className="modal-logo-box">
          <ProviderLogo provider={model.providerId} size={42} />
        </div>
        <div className="modal-title-meta">
          <div className="modal-category-row">
            <span className="category-pill">{model.category}</span>
            <span className="provider-name-tag">{p.company}</span>
          </div>
          <h3>{model.name}</h3>
          <p>{model.description}</p>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="model-stats-bar">
        {perImage ? (
          <div className="stat-cell">
            <span className="stat-label">Harga per gambar</span>
            <strong className="stat-price">{formatIdr(perImageIdr(model))}</strong>
          </div>
        ) : (
          <>
            <div className="stat-cell">
              <span className="stat-label">Input / 1 juta token</span>
              <strong>{formatIdr(inputIdrPer1M(model))}</strong>
            </div>
            <div className="stat-cell">
              <span className="stat-label">Output / 1 juta token</span>
              <strong>{formatIdr(outputIdrPer1M(model))}</strong>
            </div>
          </>
        )}
        <div className="stat-cell">
          <span className="stat-label">Rp10.000 cukup untuk</span>
          <strong className="stat-price">
            ±{formatNum(unitsForBudget(model))} {unit}
          </strong>
        </div>
      </div>

      {/* Modal Tabs */}
      <div className="modal-tabs-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "quickstart"}
          className={`modal-tab-btn ${activeTab === "quickstart" ? "active" : ""}`}
          onClick={() => setActiveTab("quickstart")}
        >
          Cara pakai
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "specs"}
          className={`modal-tab-btn ${activeTab === "specs" ? "active" : ""}`}
          onClick={() => setActiveTab("specs")}
        >
          Spesifikasi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pricing"}
          className={`modal-tab-btn ${activeTab === "pricing" ? "active" : ""}`}
          onClick={() => setActiveTab("pricing")}
        >
          Hitungan biaya
        </button>
      </div>

      {/* Tab 1: Quickstart */}
      {activeTab === "quickstart" && (
        <div className="modal-tab-panel">
          <div className="connect-code-card">
            <div className="code-field">
              <label>Base URL (format OpenAI)</label>
              <div className="copy-row">
                <code>{GATEWAY_BASE_URL}</code>
                <button
                  type="button"
                  className="button-primary-sm"
                  onClick={() => copyText(GATEWAY_BASE_URL, "url")}
                >
                  {copiedUrl ? "Tersalin" : "Salin URL"}
                </button>
              </div>
            </div>

            <div className="code-field">
              <label>Nama model (isi di parameter model)</label>
              <div className="copy-row">
                <code>{model.id}</code>
                <button
                  type="button"
                  className="button-sm-outline"
                  onClick={() => copyText(model.id, "key")}
                >
                  {copiedKey ? "Tersalin" : "Salin nama"}
                </button>
              </div>
            </div>
          </div>

          <div className="usage-recommend-box">
            <h4>Bisa langsung dipakai di:</h4>
            <ul>
              {model.endpoints.includes("anthropic") && (
                <li>
                  <b>Claude Code:</b> set <code>ANTHROPIC_BASE_URL={GATEWAY_ORIGIN}</code> lalu jalankan <code>claude --model {model.id}</code>
                </li>
              )}
              {model.endpoints.includes("openai") && (
                <li>
                  <b>Cursor:</b> Settings &gt; Models, aktifkan Override OpenAI Base URL, isi Base URL di atas, lalu tambah model <code>{model.id}</code>
                </li>
              )}
              {model.endpoints.includes("openai") && (
                <li>
                  <b>Chatbox (HP/laptop):</b> pilih provider OpenAI API Compatible, isi Base URL dan API key, lalu ketik nama model di atas
                </li>
              )}
              {model.endpoints.includes("image") && (
                <li>
                  <b>API gambar:</b> kirim <code>POST /v1/images/generations</code> dengan <code>&quot;model&quot;: &quot;{model.id}&quot;</code>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Specs */}
      {activeTab === "specs" && (
        <div className="modal-tab-panel">
          <div className="spec-list">
            <div className="spec-item">
              <span className="spec-key">Menerima input</span>
              <span className="spec-val">{model.inputs.join(", ")}</span>
            </div>
            {model.contextTokens && (
              <div className="spec-item">
                <span className="spec-key">Jendela konteks</span>
                <span className="spec-val">{formatNum(model.contextTokens)} token (dokumentasi resmi)</span>
              </div>
            )}
            <div className="spec-item">
              <span className="spec-key">Kompatibel dengan</span>
              <span className="spec-val">{compatibleApps(model).join(", ")}</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Masa aktif saldo</span>
              <span className="spec-val">Tidak hangus. Saldo hanya berkurang saat model dipakai.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pricing */}
      {activeTab === "pricing" && (
        <div className="modal-tab-panel">
          <div className="spec-list">
            {perImage ? (
              <div className="spec-item">
                <span className="spec-key">Satu gambar</span>
                <span className="spec-val">{formatIdr(perImageIdr(model))}, berapa pun ukuran prompt-nya</span>
              </div>
            ) : (
              <>
                <div className="spec-item">
                  <span className="spec-key">Satu jawaban</span>
                  <span className="spec-val">
                    {formatNum(ANSWER_INPUT_TOKENS)} token masuk × {formatIdr(inputIdrPer1M(model))} + {formatNum(ANSWER_OUTPUT_TOKENS)} token keluar × {formatIdr(outputIdrPer1M(model))}, dibagi 1 juta
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-key">Hasilnya</span>
                  <span className="spec-val">±Rp{unitCostIdr(model).toLocaleString("id-ID", { maximumFractionDigits: 2 })} per jawaban</span>
                </div>
              </>
            )}
            <div className="spec-item">
              <span className="spec-key">Dengan Rp10.000</span>
              <span className="spec-val">±{formatNum(unitsForBudget(model))} {unit}</span>
            </div>
            <div className="spec-item">
              <span className="spec-key">Sumber tarif</span>
              <span className="spec-val">Gateway juragantoken.co.id per {PRICING_SNAPSHOT_DATE}, kurs contoh Rp16.250/US$</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Footer */}
      <div className="modal-footer-actions">
        <button
          type="button"
          className="button-outline"
          onClick={handleCopyAll}
        >
          {copiedAll ? "Base URL & model tersalin" : "Salin Base URL & model"}
        </button>
        {onSelectTopUp && (
          <button
            type="button"
            className="button-accent"
            onClick={() => {
              onClose();
              onSelectTopUp(model);
            }}
          >
            Beli saldo untuk model ini
          </button>
        )}
      </div>
    </Dialog>
  );
}
