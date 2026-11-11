import type { Metadata } from "next";
import Link from "next/link";
import { StatusClient } from "./StatusClient";

export const metadata: Metadata = {
  title: "Status Layanan & Kesiapan Sistem Real-Time - Juragan Token",
  description:
    "Pantau status operasional gateway AI, database cloud Supabase, dan sistem pembayaran QRIS Juragan Token secara real-time. Transparansi dan uptime 99.9%.",
  alternates: {
    canonical: "/status",
  },
};

export default function StatusPage() {
  return (
    <div className="status-page-container">
      <header className="docs-nav-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label="Kembali ke Beranda">
            <strong>
              juragan<span>token</span>
              <span className="dot">.</span>
            </strong>
            <span className="docs-badge" style={{ background: "#dcfce7", color: "#166534" }}>
              Live System Status
            </span>
          </Link>
          <div className="docs-header-links">
            <Link href="/" className="docs-header-link">
              ← Beranda
            </Link>
            <Link href="/docs" className="docs-header-link">
              Dokumentasi API
            </Link>
            <Link href="/#katalog-retail" className="docs-header-btn">
              Beli Token
            </Link>
          </div>
        </div>
      </header>

      <StatusClient />

      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <p>© 2026 Juragan Token Indonesia. Real-Time Telemetry &amp; Uptime Monitor.</p>
          <div className="docs-footer-nav">
            <Link href="/">Beranda</Link>
            <span>•</span>
            <Link href="/docs">Dokumentasi</Link>
            <span>•</span>
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
            <span>•</span>
            <Link href="/privacy">Kebijakan Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
