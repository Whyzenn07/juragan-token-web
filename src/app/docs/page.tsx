import type { Metadata } from "next";
import Link from "next/link";
import "./docs.css";
import { DocsClient } from "./DocsClient";

export const metadata: Metadata = {
  title: "Dokumentasi & Panduan Integrasi API - Juragantoken",
  description:
    "Panduan integrasi Universal AI Gateway Juragantoken: 1 API Key untuk semua model AI di Cursor, Claude Code, Python, Node.js, dan cURL pada Windows, macOS, dan Linux.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsPage() {
  return (
    <div className="dx-page">
      <header className="dx-topbar">
        <div className="dx-topbar-inner">
          <Link href="/" className="dx-brand" aria-label="Kembali ke Beranda">
            juragan<span>token.</span>
            <em>Docs</em>
          </Link>
          <nav className="dx-top-links" aria-label="Navigasi atas">
            <Link href="/">Beranda</Link>
            <Link href="/status">Status</Link>
            <Link href="/login" className="dx-top-ghost">
              Sign In
            </Link>
            <Link href="/signup" className="dx-top-solid">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <DocsClient />

      <footer className="dx-footer">
        <div className="dx-footer-inner">
          <p>© 2026 PT Rejeki Digital Cemerlang · Juragantoken</p>
          <nav aria-label="Tautan footer">
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <Link href="/status">Status Sistem</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
