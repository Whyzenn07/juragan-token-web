export * from "@/types";
import type { Category, Provider, ModelItem, RetailPackage, PaymentMethod } from "@/types";

/** Gateway produksi. Domain api.juragantoken.co.id belum punya DNS, jadi semua panduan memakai host ini. */
export const GATEWAY_ORIGIN = "https://www.juragantoken.co.id";
export const GATEWAY_BASE_URL = `${GATEWAY_ORIGIN}/v1`;
export const PRICING_SNAPSHOT_DATE = "27 Okt 2026";

/** Kurs contoh (lihat DESIGN.md). */
export const USD_RATE = 16_250;
/** Pengali harga jual ritel terhadap harga gateway. 1 = dijual sama dengan harga gateway. Diatur pemilik. */
export const RETAIL_MARKUP = 1;

/** Asumsi satu "jawaban": pertanyaan beserta konteks ~1.500 token, jawaban ~800 token. */
export const ANSWER_INPUT_TOKENS = 1_500;
export const ANSWER_OUTPUT_TOKENS = 800;
export const BUDGET_SAMPLE_IDR = 10_000;

export const categories: Category[] = ["Semua", "Ngoding", "Tugas & Riset", "Chat Hemat", "Gambar"];

export const providers: Provider[] = [
  { id: "anthropic", name: "Claude", company: "Anthropic", hasLogo: false },
  { id: "openai", name: "GPT", company: "OpenAI", hasLogo: false },
  { id: "google", name: "Gemini", company: "Google", hasLogo: false },
  { id: "deepseek", name: "DeepSeek", company: "DeepSeek", hasLogo: false },
  { id: "alibaba", name: "Qwen", company: "Alibaba Cloud", hasLogo: false },
  { id: "moonshot", name: "Kimi", company: "Moonshot AI", hasLogo: false },
  { id: "zhipu", name: "GLM", company: "Z.ai", hasLogo: false },
  { id: "xai", name: "Grok", company: "xAI", hasLogo: false },
  { id: "fable", name: "Claude Fable", company: "Anthropic", hasLogo: false }
];

export const modelsCatalog: ModelItem[] = [
  // Ngoding & Frontier Development
  {
    id: "chatgpt-6-astra",
    name: "Chat GPT 6 Astra",
    providerId: "openai",
    category: "Ngoding",
    description: "Frontier tertinggi OpenAI untuk pembuatan web/app otonom, refactoring fullstack, arsitektur microservices, dan coding loop.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_048_576,
    ratio: 1.8,
    completionRatio: 4.5,
    featured: true
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Kasta tertinggi Anthropic untuk deep reasoning logika murni, perancangan arsitektur enterprise, pembuktian matematis, dan pairing coding bebas halusinasi.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 2,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Pilihan utama untuk Claude Code dan Cursor: review kode, refactor lintas file, dan tugas bertahap.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1,
    completionRatio: 5,
    featured: true
  },
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    providerId: "moonshot",
    category: "Ngoding",
    description: "Model khusus rekayasa perangkat lunak dari Moonshot. Harga sepertiga Claude Sonnet.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.465,
    completionRatio: 4.150537634409,
    featured: true
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    providerId: "openai",
    category: "Ngoding",
    description: "Untuk coding kompleks: merencanakan perubahan, membaca hasil tool, dan tugas multi-langkah.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
    completionRatio: 5
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Mode berpikir dan non-berpikir, konteks 1 juta token. Hanya menerima teks.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.665,
    completionRatio: 3.007518796992481
  },
  {
    id: "glm-5.3",
    name: "GLM-5.3",
    providerId: "zhipu",
    category: "Ngoding",
    description: "Kuat di pemahaman kode lintas file dan tugas panjang yang harus menjaga instruksi awal.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.7,
    completionRatio: 3.142857142857143
  },

  // Tugas & Riset
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Frontier research & ultra-long context Google (2M+ token). Spesialis sintesis jurnal multi-buku, audio kuliah, video rekaman riset, dan analisis data ilmiah.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    contextTokens: 2_097_152,
    ratio: 1.25,
    completionRatio: 4.0,
    featured: true
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Frontier hybrid reasoning & creative narrative synthesis generasi Claude dari Anthropic. Mampu menyusun argumen mendalam, arsitektur teknis, dan sintesis dokumen riset kompleks.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1.4,
    completionRatio: 3.5,
    featured: true
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Baca PDF jurnal, rekaman kuliah, dan video sekaligus. Cocok untuk merangkum referensi skripsi.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    contextTokens: 1_048_576,
    ratio: 1,
    completionRatio: 6,
    featured: true
  },
  {
    id: "kimi-k3",
    name: "Kimi K3",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Memahami teks, tangkapan layar, dan video. Bagus untuk sintesis dokumen panjang.",
    inputs: ["teks", "gambar", "video"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.43,
    completionRatio: 4.996503496503
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Seimbang antara kemampuan dan biaya. Untuk ringkasan terstruktur dan bantuan tugas harian.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
    completionRatio: 6
  },
  {
    id: "qwen3.7-max",
    name: "Qwen3.7 Max",
    providerId: "alibaba",
    category: "Tugas & Riset",
    description: "Penalaran dokumen dan tugas yang butuh tool. Versi teratas keluarga Qwen3.7.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.855,
    completionRatio: 3.005847953216
  },
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Tanya jawab teks dan gambar dengan harga output yang rendah untuk kelasnya.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.625,
    completionRatio: 2
  },

  // Chat Hemat
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    providerId: "google",
    category: "Chat Hemat",
    description: "Cepat dan murah, tetap bisa membaca PDF, gambar, audio, dan video. Andalan untuk Chatbox di HP.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["gemini", "openai", "anthropic"],
    ratio: 0.25,
    completionRatio: 6,
    featured: true
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    providerId: "deepseek",
    category: "Chat Hemat",
    description: "Teman ngobrol dan terjemah jurnal sehari-hari. Ratusan jawaban per sepuluh ribu rupiah.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.22,
    completionRatio: 3.022727272727273,
    featured: true
  },
  {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    providerId: "openai",
    category: "Chat Hemat",
    description: "Model OpenAI paling irit untuk tugas pendek: klasifikasi, ekstraksi, dan pertanyaan singkat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.05,
    completionRatio: 5,
    featured: true
  },
  {
    id: "glm-5.3-flash",
    name: "GLM-5.3 Flash",
    providerId: "zhipu",
    category: "Chat Hemat",
    description: "Versi ringan GLM yang bisa membaca tangkapan layar. Cocok untuk tanya cepat soal tugas.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.0375,
    completionRatio: 3.3333333333333335
  },
  {
    id: "qwen3.5-flash",
    name: "Qwen3.5 Flash",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Termurah di katalog. Untuk ringkasan, ekstraksi data, dan chat ringan dalam jumlah banyak.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.0141,
    completionRatio: 10
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Claude versi ringan. Gaya bahasa Claude dengan biaya seperenam Sonnet.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    ratio: 0.5,
    completionRatio: 5
  },

  // Gambar
  {
    id: "qwen-image-2.0",
    name: "Qwen Image 2.0",
    providerId: "alibaba",
    category: "Gambar",
    description: "Buat dan edit gambar, termasuk poster dan desain yang memuat tulisan.",
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
    description: "Versi Pro untuk visual produk dan edit yang harus menjaga subjek tetap sama.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.07
  }
];

// Turunan harga. Semua angka dihitung dari rasio gateway agar tidak ada harga yang diketik manual.

export const inputIdrPer1M = (m: ModelItem) => m.ratio * 2 * USD_RATE * RETAIL_MARKUP;
export const outputIdrPer1M = (m: ModelItem) => inputIdrPer1M(m) * m.completionRatio;
export const perImageIdr = (m: ModelItem) => (m.perImageUsd ?? 0) * USD_RATE * RETAIL_MARKUP;
export const isPerImage = (m: ModelItem) => m.perImageUsd !== undefined;

/** Biaya satu jawaban (atau satu gambar) dalam rupiah. */
export const unitCostIdr = (m: ModelItem) =>
  isPerImage(m)
    ? perImageIdr(m)
    : (ANSWER_INPUT_TOKENS * inputIdrPer1M(m) + ANSWER_OUTPUT_TOKENS * outputIdrPer1M(m)) / 1_000_000;

/** Berapa jawaban (atau gambar) yang didapat dari sejumlah rupiah. */
export const unitsForBudget = (m: ModelItem, budgetIdr = BUDGET_SAMPLE_IDR) =>
  Math.floor(budgetIdr / unitCostIdr(m));

export type Tier = "Hemat" | "Seimbang" | "Premium";

export const tierOf = (m: ModelItem): Tier => {
  if (isPerImage(m)) return "Seimbang";
  const units = unitsForBudget(m);
  if (units >= 300) return "Hemat";
  if (units >= 60) return "Seimbang";
  return "Premium";
};

/** Posisi 0..1 pada skala log 20..3.000 jawaban, untuk meter "seberapa jauh sepuluh ribu rupiah". Dibulatkan 3 desimal untuk mencegah selisih presisi float saat hidrasi SSR/klien. */
export const reachScore = (m: ModelItem): number => {
  const units = Math.max(1, unitsForBudget(m));
  const min = Math.log(20);
  const max = Math.log(3_000);
  const score = Math.min(1, Math.max(0, (Math.log(units) - min) / (max - min)));
  return Math.round(score * 1000) / 1000;
};

/** Aplikasi yang bisa langsung dipakai, diturunkan dari format endpoint gateway. */
export const compatibleApps = (m: ModelItem): string[] => {
  if (m.endpoints.includes("image")) return ["API gambar", "Python"];
  const apps: string[] = [];
  if (m.endpoints.includes("anthropic")) apps.push("Claude Code");
  if (m.endpoints.includes("openai")) apps.push("Cursor", "Chatbox");
  return apps;
};

const modelById = (id: string) => modelsCatalog.find((m) => m.id === id) as ModelItem;
const answersFor = (id: string, budget: number) =>
  `≈ ${new Intl.NumberFormat("id-ID").format(unitsForBudget(modelById(id), budget))} jawaban ${modelById(id).name}`;

// Paket Retail Khusus Mahasiswa & Retail (Top-up Nominal Ramah Uang Saku)
export const retailPackages: RetailPackage[] = [
  {
    id: "pkt-mhs-uji",
    name: "Paket Coba-Coba",
    subtitle: "Uang saku ramah kantong",
    targetUser: "Mahasiswa / Pemula yang baru mau coba API",
    priceIdr: 15000,
    estToken: answersFor("deepseek-v4-flash", 15000),
    description: "Cukup untuk ratusan pertanyaan tugas, terjemahan jurnal bahasa Inggris, dan chat harian di HP.",
    popularFor: ["Tugas Kuliah", "Chatbox di HP", "Terjemah Jurnal"],
    recommendedModel: "DeepSeek V4 Flash / Gemini 3.8 Flash",
    badge: "Termurah"
  },
  {
    id: "pkt-mhs-starter",
    name: "Paket Starter Kuliah",
    subtitle: "Pilihan paling hemat bulanan",
    targetUser: "Mahasiswa aktif untuk tugas & riset mingguan",
    priceIdr: 29000,
    estToken: answersFor("gemini-3.8-flash", 29000),
    description: "Saldo fleksibel untuk tanya jawab intensif, bedah tugas presentasi, dan ringkas materi PDF perkuliahan.",
    popularFor: ["Review Jurnal PDF", "Bantuan Resume", "Chatbot Harian"],
    recommendedModel: "Gemini 3.8 Flash / Kimi K2.7 Code",
    badge: "Favorit Mahasiswa",
    featured: true
  },
  {
    id: "pkt-skripsi-koding",
    name: "Paket Skripsi & Koding",
    subtitle: "Kekuatan ganda riset & debug",
    targetUser: "Mahasiswa tingkat akhir & developer pemula",
    priceIdr: 69000,
    estToken: answersFor("claude-sonnet-5-5", 69000),
    description: "Rangkum puluhan jurnal dengan Gemini 3.1 Pro, lalu kerjakan kode praktikum dengan Claude Sonnet atau Kimi Code.",
    popularFor: ["Skripsi Bab 1-5", "Debug Error Coding", "Cursor & VS Code"],
    recommendedModel: "Claude Sonnet 5.5 / Gemini 3.1 Pro / Kimi K2.7 Code",
    badge: "Paling Bernilai"
  },
  {
    id: "pkt-pro-builder",
    name: "Paket Pro Builder",
    subtitle: "Spesialis Claude Code & Cursor",
    targetUser: "Freelancer, developer solo, & tech builder",
    priceIdr: 149000,
    estToken: answersFor("claude-sonnet-5-5", 149000),
    description: "Saldo besar untuk pairing coding di terminal Claude Code tanpa kartu kredit dan tanpa langganan bulanan.",
    popularFor: ["Claude Code CLI", "Alternatif Cursor Pro", "Sprint Proyek Klien"],
    recommendedModel: "Claude Sonnet 5.5 / Claude Opus 5.5 / GPT-6 Sol",
    badge: "Power User"
  }
];

export const paymentMethods = [
  { id: "qris", name: "QRIS SingaPay (Instan)", fee: "Gratis Biaya Admin", feeAmount: 0, provider: "BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana", speed: "1 Detik Verifikasi" },
  { id: "va-bca", name: "BCA Virtual Account", fee: "Rp 1.000", feeAmount: 1000, provider: "BCA Mobile / myBCA / KlikBCA", speed: "Otomatis Real-time" },
  { id: "va-mandiri", name: "Mandiri Virtual Account", fee: "Rp 1.000", feeAmount: 1000, provider: "Livin by Mandiri", speed: "Otomatis Real-time" },
  { id: "va-bri", name: "BRI Virtual Account (BRIVA)", fee: "Rp 1.000", feeAmount: 1000, provider: "BRImo / ATM BRI", speed: "Otomatis Real-time" },
  { id: "ewallet", name: "e-Wallet (Dana / GoPay / ShopeePay)", fee: "Bebas Biaya", feeAmount: 0, provider: "Scan atau Notifikasi Aplikasi", speed: "Instan" }
];

export const providerById = (id: string) => providers.find((provider) => provider.id === id) as Provider;
