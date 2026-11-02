-- ============================================================================
-- TABEL AUDIT LOG PEMAKAIAN API: public.usage_logs
-- Mencatat setiap transaksi inferensi model AI, token terpakai, dan biaya potong
-- ============================================================================

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

-- RLS Policies
alter table public.usage_logs enable row level security;

drop policy if exists "Allow insert usage_logs" on public.usage_logs;
create policy "Allow insert usage_logs" on public.usage_logs for insert with check (true);

drop policy if exists "Allow read usage_logs" on public.usage_logs;
create policy "Allow read usage_logs" on public.usage_logs for select using (true);
