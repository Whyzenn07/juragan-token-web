export * from "@/types";
import type { Category, Provider, ModelItem, RetailPackage, PaymentMethod } from "@/types";

/** Gateway produksi. Domain api.juragantoken.co.id belum punya DNS, jadi semua panduan memakai host ini. */
export const GATEWAY_ORIGIN = "https://www.juragantoken.co.id";
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
  // ==========================================
  // 1. OPENAI FAMILY (Luna -> Terra -> Sol -> Astra)
  // ==========================================
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    providerId: "openai",
    category: "Chat Hemat",
    description: "Model OpenAI paling irit untuk tugas pendek: klasifikasi, ekstraksi data, dan pertanyaan singkat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.05,
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
    ratio: 0.5,
    completionRatio: 6
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    providerId: "openai",
    category: "Ngoding",
    description: "Spesialis coding kompleks: merencanakan arsitektur, membaca hasil tool, dan tugas multi-langkah.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
    completionRatio: 5,
    featured: true
  },
  {
    id: "chatgpt-6-astra",
    name: "Chat GPT 6 Astra",
    providerId: "openai",
    category: "Ngoding",
    description: "Frontier tertinggi OpenAI untuk pembuatan web/app otonom, refactoring fullstack, dan coding loop.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_048_576,
    ratio: 1.8,
    completionRatio: 4.5,
    featured: true
  },

  // ==========================================
  // 2. ANTHROPIC CLAUDE FAMILY (Haiku -> Sonnet 4.6 -> Sonnet 5.5 -> Fable 5.1 -> Opus 5.5)
  // ==========================================
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Claude versi ringan dan gesit. Gaya bahasa sopan khas Claude dengan biaya seperenam Sonnet.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    ratio: 0.25,
    completionRatio: 5
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Versi stabil legendaris pilihan para software engineer. Hemat dan handal untuk sesi ngoding panjang.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 500_000,
    ratio: 0.75,
    completionRatio: 5
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Pilihan utama untuk Claude Code CLI, Cursor, dan Cline: refactor lintas file dan tugas otonom bertahap.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Frontier hybrid reasoning & creative narrative synthesis untuk argumen mendalam dan riset kompleks.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1.4,
    completionRatio: 3.5,
    featured: true
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Kasta tertinggi Anthropic untuk deep reasoning logika murni, arsitektur enterprise, dan pairing coding bebas halusinasi.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 2,
    completionRatio: 5,
    featured: true
  },

  // ==========================================
  // 3. ALIBABA QWEN FAMILY (Flash -> 35B Coder -> 3.7 Max -> Image 2.0 -> Image 2.0 Pro)
  // ==========================================
  {
    id: "qwen3.5-flash",
    name: "Qwen 3.5 Flash",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Model reasoning & chat paling hemat di dunia dari Alibaba Cloud. Konteks 1 juta token, ideal untuk ekstraksi data masif dan bot percakapan.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.015,
    completionRatio: 9.66,
    featured: true
  },
  {
    id: "qwen3.6-35b-a3b",
    name: "Qwen 3.6 35B A3B",
    providerId: "alibaba",
    category: "Ngoding",
    description: "Model coding open-weights super tajam untuk Cursor dan VS Code. Efisiensi tinggi untuk sintaks kode dan bug fixing instan.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 262_144,
    ratio: 0.13,
    completionRatio: 5.92
  },
  {
    id: "qwen3.7-max",
    name: "Qwen 3.7 Max",
    providerId: "alibaba",
    category: "Tugas & Riset",
    description: "Flagship frontier tertinggi keluarga Qwen Alibaba: penalaran dokumen rumit, tugas multialat, dan pemahaman multilingual fasih.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.855,
    completionRatio: 3.00,
    featured: true
  },
  {
    id: "qwen-image-2.0",
    name: "Qwen Image 2.0",
    providerId: "alibaba",
    category: "Gambar",
    description: "Generasi gambar artistik dan ilustrasi kreatif dari teks prompt. Sangat mahir merender tipografi teks rapi di dalam poster promosi.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.03
  },
  {
    id: "qwen-image-2.0-pro",
    name: "Qwen Image 2.0 Pro",
    providerId: "alibaba",
    category: "Gambar",
    description: "Versi Studio HD Pro untuk foto visual produk e-commerce, rendering resolusi tinggi 2K, dan konsistensi wajah subjek.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.07
  },

  // ==========================================
  // 4. MINIMAX FAMILY (M3.1 Flash -> M2.5 -> M2.7 -> M3)
  // ==========================================
  {
    id: "minimax-m3.1-flash",
    name: "MiniMax M3.1 Flash",
    providerId: "minimax",
    category: "Chat Hemat",
    description: "Ringan, responsif, dan ultra-cepat. Sangat cocok untuk chatbot kilat, CS otomatis, dan tanya jawab harian.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.15,
    completionRatio: 4
  },
  {
    id: "minimax-m2.5",
    name: "MiniMax M2.5",
    providerId: "minimax",
    category: "Ngoding",
    description: "Ahli coding dan tool calling berkecepatan tinggi dengan konteks 1 juta token. Kualitas setara model mahal dengan biaya 10x lebih hemat!",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.15,
    completionRatio: 4,
    featured: true
  },
  {
    id: "minimax-m2.7",
    name: "MiniMax M2.7",
    providerId: "minimax",
    category: "Ngoding",
    description: "Model serbaguna MiniMax dengan pemahaman multimodal teks dan gambar. Sangat seimbang untuk coding dan analisis visual.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.15,
    completionRatio: 4
  },
  {
    id: "minimax-m3",
    name: "MiniMax M3",
    providerId: "minimax",
    category: "Tugas & Riset",
    description: "Frontier tertinggi MiniMax: deep reasoning, sintesis dokumen ekstensif, dan pemecahan masalah algoritma rumit.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.3,
    completionRatio: 4
  },

  // ==========================================
  // 5. GOOGLE GEMINI FAMILY (3.8 Flash -> 2.0 Flash -> 3.1 Pro -> 4 Argon)
  // ==========================================
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    providerId: "google",
    category: "Chat Hemat",
    description: "Cepat dan hemat, tetap bisa membaca PDF, gambar, audio, dan video. Andalan untuk Chatbox di smartphone.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    ratio: 0.25,
    completionRatio: 6,
    featured: true
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    providerId: "google",
    category: "Chat Hemat",
    description: "Versi realtime API global Google paling populer. Kecepatan kilat untuk pencarian fakta dan asisten percakapan.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    ratio: 0.05,
    completionRatio: 4
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Baca PDF jurnal ratusan lembar dan video rekaman riset sekaligus. Pilihan nomor 1 untuk merangkum skripsi.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    contextTokens: 1_048_576,
    ratio: 1,
    completionRatio: 6,
    featured: true
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Frontier ultra-long context Google (2M+ token). Spesialis sintesis buku, kompilasi tesis, dan analisis data ilmiah.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    contextTokens: 2_097_152,
    ratio: 1.25,
    completionRatio: 4.0,
    featured: true
  },

  // ==========================================
  // 6. xAI GROK FAMILY (Grok 3 Mini -> Grok 4 Fast -> Grok 4.3 -> Grok 4.5)
  // ==========================================
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    providerId: "xai",
    category: "Chat Hemat",
    description: "Model penalaran ringkas dari xAI Elon Musk. Jawaban tajam, objektif, dan biaya token output yang super murah.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.15,
    completionRatio: 1.67,
    featured: true
  },
  {
    id: "grok-4-fast-reasoning",
    name: "Grok 4 Fast Reasoning",
    providerId: "xai",
    category: "Ngoding",
    description: "Logika penalaran komputasi tinggi berkecepatan kilat. Efektif untuk review logika kode dan perancangan algoritma.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.1,
    completionRatio: 2.5
  },
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Tanya jawab multimodal teks dan gambar dengan harga output rendah di kelasnya.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.625,
    completionRatio: 2
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Frontier tertinggi xAI: penalaran mendalam tanpa sensor berlebihan, wawasan terkini, dan analisis data kompleks.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
    completionRatio: 3
  },

  // ==========================================
  // 7. MOONSHOT KIMI FAMILY (K2.7 Code -> K3 -> K3.1 Pro)
  // ==========================================
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    providerId: "moonshot",
    category: "Ngoding",
    description: "Model khusus rekayasa perangkat lunak dari Moonshot. Harga sepertiga Claude Sonnet dengan akurasi bug fixing tinggi.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.465,
    completionRatio: 4.15,
    featured: true
  },
  {
    id: "kimi-k3",
    name: "Kimi K3",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Pionir konteks jutaan token tanpa kehilangan detail. Mampu membaca buku tebal, ratusan halaman skripsi, dan video.",
    inputs: ["teks", "gambar", "video"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.43,
    completionRatio: 5
  },
  {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Versi Pro berkecepatan tinggi dengan kemampuan matematika dan logika penalaran terstruktur tingkat lanjut.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
    completionRatio: 5
  },

  // ==========================================
  // 8. DEEPSEEK FAMILY (V4 Flash -> V4 Pro)
  // ==========================================
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    providerId: "deepseek",
    category: "Chat Hemat",
    description: "Teman ngobrol dan terjemah jurnal sehari-hari. Ribuan jawaban per sepuluh ribu rupiah.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.22,
    completionRatio: 3.02,
    featured: true
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Mode berpikir (reasoning) dan non-berpikir, konteks 1 juta token. Sangat tangguh untuk coding dan matematika murni.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.665,
    completionRatio: 3.01,
    featured: true
  },

  // ==========================================
  // 9. BYTEDANCE FAMILY (Seed 1.6 Flash -> Seed 2.0 Lite -> Seedream 4.5)
  // ==========================================
  {
    id: "seed-1.6-flash",
    name: "Seed 1.6 Flash",
    providerId: "bytedance",
    category: "Chat Hemat",
    description: "Chat harian responsif dari ekosistem Doubao ByteDance dengan tarif super murah. Cocok untuk bot percakapan, FAQ, dan ringkasan kilat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 262_144,
    ratio: 0.041,
    completionRatio: 4,
    featured: true
  },
  {
    id: "seed-2.0-lite",
    name: "Seed 2.0 Lite",
    providerId: "bytedance",
    category: "Chat Hemat",
    description: "Model multimodal ringan ByteDance dengan pemrosesan teks, gambar, dan video ringkas. Analisis frame visual dan transkrip konten secara instan.",
    inputs: ["teks", "gambar", "video"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 524_288,
    ratio: 0.1375,
    completionRatio: 8
  },
  {
    id: "seedream-4.5",
    name: "Seed Dream 4.5",
    providerId: "bytedance",
    category: "Gambar",
    description: "Generate gambar artistik dan fotorealistis dari teks deskriptif oleh ByteDance Seed. Resolusi tajam, pencahayaan sinematik, dan komposisi visual modern.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.044,
    featured: true
  },

  // ==========================================
  // 10. ZHIPU GLM FAMILY (GLM 5.3 Flash -> GLM 5.3)
  // ==========================================
  {
    id: "glm-5.3-flash",
    name: "GLM 5.3 Flash",
    providerId: "zhipu",
    category: "Chat Hemat",
    description: "Versi ringan GLM yang bisa membaca tangkapan layar. Cocok untuk tanya cepat tugas kuliah dan PR.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.0375,
    completionRatio: 3.33
  },
  {
    id: "glm-5.3",
    name: "GLM 5.3",
    providerId: "zhipu",
    category: "Ngoding",
    description: "Kuat dalam pemahaman kode lintas file dan tugas panjang yang harus menjaga instruksi awal.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.7,
    completionRatio: 3.14
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

// Paket Retail Khusus Mahasiswa & Retail (Top-up Nominal Ramah Uang Saku)
export const retailPackages: RetailPackage[] = [
  {
    id: "pkt-mhs-uji",
    name: "Paket Coba-Coba",
    subtitle: "Uang saku ramah kantong",
    targetUser: "Pemula",
    priceIdr: 15000,
    estToken: answersFor("deepseek-v4-flash", 15000, "DeepSeek"),
    description: "Cukup untuk ratusan pertanyaan tugas, terjemahan jurnal bahasa Inggris, dan chat harian di HP.",
    popularFor: ["Tugas Kuliah", "Chatbox di HP", "Terjemah Jurnal"],
    recommendedModel: "DeepSeek V4 Flash / Gemini 3.8 Flash",
    badge: "Termurah"
  },
  {
    id: "pkt-mhs-starter",
    name: "Paket Starter Kuliah",
    subtitle: "Pilihan paling hemat bulanan",
    targetUser: "Mahasiswa",
    priceIdr: 29000,
    estToken: answersFor("gemini-3.8-flash", 29000, "Gemini"),
    description: "Saldo fleksibel untuk tanya jawab intensif, bedah tugas presentasi, dan ringkas materi PDF perkuliahan.",
    popularFor: ["Review Jurnal PDF", "Bantuan Resume", "Chatbot Harian"],
    recommendedModel: "Gemini 3.8 Flash / Kimi K2.7 Code",
    badge: "Favorit",
    featured: true
  },
  {
    id: "pkt-skripsi-koding",
    name: "Paket Skripsi & Koding",
    subtitle: "Kekuatan ganda riset & debug",
    targetUser: "Skripsi",
    priceIdr: 69000,
    estToken: answersFor("claude-sonnet-5-5", 69000, "Claude"),
    description: "Rangkum puluhan jurnal dengan Gemini 3.1 Pro, lalu kerjakan kode praktikum dengan Claude Sonnet.",
    popularFor: ["Skripsi Bab 1-5", "Debug Error Coding", "Cursor & VS Code"],
    recommendedModel: "Claude Sonnet 5.5 / Gemini 3.1 Pro / Kimi K2.7 Code",
    badge: "Best Value"
  },
  {
    id: "pkt-pro-builder",
    name: "Paket Pro Builder",
    subtitle: "Spesialis Claude Code & Cursor",
    targetUser: "Developer",
    priceIdr: 149000,
    estToken: answersFor("claude-sonnet-5-5", 149000, "Claude"),
    description: "Saldo besar untuk pairing coding di terminal Claude Code tanpa kartu kredit dan tanpa langganan bulanan.",
    popularFor: ["Claude Code CLI", "Alternatif Cursor Pro", "Sprint Proyek Klien"],
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
  }
];

export const providerById = (id: string) => providers.find((provider) => provider.id === id) as Provider;

