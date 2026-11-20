"use client";

import Link from "next/link";
import { buildWhatsappUrl, WHATSAPP_DISPLAY } from "@/lib/site-config";

type PreFooterCtaProps = {
  onOpenBalanceModal: () => void;
};

export function PreFooterCta({ onOpenBalanceModal }: PreFooterCtaProps) {
  const waUrl = buildWhatsappUrl(
    "Halo Tim Juragantoken, saya ingin berkonsultasi mengenai rekomendasi model AI dan uji coba endpoint gateway."
  );

  return (
    <section
      className="jt-prefooter-section"
      aria-labelledby="prefooter-cta-heading"
      data-reveal="scale"
    >
      <div className="jt-prefooter-card">
        <div className="jt-prefooter-content">
          <span className="jt-prefooter-badge">KONSULTASI &amp; UJI COBA AKSES</span>
          <h2 id="prefooter-cta-heading">
            Satu API Key Terpadu untuk Seluruh Kebutuhan AI Proyek &amp; Tim Anda
          </h2>
          <p>
            Diskusikan rekomendasi model untuk ngoding, riset, maupun automasi chatbot, atau jadwalkan uji coba langsung endpoint{" "}
            <code>api.tokotokenai.com/v1</code> bersama tim Juragantoken melalui WhatsApp{" "}
            <strong>{WHATSAPP_DISPLAY}</strong>.
          </p>
        </div>

        <div className="jt-prefooter-actions">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="jt-pf-btn-white"
          >
            <span>Hubungi via WhatsApp</span>
            <span aria-hidden="true">↗</span>
          </a>

          <button
            type="button"
            className="jt-pf-btn-outline"
            onClick={onOpenBalanceModal}
          >
            <span>Cek Saldo Virtual Key</span>
          </button>

          <Link href="/docs" className="jt-pf-link">
            <span>Baca Dokumentasi API →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
