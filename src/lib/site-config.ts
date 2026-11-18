export const SITE_BRAND_NAME = "Juragantoken";
export const SITE_TAGLINE = "One Gateway. Every Intelligence.";

/**
 * Feature flag checkout/harga ritel.
 * Default `false` agar website tampil sebagai Company Profile & Katalog Keahlian LLM.
 * Set `NEXT_PUBLIC_ENABLE_CHECKOUT="true"` untuk mengaktifkan kembali alur pembayaran.
 */
export const ENABLE_CHECKOUT =
  process.env.NEXT_PUBLIC_ENABLE_CHECKOUT === "true";

export const SHOW_CATALOG_PRICING = ENABLE_CHECKOUT;

export const WHATSAPP_RAW = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281226983990"
).replace(/[^0-9]/g, "");

export const WHATSAPP_DISPLAY = "0812-2698-3990";

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(message)}`;
}
