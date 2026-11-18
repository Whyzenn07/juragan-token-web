export * from "@/types";
import type { Category, Provider, ModelItem, RetailPackage, PaymentMethod } from "@/types";

/** Gateway produksi. Menggunakan domain publik terkonfigurasi. */
export const GATEWAY_ORIGIN =
  (process.env.NEXT_PUBLIC_APP_URL || "https://api.tokotokenai.com").trim().replace(/\/+$/, "");
export const GATEWAY_BASE_URL = `${GATEWAY_ORIGIN}/v1`;
export const PRICING_SNAPSHOT_DATE = "4 Nov 2026";

/** Kurs Realtime USD/IDR (Rp 18.134 per 4 Nov 2026). */
export const USD_RATE = 18_134;
/** Pengali harga jual ritel terhadap harga gateway. 1 = dijual sama dengan harga gateway. Diatur pemilik. */
export const RETAIL_MARKUP = 1;

/** Asumsi satu "jawaban": pertanyaan beserta konteks ~1.500 token, jawaban ~800 token. */
export const ANSWER_INPUT_TOKENS = 1_500;
export const ANSWER_OUTPUT_TOKENS = 800;
export const BUDGET_SAMPLE_IDR = 10_000;

export const categories: Category[] = ["Semua", "Ngoding", "Tugas & Riset", "Chat Hemat", "Gambar"];

export const providers: Provider[] = [
  { id: "openai", name: "GPT", company: "OpenAI", hasLogo: false },
  { id: "anthropic", name: "Claude", company: "Anthropic", hasLogo: false },
  { id: "alibaba", name: "Qwen", company: "Alibaba Cloud", hasLogo: false },
  { id: "minimax", name: "MiniMax", company: "MiniMax", hasLogo: false },
  { id: "google", name: "Gemini", company: "Google", hasLogo: false },
  { id: "xai", name: "Grok", company: "xAI", hasLogo: false },
  { id: "moonshot", name: "Kimi", company: "Moonshot AI", hasLogo: false },
  { id: "deepseek", name: "DeepSeek", company: "DeepSeek", hasLogo: false },
  { id: "bytedance", name: "Doubao", company: "ByteDance", hasLogo: false },
  { id: "zhipu", name: "GLM", company: "Z.ai", hasLogo: false },
  { id: "fable", name: "Claude Fable", company: "Anthropic", hasLogo: false }
];

export const modelsCatalog: ModelItem[] = [
  {
    id: "chatgpt-6-astra",
    name: "Chat GPT 6 Astra",
    providerId: "openai",
    category: "Ngoding",
    description: "Frontier tertinggi OpenAI untuk pembuatan web/app otonom, refactoring fullstack, dan coding loop.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_048_576,
    ratio: 5.0,
    completionRatio: 5,
    featured: true
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Model penalaran profesional generasi ke-6 OpenAI untuk analitika riset multi-langkah, arsitektur sistem, dan sintesis komputasi mendalam.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.75,
    completionRatio: 5,
    featured: true
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Seimbang antara kemampuan analitis dan biaya. Untuk ringkasan terstruktur dan bantuan riset harian.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.0,
    completionRatio: 6
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Model penalaran cerdas generasi ke-6 OpenAI: arsitektur responsif, pemahaman kontekstual maju, dan analitika presisi tinggi.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.75,
    completionRatio: 5,
    featured: true
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    providerId: "openai",
    category: "Chat Hemat",
    description: "Generasi baru efisiensi OpenAI untuk respons kilat, chatbot interaktif, dan parsing payload data terstruktur.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.15,
    completionRatio: 5,
    featured: true
  },
  {
    id: "gpt-5.4",
    name: "GPT 5.4",
    providerId: "openai",
    category: "Ngoding",
    description: "Model engineering OpenAI generasi 5.4 untuk arsitektur backend, refactoring bersih, dan debugging multi-file.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.25,
    completionRatio: 6
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Puncak kecerdasan Anthropic untuk penalaran mendalam, tinjauan dokumen strategis, dan arsitektur sistem kritis.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 3.5,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Model koding terkuat di dunia saat ini. Menguasai arsitektur kompleks, debugging multi-file, dan integrasi Claude Code.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 1.75,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-fable-5-1",
    name: "Claude Fable 5.1",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Generasi khusus seri Fable 5.1 Anthropic untuk sintesis arsitektur backend, review kode presisi, dan alur agentic kompleks.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 5,
    completionRatio: 5
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Generasi 5.5 teringan Anthropic: penalaran cepat generasi terbaru dengan kecepatan streaming instan dan gaya bahasa cerdas.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    ratio: 0.45,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Model senior seri Opus untuk debugging modul besar, migrasi sistem legacy, dan verifikasi keamanan kode.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 2.5,
    completionRatio: 5
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Pilihan favorit tim developer untuk Claude Code CLI, Cursor, dan refactoring source code lintas repositori.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 1.5,
    completionRatio: 5
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    providerId: "google",
    category: "Ngoding",
    description: "Frontier generasi ke-4 terbaru Google DeepMind untuk reasoning tingkat tinggi dan pemecahan algoritma rumit.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["openai"],
    ratio: 1.75,
    completionRatio: 5,
    featured: true
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    providerId: "google",
    category: "Chat Hemat",
    description: "Multimodal serba-bisa Google generasi terbaru. Jendela konteks raksasa 1 juta token dengan harga super terjangkau.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["openai"],
    contextTokens: 1_000_000,
    ratio: 0.25,
    completionRatio: 6,
    featured: true
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash Code",
    providerId: "google",
    category: "Ngoding",
    description: "Model koding kilat Google untuk integrasi CI/CD, parsing log server, dan penulisan skrip automasi.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.15,
    completionRatio: 5
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Spesialis dokumen riset tebal. Sanggup membaca ratusan halaman PDF, video 1 jam, dan transkrip audio sekaligus.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["openai"],
    contextTokens: 2_000_000,
    ratio: 1.0,
    completionRatio: 6,
    featured: true
  },
  {
    id: "imagen-3-fast",
    name: "Imagen 3 Studio",
    providerId: "google",
    category: "Gambar",
    description: "Teknologi generasi visual terbaru Google DeepMind. Render teks dalam gambar sempurna dan fotorealisme tinggi.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.03,
    featured: true
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    providerId: "google",
    category: "Chat Hemat",
    description: "Model Google latensi sub-detik berbiaya hemat untuk chatbot volume tinggi, klasifikasi data, dan automasi cepat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.15,
    completionRatio: 4
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Versi pro tingkat lanjut DeepSeek untuk penulisan aplikasi fullstack, integrasi database, dan penyelesaian error pelik.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.28,
    completionRatio: 4,
    featured: true
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    providerId: "deepseek",
    category: "Chat Hemat",
    description: "Generasi V4 super hemat dari DeepSeek. Respon kilat untuk tanya jawab harian dan ringkasan teks singkat.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.04,
    completionRatio: 4,
    featured: true
  },
  {
    id: "deepseek-chat-v3",
    name: "DeepSeek V3 Chat",
    providerId: "deepseek",
    category: "Chat Hemat",
    description: "Model flagship serbaguna dengan biaya sangat terjangkau. Jawaban padat, natural, dan cerdas dalam bahasa Indonesia.",
    inputs: ["teks"],
    endpoints: ["openai"],
    contextTokens: 64_000,
    ratio: 0.07,
    completionRatio: 4
  },
  {
    id: "deepseek-r1-reasoner",
    name: "DeepSeek R1 Reasoner",
    providerId: "deepseek",
    category: "Tugas & Riset",
    description: "Pelopor penalaran open-weights dunia. Menyajikan cara berpikir langkah demi langkah (chain of thought) yang transparan.",
    inputs: ["teks"],
    endpoints: ["openai"],
    contextTokens: 64_000,
    ratio: 0.28,
    completionRatio: 4,
    featured: true
  },
  {
    id: "deepseek-coder-v2.5",
    name: "DeepSeek Coder V2.5",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Spesialis pemrograman ringan DeepSeek yang menguasai 300+ bahasa untuk penulisan skrip, SQL, dan automasi CI/CD.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.14,
    completionRatio: 4,
    featured: true
  },
  {
    id: "qwen3.7-max",
    name: "Qwen 3.7 Max",
    providerId: "alibaba",
    category: "Tugas & Riset",
    description: "Model terbesar Alibaba untuk analisis pasar, data science, dan ringkasan dokumen multibahasa tanpa kompromi akurasi.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.855,
    completionRatio: 3.01,
    featured: true
  },
  {
    id: "qwen3.8-flash",
    name: "Qwen 3.8 Flash",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Rilis tercepat seri Qwen 3.8 untuk ekstraksi JSON terstruktur, layanan pelanggan multibahasa, dan pemrosesan volume tinggi.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.075,
    completionRatio: 3.133
  },
  {
    id: "qwen3.7-plus",
    name: "Qwen 3.7 Plus",
    providerId: "alibaba",
    category: "Ngoding",
    description: "Model coding dan logic frontier Alibaba Cloud untuk integrasi API, penulisan script, dan automasi bisnis.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.2,
    completionRatio: 4
  },
  {
    id: "qwen3.6-flash",
    name: "Qwen 3.6 Flash",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Generasi baru Qwen ultra-cepat dengan pemahaman bahasa Indonesia yang sangat luwes dan biaya super murah.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.0845,
    completionRatio: 6
  },
  {
    id: "qwen-image-2.0-pro",
    name: "Qwen Image 2.0 Pro",
    providerId: "alibaba",
    category: "Gambar",
    description: "Generasi gambar resolusi tinggi dari Alibaba Cloud dengan pemahaman teks Mandarin dan Inggris yang presisi.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.028,
    featured: true
  },
  {
    id: "grok-4",
    name: "Grok 4 Reasoning",
    providerId: "xai",
    category: "Ngoding",
    description: "Frontier reasoning xAI dengan kluster komputasi Colossus. Sangat kuat untuk matematika lanjut dan arsitektur kode.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 1.65,
    completionRatio: 5,
    featured: true
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    providerId: "xai",
    category: "Ngoding",
    description: "Generasi terbaru xAI dengan kecepatan eksekusi tinggi untuk analisis log produksi, koding intensif, dan sintesis data real-time.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 1,
    completionRatio: 3
  },
  {
    id: "grok-4-fast-reasoning",
    name: "Grok 4 Fast",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Penalaran analitis cepat xAI generasi ke-4 untuk verifikasi data, pencarian logika kritis, dan sintesis ringkasan instan.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 1.25,
    completionRatio: 4
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    providerId: "xai",
    category: "Chat Hemat",
    description: "Grok versi ringkas berkecepatan tinggi. Karakter to the point, gaya bicara cerdas, dan biaya sangat terjangkau.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.15,
    completionRatio: 1.67
  },
  {
    id: "grok-imagine-v1",
    name: "Grok Vision & Imagine",
    providerId: "xai",
    category: "Gambar",
    description: "Model visi dan kreasi grafis xAI. Hasilkan visual fotorealistis dan interpretasi gambar kompleks dengan gaya unik.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.035,
    featured: true
  },
  {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro Code",
    providerId: "moonshot",
    category: "Ngoding",
    description: "Versi pro generasi K3.1 dengan pemahaman struktur kode kompleks dan chain-of-thought koding tingkat lanjut.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.85,
    completionRatio: 4
  },
  {
    id: "kimi-k3",
    name: "Kimi K3 Research",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Model riset kontekstual panjang dari Moonshot AI untuk memproses referensi berlembar-lembar secara utuh.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 1.43,
    completionRatio: 5,
    featured: true
  },
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    providerId: "moonshot",
    category: "Ngoding",
    description: "Model spesialis koding Moonshot AI untuk pengembangan aplikasi web, skrip Python, dan penyelesaian bug lintas file.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.465,
    completionRatio: 4.15,
    featured: true
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6 Flash",
    providerId: "moonshot",
    category: "Chat Hemat",
    description: "Model efisien Moonshot AI untuk ekstraksi poin penting, penerjemahan cepat, dan draf tulisan ringkas.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.465,
    completionRatio: 4.15
  },
  {
    id: "kimi-chat-instant",
    name: "Kimi Chat Instant",
    providerId: "moonshot",
    category: "Chat Hemat",
    description: "Asisten percakapan berlatensi rendah untuk penyusunan ringkasan eksekutif, penyuntingan dokumen, dan respons cepat harian.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.465,
    completionRatio: 4.15
  },
  {
    id: "MiniMax-M3",
    name: "MiniMax M3",
    providerId: "minimax",
    category: "Ngoding",
    description: "Generasi ke-3 MiniMax dengan konteks luas untuk orkestrasi agen kerja, automasi kode backend, dan alur tool-calling stabil.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.3,
    completionRatio: 4
  },
  {
    id: "minimax-m2.7",
    name: "MiniMax M2.7 Coder",
    providerId: "minimax",
    category: "Ngoding",
    description: "Model reasoning MiniMax dengan optimasi koding untuk frontend React, API backend, dan SQL queries.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.35,
    completionRatio: 4.5
  },
  {
    id: "minimax-m2.7-pro",
    name: "MiniMax M2.7 Pro",
    providerId: "minimax",
    category: "Ngoding",
    description: "Spesialis arsitektur fullstack MiniMax dengan jendela konteks besar untuk audit kode dan refactoring proyek.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.65,
    completionRatio: 4.5
  },
  {
    id: "minimax-m2.5",
    name: "MiniMax M2.5 Fast",
    providerId: "minimax",
    category: "Chat Hemat",
    description: "Model cepat MiniMax untuk percakapan alami, terjemahan real-time, dan pemrosesan instruksi sehari-hari.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.15,
    completionRatio: 4,
    featured: true
  },
  {
    id: "minimax-image-art",
    name: "MiniMax Image Art",
    providerId: "minimax",
    category: "Gambar",
    description: "Generator gambar artistik dari MiniMax untuk ilustrasi buku, poster media sosial, dan materi kreatif visual.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.022
  },
  {
    id: "seed-2.0-pro",
    name: "Seed 2.0 Pro",
    providerId: "bytedance",
    category: "Ngoding",
    description: "Model engineering ByteDance dengan pengoptimalan logika koding, refactoring skrip, dan penulisan algoritma.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.40,
    completionRatio: 4.5,
    featured: true
  },
  {
    id: "seed-2.0-lite",
    name: "Seed 2.0 Lite",
    providerId: "bytedance",
    category: "Chat Hemat",
    description: "Generasi 2.0 yang sangat efisien dari ByteDance. Kecepatan streaming tinggi dengan konsumsi token irit.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.08,
    completionRatio: 4,
    featured: true
  },
  {
    id: "seed-1.8",
    name: "Seed 1.8 Research",
    providerId: "bytedance",
    category: "Tugas & Riset",
    description: "Spesialis analisis tren, ekstraksi data riset, dan pengolahan dokumen komprehensif dari ByteDance AI Lab.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.50,
    completionRatio: 4
  },
  {
    id: "seedance-2.0-fast",
    name: "Seedance 2.0 Fast",
    providerId: "bytedance",
    category: "Gambar",
    description: "Mesin generasi visual & animasi cepat dari ByteDance untuk prototipe aset kampanye, storyboard, dan media digital.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 37.5,
    completionRatio: 1
  },
  {
    id: "seedream-4.5",
    name: "Seed Dream 4.5",
    providerId: "bytedance",
    category: "Gambar",
    description: "Generator gambar artistik dari ByteDance. Komposisi visual dramatis, tekstur dinamis, dan rendering lanskap memukau.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.025,
    featured: true
  },
  {
    id: "glm-5.3",
    name: "GLM 5.3 General",
    providerId: "zhipu",
    category: "Tugas & Riset",
    description: "Versi flagship Zhipu AI untuk pemahaman kontekstual luas, sintesis dokumen kompleks, dan penalaran logika tingkat tinggi.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.7,
    completionRatio: 3.143,
    featured: true
  },
  {
    id: "glm-5.3-flash",
    name: "GLM 5.3 Flash",
    providerId: "zhipu",
    category: "Chat Hemat",
    description: "Model generasi GLM 5.3 paling gesit dari Zhipu AI. Jawaban singkat padat dengan efisiensi biaya tertinggi.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.0375,
    completionRatio: 3.333,
    featured: true
  },
  {
    id: "glm-5-turbo",
    name: "GLM 5 Turbo Pro",
    providerId: "zhipu",
    category: "Ngoding",
    description: "Model turbo koding bertenaga tinggi untuk debugging sistem, automasi workflow, dan integrasi API.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.6,
    completionRatio: 3.333,
    featured: true
  },
  {
    id: "glm-5.2",
    name: "GLM 5.2 Research",
    providerId: "zhipu",
    category: "Tugas & Riset",
    description: "Penalaran analitis kuat untuk telaah literatur ilmiah, perbandingan metodologi, dan penulisan makalah akademis.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.7,
    completionRatio: 3.143
  },
  {
    id: "glm-5.1",
    name: "GLM 5.1 Coder",
    providerId: "zhipu",
    category: "Ngoding",
    description: "Spesialis koding GLM untuk penulisan script web, refactoring kode, dan integrasi mulus di Cursor & VS Code.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.4225,
    completionRatio: 4
  },
  {
    id: "glm-5",
    name: "GLM 5",
    providerId: "zhipu",
    category: "Chat Hemat",
    description: "Model efisien Zhipu AI seri GLM 5 untuk percakapan responsif, ringkasan cepat, dan olah teks operasional.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.44,
    completionRatio: 3.2
  }
];

// Turunan harga. Semua angka dihitung dari rasio gateway agar tidak ada harga yang diketik manual.

export const inputIdrPer1M = (m: ModelItem, rate = USD_RATE) => m.ratio * 2 * rate * RETAIL_MARKUP;
export const outputIdrPer1M = (m: ModelItem, rate = USD_RATE) => inputIdrPer1M(m, rate) * m.completionRatio;
export const perImageIdr = (m: ModelItem, rate = USD_RATE) => (m.perImageUsd ?? 0) * rate * RETAIL_MARKUP;
export const isPerImage = (m: ModelItem) => m.perImageUsd !== undefined;

/** Biaya satu jawaban (atau satu gambar) dalam rupiah. */
export const unitCostIdr = (m: ModelItem, rate = USD_RATE) =>
  isPerImage(m)
    ? perImageIdr(m, rate)
    : (ANSWER_INPUT_TOKENS * inputIdrPer1M(m, rate) + ANSWER_OUTPUT_TOKENS * outputIdrPer1M(m, rate)) / 1_000_000;

/** Berapa jawaban (atau gambar) yang didapat dari sejumlah rupiah. */
export const unitsForBudget = (m: ModelItem, budgetIdr = BUDGET_SAMPLE_IDR, rate = USD_RATE) =>
  Math.floor(budgetIdr / unitCostIdr(m, rate));

export type Tier = "Hemat" | "Seimbang" | "Premium";

export const tierOf = (m: ModelItem): Tier => {
  if (isPerImage(m)) return "Seimbang";
  const units = unitsForBudget(m);
  if (units >= 300) return "Hemat";
  if (units >= 60) return "Seimbang";
  return "Premium";
};

/** Posisi 0..1 untuk meter "seberapa jauh sepuluh ribu rupiah". Untuk teks menggunakan skala log 20..3.000 jawaban, untuk model gambar menggunakan skala log 2..35 gambar. */
export const reachScore = (m: ModelItem): number => {
  const units = Math.max(1, unitsForBudget(m));
  if (isPerImage(m)) {
    const minImg = Math.log(2);
    const maxImg = Math.log(35);
    const score = Math.min(1, Math.max(0.18, (Math.log(units) - minImg) / (maxImg - minImg)));
    return Math.round(score * 1000) / 1000;
  }
  const min = Math.log(20);
  const max = Math.log(3_000);
  const score = Math.min(1, Math.max(0, (Math.log(units) - min) / (max - min)));
  return Math.round(score * 1000) / 1000;
};

/** Aplikasi yang bisa langsung dipakai, diturunkan dari format endpoint gateway. */
export const compatibleApps = (m: ModelItem): string[] => {
  if (m.endpoints.includes("image")) return ["API Gambar", "Python SDK", "REST API", "Teks-ke-Visual"];
  const apps: string[] = [];
  if (m.endpoints.includes("anthropic")) apps.push("Claude Code");
  if (m.endpoints.includes("openai")) apps.push("Cursor", "Chatbox");
  return apps;
};

const modelById = (id: string) => modelsCatalog.find((m) => m.id === id) as ModelItem;
const answersFor = (id: string, budget: number, shortModelName: string) =>
  `±${new Intl.NumberFormat("id-ID").format(unitsForBudget(modelById(id), budget))} Interaksi · ${shortModelName}`;

// Pilihan Paket Token Fleksibel Sesuai Kebutuhan (Personal, Kerja, Coding, & Enterprise)
export const retailPackages: RetailPackage[] = [
  {
    id: "pkt-mhs-uji",
    name: "Paket Starter AI",
    subtitle: "Kebutuhan chat, tugas & eksplorasi harian",
    targetUser: "Personal",
    priceIdr: 15000,
    estToken: answersFor("deepseek-v4-flash", 15000, "DeepSeek"),
    description: "Cukup untuk ratusan pertanyaan AI harian, terjemahan dokumen instan, dan asisten chat cepat di smartphone & laptop.",
    popularFor: ["Chat & Tanya Cepat", "Asisten HP & Web", "Terjemah Dokumen"],
    recommendedModel: "DeepSeek V4 Flash / Gemini 3.8 Flash",
    badge: "Starter Hemat"
  },
  {
    id: "pkt-mhs-starter",
    name: "Paket Produktivitas",
    subtitle: "Analisis dokumen, riset & asisten kerja",
    targetUser: "Profesional",
    priceIdr: 29000,
    estToken: answersFor("gemini-3.8-flash", 29000, "Gemini"),
    description: "Saldo fleksibel untuk analisis berkas PDF panjang, resume rapat, pembuatan draft email/laporan, dan riset harian.",
    popularFor: ["Analisis PDF Panjang", "Draft Laporan Kerja", "Riset & Resume Data"],
    recommendedModel: "Gemini 3.8 Flash / Kimi K2.7 Code",
    badge: "Paling Populer",
    featured: true
  },
  {
    id: "pkt-skripsi-koding",
    name: "Paket Pro & Developer",
    subtitle: "Pairing coding Cursor, debug & riset teknis",
    targetUser: "Developer",
    priceIdr: 69000,
    estToken: answersFor("claude-sonnet-5-5", 69000, "Claude"),
    description: "Saldo optimal untuk pairing coding intensif di Cursor / VS Code, penanganan error kompleks, dan pengolahan data teknis.",
    popularFor: ["Pairing di Cursor/VS Code", "Debug Error Coding", "Riset Data Kompleks"],
    recommendedModel: "Claude Sonnet 5.5 / Gemini 3.1 Pro / Kimi K2.7 Code",
    badge: "Best Value"
  },
  {
    id: "pkt-pro-builder",
    name: "Paket Enterprise / Ultra",
    subtitle: "Sprint Claude Code CLI, automasi API & performa",
    targetUser: "Enterprise",
    priceIdr: 149000,
    estToken: answersFor("claude-sonnet-5-5", 149000, "Claude"),
    description: "Kapasitas saldo besar untuk workflow terminal Claude Code CLI, proyek produksi skala penuh, dan automasi backend tanpa langganan kartu kredit.",
    popularFor: ["Claude Code CLI Terminal", "Automasi Script & API", "Proyek Klien Skala Besar"],
    recommendedModel: "Claude Sonnet 5.5 / Claude Opus 5.5 / GPT-6 Sol",
    badge: "Power User"
  }
];

export const paymentMethods: PaymentMethod[] = [
  // 1. QRIS Instan
  {
    id: "qris",
    category: "qris",
    channelCode: "qris",
    name: "QRIS Instan (Semua Bank & e-Wallet)",
    fee: "Gratis Biaya Admin",
    feeAmount: 0,
    provider: "BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA, LinkAja",
    speed: "1 Detik Verifikasi Otomatis",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Bebas Biaya Admin"
  },

  // 2. Virtual Account & e-Wallet
  {
    id: "va-dana",
    category: "va_ewallet",
    channelCode: "dana",
    name: "DANA",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "Saldo DANA / Virtual Account DANA",
    speed: "Otomatis Real-time",
    accountNumber: "3901 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Instan"
  },
  {
    id: "va-shopeepay",
    category: "va_ewallet",
    channelCode: "shopeepay",
    name: "ShopeePay",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "Aplikasi Shopee / ShopeePay",
    speed: "Otomatis Real-time",
    accountNumber: "893 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Instan"
  },
  {
    id: "va-ovo",
    category: "va_ewallet",
    channelCode: "ovo",
    name: "OVO",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "OVO Cash / OVO Premier",
    speed: "Otomatis Real-time",
    accountNumber: "8099 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Instan"
  },
  {
    id: "va-gopay",
    category: "va_ewallet",
    channelCode: "gopay",
    name: "GoPay",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "Aplikasi GoPay / Gojek",
    speed: "Otomatis Real-time",
    accountNumber: "70001 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Instan"
  },
  {
    id: "va-bca",
    category: "va_ewallet",
    channelCode: "bca_va",
    name: "BCA Virtual Account",
    fee: "Rp 1.000",
    feeAmount: 1000,
    provider: "BCA Mobile / myBCA / KlikBCA",
    speed: "Otomatis Real-time",
    accountNumber: "3901 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Populer"
  },
  {
    id: "va-mandiri",
    category: "va_ewallet",
    channelCode: "mandiri_va",
    name: "Mandiri Virtual Account",
    fee: "Rp 1.000",
    feeAmount: 1000,
    provider: "Livin by Mandiri",
    speed: "Otomatis Real-time",
    accountNumber: "88708 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Populer"
  },
  {
    id: "va-bri",
    category: "va_ewallet",
    channelCode: "bri_va",
    name: "BRI Virtual Account (BRIVA)",
    fee: "Rp 1.000",
    feeAmount: 1000,
    provider: "BRImo / ATM BRI",
    speed: "Otomatis Real-time",
    accountNumber: "12800 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "va-bni",
    category: "va_ewallet",
    channelCode: "bni_va",
    name: "BNI Virtual Account",
    fee: "Rp 1.000",
    feeAmount: 1000,
    provider: "BNI Mobile Banking / ATM BNI",
    speed: "Otomatis Real-time",
    accountNumber: "8277 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "va-seabank",
    category: "va_ewallet",
    channelCode: "seabank_va",
    name: "SeaBank Virtual Account",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "Aplikasi SeaBank / Transfer Bank",
    speed: "Otomatis Real-time",
    accountNumber: "7820 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Instan"
  },
  {
    id: "va-permata",
    category: "va_ewallet",
    channelCode: "permata_va",
    name: "Permata Virtual Account",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "PermataMobile X / ATM Permata",
    speed: "Otomatis Real-time",
    accountNumber: "8528 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "va-cimb",
    category: "va_ewallet",
    channelCode: "cimb_va",
    name: "CIMB Niaga Virtual Account",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "OCTO Mobile / ATM CIMB Niaga",
    speed: "Otomatis Real-time",
    accountNumber: "1199 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "ewallet",
    category: "va_ewallet",
    channelCode: "dana",
    name: "e-Wallet (DANA / GoPay / ShopeePay)",
    fee: "Bebas Biaya",
    feeAmount: 0,
    provider: "Scan atau Notifikasi Aplikasi",
    speed: "Instan",
    accountNumber: "3901 0812 3456 7890",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },

  // 3. Transfer Bank
  {
    id: "transfer-bca",
    category: "bank_transfer",
    channelCode: "bca",
    name: "Bank Central Asia (BCA)",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening BCA (014) · Verifikasi Cepat",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "8831 2948 10",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Prioritas"
  },
  {
    id: "transfer-mandiri",
    category: "bank_transfer",
    channelCode: "mandiri",
    name: "Bank Mandiri",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening Mandiri (008) · Verifikasi Cepat",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "137 00 2938 1823",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "transfer-bri",
    category: "bank_transfer",
    channelCode: "bri",
    name: "Bank Rakyat Indonesia (BRI)",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening BRI (002) · Verifikasi Cepat",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "0341 01 002938 503",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "transfer-bni",
    category: "bank_transfer",
    channelCode: "bni",
    name: "Bank Negara Indonesia (BNI)",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening BNI (009) · Verifikasi Cepat",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "0823 9182 34",
    accountName: "PT JURAGAN TOKEN INDONESIA"
  },
  {
    id: "transfer-bsi",
    category: "bank_transfer",
    channelCode: "bsi",
    name: "Bank Syariah Indonesia (BSI)",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening BSI (451) · Bebas Biaya & Syariah",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "721 829 3841",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Syariah"
  },
  {
    id: "transfer-seabank",
    category: "bank_transfer",
    channelCode: "seabank",
    name: "PT Bank Seabank Indonesia (SeaBank)",
    fee: "Gratis Admin",
    feeAmount: 0,
    provider: "Rekening SeaBank (535) · Verifikasi Cepat",
    speed: "Verifikasi 1-3 Menit",
    accountNumber: "9012 3847 1928",
    accountName: "PT JURAGAN TOKEN INDONESIA",
    badge: "Digital Bank"
  }
];

export const providerById = (id: string) => providers.find((provider) => provider.id === id) as Provider;

