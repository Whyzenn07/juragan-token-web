import type { ReactNode } from "react";
import { providerById } from "@/data/catalog";

// Set ikon sendiri: stroke 2px, ujung persegi, agar tidak terasa seperti pustaka bawaan.
const paths: Record<string, ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5.5 5.5" /></>,
  bag: <><path d="M4.5 8h15l-1.2 12H5.7L4.5 8Z" /><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alert: <><path d="M12 4 2.8 20h18.4L12 4Z" /><path d="M12 10v5M12 17.6v.4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" /><path d="M16 8V4H4v12h4" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3h3v3l-2 2v2l-2 2v2h-2l-1.3 1.3" /></>,
  terminal: <><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>,
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  chevron: <polyline points="6 9 12 15 18 9" />,
};

export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      {paths[name]}
    </svg>
  );
}

// Tiga balok miring: jalur kredit bertingkat. Kandidat logo, menunggu persetujuan pemilik.
export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 40 32" fill="none">
      <path d="M2 28 14 4h8L10 28H2Z" fill="currentColor" />
      <path d="M15 28 27 4h8L23 28h-8Z" fill="currentColor" opacity=".68" />
      <path d="M28 28 36 12h2L30 28h-2Z" fill="currentColor" opacity=".36" />
    </svg>
  );
}

// Wordmark teks sementara. Memakai file logo resmi bila hasLogo bernilai true.
export function ProviderMark({ providerId, compact = false }: { providerId: string; compact?: boolean }) {
  const provider = providerById(providerId);
  if (provider.hasLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={compact ? "provider-logo compact" : "provider-logo"} src={`/logos/${provider.id}.svg`} alt={provider.company} height={compact ? 20 : 26} />;
  }
  return <span className={compact ? "wordmark compact" : "wordmark"}>{provider.name}</span>;
}
