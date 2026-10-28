import type { Metadata } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const heading = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Juragan Token: kredit API AI prabayar untuk Claude, Qwen, Grok, dan lainnya",
  description:
    "Katalog kredit API prabayar untuk model AI seperti Claude, Codex, Gemini, Grok, Qwen, Kimi, dan DeepSeek. Harga dalam rupiah, checkout masih simulasi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
