"use client";

import { WHATSAPP_DISPLAY } from "@/lib/site-config";

const NEUTRAL_COMPARE_ROWS = [
  {
    aspect: "Entitas Hukum & Kepatuhan",
    directVendor: "Entitas luar negeri; sulit memenuhi syarat vendor lokal & faktur pajak.",
    genericAggregator: "Entitas asing / tidak diketahui tanpa dukungan legalitas lokal Indonesia.",
    juragan: "PT Lokal Resmi di Indonesia (PT Rejeki Digital Cemerlang) lengkap dengan Faktur Pajak.",
  },
  {
    aspect: "Mekanisme Pembayaran",
    directVendor: "Kartu kredit internasional per vendor + risiko selisih kurs & reimbursement.",
    genericAggregator: "Kartu kredit luar negeri / crypto tanpa dukungan invoice korporat IDR.",
    juragan: "Invoice B2B & Transfer Bank IDR untuk Enterprise, serta QRIS/Transfer fleksibel untuk Standard.",
  },
  {
    aspect: "Kontrol Keamanan & API Key",
    directVendor: "Banyak API Key terpisah antar vendor; sulit dipantau terpusat oleh tim IT.",
    genericAggregator: "Kontrol akses tim terbatas dan tidak terintegrasi alur persetujuan lokal.",
    juragan: "1 API Key Universal untuk 100+ AI + Whitelist IP opsional + Audit Log real-time.",
  },
  {
    aspect: "Dukungan (SLA) & Keamanan Deposit",
    directVendor: "Tiket email global dengan antrean zona waktu luar negeri.",
    genericAggregator: "Sistem tiket anonim dengan risiko pemblokiran akun sepihak.",
    juragan: `Didukung jalur langsung Principal, keamanan deposit 100%, & dukungan WA lokal (${WHATSAPP_DISPLAY}).`,
  },
];

export function WhyChooseUs() {
  return (
    <section className="jt-section" id="kenapa-kami" aria-labelledby="why-heading">
      <div className="jt-section-head" data-reveal="fade-up">
        <span className="jt-kicker">KENAPA MEMILIH JURAGANTOKEN</span>
        <h2 id="why-heading">Menjembatani Kebutuhan Teknis &amp; Efisiensi Operasional</h2>
        <p>
          Dibangun untuk tim developer, agensi, akademisi, dan perusahaan di Indonesia yang membutuhkan akses lintas
          model LLM secara cepat, terstruktur, dan mudah dikendalikan.
        </p>
      </div>

      {/* Neutral Category Comparison Table (no third-party competitor names) */}
      <div className="jt-compare-wrap" data-reveal="scale">
        <div className="jt-compare-head">
          <h3>Perbandingan Pendekatan Integrasi</h3>
          <span>Evaluasi objektif antara daftar ke tiap vendor, agregator global umum, dan Juragantoken</span>
        </div>
        <div className="jt-compare-scroll">
          <table className="jt-compare-table">
            <thead>
              <tr>
                <th>Aspek Operasional</th>
                <th>Daftar Langsung per Vendor</th>
                <th>Platform Agregator Umum</th>
                <th className="jt-col-highlight">Juragantoken Gateway</th>
              </tr>
            </thead>
            <tbody>
              {NEUTRAL_COMPARE_ROWS.map((row) => (
                <tr key={row.aspect}>
                  <td className="jt-aspect-cell">{row.aspect}</td>
                  <td>{row.directVendor}</td>
                  <td>{row.genericAggregator}</td>
                  <td className="jt-col-highlight">{row.juragan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
