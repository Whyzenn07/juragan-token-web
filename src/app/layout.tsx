import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const heading = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#0a2442",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.juragantoken.co.id"),
  title: "Juragan Token: Kredit API AI Prabayar untuk Claude, GPT, Gemini & DeepSeek",
  description:
    "Marketplace kredit API Multi-AI prabayar lokal di Indonesia. Akses resmi Claude Sonnet, Opus 5.5, GPT-4o, Gemini 3.8 Flash, dan DeepSeek tanpa kartu kredit melalui QRIS instan dan Virtual Account Bank lokal.",
  keywords: [
    "Juragan Token",
    "kredit API AI",
    "API Claude Sonnet",
    "API Claude Opus",
    "API ChatGPT Indonesia",
    "API Gemini Flash",
    "token AI prabayar",
    "beli API AI QRIS",
    "API AI tanpa kartu kredit",
    "Cursor AI API key",
    "Claude Code CLI token",
  ],
  authors: [{ name: "Juragan Token Indonesia", url: "https://www.juragantoken.co.id" }],
  creator: "Juragan Token Indonesia",
  publisher: "Juragan Token Indonesia",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Juragan Token - 1 Kunci Token untuk Semua AI Kelas Dunia",
    description:
      "Akses resmi Claude 3.5 / Opus 5.5, GPT-4o, Gemini 3.8 Flash, dan DeepSeek dalam mata uang Rupiah. Bayar instan via QRIS, aktif selamanya tanpa kedaluwarsa.",
    url: "https://www.juragantoken.co.id",
    siteName: "Juragan Token Indonesia",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "Juragan Token - Marketplace Kredit API AI Prabayar Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juragan Token - Kredit API AI Prabayar Indonesia",
    description:
      "Akses Claude Opus, GPT, Gemini, dan DeepSeek via QRIS instan tanpa kartu kredit. Kompatibel dengan Cursor, Claude Code, dan Chatbox.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
