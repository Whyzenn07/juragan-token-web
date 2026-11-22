"use client";

import Link from "next/link";
import { buildWhatsappUrl, WHATSAPP_DISPLAY } from "@/lib/site-config";

const FRAGMENTATION_RISKS = [
  {
    division: "Tim IT & Engineering",
    title: "Titik Buta Keamanan & Fragmentasi SDK",
    desc: "Penggunaan API Key pihak ketiga yang tersebar tanpa kontrol akses IP serta pemeliharaan banyak integrasi vendor berbeda.",
  },
  {
    division: "Tim Purchasing & Finance",
    title: "Kekacauan Administratif & Reimbursement",
    desc: "Ratusan transaksi kartu kredit pribadi karyawan dan klaim petty cash berulang tiap bulan untuk banyak layanan AI terpisah.",
  },
  {
    division: "Legal & Compliance",
    title: "Risiko Kepatuhan & Biaya Valas",
    desc: "Pembayaran ke entitas asing tanpa faktur pajak lokal resmi serta fluktuasi kurs dan biaya lintas negara (cross-border fees).",
  },
];

export function EnterpriseStandardSection() {
  const enterpriseWaUrl = buildWhatsappUrl(
    "Halo Tim Enterprise Juragantoken (PT Rejeki Digital Cemerlang), kami ingin berdiskusi mengenai integrasi B2B, IP Whitelist, dan Invoice/Faktur Pajak."
  );

  return (
    <section
      className="jt-section"
      id="enterprise-standard"
      aria-labelledby="ent-std-heading"
    >
      <div className="jt-section-head" data-reveal="fade-up">
        <span className="jt-kicker">ENTERPRISE-READY · FLEKSIBEL UNTUK STANDARD</span>
        <h2 id="ent-std-heading">
          Satu API Key Universal untuk Semua AI — Skala Korporat Maupun Mandiri
        </h2>
        <p>
          Dikelola resmi oleh <strong>PT Rejeki Digital Cemerlang</strong>. Menjembatani kebutuhan teknis tim IT dan
          efisiensi tim Purchasing, sekaligus tetap fleksibel untuk developer dan tim kecil lewat jalur Standard.
        </p>
      </div>

      {/* 3 Masalah Fragmentasi Enterprise (Slide 2 PDF) */}
      <div className="jt-risks-grid">
        {FRAGMENTATION_RISKS.map((item, idx) => (
          <article
            key={item.division}
            className="jt-risk-card"
            data-reveal="fade-up"
            data-delay={idx * 70}
          >
            <span className="jt-risk-div">{item.division}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </article>
        ))}
      </div>

      {/* Dual-Track Cards: Enterprise B2B vs Standard Fleksibel */}
      <div className="jt-tier-grid">
        {/* Jalur Enterprise (Primary Target) */}
        <article className="jt-tier-card is-enterprise" data-reveal="scale">
          <div className="jt-tier-top">
            <span className="jt-tier-pill enterprise">TARGET UTAMA · ENTERPRISE B2B</span>
            <span className="jt-tier-entity">PT Rejeki Digital Cemerlang</span>
          </div>
          <h3>Sentralisasi Pengadaan, Keamanan &amp; Kepatuhan Korporat</h3>
          <p className="jt-tier-lead">
            Dirancang untuk perusahaan, divisi IT, dan tim Purchasing yang membutuhkan satu gerbang AI resmi di Indonesia.
          </p>
          <ul className="jt-tier-list">
            <li>
              <strong>1 API Key Universal / Departemen:</strong> Akses penuh OpenAI, Claude, Gemini, DeepSeek, Qwen &amp; 100+ model AI dalam satu integrasi.
            </li>
            <li>
              <strong>Kontrol Keamanan IP Whitelist:</strong> Batasi penggunaan API Key eksklusif untuk IP kantor atau server produksi guna mencegah kebocoran saldo.
            </li>
            <li>
              <strong>Legalitas PT Lokal &amp; Faktur Pajak:</strong> Pembayaran IDR via Invoice B2B &amp; transfer bank lokal — tanpa kartu kredit dan bebas biaya valas.
            </li>
            <li>
              <strong>Bebas Reimbursement &amp; Dukungan Principal:</strong> Deposit B2B terpusat dengan alokasi kuota terukur, keamanan deposit 100%, serta SLA WhatsApp lokal ({WHATSAPP_DISPLAY}).
            </li>
          </ul>
          <div className="jt-tier-actions">
            <a
              href={enterpriseWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="jt-tier-btn-white"
            >
              <span>Konsultasi Enterprise B2B</span>
              <span aria-hidden="true">↗</span>
            </a>
            <Link href="/dashboard?order=1&tier=enterprise" className="jt-tier-btn-ghost-dark">
              <span>Ajukan Deposit Enterprise →</span>
            </Link>
          </div>
        </article>

        {/* Jalur Standard (Fleksibel) */}
        <article className="jt-tier-card is-standard" data-reveal="scale" data-delay="80">
          <div className="jt-tier-top">
            <span className="jt-tier-pill standard">FLEKSIBEL · STANDARD &amp; DEVELOPER</span>
            <span className="jt-tier-entity muted">Mandiri · Tanpa Minimum Besar</span>
          </div>
          <h3>Cepat, Fleksibel &amp; Siap Pakai dalam 1 Menit</h3>
          <p className="jt-tier-lead">
            Cocok untuk software engineer, startup tahap awal, akademisi, hingga operasional tim kecil tanpa kontrak rumit.
          </p>
          <ul className="jt-tier-list">
            <li>
              <strong>1 API Key untuk Semua AI:</strong> Ganti model dari Claude ke GPT, Gemini, atau DeepSeek cukup ubah nama model tanpa ganti kunci.
            </li>
            <li>
              <strong>Akses Fleksibel dari Mana Saja:</strong> Tanpa pembatasan IP default — langsung jalan di Cursor IDE, Claude Code CLI, Chatbox, maupun Python SDK.
            </li>
            <li>
              <strong>Saldo IDR Tanpa Hangus:</strong> Isi ulang fleksibel ke API Key yang sama via QRIS atau Transfer Bank lokal tanpa kartu kredit luar negeri.
            </li>
            <li>
              <strong>Portal Akun Gmail Terintegrasi:</strong> Pantau sisa saldo, riwayat pesanan, dan ajukan top-up langsung dari dashboard pribadi Anda.
            </li>
          </ul>
          <div className="jt-tier-actions">
            <Link href="/dashboard?order=1&tier=standard" className="jt-tier-btn-royal">
              <span>Pesan Kredit via Portal →</span>
            </Link>
            <Link href="/signup" className="jt-tier-btn-outline">
              <span>Daftar Akun Baru</span>
            </Link>
          </div>
        </article>
      </div>

      {/* Strip Transformasi Proses B2B (Slide 7 PDF) */}
      <div className="jt-transform-strip" data-reveal="fade-up">
        <div className="jt-ts-head">
          <span className="jt-ts-badge">TRANSFORMASI PROSES PENGADAAN</span>
          <strong>Bebaskan tim Anda dari kerumitan reimbursement &amp; shadow IT</strong>
        </div>
        <div className="jt-ts-steps" aria-label="Alur proses B2B Juragantoken">
          <div className="jt-ts-node">
            <span>01</span>
            <strong>Deposit IDR Terpusat</strong>
            <small>Invoice B2B + Faktur Pajak PT</small>
          </div>
          <span className="jt-ts-arrow" aria-hidden="true">→</span>
          <div className="jt-ts-node">
            <span>02</span>
            <strong>Distribusi 1 API Key Universal</strong>
            <small>Per departemen / Gmail + IP Whitelist</small>
          </div>
          <span className="jt-ts-arrow" aria-hidden="true">→</span>
          <div className="jt-ts-node is-done">
            <span>✓</span>
            <strong>Siap Pakai Lintas 100+ AI</strong>
            <small>Monitoring &amp; audit real-time</small>
          </div>
        </div>
      </div>
    </section>
  );
}
