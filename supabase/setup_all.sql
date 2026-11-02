-- ============================================================================
-- SETUP LENGKAP SUPABASE: JURAGAN TOKEN (MIGRATION + BACKUP RESTORE)
-- Salin dan jalankan seluruh isi skrip ini di SQL Editor Supabase Anda.
-- ============================================================================

-- 1. TABEL ORDERS
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
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone,
    key_hash text,
    pending_reveal text,
    email_status text default 'none',
    email_message text
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_customer_email on public.orders (customer_email);
create index if not exists idx_orders_token_hash on public.orders (token_hash);

-- 2. TABEL KEYS
create table if not exists public.keys (
    hash text primary key,
    last4 text not null,
    order_id text references public.orders(id) on delete set null,
    plan_name text not null,
    est_package text,
    balance_idr integer not null default 0,
    status text not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_keys_order_id on public.keys (order_id);
create index if not exists idx_keys_status on public.keys (status);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.orders enable row level security;
alter table public.keys enable row level security;

drop policy if exists "Allow public order insertion" on public.orders;
create policy "Allow public order insertion" on public.orders for insert with check (true);

drop policy if exists "Allow order read" on public.orders;
create policy "Allow order read" on public.orders for select using (true);

drop policy if exists "Allow order update" on public.orders;
create policy "Allow order update" on public.orders for update using (true) with check (true);

drop policy if exists "Allow keys lookup by hash" on public.keys;
create policy "Allow keys lookup by hash" on public.keys for select using (true);

drop policy if exists "Allow keys insert on payment" on public.keys;
create policy "Allow keys insert on payment" on public.keys for insert with check (true);

-- 4. RESTORE BACKUP DATA YANG SUDAH ADA
insert into public.orders (
    id, token_hash, customer_name, customer_email, customer_phone,
    package_id, package_name, est_package, base_idr, fee_idr, total_idr,
    method_id, method_name, status, created_at, paid_at, key_hash, email_status, email_message
) values
(
    'INV-JT-MVY0KFBD3965',
    '5a5c235d2dec7f8fc25951cc6ff5c5d6400ca54cf838990b52e09e816c171e39',
    'Budi Santoso',
    'budi@kampus.ac.id',
    '081226983990',
    'pkt-pro-builder',
    'Paket Pro Builder',
    '±833 Interaksi · Claude',
    149000, 0, 149000,
    'qris', 'QRIS SingaPay (Instan)',
    'paid', '2026-11-01T15:57:45.500Z', '2026-11-01T15:58:18.508Z',
    '3f6d62aaee5fc7153cf9174ccbc27a3543db3286bb20066eb0b06c7d668b708e',
    'simulated', 'Mode simulasi: kredensial Gmail belum diisi, email untuk budi@kampus.ac.id tidak dikirim.'
),
(
    'INV-JT-MVY1Q58O4A6D',
    '9ea5f1ff576e7388659a9a4675a69b4d926a3613c2631e1b059a9356bb3d2954',
    'wolly',
    'wumboloji284@gmail.com',
    '081226983990',
    'pkt-skripsi-koding',
    'Paket Skripsi & Koding',
    '±386 Interaksi · Claude',
    69000, 0, 69000,
    'qris', 'QRIS SingaPay (Instan)',
    'paid', '2026-11-01T16:30:11.978Z', '2026-11-01T16:30:33.595Z',
    '6a75d91bd9f9983c39543d218b69187cdece401142e21be3811fdcb461bac42c',
    'simulated', 'Mode simulasi: kredensial Gmail belum diisi, email untuk wumboloji284@gmail.com tidak dikirim.'
),
(
    'INV-JT-MVY1VXFYFF4C',
    '1a64967a0254f17845b35a24ff1a08e9bdb14b22725ab91c6f16866ff7acb00f',
    'Dimas Pratama',
    'dimas.dev@mahasiswa.ac.id',
    '081226983990',
    'pkt-mhs-starter',
    'Paket Starter Kuliah',
    '±566 Interaksi · Gemini',
    29000, 0, 29000,
    'qris', 'QRIS SingaPay (Instan)',
    'paid', '2026-11-01T16:34:41.817Z', '2026-11-01T16:37:30.131Z',
    'ddea9c0fe0f186b869de100b187b1cde2f6e3b20cab75d4eb41dc94a94391bf3',
    'simulated', 'Mode simulasi: kredensial Gmail belum diisi, email untuk dimas.dev@mahasiswa.ac.id tidak dikirim.'
)
on conflict (id) do nothing;

insert into public.keys (
    hash, last4, order_id, plan_name, est_package, balance_idr, status, created_at
) values
(
    '3f6d62aaee5fc7153cf9174ccbc27a3543db3286bb20066eb0b06c7d668b708e',
    'AouR',
    'INV-JT-MVY0KFBD3965',
    'Paket Pro Builder',
    '±833 Interaksi · Claude',
    149000,
    'active',
    '2026-11-01T15:58:18.508Z'
),
(
    '6a75d91bd9f9983c39543d218b69187cdece401142e21be3811fdcb461bac42c',
    'X9yT',
    'INV-JT-MVY1Q58O4A6D',
    'Paket Skripsi & Koding',
    '±386 Interaksi · Claude',
    69000,
    'active',
    '2026-11-01T16:30:33.595Z'
),
(
    'ddea9c0fe0f186b869de100b187b1cde2f6e3b20cab75d4eb41dc94a94391bf3',
    '_pau',
    'INV-JT-MVY1VXFYFF4C',
    'Paket Starter Kuliah',
    '±566 Interaksi · Gemini',
    29000,
    'active',
    '2026-11-01T16:37:30.130Z'
)
on conflict (hash) do nothing;
