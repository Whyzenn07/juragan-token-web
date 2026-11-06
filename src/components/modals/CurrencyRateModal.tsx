"use client";

import { useEffect, useMemo, useState } from "react";
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

type Timeframe = "1HR" | "5HR" | "1BLN" | "1TH" | "5TH" | "Maks";

// Sample realistic historical trend curves for Google Finance-style chart
const TIMEFRAME_DATA: Record<Timeframe, { points: string; min: number; max: number; dates: [string, string] }> = {
  "1HR": {
    points: "0,65 20,62 40,68 60,55 80,58 100,50 120,53 140,46 160,48 180,42 200,45 220,38 240,40 260,35",
    min: 18050,
    max: 18110,
    dates: ["14:00", "15:08"]
  },
  "5HR": {
    points: "0,75 25,68 50,72 75,60 100,64 125,52 150,56 175,45 200,48 225,38 250,42 260,35",
    min: 18020,
    max: 18120,
    dates: ["10:00", "15:08"]
  },
  "1BLN": {
    points: "0,65 15,68 30,58 45,52 60,48 75,54 90,32 105,30 120,28 135,35 150,25 165,22 180,24 195,15 210,18 225,16 230,85 240,78 248,22 260,20",
    min: 17400,
    max: 18200,
    dates: ["16 Okt", "28 Okt"]
  },
  "1TH": {
    points: "0,80 30,75 60,68 90,60 120,55 150,48 180,42 210,35 240,28 260,20",
    min: 16200,
    max: 18200,
    dates: ["Nov 2025", "Nov 2026"]
  },
  "5TH": {
    points: "0,88 40,82 80,72 120,65 160,54 200,42 240,30 260,20",
    min: 14500,
    max: 18200,
    dates: ["2021", "2026"]
  },
  "Maks": {
    points: "0,95 35,90 70,82 105,75 140,64 175,52 210,38 245,28 260,20",
    min: 9800,
    max: 18200,
    dates: ["2000", "2026"]
  }
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
  const [timeframe, setTimeframe] = useState<Timeframe>("1BLN");
  const [usdInput, setUsdInput] = useState<string>("1");
  const [idrInput, setIdrInput] = useState<string>(() => String(usdRate));
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Update clock in real time (WIB + UTC)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta"
      };
      const wibStr = new Intl.DateTimeFormat("id-ID", options).format(now);
      const utcHours = String(now.getUTCHours()).padStart(2, "0");
      const utcMins = String(now.getUTCMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${wibStr} WIB · ${utcHours}.${utcMins} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync idrInput whenever usdRate changes
  useEffect(() => {
    const num = parseFloat(usdInput.replace(/,/g, "")) || 0;
    if (!isSwapped) {
      setIdrInput(num === 0 ? "" : (num * usdRate).toLocaleString("id-ID", { maximumFractionDigits: 2 }));
    }
  }, [usdRate]);

  const handleUsdChange = (val: string) => {
    setUsdInput(val);
    const parsed = parseFloat(val.replace(/,/g, ""));
    if (isNaN(parsed)) {
      setIdrInput("");
    } else {
      const converted = parsed * usdRate;
      setIdrInput(converted.toLocaleString("id-ID", { maximumFractionDigits: 2 }));
    }
  };

  const handleIdrChange = (val: string) => {
    setIdrInput(val);
    const clean = val.replace(/\./g, "").replace(/,/g, ".");
    const parsed = parseFloat(clean);
    if (isNaN(parsed) || usdRate === 0) {
      setUsdInput("");
    } else {
      const converted = parsed / usdRate;
      setUsdInput(converted.toLocaleString("en-US", { maximumFractionDigits: 4 }));
    }
  };

  const handleSwap = () => {
    setIsSwapped((prev) => !prev);
  };

  const chart = TIMEFRAME_DATA[timeframe];
  const formattedMainRate = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usdRate);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      label="Nilai Tukar Dolar Amerika Serikat ke Rupiah Indonesia"
      panelClassName="modal google-currency-modal"
    >
      <button
        type="button"
        className="gcm-close-btn"
        onClick={onClose}
        aria-label="Tutup jendela kurs"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Google Finance Header Section */}
      <div className="gcm-top-section">
        <div className="gcm-title-bar">
          <span className="gcm-kicker-label">1 Dolar Amerika Serikat sama dengan</span>
          <div className="gcm-meta-actions">
            <span className="gcm-live-pill">
              <span className="gcm-pulse-dot" />
              <span>Real-Time BI</span>
            </span>
          </div>
        </div>

        <div className="gcm-rate-hero-row">
          <div className="gcm-rate-text-col">
            <div className="gcm-big-rate">{formattedMainRate}</div>
            <div className="gcm-currency-target">Rupiah Indonesia</div>
            <div className="gcm-timestamp-row">
              <span>{currentTimeStr || "Pembaruan Real-Time"}</span>
              <span className="gcm-sep">·</span>
              <span className="gcm-source">Bank Indonesia (JISDOR) &amp; Live Forex</span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="gcm-chart-col">
            {/* Timeframe Filter Tabs */}
            <div className="gcm-timeframe-tabs" role="tablist">
              {(["1HR", "5HR", "1BLN", "1TH", "5TH", "Maks"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  role="tab"
                  aria-selected={timeframe === tf}
                  className={`gcm-tf-btn ${timeframe === tf ? "active" : ""}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="gcm-chart-wrapper">
              <div className="gcm-y-labels">
                <span>{chart.max.toLocaleString("id-ID")}</span>
                <span>{((chart.max + chart.min) / 2).toLocaleString("id-ID")}</span>
                <span>{chart.min.toLocaleString("id-ID")}</span>
              </div>
              <div className="gcm-svg-container">
                <svg viewBox="0 0 260 90" className="gcm-sparkline" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gcmChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34a853" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#34a853" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={`0,90 ${chart.points} 260,90`}
                    fill="url(#gcmChartGrad)"
                  />
                  {/* Stroke line */}
                  <polyline
                    fill="none"
                    stroke="#34a853"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chart.points}
                  />
                  {/* Latest point indicator */}
                  <circle cx="260" cy="20" r="3.5" fill="#34a853" stroke="#202124" strokeWidth="1.5" />
                </svg>
                <div className="gcm-x-labels">
                  <span>{chart.dates[0]}</span>
                  <span>{chart.dates[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Two-Way Currency Converter Input (Google Style) */}
      <div className="gcm-converter-box">
        <div className="gcm-converter-inner">
          {/* Row 1: USD Input */}
          <div className="gcm-input-card">
            <input
              type="text"
              inputMode="decimal"
              className="gcm-number-input"
              value={isSwapped ? idrInput : usdInput}
              onChange={(e) => (isSwapped ? handleIdrChange(e.target.value) : handleUsdChange(e.target.value))}
              aria-label={isSwapped ? "Jumlah Rupiah Indonesia" : "Jumlah Dolar Amerika Serikat"}
            />
            <div className="gcm-currency-select">
              <span className="gcm-currency-name">
                {isSwapped ? "Rupiah Indonesia" : "Dolar Amerika Serikat"}
              </span>
              <span className="gcm-currency-code">({isSwapped ? "IDR" : "USD"})</span>
            </div>
          </div>

          {/* Swap Button */}
          <div className="gcm-swap-wrapper">
            <button
              type="button"
              className="gcm-swap-button"
              onClick={handleSwap}
              title="Tukar arah konversi"
              aria-label="Tukar mata uang"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
                <polyline points="17 14 12 9 7 14" />
                <line x1="12" y1="9" x2="12" y2="21" />
              </svg>
            </button>
          </div>

          {/* Row 2: IDR Input */}
          <div className="gcm-input-card">
            <input
              type="text"
              inputMode="decimal"
              className="gcm-number-input"
              value={isSwapped ? usdInput : idrInput}
              onChange={(e) => (isSwapped ? handleUsdChange(e.target.value) : handleIdrChange(e.target.value))}
              aria-label={isSwapped ? "Jumlah Dolar Amerika Serikat" : "Jumlah Rupiah Indonesia"}
            />
            <div className="gcm-currency-select">
              <span className="gcm-currency-name">
                {isSwapped ? "Dolar Amerika Serikat" : "Rupiah Indonesia"}
              </span>
              <span className="gcm-currency-code">({isSwapped ? "USD" : "IDR"})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Application Notice */}
      <div className="gcm-info-footer">
        <div className="gcm-info-text">
          <span>
            Digunakan otomatis untuk kalkulasi harga <b>{totalModels} model AI</b> di Juragan Token langsung dari tarif gateway resmi tanpa markup. Status: <b>{syncStatus}</b>.
          </span>
        </div>

        {syncNotification && (
          <div className="gcm-sync-alert" role="status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{syncNotification}</span>
          </div>
        )}

        <div className="gcm-action-bar">
          <button
            type="button"
            className={`gcm-refresh-btn ${isSyncing ? "loading" : ""}`}
            onClick={onSyncPricing}
            disabled={isSyncing}
          >
            <span className={`gcm-spin-icon ${isSyncing ? "spinning" : ""}`}>↻</span>
            <span>{isSyncing ? "Menyinkronkan Nilai Tukar..." : "Segarkan Kurs BI & Harga Gateway"}</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
