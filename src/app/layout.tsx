import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./landing.css";

export const viewport: Viewport = {
  themeColor: "#0a2442",
  width: "device-width",
  initialScale: 1,
};

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://api.tokotokenai.com").trim().replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Juragantoken — One Gateway. Every Intelligence.",
  description:
    "Gerbang API AI terpadu di Indonesia untuk mengakses Claude Fable 5.2, Claude Opus 5.5, GPT-6.2 Astra, Gemini 4 Carbon, DeepSeek V4.1 Flash, Kimi K3, Qwen3-Coder, dan puluhan model LLM terkemuka melalui satu integrasi OpenAI-compatible.",
  keywords: [
    "Juragantoken",
    "Juragan Token",
    "AI Gateway Indonesia",
    "API Claude Fable 5.2",
    "API Claude Opus 5.5",
    "API GPT-6.2 Astra",
    "API Gemini 4 Carbon",
    "API DeepSeek V4.1 Flash",
    "API Kimi K3",
    "API Qwen3-Coder",
    "Cursor AI API gateway",
    "Claude Code CLI gateway",
  ],
  authors: [{ name: "Juragantoken Indonesia", url: appUrl }],
  creator: "Juragantoken Indonesia",
  publisher: "Juragantoken Indonesia",
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
    title: "Juragantoken — One Gateway. Every Intelligence.",
    description:
      "Satu API Gateway terpadu untuk mengakses Claude, GPT, Gemini, DeepSeek, dan Qwen bagi developer dan tim di Indonesia.",
    url: appUrl,
    siteName: "Juragantoken Indonesia",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/logo-juragantoken.jpg",
        width: 1200,
        height: 416,
        alt: "Juragantoken — One Gateway. Every Intelligence.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juragantoken — One Gateway. Every Intelligence.",
    description:
      "Gerbang terpadu untuk model AI ngoding, riset mendalam, dan efisiensi biaya operasional melalui satu endpoint OpenAI-compatible.",
    images: ["/images/logo-juragantoken.jpg"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
