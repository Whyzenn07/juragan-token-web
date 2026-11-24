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
        <span className="jt-kicker">KOMPARASI GATEWAY ENTERPRISE</span>
        <h2 id="why-heading">Mengapa Perusahaan &amp; Tim IT Memilih Juragantoken</h2>
        <p>
          Evaluasi objektif antara mendaftar langsung ke tiap vendor asing, menggunakan agregator global umum, dan
          memakai Juragantoken Gateway di bawah naungan <strong>PT Rejeki Digital Cemerlang</strong>.
        </p>
      </div>

      {/* Neutral Category Comparison Table (Desktop table -> Mobile Flexbox Cards) */}
      <div className="jt-compare-wrap" data-reveal="scale">
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
                  <td className="jt-aspect-cell" data-label="Aspek Operasional">
                    {row.aspect}
                  </td>
                  <td data-label="Daftar Langsung per Vendor">{row.directVendor}</td>
                  <td data-label="Platform Agregator Umum">{row.genericAggregator}</td>
                  <td className="jt-col-highlight" data-label="Juragantoken Gateway">
                    {row.juragan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
