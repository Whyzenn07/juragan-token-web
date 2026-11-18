"use client";

import { useState } from "react";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { modelsCatalog, type ModelItem } from "@/data/catalog";

type SpecialtyTab = "coding" | "research" | "efficient";

type SpecialtyCard = {
  id: string;
  name: string;
  providerId: string;
  role: string;
  strengths: string[];
};

const SPECIALTY_GROUPS: Record<
  SpecialtyTab,
  {
    label: string;
    headline: string;
    summary: string;
    badge: string;
    models: SpecialtyCard[];
  }
> = {
  coding: {
    label: "Ngoding & Arsitektur",
    headline: "Model terbaik untuk software engineering, debugging, & refactoring kompleks",
    summary:
      "Cocok dipasang di Cursor IDE, Claude Code CLI, atau pipeline CI internal untuk menulis kode bersih lintas banyak file.",
    badge: "Presisi Tinggi",
    models: [
      {
        id: "claude-opus-5-5",
        name: "Claude Opus 5.5",
        providerId: "anthropic",
        role: "Flagship Coding & Arsitektur",
        strengths: ["Refactoring multi-file akurat", "Memahami konteks repositori besar", "Minim halusinasi sintaks"],
      },
      {
        id: "chatgpt-6-astra",
        name: "Chat GPT 6 Astra",
        providerId: "openai",
        role: "Problem Solver & Code Review",
        strengths: ["Debugging algoritma rumit", "Perancangan struktur API & database", "Pembuatan unit test otomatis"],
      },
      {
        id: "gemini-4-argon",
        name: "Gemini 4 Argon",
        providerId: "google",
        role: "Full-Stack & Jendela Konteks Luas",
        strengths: ["Membaca codebase & log berukuran besar", "Sintesis frontend + backend sekaligus", "Cepat untuk iterasi UI"],
      },
    ],
  },
  research: {
    label: "Riset & Penalaran",
    headline: "Model andalan untuk riset pasar, kajian dokumen, & analisa terstruktur",
    summary:
      "Dirancang untuk membedah laporan panjang, membandingkan hipotesis, serta merangkum temuan teknis maupun bisnis.",
    badge: "Analisa Mendalam",
    models: [
      {
        id: "gpt-6-sol",
        name: "GPT-6 Sol",
        providerId: "openai",
        role: "Riset Strategis & Sintesis",
        strengths: ["Penalaran bertahap yang runtut", "Ringkasan laporan eksekutif", "Akurat pada instruksi kompleks"],
      },
      {
        id: "gpt-5.6-terra",
        name: "GPT-5.6 Terra",
        providerId: "openai",
        role: "Riset Harian & Analisa Data",
        strengths: ["Seimbang untuk evaluasi dokumen", "Ekstraksi poin penting terstruktur", "Stabil untuk alur kerja tim"],
      },
      {
        id: "gpt-6-luna",
        name: "GPT-6 Luna",
        providerId: "openai",
        role: "Pemahaman Kontekstual Maju",
        strengths: ["Menangkap nuansa dokumen & gambar", "Komparasi skenario mendalam", "Output rapi & terverifikasi"],
      },
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        providerId: "deepseek",
        role: "Penalaran Logika & Sains",
        strengths: ["Kuat di logika matematika & riset", "Rantai berpikir (reasoning) transparan", "Efisien untuk eksperimen intensif"],
      },
    ],
  },
  efficient: {
    label: "Hemat & Efisien",
    headline: "Model ekonomis berkecepatan tinggi dari DeepSeek, Qwen, & ekosistem Asia",
    summary:
      "Ideal untuk chatbot layanan pelanggan, automasi workflow volume tinggi, translasi, dan asisten operasional tanpa boros biaya.",
    badge: "Efisiensi Biaya",
    models: [
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        providerId: "deepseek",
        role: "Kecepatan Tinggi & Ekonomis",
        strengths: ["Latensi rendah untuk aplikasi real-time", "Sangat hemat untuk volume request tinggi", "Andal untuk tugas harian"],
      },
      {
        id: "deepseek-chat-v3",
        name: "DeepSeek V3 Chat",
        providerId: "deepseek",
        role: "Asisten Operasional Harian",
        strengths: ["Respons alami Bahasa Indonesia & Inggris", "Stabil untuk customer support bot", "Rasio performa-biaya tinggi"],
      },
      {
        id: "qwen3.7-max",
        name: "Qwen 3.7 Max",
        providerId: "alibaba",
        role: "Multi-Bahasa & Pemrosesan Teks",
        strengths: ["Unggul di dokumen Asia & teknis", "Pemrosesan JSON & ekstraksi terstruktur", "Skalabilitas tinggi untuk bisnis"],
      },
      {
        id: "qwen3.6-flash",
        name: "Qwen 3.6 Flash",
        providerId: "alibaba",
        role: "Ringan untuk Automasi Massal",
        strengths: ["Biaya pemrosesan sangat rendah", "Cocok untuk klasifikasi & moderasi teks", "Berjalan mulus di workflow API"],
      },
      {
        id: "glm-5.3-flash",
        name: "GLM 5.3 Flash",
        providerId: "zhipu",
        role: "Alternatif Hemat & Responsif",
        strengths: ["Pilihan diversifikasi model Asia", "Cepat untuk summarization ringan", "Terintegrasi dalam endpoint sama"],
      },
    ],
  },
};

type ModelExpertiseShowcaseProps = {
  onSelectModel: (model: ModelItem) => void;
  onBrowseCategory: (category: "Ngoding" | "Tugas & Riset" | "Chat Hemat") => void;
};

export function ModelExpertiseShowcase({ onSelectModel, onBrowseCategory }: ModelExpertiseShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SpecialtyTab>("coding");
  const current = SPECIALTY_GROUPS[activeTab];

  const handleOpen = (card: SpecialtyCard) => {
    const found = modelsCatalog.find((m) => m.id === card.id);
    if (found) onSelectModel(found);
  };

  const categoryTarget =
    activeTab === "coding" ? "Ngoding" : activeTab === "research" ? "Tugas & Riset" : "Chat Hemat";

  return (
    <section className="jt-section" id="keahlian-model" aria-labelledby="expertise-heading" data-reveal="fade-up">
      <div className="jt-section-head">
        <span className="jt-kicker">REKOMENDASI BERDASARKAN KEBUTUHAN</span>
        <h2 id="expertise-heading">Pilih Model Sesuai Keahlian &amp; Efektivitas Kerja</h2>
        <p>
          Setiap model memiliki keunggulan berbeda. Gunakan model flagship untuk arsitektur kode atau riset mendalam,
          dan alihkan beban kerja ringan ke model hemat seperti DeepSeek serta Qwen — semuanya dari satu gateway.
        </p>
      </div>

      <div className="jt-expertise-tabs" role="tablist" aria-label="Kategori keahlian model AI">
        {(Object.keys(SPECIALTY_GROUPS) as SpecialtyTab[]).map((key) => {
          const group = SPECIALTY_GROUPS[key];
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`jt-exp-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              <span>{group.label}</span>
              <span className="jt-exp-badge">{group.badge}</span>
            </button>
          );
        })}
      </div>

      <div className="jt-expertise-panel" role="tabpanel">
        <div className="jt-exp-panel-top">
          <div>
            <h3>{current.headline}</h3>
            <p>{current.summary}</p>
          </div>
          <button
            type="button"
            className="jt-link-pill"
            onClick={() => onBrowseCategory(categoryTarget)}
          >
            Filter Katalog &ldquo;{categoryTarget}&rdquo; ↗
          </button>
        </div>

        <div className="jt-exp-grid">
          {current.models.map((item) => (
            <article key={item.id} className="jt-exp-card">
              <div className="jt-exp-card-head">
                <ProviderLogo provider={item.providerId} size={30} />
                <div>
                  <h4>{item.name}</h4>
                  <span>{item.role}</span>
                </div>
              </div>
              <ul className="jt-exp-list">
                {item.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <button
                type="button"
                className="jt-exp-detail-btn"
                onClick={() => handleOpen(item)}
              >
                Lihat Spesifikasi &amp; Cara Pakai →
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
