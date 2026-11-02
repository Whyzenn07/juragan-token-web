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

type Db = { orders: Record<string, Order>; keys: Record<string, KeyRecord> };

const FILE = path.join(process.cwd(), "data", "store.json");

let queue: Promise<unknown> = Promise.resolve();

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return { orders: parsed.orders ?? {}, keys: parsed.keys ?? {} };
  } catch {
    return { orders: {}, keys: {} };
  }
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
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
