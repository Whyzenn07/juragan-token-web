-- ============================================================================
-- MIGRATION: Security RLS Hardening + Payment Gateway Columns (2026-11-13)
-- 1. Menutup celah akses anon/publik (using (true)) pada orders, keys, usage_logs.
-- 2. Membatasi eksekusi RPC deduct_token_balance hanya untuk service_role.
-- 3. Menambah kolom metadata payment gateway (Tripay/Midtrans/Xendit) ke orders.
-- ============================================================================

-- A. Kolom Payment Gateway pada public.orders
alter table public.orders
  add column if not exists gateway_provider text,
  add column if not exists gateway_reference text,
  add column if not exists payment_url text,
  add column if not exists qr_url text,
  add column if not exists pay_code text;

-- B. Cabut policy permisif lama (using (true))
drop policy if exists "Allow public order insertion" on public.orders;
drop policy if exists "Allow order read" on public.orders;
drop policy if exists "Allow order update" on public.orders;
drop policy if exists "Allow keys lookup by hash" on public.keys;
drop policy if exists "Allow keys insert on payment" on public.keys;
drop policy if exists "Allow keys update on balance deduction" on public.keys;
drop policy if exists "Allow insert usage_logs" on public.usage_logs;
drop policy if exists "Allow read usage_logs" on public.usage_logs;

-- C. Policy Ketat: Hanya backend service_role yang berhak membaca/menulis tabel sensitif
drop policy if exists "Service role full access orders" on public.orders;
create policy "Service role full access orders"
  on public.orders for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role full access keys" on public.keys;
create policy "Service role full access keys"
  on public.keys for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role full access usage_logs" on public.usage_logs;
create policy "Service role full access usage_logs"
  on public.usage_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- D. Cabut hak akses langsung role anon & authenticated di skema publik
revoke all on public.orders from anon, authenticated;
revoke all on public.keys from anon, authenticated;
revoke all on public.usage_logs from anon, authenticated;

revoke all on function public.deduct_token_balance(text, integer) from public, anon, authenticated;
grant execute on function public.deduct_token_balance(text, integer) to service_role;

