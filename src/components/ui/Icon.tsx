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
};

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" viewBox="0 0 24 24" width={size}>
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
