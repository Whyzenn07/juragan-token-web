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
  // 1. OPENAI FAMILY (Luna, Terra, Sol, Astra, Mini, Omni, o3-mini, DALL-E)
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
    ratio: 0.5,
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
    category: "Ngoding",
    description: "Spesialis coding kompleks: merencanakan arsitektur, membaca hasil tool, dan tugas multi-langkah.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 1,
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
    ratio: 1.8,
    completionRatio: 4.5,
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
  // 2. ANTHROPIC CLAUDE FAMILY (Haiku, 3.5 Haiku, Sonnet, 3.7 Hybrid, Opus)
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
    id: "claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    providerId: "anthropic",
    category: "Chat Hemat",
    description: "Respon super kilat dengan latensi ultra-rendah untuk chat harian dan ekstraksi informasi cepat dengan tata bahasa elegan.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 0.4,
    completionRatio: 5,
    featured: true
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
    ratio: 0.8,
    completionRatio: 3.75
  },
  {
    id: "claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    providerId: "anthropic",
    category: "Tugas & Riset",
    description: "Standar emas industri untuk analisis teks akademis panjang, penulisan esai, dan penyusunan argumen kritis bebas halusinasi.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 200_000,
    ratio: 1.5,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Raja coding modern di Claude Code dan Cursor. Penalaran tajam, sintaks bersih, dan eksekusi instruksi presisi.",
    inputs: ["teks", "gambar", "PDF"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet Hybrid",
    providerId: "anthropic",
    category: "Ngoding",
    description: "Model hybrid reasoning pertama Anthropic dengan dynamic thinking budget untuk arsitektur software dan full-stack refactoring.",
    inputs: ["teks", "gambar"],
    endpoints: ["anthropic", "openai"],
    contextTokens: 1_000_000,
    ratio: 1.5,
    completionRatio: 5,
    featured: true
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
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
  // 3. ALIBABA QWEN FAMILY (Flash, Coder Turbo, 35B, 72B, 3.7 Max, Image)
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
    id: "qwen-2.5-coder-turbo",
    name: "Qwen 2.5 Coder Turbo",
    providerId: "alibaba",
    category: "Chat Hemat",
    description: "Model koding dan chat super hemat dari Alibaba Cloud. Ringan, cepat, dan handal untuk tanya-jawab koding instan.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.02,
    completionRatio: 5
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
    id: "qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B Instruct",
    providerId: "alibaba",
    category: "Tugas & Riset",
    description: "Model open-weights terkuat Alibaba dengan akurasi benchmark setara GPT-4o untuk matematika, sains, dan karya tulis ilmiah.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 131_072,
    ratio: 0.4,
    completionRatio: 4,
    featured: true
  },
  {
    id: "qwen3.7-max",
    name: "Qwen 3.7 Max",
    providerId: "alibaba",
    category: "Tugas & Riset",
    description: "Flagship tercanggih Alibaba Cloud. Kapabilitas setara Claude 3.5 Sonnet dengan tarif sepertiga lebih terjangkau.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.8,
    completionRatio: 4.5,
    featured: true
  },
  {
    id: "qwen-image-2.0",
    name: "Qwen Image 2.0",
    providerId: "alibaba",
    category: "Gambar",
    description: "Model generate gambar photorealistic generasi terbaru dari Alibaba. Detail tekstur wajah dan objek sangat natural.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.038,
    featured: true
  },
  {
    id: "qwen-image-2.0-pro",
    name: "Qwen Image 2.0 Pro",
    providerId: "alibaba",
    category: "Gambar",
    description: "Kasta tertinggi render gambar AI Alibaba dengan resolusi ultra tajam dan pemahaman tata letak teks dalam gambar yang akurat.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.055
  },

  // ==========================================
  // 4. MINIMAX FAMILY (M2.5, M2.5 Pro, M2.7, M2.7 Pro, Turbo, Art)
  // ==========================================
  {
    id: "minimax-chat-turbo",
    name: "MiniMax Chat Turbo",
    providerId: "minimax",
    category: "Chat Hemat",
    description: "Output kilat hingga 100 token/detik dengan gaya percakapan alami khas MiniMax untuk asisten virtual interaktif.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.05,
    completionRatio: 4
  },
  {
    id: "minimax-m2.5",
    name: "MiniMax M2.5",
    providerId: "minimax",
    category: "Chat Hemat",
    description: "Asisten cerdas serba bisa dengan kemampuan bahasa Indonesia yang sangat natural dan ekspresif.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.08,
    completionRatio: 4.8
  },
  {
    id: "minimax-m2.5-pro",
    name: "MiniMax M2.5 Pro",
    providerId: "minimax",
    category: "Tugas & Riset",
    description: "Versi Pro berkecepatan tinggi dengan pemahaman konteks panjang untuk analisis dokumen rapat dan riset skripsi.",
    inputs: ["teks", "PDF"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.15,
    completionRatio: 5.33
  },
  {
    id: "minimax-m2.7",
    name: "MiniMax M2.7",
    providerId: "minimax",
    category: "Ngoding",
    description: "Generasi terbaru dengan peningkatan dramatis pada pemecahan soal logika koding dan matematika.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.25,
    completionRatio: 4.8
  },
  {
    id: "minimax-m2.7-pro",
    name: "MiniMax M2.7 Pro",
    providerId: "minimax",
    category: "Ngoding",
    description: "Model flagship MiniMax untuk perancangan arsitektur software dan penulisan karya ilmiah bertingkat.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.5,
    completionRatio: 4.4,
    featured: true
  },
  {
    id: "minimax-image-art",
    name: "MiniMax Image Art",
    providerId: "minimax",
    category: "Gambar",
    description: "Sintesis gambar dan visual ilustrasi gaya digital art kontemporer dengan akurasi pencahayaan dan tekstur detail.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.035
  },

  // ==========================================
  // 5. GOOGLE GEMINI FAMILY (Flash, Thinking, Coder, Pro, Argon, Imagen 3)
  // ==========================================
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    providerId: "google",
    category: "Chat Hemat",
    description: "Model ultra-cepat Google dengan efisiensi biaya tertinggi. Konteks 1 juta token, cocok untuk asisten harian dan bot obrolan.",
    inputs: ["teks", "gambar", "audio", "video"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.045,
    completionRatio: 5.33,
    featured: true
  },
  {
    id: "gemini-flash-thinking",
    name: "Gemini Flash Thinking",
    providerId: "google",
    category: "Chat Hemat",
    description: "Model reasoning berkecepatan kilat dari Google dengan output proses berpikir transparan. Hebat untuk soal logika bertahap.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.075,
    completionRatio: 4
  },
  {
    id: "gemini-2.5-flash-code",
    name: "Gemini 2.5 Flash Coder",
    providerId: "google",
    category: "Ngoding",
    description: "Optimasi koding berkecepatan tinggi dengan konteks 1 juta token, sempurna untuk parsing repository utuh di Cursor dan Cline.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 1_000_000,
    ratio: 0.075,
    completionRatio: 4,
    featured: true
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro Vision",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Pemimpin pemrosesan multimodal audio, video, teks panjang hingga 2 juta token untuk bedah skripsi, jurnal ilmiah, dan kuliah umum.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 2_097_152,
    ratio: 0.625,
    completionRatio: 4,
    featured: true
  },
  {
    id: "gemini-3.8-pro",
    name: "Gemini 3.8 Pro",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Multimodal andalan Google untuk riset ilmiah, analisis video berdurasi jam, dan pembedahan ratusan halaman dokumen PDF.",
    inputs: ["teks", "gambar", "audio", "video", "PDF"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 2_000_000,
    ratio: 0.8,
    completionRatio: 4,
    featured: true
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    providerId: "google",
    category: "Tugas & Riset",
    description: "Kasta puncak riset Google dengan kapabilitas reasoning mendalam untuk matematika tingkat lanjut dan sains komputasi.",
    inputs: ["teks", "gambar", "video", "PDF"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 2_000_000,
    ratio: 1.5,
    completionRatio: 4
  },
  {
    id: "imagen-3-fast",
    name: "Imagen 3 Studio",
    providerId: "google",
    category: "Gambar",
    description: "Generator gambar kualitas studio generasi terbaru Google dengan rendering teks tajam, detail fotorealistis, dan pencahayaan natural.",
    inputs: ["teks"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.035,
    featured: true
  },

  // ==========================================
  // 6. XAI GROK FAMILY (Mini, Grok 3, Grok Code, Grok 4, Imagine)
  // ==========================================
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    providerId: "xai",
    category: "Chat Hemat",
    description: "Model penalaran cepat dan ringan dari xAI. Gaya lugas, cerdas, dan biaya sangat terjangkau untuk penggunaan rutin.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.1,
    completionRatio: 4
  },
  {
    id: "grok-3",
    name: "Grok 3",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Model kecerdasan umum frontier dari xAI Elon Musk dengan akses pengetahuan terkini dan penalaran saintifik mendalam.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.8,
    completionRatio: 4,
    featured: true
  },
  {
    id: "grok-3-code",
    name: "Grok 3 Code",
    providerId: "xai",
    category: "Ngoding",
    description: "Model spesialis rekayasa perangkat lunak dari xAI dengan pemahaman mendalam tentang arsitektur sistem dan debugging rumit.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 131_072,
    ratio: 1,
    completionRatio: 4
  },
  {
    id: "grok-4-reasoning",
    name: "Grok 4 Reasoning",
    providerId: "xai",
    category: "Tugas & Riset",
    description: "Model penalaran tingkat tinggi xAI dengan rantai pemikiran mandiri untuk memecahkan persoalan logika dan sains murni.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 262_144,
    ratio: 1.6,
    completionRatio: 4,
    featured: true
  },
  {
    id: "grok-imagine-v1",
    name: "Grok Vision & Imagine",
    providerId: "xai",
    category: "Gambar",
    description: "Pembuatan dan manipulasi visual dari xAI dengan pemahaman prompt konteks unik dan kreativitas artistik ekspresif.",
    inputs: ["teks", "gambar"],
    endpoints: ["image"],
    ratio: 0,
    completionRatio: 0,
    perImageUsd: 0.04
  },

  // ==========================================
  // 7. MOONSHOT KIMI FAMILY (Instant, Code, K3, K3.1, Academic 2M)
  // ==========================================
  {
    id: "kimi-chat-instant",
    name: "Kimi Chat Instant",
    providerId: "moonshot",
    category: "Chat Hemat",
    description: "Model chat ringan dan responsif dari Moonshot AI untuk tanya-jawab harian, terjemahan kilat, dan copywriting cepat.",
    inputs: ["teks", "gambar"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.1,
    completionRatio: 3,
    featured: true
  },
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
  {
    id: "kimi-k3-academic",
    name: "Kimi K3 Academic 2M",
    providerId: "moonshot",
    category: "Tugas & Riset",
    description: "Konteks ekstra panjang 2 juta token untuk membedah tumpukan buku referensi, laporan keuangan, dan tesis tanpa terputus.",
    inputs: ["teks", "PDF"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 2_000_000,
    ratio: 1.2,
    completionRatio: 4,
    featured: true
  },

  // ==========================================
  // 8. DEEPSEEK FAMILY (V4 Flash, Chat V3, Coder, V4 Pro, R1 Reasoner)
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
    id: "deepseek-chat-v3",
    name: "DeepSeek V3 Chat",
    providerId: "deepseek",
    category: "Chat Hemat",
    description: "Model percakapan serbaguna dari DeepSeek dengan efisiensi token legendaris, cocok untuk percakapan santai dan pembuatan draft kilat.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.14,
    completionRatio: 2
  },
  {
    id: "deepseek-coder-v2.5",
    name: "DeepSeek Coder V2.5",
    providerId: "deepseek",
    category: "Ngoding",
    description: "Spesialis 300+ bahasa pemrograman untuk auto-completion kilat, pembuatan unit test, dan refactor fungsi rumit.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 128_000,
    ratio: 0.2,
    completionRatio: 4
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
  {
    id: "deepseek-r1-reasoner",
    name: "DeepSeek R1 Reasoner",
    providerId: "deepseek",
    category: "Tugas & Riset",
    description: "Model reasoning murni open-weights pemenang penghargaan dunia, setara o1 untuk matematika, sains, dan analisis logika rumit.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    contextTokens: 128_000,
    ratio: 0.55,
    completionRatio: 4,
    featured: true
  },

  // ==========================================
  // 9. BYTEDANCE FAMILY (Seed Flash, Lite, Coder, Research, Seedream)
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
    id: "seed-coder-pro",
    name: "Seed Coder Pro",
    providerId: "bytedance",
    category: "Ngoding",
    description: "Model rekayasa software dari ByteDance untuk penyusunan arsitektur sistem, unit testing, dan integrasi backend API.",
    inputs: ["teks"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.3,
    completionRatio: 4
  },
  {
    id: "seed-research-max",
    name: "Seed Research Max",
    providerId: "bytedance",
    category: "Tugas & Riset",
    description: "Model penalaran teks panjang ByteDance untuk resume skripsi, analisis komparasi paper, dan sintesis literatur.",
    inputs: ["teks", "PDF"],
    endpoints: ["openai", "anthropic"],
    ratio: 0.45,
    completionRatio: 4
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
];;

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

