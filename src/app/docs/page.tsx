import type { Metadata } from "next";
import Link from "next/link";
import { DocsClient } from "./DocsClient";

export const metadata: Metadata = {
  title: "Dokumentasi Resmi & Panduan Integrasi API - Juragan Token",
  description:
    "Panduan lengkap integrasi Universal AI Gateway Juragan Token untuk Cursor AI, Claude Code CLI, Windsurf, Chatbox, dan Python SDK. 1 API Key untuk semua model AI terkemuka.",
  alternates: {
    canonical: "https://www.juragantoken.co.id/docs",
  },
};

export default function DocsPage() {
  return (
    <div className="docs-page-container">
      {/* Header Navigasi Docs */}
      <header className="docs-nav-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label="Kembali ke Beranda">
            <strong>
              juragan<span>token</span>
              <span className="dot">.</span>
            </strong>
            <span className="docs-badge">Docs &amp; API Reference</span>
          </Link>
          <div className="docs-header-links">
            <Link href="/" className="docs-header-link">
              ← Beranda
            </Link>
            <Link href="/status" className="docs-header-link">
              Status Sistem
            </Link>
            <Link href="/#katalog-retail" className="docs-header-btn">
              Beli Token AI
            </Link>
          </div>
        </div>
      </header>

      {/* Konten Dokumentasi Interaktif */}
      <DocsClient />

      {/* Footer Docs */}
      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <p>© 2026 Juragan Token Indonesia. Universal AI Gateway &amp; Token Marketplace.</p>
          <div className="docs-footer-nav">
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
            <span>•</span>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <span>•</span>
            <Link href="/status">Status Sistem</Link>
            <span>•</span>
            <a
              href="https://wa.me/6281226983990?text=Halo%20Admin%20Juragan%20Token,%20saya%20butuh%20bantuan%20teknis%20API."
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
