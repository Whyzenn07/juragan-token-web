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
  // 1. OPENAI FAMILY (9 Models - 3x3 Grid)
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
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    providerId: "openai",
    category: "Chat Hemat",
    description: "Generasi baru efisiensi OpenAI untuk respons kilat, chatbot interaktif, dan parsing payload data terstruktur.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.125,
    completionRatio: 8,
    featured: true
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    providerId: "openai",
    category: "Chat Hemat",
    description: "Multimodal ultra-cepat dan hemat biaya dari OpenAI untuk percakapan harian, customer bot, dan terjemahan kilat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.075,
    completionRatio: 4,
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
    id: "gpt-4o",
    name: "GPT-4o Omni",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Flagship multimodal frontier OpenAI untuk analisis dokumen PDF tebal, visi gambar, dan sintesis riset komprehensif.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 128_000,
    ratio: 1.25,
    completionRatio: 4,
    featured: true
  },
  {
    id: "gpt-6-sol",
    name: "GPT-6 Sol",
    providerId: "openai",
    category: "Tugas & Riset",
    description: "Model penalaran profesional OpenAI untuk analitika riset multi-langkah dan sintesis komputasi mendalam.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1.0,
    completionRatio: 5,
    featured: true
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    providerId: "openai",
    category: "Ngoding",
    description: "Model penalaran sains, matematika, dan koding presisi tinggi dengan chain-of-thought fleksibel untuk bug fixing mendalam.",
    inputs: ["teks"],
    endpoints: ["openai"],
    contextTokens: 200_000,
    ratio: 0.55,
    completionRatio: 4,
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
    ratio: 5.0,
    completionRatio: 5,
    featured: true
  },
  {
    id: "dall-e-3",
    name: "DALL·E 3 HD",
    providerId: "openai",
    category: "Gambar",
    description: "Generator visual fotorealistik dan ilustrasi artistik presisi tinggi dari prompt bahasa alami Indonesia maupun Inggris.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.04,
    featured: true
  },

  // ==========================================
  // 2. ANTHROPIC CLAUDE FAMILY (9 Models - 3x3 Grid)
  // ==========================================
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Claude generasi terbaru paling ringan dan ekonomis. Kecepatan streaming instan untuk chat harian dan klasifikasi teks.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    ratio: 0.05,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Claude versi ringan dan gesit. Gaya bahasa sopan khas Claude dengan biaya seperenam Sonnet.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    ratio: 0.5,
    completionRatio: 5
  },
  {
    id: "claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Model ringan ultra-cepat untuk customer service, ekstraksi data, dan parsing dokumen singkat.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 0.5,
    completionRatio: 5
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Pilihan favorit developer untuk Claude Code CLI, Cursor, dan refactoring source code skala besar.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    ratio: 1.5,
    completionRatio: 5
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Model reasoning koding generasi 5 Anthropic untuk penulisan arsitektur backend, refactoring, dan automated unit tests.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    ratio: 1.0,
    completionRatio: 5
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
    ratio: 1.0,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Model flagship kelas berat Anthropic untuk analisis riset akademik mendalam dan penyusunan naskah komprehensif.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    ratio: 2.5,
    completionRatio: 5
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Penalaran filosofis dan analitis tingkat tinggi untuk bedah teori, riset multidisiplin, dan sintesis ilmiah.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    ratio: 2.5,
    completionRatio: 5
  },
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Puncak kecerdasan Anthropic. Penalaran filosofis, bedah jurnal puluhan halaman, dan argumen skripsi paling berbobot.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 2.0,
    completionRatio: 5,
    featured: true
  },

  // ==========================================
  // 3. ALIBABA CLOUD / QWEN (6 Models - 2x3 Grid)
  // ==========================================
  {
    id: "qwen3.5-flash",
    name: "Qwen 3.5 Flash",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Paling ekonomis di seluruh katalog. Cocok untuk bot WhatsApp, auto-reply, dan tanya jawab cepat tanpa boros saldo.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.0141,
    completionRatio: 10,
    featured: true
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
    id: "qwen3.6-35b-a3b",
    name: "Qwen 3.6 35B A3B",
    providerId: "alibaba",
    category: "Ngoding",
    description: "Arsitektur MoE hemat sumber daya dengan kemampuan coding mendekati model 70B.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.13,
    completionRatio: 5.92
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

  // ==========================================
  // 4. MINIMAX FAMILY (6 Models - 2x3 Grid)
  // ==========================================
  {
    id: "minimax-chat-turbo",
    name: "MiniMax Chat Turbo",
    providerId: "minimax",
    category: "Chat Hemat",
    description: "Respon secepat kilat untuk asisten pribadi, brainstorming ide konten, dan pembuatan draf artikel blog.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.08,
    completionRatio: 4
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
    id: "minimax-m2.5-pro",
    name: "MiniMax M2.5 Pro",
    providerId: "minimax",
    category: "Tugas & Riset",
    description: "Versi pro berkecepatan tinggi untuk analisis dokumen panjang, riset komparasi produk, dan pembuatan laporan formal.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.35,
    completionRatio: 5,
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

  // ==========================================
  // 5. GOOGLE GEMINI FAMILY (6 Models - 2x3 Grid)
  // ==========================================
  {
    id: "gemini-flash-lite-latest",
    name: "Gemini Flash Lite",
    providerId: "google",
    category: "Chat Hemat",
    description: "Varian Google paling efisien untuk ekstraksi teks, klasifikasi cepat, dan bot tanya jawab berkecepatan tinggi.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai"],
    ratio: 0.05,
    completionRatio: 4
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
    ratio: 0.75,
    completionRatio: 4.67
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    providerId: "google",
    category: "Ngoding",
    description: "Eksperimen frontier terbaru Google DeepMind untuk reasoning tingkat tinggi dan pemecahan algoritma rumit.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["openai"],
    ratio: 1.0,
    completionRatio: 5,
    featured: true
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

  // ==========================================
  // 6. XAI / GROK FAMILY (6 Models - 2x3 Grid)
  // ==========================================
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
    id: "grok-4-fast-reasoning",
    name: "Grok 4 Fast",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Penalaran analitis cepat xAI untuk verifikasi data, pencarian logika kritis, dan sintesis ringkasan instan.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.1,
    completionRatio: 2.5
  },
  {
    id: "grok-3-fast-beta",
    name: "Grok 3 Fast Beta",
    providerId: "xai",
    category: "Ngoding",
    description: "Versi beta bertenaga xAI untuk sprint coding cepat, generate boilerplate, dan eksekusi instruksi technical.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 2.75,
    completionRatio: 5
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
    id: "grok-3",
    name: "Grok 3",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Flagship xAI dengan pemahaman sains mendalam, wawasan terkini, dan analisis tanpa sensor berlebih.",
    inputs: ["teks"],
    endpoints: ["openai"],
    contextTokens: 131_072,
    ratio: 1.5,
    completionRatio: 5,
    featured: true
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

  // ==========================================
  // 7. MOONSHOT AI / KIMI (6 Models - 2x3 Grid)
  // ==========================================
  {
    id: "kimi-chat-instant",
    name: "Kimi Chat Instant",
    providerId: "moonshot",
    category: "Chat Hemat",
    description: "Sangat responsif untuk tanya jawab santai, revisi tata bahasa skripsi, dan obrolan ide harian.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.465,
    completionRatio: 4.15
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
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    providerId: "moonshot",
    category: "Ngoding",
    description: "Model spesialis koding Moonshot AI. Handal menyelesaikan tugas coding web, script Python, dan algoritma praktikum.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.465,
    completionRatio: 4.15,
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
    ratio: 37.5,
    completionRatio: 1
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
    id: "kimi-k3.1-pro-highspeed",
    name: "Kimi K3.1 Pro Turbo",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Akselerasi inference tinggi untuk penelusuran jurnal ilmiah, sintesis data, dan pembuatan makalah riset kilat.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 37.5,
    completionRatio: 1
  },

  // ==========================================
  // 8. DEEPSEEK FAMILY (6 Models - 2x3 Grid)
  // ==========================================
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
    id: "deepseek-coder-v2.5",
    name: "DeepSeek Coder V2.5",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Model koding terfavorit mahasiswa informatika. Menguasai 300+ bahasa pemrograman dengan biaya per prompt sangat murah.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.14,
    completionRatio: 4,
    featured: true
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
    id: "deepseek-r1-distill",
    name: "DeepSeek R1 Distill",
    providerId: "deepseek",
    category: "Tugas & Riset",
    description: "Versi penalaran ringkas R1 yang sangat efisien untuk olah data tugas kuliah, sitasi jurnal, dan bedah metodologi skripsi.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.14,
    completionRatio: 4
  },

  // ==========================================
  // 9. BYTEDANCE / SEED FAMILY (6 Models - 2x3 Grid)
  // ==========================================
  {
    id: "seed-1.6-flash",
    name: "Seed 1.6 Flash",
    providerId: "bytedance",
    category: "Chat Hemat",
    description: "Model ultra-cepat ByteDance untuk percakapan sosial, rekomendasi konten, dan interaksi interaktif harian.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 37.5,
    completionRatio: 1
  },
  {
    id: "seed-2.0-lite",
    name: "Seed 2.0 Lite",
    providerId: "bytedance",
    category: "Chat Hemat",
    description: "Generasi 2.0 yang sangat efisien dari ByteDance. Kecepatan streaming tinggi dengan konsumsi token irit.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 37.5,
    completionRatio: 1,
    featured: true
  },
  {
    id: "seed-2.0-pro",
    name: "Seed 2.0 Pro",
    providerId: "bytedance",
    category: "Ngoding",
    description: "Model engineering ByteDance dengan pengoptimalan logika koding, refactoring skrip, dan penulisan algoritma.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 37.5,
    completionRatio: 1,
    featured: true
  },
  {
    id: "seed-2.0-mini",
    name: "Seed 2.0 Mini Code",
    providerId: "bytedance",
    category: "Ngoding",
    description: "Model koding ringan ByteDance untuk autocompletion di IDE, penulisan fungsi kecil, dan unit testing cepat.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 37.5,
    completionRatio: 1
  },
  {
    id: "seed-1.8",
    name: "Seed 1.8 Research",
    providerId: "bytedance",
    category: "Tugas & Riset",
    description: "Spesialis analisis tren, ekstraksi data riset, dan pengolahan dokumen komprehensif dari ByteDance AI Lab.",
    inputs: ["teks"],
    endpoints: ["openai"],
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

  // ==========================================
  // 10. Z.AI / ZHIPU GLM FAMILY (6 Models - 2x3 Grid)
  // ==========================================
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
    id: "glm-5",
    name: "GLM 5 Air",
    providerId: "zhipu",
    category: "Chat Hemat",
    description: "Model serbaguna Z.AI untuk percakapan natural, terjemahan bilingual Indonesia-Inggris, dan tanya jawab tugas.",
    inputs: ["teks"],
    endpoints: ["openai"],
    ratio: 0.44,
    completionRatio: 3.2
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

