import { promises as fs } from "fs";
import path from "path";

export type OrderStatus = "pending" | "paid" | "expired";
export type EmailStatus = "none" | "sent" | "simulated" | "error";

export type Order = {
  id: string;
  tokenHash: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  packageName: string;
  estPackage: string;
  baseIdr: number;
  feeIdr: number;
  totalIdr: number;
  methodId: string;
  methodName: string;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  keyHash?: string;
  /** Kunci utuh disimpan hanya sampai pembeli mengambilnya sekali, lalu dihapus. */
  pendingReveal?: string;
  emailStatus: EmailStatus;
  emailMessage?: string;
  targetKeyHash?: string;
  isTopUp?: boolean;
};

export type KeyRecord = {
  hash: string;
  last4: string;
  orderId: string;
  planName: string;
  estPackage: string;
  balanceIdr: number;
  createdAt: string;
  status: "active";
};

export type UsageLog = {
  id: string;
  keyHash: string;
  keyLast4: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costIdr: number;
  remainingBalanceIdr: number;
  createdAt: string;
};

type Db = {
  orders: Record<string, Order>;
  keys: Record<string, KeyRecord>;
  usageLogs?: UsageLog[];
};

const FILE = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join("/tmp", "juragan-token-store.json")
  : path.join(process.cwd(), "data", "store.json");

let queue: Promise<unknown> = Promise.resolve();

/** Cadangan di memori bila disk tidak bisa ditulis (mis. filesystem read-only). */
let memDb: Db | null = null;

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return {
      orders: parsed.orders ?? {},
      keys: parsed.keys ?? {},
      usageLogs: parsed.usageLogs ?? [],
    };
  } catch {
    if (memDb) return JSON.parse(JSON.stringify(memDb)) as Db;
    return { orders: {}, keys: {}, usageLogs: [] };
  }
}

async function writeDb(db: Db): Promise<void> {
  memDb = JSON.parse(JSON.stringify(db)) as Db;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  } catch (err) {
    console.error("[STORE] Gagal menulis ke disk, memakai memori:", err instanceof Error ? err.message : err);
  }
}

/** Baca-ubah-tulis berurutan agar dua request bersamaan tidak saling menimpa. */
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function query<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => fn(await readDb()));
  queue = run.catch(() => undefined);
  return run;
}
