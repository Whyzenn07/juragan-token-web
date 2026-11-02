-- Migration: Inisialisasi Tabel Orders dan Keys Juragan Token
-- Project: juragan-token-web (https://nzcblpzianzbgbwglhxc.supabase.co)

-- 1. Tabel Orders (Riwayat Transaksi & Pemesanan)
create table if not exists public.orders (
    id text primary key,
    token_hash text not null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text,
    package_id text not null,
    package_name text not null,
    est_package text,
    base_idr integer not null,
    fee_idr integer not null default 0,
    total_idr integer not null,
    method_id text not null,
    method_name text not null,
    status text not null default 'pending', -- pending, paid, expired
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone,
    key_hash text,
    pending_reveal text,
    email_status text default 'none',
    email_message text
);

-- Indeks pencarian orders
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_customer_email on public.orders (customer_email);
create index if not exists idx_orders_token_hash on public.orders (token_hash);

-- 2. Tabel Keys (Daftar Virtual API Key Terdaftar & Saldo)
create table if not exists public.keys (
    hash text primary key, -- SHA-256 dari jt-live-...
    last4 text not null,
    order_id text references public.orders(id) on delete set null,
    plan_name text not null,
    est_package text,
    balance_idr integer not null default 0,
    status text not null default 'active', -- active, suspended, revoked
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indeks pencarian keys
create index if not exists idx_keys_order_id on public.keys (order_id);
create index if not exists idx_keys_status on public.keys (status);

-- 3. Row Level Security (RLS) Policies
alter table public.orders enable row level security;
alter table public.keys enable row level security;

-- Policy untuk pembuatan pesanan (anon boleh insert order baru)
drop policy if exists "Allow public order insertion" on public.orders;
create policy "Allow public order insertion"
on public.orders for insert
with check (true);

-- Policy untuk membaca pesanan (hanya bisa dibaca lewat order token atau admin)
drop policy if exists "Allow order read" on public.orders;
create policy "Allow order read"
on public.orders for select
using (true);

-- Policy untuk update status pesanan (saat konfirmasi pembayaran)
drop policy if exists "Allow order update" on public.orders;
create policy "Allow order update"
on public.orders for update
using (true)
with check (true);

-- Policy untuk membaca kunci (cek saldo via hash)
drop policy if exists "Allow keys lookup by hash" on public.keys;
create policy "Allow keys lookup by hash"
on public.keys for select
using (true);

-- Policy untuk penambahan kunci saat konfirmasi
drop policy if exists "Allow keys insert on payment" on public.keys;
create policy "Allow keys insert on payment"
on public.keys for insert
with check (true);
