"use client";

import { buildWhatsappUrl, WHATSAPP_DISPLAY } from "@/lib/site-config";

const ADVANTAGES = [
  {
    kicker: "01 · Integrasi Standar Industri",
    title: "Satu Base URL untuk 11+ Provider AI",
    desc: "Tidak perlu memelihara banyak SDK berbeda. Aplikasi, Cursor IDE, Claude Code, dan skrip Python langsung tersambung ke satu endpoint terpadu.",
  },
  {
    kicker: "02 · Fleksibilitas Model",
    title: "Bebas Padukan Model Flagship & Hemat",
    desc: "Gunakan Claude Opus 5.5 atau GPT-6 Astra untuk tugas berat, lalu rute beban harian ke DeepSeek atau Qwen agar efisiensi operasional terjaga.",
  },
  {
    kicker: "03 · Keamanan Zero-Knowledge",
    title: "Enkripsi Transit TLS & Hashing SHA-256",
    desc: "Kunci API disimpan dalam bentuk hash satu arah SHA-256 dan gateway meneruskan request langsung tanpa menggunakan prompt Anda untuk melatih model.",
  },
  {
    kicker: "04 · Pendampingan Lokal",
    title: "Konsultasi & Dukungan Teknis Indonesia",
    desc: "Tim teknis kami siap membantu setup, pemilihan model paling tepat, dan uji coba langsung via WhatsApp tanpa sistem tiket berbelit.",
  },
];

const NEUTRAL_COMPARE_ROWS = [
  {
    aspect: "Cara Integrasi Developer",
    directVendor: "Harus mengelola SDK, akun, dan API Key terpisah per vendor AI.",
    genericAggregator: "Endpoint agregat tersedia, namun dokumentasi & dukungan serba mandiri.",
    juragan: "Satu endpoint OpenAI-compatible + panduan cepat Cursor, Claude Code, & Python.",
  },
  {
    aspect: "Kurasi & Rekomendasi Model",
    directVendor: "Hanya menyediakan katalog model dari masing-masing vendor.",
    genericAggregator: "Ratusan model bercampur tanpa pengelompokan beban kerja.",
    juragan: "Dikurasi jelas per keahlian: Ngoding, Riset Mendalam, dan Chat Hemat (DeepSeek/Qwen).",
  },
  {
    aspect: "Manajemen Kunci & Saldo",
    directVendor: "Tagihan dan batas kuota tersebar di banyak dashboard berbeda.",
    genericAggregator: "Pengaturan bergantung dashboard luar negeri & dokumentasi berbahasa Inggris.",
    juragan: "Virtual API Key terpusat dengan pengecekan status & riwayat pemakaian instan.",
  },
  {
    aspect: "Dukungan Teknis",
    directVendor: "Tiket email global dengan antrean zona waktu luar negeri.",
    genericAggregator: "Forum komunitas / tiket email anonim.",
    juragan: `Komunikasi langsung tim lokal via WhatsApp (${WHATSAPP_DISPLAY}) & halaman status live.`,
  },
];

export function WhyChooseUs() {
  const waHref = buildWhatsappUrl(
    "Halo Tim Juragantoken, saya ingin berdiskusi mengenai integrasi API AI untuk tim/perusahaan kami."
  );

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

      {/* 4 Core Real Advantages */}
      <div className="jt-adv-grid">
        {ADVANTAGES.map((adv, idx) => (
          <article key={adv.title} className="jt-adv-card" data-reveal="fade-up" data-delay={idx * 60}>
            <span className="jt-adv-kicker">{adv.kicker}</span>
            <h3>{adv.title}</h3>
            <p>{adv.desc}</p>
          </article>
        ))}
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

      {/* Contact Callout Strip (using testing WA 0812-2698-3990) */}
      <div className="jt-contact-banner" data-reveal="fade-up">
        <div>
          <span className="jt-kicker">KONSULTASI &amp; UJI COBA AKSES</span>
          <h3>Butuh Rekomendasi Model untuk Proyek atau Tim Anda?</h3>
          <p>
            Diskusikan kebutuhan ngoding, riset, atau automasi chatbot bersama tim Juragantoken melalui WhatsApp{" "}
            <strong>{WHATSAPP_DISPLAY}</strong>.
          </p>
        </div>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="jt-wa-cta">
          <span>Hubungi via WhatsApp</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
