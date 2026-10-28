"use client";

import React from "react";

type RegionBadgeProps = {
  className?: string;
  showText?: boolean;
};

export function RegionBadge({ className = "", showText = true }: RegionBadgeProps) {
  return (
    <div
      className={`hero-regions ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "10px",
        marginTop: "22px",
        fontSize: "12px",
        color: "#526c87",
        lineHeight: 1.4,
        flexWrap: "nowrap",
        whiteSpace: "normal",
      }}
    >
      {/* Professional Regional Gateway Pill Badge */}
      <span
        className="region-badge-pill"
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "6px",
          background: "#ffffff",
          border: "1px solid #d4e2f0",
          borderRadius: "999px",
          padding: "4px 10px 4px 8px",
          boxShadow: "0 1px 4px rgba(10, 36, 66, 0.06)",
          color: "#0a4ea3",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      >
        {/* Precision Vector Globe (Non-animated, crisp fintech vector) */}
        <svg
          className="region-globe-icon"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="#0a4ea3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: "block", flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>

        {/* Indonesia Flag Micro Chip */}
        <span
          className="region-flag-chip"
          style={{
            display: "inline-flex",
            flexDirection: "column",
            width: "14px",
            height: "10px",
            borderRadius: "2px",
            overflow: "hidden",
            border: "1px solid rgba(10, 37, 64, 0.15)",
            flexShrink: 0,
          }}
          title="Indonesia (ID Gateway)"
        >
          <span style={{ width: "100%", height: "50%", background: "#dc2626", display: "block" }} />
          <span style={{ width: "100%", height: "50%", background: "#ffffff", display: "block" }} />
        </span>

        {/* Region Code Tag */}
        <span
          className="region-code"
          style={{
            fontSize: "10.5px",
            fontWeight: 800,
            color: "#0a2540",
            letterSpacing: "0.4px",
            lineHeight: 1,
            display: "inline-block",
          }}
        >
          ID
        </span>
      </span>

      {showText && (
        <span
          className="hero-regions-text"
          style={{
            fontSize: "12px",
            color: "#526c87",
            fontWeight: 500,
            lineHeight: 1.4,
            display: "inline-block",
          }}
        >
          Dioptimalkan untuk <strong style={{ color: "#0a2540", fontWeight: 700 }}>mahasiswa</strong> &amp;{" "}
          <strong style={{ color: "#0a2540", fontWeight: 700 }}>tech builder</strong> di Indonesia
        </span>
      )}
    </div>
  );
}
