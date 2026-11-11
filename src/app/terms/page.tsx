import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan (Terms of Service) - Juragan Token",
  description:
    "Syarat dan ketentuan resmi penggunaan layanan kredit Multi-AI prabayar dan Universal AI Gateway Juragan Token. Transparan, aman, dan tanpa masa kedaluwarsa.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="legal-page-container">
      <header className="docs-nav-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label="Kembali ke Beranda">
            <strong>
              juragan<span>token</span>
              <span className="dot">.</span>
            </strong>
            <span className="docs-badge">Legal &amp; Compliance</span>
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
            <span className="legal-badge">Dokumen Resmi Layanan</span>
            <h1>Syarat &amp; Ketentuan Penggunaan</h1>
            <p className="legal-meta">Terakhir diperbarui: 5 November 2026 • Berlaku efektif untuk seluruh pengguna</p>
          </div>

          <div className="legal-body">
            <section className="legal-section">
              <h2>1. Definisi &amp; Ruang Lingkup Layanan</h2>
              <p>
                <b>Juragan Token</b> (&quot;Kami&quot;, &quot;Layanan&quot;) adalah platform gateway kredit AI prabayar terpadu yang memfasilitasi akses komputasi ke berbagai penyedia model kecerdasan buatan global (termasuk OpenAI, Anthropic, Google AI, Alibaba Cloud, MiniMax, dan ByteDance) melalui mata uang Rupiah (IDR).
              </p>
              <p>
                Dengan mengakses website, melakukan pembayaran melalui sistem checkout SingaPay, atau menggunakan Virtual API Key (<code>jt-live-...</code>), Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen ini.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Masa Aktif Saldo &amp; Nilai Kredit (No-Expiry Guarantee)</h2>
              <div className="highlight-callout">
                <Icon name="check" size={18} />
                <div>
                  <strong>Jaminan Masa Aktif Permanen (Tanpa Hangus Bulanan)</strong>
                  <p>
                    Setiap kredit token rupiah yang Anda beli di Juragan Token berlaku <b>selamanya</b> dan tidak memiliki masa kedaluwarsa bulanan (*no-expiry policy*). Saldo hanya akan berkurang apabila terjadi pemakaian inferensi nyata.
                  </p>
                </div>
              </div>
              <p>
                Perhitungan saldo dipotong secara transparan per 1.000 token input dan completion sesuai tarif acuan katalog yang tercantum di website pada saat transaksi inferensi berlangsung.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Sistem Pembayaran &amp; Penerbitan API Key</h2>
              <ul>
                <li>Pembayaran diproses secara instan melalui sistem <b>SingaPay</b> menggunakan <b>QRIS Standar Pembayaran Nasional</b> serta Virtual Account bank resmi Indonesia (BCA, Mandiri, BRI, BNI, SeaBank, Permata).</li>
                <li>Setelah transaksi lunas dan diverifikasi oleh sistem, satu <b>Virtual API Key unik (<code>jt-live-...</code>)</b> akan langsung diterbitkan di layar pemesanan dan dikirimkan ke alamat email pembeli.</li>
                <li>Pengguna bertanggung jawab penuh atas kerahasiaan API Key masing-masing. Juragan Token tidak pernah meminta kunci rahasia Anda di luar formulir autentikasi resmi.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Kebijakan Pengembalian Dana (Refund Policy)</h2>
              <p>
                Mengingat produk yang kami sediakan adalah komoditas digital berupa kredit komputasi yang langsung aktif dan dapat dikonsumsi seketika, maka:
              </p>
              <ul>
                <li>Pembelian yang telah berhasil diterbitkan API Key-nya <b>bersifat final dan tidak dapat diuangkan kembali (non-refundable)</b>, kecuali terbukti terjadi kegagalan teknis permanen pada infrastruktur server Juragan Token yang berlangsung lebih dari 3 × 24 jam tanpa penyelesaian.</li>
                <li>Jika terjadi kendala pembayaran ganda (double-payment) akibat gangguan jaringan perbankan, pengguna berhak mengajukan verifikasi ke tim Customer Service via WhatsApp resmi (<code>081226983990</code>) dengan melampirkan bukti transfer dan invoice untuk pengembalian dana atau penambahan saldo senilai nominal terkait.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Batasan Penggunaan Wajar (Fair Use &amp; Prohibited Content)</h2>
              <p>Pengguna dilarang keras memanfaatkan gateway Juragan Token untuk:</p>
              <ul>
                <li>Membuat, menyebarkan, atau memproses konten yang melanggar hukum Republik Indonesia (pornografi, ujaran kebencian, perjudian, ancaman kekerasan, dan terorisme).</li>
                <li>Melakukan serangan penolakan layanan (DDoS), eksploitasi celah keamanan, reverse-engineering infrastruktur gateway, atau tindakan penyalahgunaan kuota di luar batas wajar.</li>
                <li>Mencoba mengekstrak master credentials upstream provider.</li>
              </ul>
              <p>
                Pelanggaran terhadap ketentuan ini berhak kami tindaklanjuti dengan penonaktifan API Key secara sepihak tanpa kewajiban kompensasi saldo tersisa.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Batasan Tanggung Jawab &amp; Ketersediaan Layanan (SLA)</h2>
              <p>
                Kami berkomitmen menjaga reliabilitas gateway dengan target uptime <b>99.9%</b>. Namun demikian, ketersediaan model AI tertentu (seperti Claude atau GPT-4o) juga bergantung pada kestabilan server penyedia model global (OpenAI/Anthropic). Juragan Token tidak bertanggung jawab atas kerugian tidak langsung atau kehilangan keuntungan bisnis akibat pemadaman mendadak dari server global tersebut.
              </p>
            </section>
          </div>

          <div className="legal-footer-box">
            <p>Punya pertanyaan seputar syarat &amp; ketentuan ini?</p>
            <a
              href="https://wa.me/6281226983990?text=Halo%20Admin%20Juragan%20Token,%20saya%20ingin%20bertanya%20mengenai%20syarat%20ketentuan%20layanan."
              target="_blank"
              rel="noreferrer"
              className="legal-contact-btn"
            >
              <Icon name="whatsapp" size={16} />
              <span>Hubungi Tim Support WhatsApp (081226983990)</span>
            </a>
          </div>
        </div>
      </main>

      <footer className="docs-footer">
        <div className="docs-footer-inner">
          <p>© 2026 Juragan Token Indonesia. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="docs-footer-nav">
            <Link href="/">Beranda</Link>
            <span>•</span>
            <Link href="/docs">Dokumentasi</Link>
            <span>•</span>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <span>•</span>
            <Link href="/status">Status Sistem</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
