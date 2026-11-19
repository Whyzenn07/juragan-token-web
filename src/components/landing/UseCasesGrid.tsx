"use client";

import type { Category } from "@/types";

type UseCaseItem = {
  tag: string;
  title: string;
  desc: string;
  stack: string[];
  targetCategory: Exclude<Category, "Semua">;
  actionLabel: string;
};

const USE_CASES: UseCaseItem[] = [
  {
    tag: "TIM ENGINEERING",
    title: "Software House & Startup Teknologi",
    desc: "Pasang satu API Key di Cursor IDE, Windsurf, maupun Claude Code CLI untuk mempercepat refactoring, code review, dan otomatisasi unit test lintas repositori.",
    stack: ["Claude Sonnet 5.5", "Chat GPT 6 Astra", "Gemini 4 Argon"],
    targetCategory: "Ngoding",
    actionLabel: "Lihat Model Ngoding",
  },
  {
    tag: "RISET & ANALITIKA",
    title: "Tim Riset, Konsultan & Analis Data",
    desc: "Bedah ratusan halaman laporan PDF, perbandingan metodologi, dan sintesis dokumen strategis dengan akurasi penalaran bertahap yang konsisten.",
    stack: ["Claude Opus 5.5", "GPT-6 Sol", "DeepSeek R1 Reasoner"],
    targetCategory: "Tugas & Riset",
    actionLabel: "Lihat Model Riset",
  },
  {
    tag: "OPERASIONAL & AUTOMASI",
    title: "Agensi Digital & Layanan Pelanggan",
    desc: "Jalankan chatbot WhatsApp/web, klasifikasi tiket, dan workflow automasi ribuan request harian berlatensi rendah dengan efisiensi token maksimal.",
    stack: ["DeepSeek V4 Flash", "Qwen 3.8 Flash", "Gemini 3.8 Flash"],
    targetCategory: "Chat Hemat",
    actionLabel: "Lihat Model Hemat",
  },
  {
    tag: "KREATIF & PRODUK",
    title: "Tim Desain, Konten & Kampanye Visual",
    desc: "Hasilkan prototipe visual produk, ilustrasi editorial, hingga storyboard kampanye berkualitas tinggi langsung dari endpoint yang sama.",
    stack: ["Imagen 3 Studio", "Qwen Image 2.0 Pro", "Seed Dream 4.5"],
    targetCategory: "Gambar",
    actionLabel: "Lihat Model Gambar",
  },
];

type UseCasesGridProps = {
  onSelectCategory: (category: Exclude<Category, "Semua">) => void;
};

export function UseCasesGrid({ onSelectCategory }: UseCasesGridProps) {
  return (
    <section
      className="jt-section"
      id="skenario-penggunaan"
      aria-labelledby="usecases-heading"
      data-reveal="fade-up"
    >
      <div className="jt-section-head">
        <span className="jt-kicker">SKENARIO PENERAPAN NYATA</span>
        <h2 id="usecases-heading">Dirancang untuk Berbagai Skala Tim &amp; Kebutuhan Industri</h2>
        <p>
          Mulai dari developer individu hingga operasional perusahaan — pilih kombinasi model paling relevan tanpa
          mengubah arsitektur aplikasi Anda.
        </p>
      </div>

      <div className="jt-usecases-grid">
        {USE_CASES.map((item) => (
          <article key={item.title} className="jt-usecase-card">
            <span className="jt-usecase-tag">{item.tag}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>

            <div className="jt-usecase-stack" aria-label="Rekomendasi model">
              {item.stack.map((modelName) => (
                <span key={modelName} className="jt-usecase-chip">
                  {modelName}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="jt-usecase-action"
              onClick={() => onSelectCategory(item.targetCategory)}
            >
              <span>{item.actionLabel}</span>
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
