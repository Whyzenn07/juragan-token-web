-- ============================================================================
-- MIGRATION: Auth Profiles, Gmail-Linked API Keys & Admin Audit Logs
-- Date: 2026-11-20
-- ============================================================================

-- 1. Tabel Profiles (Sinkron otomatis dengan auth.users untuk akun Gmail & Role RBAC)
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

-- 2. Perluas Tabel Orders untuk Keterkaitan Akun Gmail & Catatan Admin
alter table public.orders
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists admin_notes text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamp with time zone;

create index if not exists idx_orders_user_id on public.orders (user_id);

-- 3. Perluas Tabel Keys agar API Key Terintegrasi Langsung ke Akun Gmail User
alter table public.keys
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists user_email text,
  add column if not exists label text,
  add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

create index if not exists idx_keys_user_id on public.keys (user_id);
create index if not exists idx_keys_user_email on public.keys (lower(user_email));

-- 4. Tabel Audit Log Admin (Akuntabilitas Perubahan Pesanan & API Key)
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

-- 5. Row Level Security (Ketat — Defense in Depth)
alter table public.profiles enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Service role full access profiles" on public.profiles;
create policy "Service role full access profiles"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role full access admin_audit_logs" on public.admin_audit_logs;
create policy "Service role full access admin_audit_logs"
  on public.admin_audit_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.profiles to authenticated;
