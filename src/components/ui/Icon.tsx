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
  whatsapp: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" fill="currentColor" stroke="none" />,
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
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

// Official Juragan Token Brand Mark (Static, Crisp, Corporate Fintech Emblem)
export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 36 28" fill="none">
      <defs>
        <linearGradient id="jtBrandGrad" x1="2" y1="2" x2="34" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a58ca" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="34" height="26" rx="6" fill="url(#jtBrandGrad)" />
      <path
        d="M10 8h10a2 2 0 0 1 2 2v1.5H12a1.5 1.5 0 0 0-1.5 1.5V17a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"
        fill="#ffffff"
        opacity="0.95"
      />
      <path
        d="M26 20H16a2 2 0 0 1-2-2v-1.5h10a1.5 1.5 0 0 0 1.5-1.5V11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2z"
        fill="#ffffff"
        opacity="0.75"
      />
      <circle cx="18" cy="14" r="2.2" fill="#38bdf8" />
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
