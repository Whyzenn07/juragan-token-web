import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Kebijakan Privasi & Keamanan Data (Privacy Policy) - Juragan Token",
  description:
    "Komitmen perlindungan data dan privasi Juragan Token. Jaminan 100% Zero-Training, enkripsi TLS 1.3, dan pengamanan kredensial berbasis SHA-256.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="legal-page-container">
      <header className="docs-nav-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label="Kembali ke Beranda">
            <strong>
              juragan<span>token</span>
              <span className="dot">.</span>
            </strong>
            <span className="docs-badge">Privacy &amp; Security</span>
          </Link>
          <div className="docs-header-links">
            <Link href="/" className="docs-header-link">
              ← Kembali ke Beranda
            </Link>
            <Link href="/docs" className="docs-header-link">
              Dokumentasi API
            </Link>
          </div>
        </div>
      </header>

      <main className="legal-content-main">
        <div className="legal-card">
          <div className="legal-header">
            <span className="legal-badge" style={{ background: "#dcfce7", color: "#166534" }}>
              Perlindungan Privasi Terjamin
            </span>
            <h1>Kebijakan Privasi &amp; Keamanan Data</h1>
            <p className="legal-meta">Terakhir diperbarui: 5 November 2026 • Komitmen privasi tanpa kompromi</p>
          </div>

          <div className="legal-body">
            <section className="legal-section">
              <div className="highlight-callout" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
                <Icon name="check" size={20} style={{ color: "#16a34a" }} />
                <div>
                  <strong style={{ color: "#14532d" }}>Prinsip Utama: Jaminan Zero-Training (Nol Pelatihan AI)</strong>
                  <p style={{ color: "#166534" }}>
                    Juragan Token <b>tidak pernah</b> menyimpan, membaca, merekam, atau membagikan prompt percakapan, cuplikan kode pemrograman, maupun berkas yang Anda kirimkan ke gateway kami untuk melatih model AI apa pun.
                  </p>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>1. Data yang Kami Kumpulkan</h2>
              <p>Untuk memproses transaksi dan menyediakan layanan gateway, kami hanya mengumpulkan data esensial minimum:</p>
              <ul>
                <li><b>Identitas Pemesan:</b> Nama lengkap dan alamat email yang Anda masukkan saat checkout untuk keperluan pengiriman invoice resmi dan kredensial API Key.</li>
                <li><b>Nomor WhatsApp (Opsional):</b> Hanya digunakan bila Anda memilih opsi konfirmasi atau pencadangan kredensial via chat WhatsApp Admin.</li>
                <li><b>Data Transaksi Keuangan:</b> Nomor invoice, metode pembayaran (QRIS / Virtual Account), nominal transaksi rupiah, serta status pelunasan. Kami tidak pernah menyimpan nomor kartu kredit atau PIN perbankan Anda.</li>
                <li><b>Log Teknis Inferensi:</b> Jumlah konsumsi token (prompt tokens dan completion tokens), timestamp, dan model AI yang dipanggil untuk keperluan perhitungan sisa saldo Anda secara transparan.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>2. Arsitektur Keamanan &amp; Kriptografi Kunci</h2>
              <p>Kami menerapkan standar keamanan kelas industri untuk melindungi akun Anda:</p>
              <ul>
                <li><b>Enkripsi Transmisi (TLS 1.3):</b> Seluruh lalu lintas data antara perangkat Anda, server gateway Juragan Token, dan upstream provider dilindungi oleh enkripsi HTTPS/TLS 1.3 terkini.</li>
                <li><b>Hashing Satu Arah SHA-256:</b> Kunci API Anda (<code>jt-live-...</code>) dienkripsi menggunakan algoritma cryptographic hash SHA-256 di database cloud Supabase. Kunci mentah hanya ditampilkan <b>satu kali (reveal-once)</b> saat transaksi sukses dan tidak disimpan dalam bentuk teks biasa di server kami.</li>
                <li><b>Proteksi Brute-Force &amp; Rate-Limiting:</b> Setiap endpoint dilindungi oleh rate limiter in-memory untuk mencegah serangan tebak kunci atau penyalahgunaan API.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Penggunaan &amp; Kerahasiaan Data</h2>
              <p>
                Data Anda digunakan secara eksklusif untuk operasional penyediaan token dan verifikasi pembayaran. Kami berpegang teguh pada komitmen:
              </p>
              <ul>
                <li><b>Tidak Ada Penjualan Data:</b> Kami tidak pernah menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak pengiklan mana pun.</li>
                <li><b>Integrasi Pihak Ketiga Tepercaya:</b> Data pembayaran hanya diproses bersama mitra berizin resmi (institusi perbankan dan penyedia QRIS berizin Bank Indonesia).</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Hak Pengguna &amp; Penghapusan Data</h2>
              <p>
                Anda memiliki hak penuh untuk menanyakan riwayat transaksi Anda atau meminta penonaktifan API Key serta penghapusan data kontak Anda dari database kami kapan saja. Untuk mengajukan permohonan tersebut, silakan hubungi tim Customer Service kami melalui WhatsApp resmi di <b>081226983990</b>.
              </p>
            </section>
          </div>

          <div className="legal-footer-box">
            <p>Butuh penjelasan lebih lanjut mengenai perlindungan data Anda?</p>
            <a
              href="https://wa.me/6281226983990?text=Halo%20Admin%20Juragan%20Token,%20saya%20ingin%20berkonsultasi%20seputar%20privasi%20dan%20keamanan%20data."
              target="_blank"
              rel="noreferrer"
              className="legal-contact-btn"
            >
              <Icon name="whatsapp" size={16} />
              <span>Konsultasi Keamanan via WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <p>© 2026 Juragan Token Indonesia. Privasi Anda adalah Prioritas Utama Kami.</p>
          <div className="docs-footer-nav">
            <Link href="/">Beranda</Link>
            <span>•</span>
            <Link href="/docs">Dokumentasi</Link>
            <span>•</span>
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
            <span>•</span>
            <Link href="/status">Status Sistem</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
