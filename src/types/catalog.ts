export type Category = "Semua" | "Ngoding" | "Tugas & Riset" | "Chat Hemat" | "Gambar";

export type Provider = {
  id: string;
  name: string;
  company: string;
  hasLogo: boolean;
};

/** Format request yang diterima gateway untuk model ini. */
export type Endpoint = "openai" | "anthropic" | "gemini" | "image";

export type Modality = "teks" | "gambar" | "audio" | "video" | "PDF";

export type ModelItem = {
  /** Harus sama persis dengan `model_name` di gateway. Ini yang diketik user di parameter `model`. */
  id: string;
  name: string;
  providerId: string;
  category: Exclude<Category, "Semua">;
  description: string;
  inputs: Modality[];
  endpoints: Endpoint[];
  /** Hanya diisi bila jendela konteks tercantum di dokumentasi resmi model. */
  contextTokens?: number;
  /** `model_ratio` gateway (New-API). Rasio 1 = US$2 per 1 juta token input. */
  ratio: number;
  /** `completion_ratio` gateway: harga output = harga input x rasio ini. */
  completionRatio: number;
  /** Untuk model yang ditagih per gambar (`quota_type` 1). */
  perImageUsd?: number;
  featured?: boolean;
};

export type RetailPackage = {
  id: string;
  name: string;
  subtitle: string;
  targetUser: string;
  priceIdr: number;
  estToken: string;
  description: string;
  popularFor: string[];
  recommendedModel: string;
  badge?: string;
  featured?: boolean;
};

export type PaymentMethod = {
  id: string;
  name: string;
  fee: string;
  feeAmount: number;
  provider: string;
  speed: string;
};
