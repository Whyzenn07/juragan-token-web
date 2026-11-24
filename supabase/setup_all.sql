-- ============================================================================
-- SETUP LENGKAP SUPABASE: JURAGAN TOKEN (MASTER MIGRATION & SCHEMA)
-- Platform: Universal AI Gateway & B2B Token Marketplace (PT Rejeki Digital Cemerlang)
-- Salin dan jalankan seluruh isi skrip ini di SQL Editor Supabase Anda.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL PROFILES (Sinkron otomatis dengan auth.users untuk akun Gmail & Role RBAC)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    full_name text not null default '',
    avatar_url text,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_email on public.profiles (lower(email));
create index if not exists idx_profiles_role on public.profiles (role);

-- Trigger otomatis saat user mendaftar via Google OAuth / Email di Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. TABEL ORDERS (Riwayat Transaksi, Checkout Retail & B2B Enterprise)
-- ----------------------------------------------------------------------------
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
    status text not null default 'pending', -- pending, paid, expired, failed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    paid_at timestamp with time zone,
    key_hash text,
    pending_reveal text,
    email_status text default 'none',
    email_message text,
    is_top_up boolean not null default false,
    target_key_hash text,
    -- Integrasi Payment Gateway (Tripay / Midtrans / Xendit / Manual)
    gateway_provider text,
    gateway_reference text,
    payment_url text,
    qr_url text,
    pay_code text,
    -- Relasi Akun Pengguna & Admin Review
    user_id uuid references public.profiles(id) on delete set null,
    admin_notes text,
    reviewed_by uuid references public.profiles(id) on delete set null,
    reviewed_at timestamp with time zone,
    -- Metadata Enterprise B2B & Faktur Pajak
    account_tier text not null default 'standard' check (account_tier in ('standard', 'enterprise')),
    company_name text,
    department text,
    requires_tax_invoice boolean not null default false,
    npwp text,
    -- Bukti Transfer & Verifikasi Manual
    payment_proof_url text,
    payment_proof_name text,
    payment_proof_uploaded_at timestamp with time zone,
    payment_proof_uploaded_by text,
    payment_reference text
);

create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_customer_email on public.orders (lower(customer_email));
create index if not exists idx_orders_token_hash on public.orders (token_hash);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_account_tier on public.orders (account_tier);
create index if not exists idx_orders_status on public.orders (status);

-- ----------------------------------------------------------------------------
-- 3. TABEL KEYS (Virtual API Key, Saldo IDR, Label & IP Whitelist)
-- ----------------------------------------------------------------------------
create table if not exists public.keys (
    hash text primary key,
    last4 text not null,
    order_id text references public.orders(id) on delete set null,
    user_id uuid references public.profiles(id) on delete set null,
    user_email text,
    label text,
    plan_name text not null,
    est_package text,
    balance_idr integer not null default 0,
    status text not null default 'active', -- active, suspended, revoked
    account_tier text not null default 'standard' check (account_tier in ('standard', 'enterprise')),
    company_name text,
    department text,
    allowed_ips text[] not null default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_keys_order_id on public.keys (order_id);
create index if not exists idx_keys_user_id on public.keys (user_id);
create index if not exists idx_keys_user_email on public.keys (lower(user_email));
create index if not exists idx_keys_status on public.keys (status);
create index if not exists idx_keys_account_tier on public.keys (account_tier);

-- ----------------------------------------------------------------------------
-- 4. TABEL USAGE_LOGS (Audit Log Pemakaian API Inferensi & Biaya Potong Saldo)
-- ----------------------------------------------------------------------------
create table if not exists public.usage_logs (
    id bigserial primary key,
    key_hash text not null references public.keys(hash) on delete cascade,
    key_last4 text,
    model text not null,
    provider text not null default 'gemini',
    prompt_tokens integer not null default 0,
    completion_tokens integer not null default 0,
    total_tokens integer not null default 0,
    cost_idr integer not null default 0,
    remaining_balance_idr integer not null default 0,
    ip_address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_usage_logs_key_hash on public.usage_logs (key_hash);
create index if not exists idx_usage_logs_created_at on public.usage_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- 5. TABEL ADMIN_AUDIT_LOGS (Akuntabilitas Perubahan Pesanan, Role & API Key)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    admin_id text not null,
    admin_email text not null,
    action text not null,
    target_type text not null,
    target_id text not null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_admin_audit_created_at on public.admin_audit_logs (created_at desc);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES — Zero-Trust & Defense-in-Depth
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.keys enable row level security;
alter table public.usage_logs enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Hapus policies lama untuk idempotency
drop policy if exists "Allow public order insertion" on public.orders;
drop policy if exists "Allow order read" on public.orders;
drop policy if exists "Allow order update" on public.orders;
drop policy if exists "Allow keys lookup by hash" on public.keys;
drop policy if exists "Allow keys insert on payment" on public.keys;
drop policy if exists "Allow keys update on balance deduction" on public.keys;
drop policy if exists "Allow insert usage_logs" on public.usage_logs;
drop policy if exists "Allow read usage_logs" on public.usage_logs;

-- Policies Service Role (Backend Node.js memiliki hak penuh via secretKey)
drop policy if exists "Service role full access profiles" on public.profiles;
create policy "Service role full access profiles" on public.profiles for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Service role full access orders" on public.orders;
create policy "Service role full access orders" on public.orders for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role full access keys" on public.keys;
create policy "Service role full access keys" on public.keys for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role full access usage_logs" on public.usage_logs;
create policy "Service role full access usage_logs" on public.usage_logs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role full access admin_audit_logs" on public.admin_audit_logs;
create policy "Service role full access admin_audit_logs" on public.admin_audit_logs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Cabut akses publik anonim dari tabel sensitif
revoke all on public.orders from anon, authenticated;
revoke all on public.keys from anon, authenticated;
revoke all on public.usage_logs from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. FUNGSI RPC ATOMIK PEMOTONGAN SALDO (Anti Race Condition)
-- ----------------------------------------------------------------------------
create or replace function public.deduct_token_balance(
    target_key_hash text,
    deduct_amount integer
) returns table(success boolean, new_balance integer) as $$
declare
    updated_bal integer;
begin
    update public.keys
    set balance_idr = greatest(0, balance_idr - deduct_amount),
        updated_at = timezone('utc'::text, now())
    where hash = target_key_hash
      and status = 'active'
    returning balance_idr into updated_bal;

    if found then
        return query select true, updated_bal;
    else
        return query select false, 0;
    end if;
end;
$$ language plpgsql security definer;

-- Batasi eksekusi RPC hanya untuk service_role
revoke execute on function public.deduct_token_balance(text, integer) from public, anon, authenticated;
grant execute on function public.deduct_token_balance(text, integer) to service_role;

-- ----------------------------------------------------------------------------
-- 8. SEED DATA AWAL (Opsional — untuk testing lingkungan baru)
-- ----------------------------------------------------------------------------
insert into public.orders (
    id, token_hash, customer_name, customer_email, customer_phone,
    package_id, package_name, est_package, base_idr, fee_idr, total_idr,
    method_id, method_name, status, created_at, paid_at, key_hash, email_status, email_message,
    account_tier, gateway_provider
) values
(
    'INV-JT-DEMO01',
    'demo-token-hash-1',
    'Budi Santoso',
    'budi.dev@gmail.com',
    '081234567890',
    'starter-50k',
    'Paket Developer Pro',
    'Saldo Rp 50.000 · Multi-Model',
    50000, 0, 50000,
    'qris', 'QRIS Instan',
    'paid', timezone('utc'::text, now() - interval '2 days'), timezone('utc'::text, now() - interval '2 days' + interval '2 minutes'),
    'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    'sent', 'Kuitansi & API Key terkirim ke email pelanggan.',
    'standard', 'manual'
),
(
    'INV-JT-DEMO02',
    'demo-token-hash-2',
    'Sari Wijaya',
    'sari.analytics@gmail.com',
    '081298765432',
    'business-100k',
    'Paket Tim Riset',
    'Saldo Rp 100.000 · Multi-Model',
    100000, 0, 100000,
    'va-bca', 'BCA Virtual Account',
    'pending', timezone('utc'::text, now() - interval '3 hours'), null,
    null, 'none', null,
    'enterprise', 'manual'
)
on conflict (id) do nothing;

insert into public.keys (
    hash, last4, order_id, user_email, label, plan_name, est_package, balance_idr, status, account_tier, created_at
) values
(
    'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    '9X4K',
    'INV-JT-DEMO01',
    'budi.dev@gmail.com',
    'Cursor IDE Utama',
    'Paket Developer Pro',
    'Saldo Rp 50.000 · Multi-Model',
    42500,
    'active',
    'standard',
    timezone('utc'::text, now() - interval '2 days')
)
on conflict (hash) do nothing;
