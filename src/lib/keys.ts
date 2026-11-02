import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateApiKey(): string {
  return `jt-live-${randomBytes(18).toString("base64url")}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOrderToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateInvoiceId(): string {
  return `INV-JT-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function safeEqualHash(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function maskKey(key: string): string {
  return `jt-live-••••••••${key.slice(-4)}`;
}

const hits = new Map<string, number[]>();

/** Pembatas laju in-memory: maksimal `limit` percobaan per `windowMs` per kunci identitas. */
export function rateLimited(id: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(id, recent);
    return true;
  }
  recent.push(now);
  hits.set(id, recent);
  return false;
}
