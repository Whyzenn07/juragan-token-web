"use client";

import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";

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
    const timer = setTimeout(() => {
      const num = parseFloat(usdInput.replace(/,/g, "")) || 0;
      if (!isSwapped) {
        setIdrInput(num === 0 ? "" : (num * usdRate).toLocaleString("id-ID", { maximumFractionDigits: 2 }));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [usdRate, isSwapped, usdInput]);

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
      {/* Clean Close Button */}
      <button
        type="button"
        className="gcm-close-btn"
        onClick={onClose}
        aria-label="Tutup jendela kurs"
        style={{
          position: "absolute",
          top: "18px",
          right: "18px",
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          color: "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10,
          transition: "all 0.15s ease",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Google Finance Header Section */}
      <div className="gcm-top-section" style={{ display: "flex", flexDirection: "column", marginBottom: "22px" }}>
        <div className="gcm-title-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span className="gcm-kicker-label" style={{ color: "#475569", fontSize: "14px", fontWeight: 500, letterSpacing: "-0.1px" }}>
            1 Dolar Amerika Serikat sama dengan
          </span>
          <div className="gcm-meta-actions" style={{ display: "flex", alignItems: "center", gap: "8px", paddingRight: "36px" }}>
            <span
              className="gcm-live-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "9999px",
                letterSpacing: "0.2px",
              }}
            >
              <span
                style={{
                  width: "6.5px",
                  height: "6.5px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                }}
              />
              <span>Real-Time BI</span>
            </span>
          </div>
        </div>

        <div className="gcm-rate-hero-row" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "20px", alignItems: "flex-start", marginTop: "2px" }}>
          {/* Main Rate Figure */}
          <div className="gcm-rate-text-col" style={{ display: "flex", flexDirection: "column" }}>
            <div
              className="gcm-big-rate"
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "#0a2540",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                fontFamily: "var(--font-h), -apple-system, sans-serif",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formattedMainRate}
            </div>
            <div
              className="gcm-currency-target"
              style={{
                fontSize: "20px",
                fontWeight: 650,
                color: "#1e293b",
                marginTop: "4px",
                letterSpacing: "-0.2px",
              }}
            >
              Rupiah Indonesia
            </div>
            <div
              className="gcm-timestamp-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#64748b",
                fontSize: "12px",
                marginTop: "10px",
                flexWrap: "wrap",
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: "#475569", fontWeight: 500 }}>{currentTimeStr || "Pembaruan Real-Time"}</span>
              <span style={{ color: "#cbd5e1" }}>·</span>
              <span style={{ color: "#64748b" }}>Bank Indonesia (JISDOR) &amp; Live Forex</span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="gcm-chart-col" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Timeframe Filter Tabs */}
            <div
              className="gcm-timeframe-tabs"
              role="tablist"
              style={{
                display: "flex",
                gap: "4px",
                justifyContent: "flex-end",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "6px",
              }}
            >
              {(["1HR", "5HR", "1BLN", "1TH", "5TH", "Maks"] as Timeframe[]).map((tf) => {
                const isActive = timeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`gcm-tf-btn ${isActive ? "active" : ""}`}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      background: isActive ? "#eff6ff" : "transparent",
                      border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                      color: isActive ? "#0a58ca" : "#64748b",
                      fontSize: "11px",
                      fontWeight: isActive ? 750 : 600,
                      padding: "3px 9px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "inherit",
                    }}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="gcm-chart-wrapper" style={{ display: "flex", gap: "8px", alignItems: "stretch", height: "94px" }}>
              <div
                className="gcm-y-labels"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: "#64748b",
                  fontSize: "10.5px",
                  fontWeight: 500,
                  fontFamily: "monospace",
                  textAlign: "right",
                  minWidth: "48px",
                }}
              >
                <span>{chart.max.toLocaleString("id-ID")}</span>
                <span>{((chart.max + chart.min) / 2).toLocaleString("id-ID")}</span>
                <span>{chart.min.toLocaleString("id-ID")}</span>
              </div>
              <div className="gcm-svg-container" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                <svg viewBox="0 0 260 90" className="gcm-sparkline" preserveAspectRatio="none" style={{ width: "100%", height: "72px", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="gcmChartGradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={`0,90 ${chart.points} 260,90`}
                    fill="url(#gcmChartGradLight)"
                  />
                  {/* Stroke line */}
                  <polyline
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chart.points}
                  />
                  {/* Latest point indicator */}
                  <circle cx="260" cy="20" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.8" />
                </svg>
                <div
                  className="gcm-x-labels"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: "10px",
                    fontWeight: 500,
                    paddingTop: "2px",
                  }}
                >
                  <span>{chart.dates[0]}</span>
                  <span>{chart.dates[1]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Two-Way Currency Converter Input (Google Style Light Card) */}
      <div
        className="gcm-converter-box"
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "18px",
        }}
      >
        <div className="gcm-converter-inner" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Left Input */}
          <div
            className="gcm-input-card"
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <input
              type="text"
              inputMode="decimal"
              className="gcm-number-input"
              value={isSwapped ? idrInput : usdInput}
              onChange={(e) => (isSwapped ? handleIdrChange(e.target.value) : handleUsdChange(e.target.value))}
              aria-label={isSwapped ? "Jumlah Rupiah Indonesia" : "Jumlah Dolar Amerika Serikat"}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#0f172a",
                fontSize: "22px",
                fontWeight: 750,
                width: "100%",
                fontFamily: "var(--font-h), -apple-system, sans-serif",
                letterSpacing: "-0.02em",
              }}
            />
            <div className="gcm-currency-select" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
              <span className="gcm-currency-name" style={{ color: "#334155", fontWeight: 600 }}>
                {isSwapped ? "Rupiah Indonesia" : "Dolar Amerika Serikat"}
              </span>
              <span className="gcm-currency-code" style={{ color: "#0a58ca", fontWeight: 750 }}>
                ({isSwapped ? "IDR" : "USD"})
              </span>
            </div>
          </div>

          {/* Swap Button */}
          <div className="gcm-swap-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              type="button"
              className="gcm-swap-button"
              onClick={handleSwap}
              title="Tukar arah konversi"
              aria-label="Tukar mata uang"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#0a58ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
                <polyline points="17 14 12 9 7 14" />
                <line x1="12" y1="9" x2="12" y2="21" />
              </svg>
            </button>
          </div>

          {/* Right Input */}
          <div
            className="gcm-input-card"
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <input
              type="text"
              inputMode="decimal"
              className="gcm-number-input"
              value={isSwapped ? usdInput : idrInput}
              onChange={(e) => (isSwapped ? handleUsdChange(e.target.value) : handleIdrChange(e.target.value))}
              aria-label={isSwapped ? "Jumlah Dolar Amerika Serikat" : "Jumlah Rupiah Indonesia"}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#0f172a",
                fontSize: "22px",
                fontWeight: 750,
                width: "100%",
                fontFamily: "var(--font-h), -apple-system, sans-serif",
                letterSpacing: "-0.02em",
              }}
            />
            <div className="gcm-currency-select" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
              <span className="gcm-currency-name" style={{ color: "#334155", fontWeight: 600 }}>
                {isSwapped ? "Dolar Amerika Serikat" : "Rupiah Indonesia"}
              </span>
              <span className="gcm-currency-code" style={{ color: "#0a58ca", fontWeight: 750 }}>
                ({isSwapped ? "USD" : "IDR"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Application Notice & Refresh Action */}
      <div className="gcm-info-footer" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div className="gcm-info-text" style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.55 }}>
          <span>
            Digunakan otomatis untuk kalkulasi harga <b style={{ color: "#0a2540", fontWeight: 700 }}>{totalModels} model AI</b> di Juragan Token langsung dari tarif gateway resmi tanpa markup. Status: <b style={{ color: "#0a58ca", fontWeight: 700 }}>{syncStatus}</b>.
          </span>
        </div>

        {syncNotification && (
          <div
            className="gcm-sync-alert"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 650,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{syncNotification}</span>
          </div>
        )}

        <div className="gcm-action-bar" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className={`gcm-refresh-btn ${isSyncing ? "loading" : ""}`}
            onClick={onSyncPricing}
            disabled={isSyncing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #0a58ca 0%, #0284c7 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "11px 22px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: isSyncing ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(10, 88, 202, 0.25)",
              transition: "all 0.15s ease",
              width: "100%",
            }}
          >
            <span
              className={`gcm-spin-icon ${isSyncing ? "spinning" : ""}`}
              style={{
                display: "inline-block",
                fontSize: "16px",
                lineHeight: 1,
              }}
            >
              ↻
            </span>
            <span>{isSyncing ? "Menyinkronkan Nilai Tukar..." : "Segarkan Kurs BI & Harga Gateway"}</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
