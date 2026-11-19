-- ============================================================================
-- MIGRATION: Enterprise B2B Tier, Department Allocation & Optional IP Whitelist
-- Aligns with Juragantoken Official PDF Deck (PT Rejeki Digital Cemerlang) & PRD
-- Date: 2026-11-20
-- ============================================================================

-- 1. Kolom Enterprise & Compliance pada public.orders
alter table public.orders
  add column if not exists account_tier text not null default 'standard' check (account_tier in ('standard', 'enterprise')),
  add column if not exists company_name text,
  add column if not exists department text,
  add column if not exists requires_tax_invoice boolean not null default false,
  add column if not exists npwp text;

create index if not exists idx_orders_account_tier on public.orders (account_tier);

-- 2. Kolom Enterprise, Departemen & Whitelist IP Opsional pada public.keys
alter table public.keys
  add column if not exists account_tier text not null default 'standard' check (account_tier in ('standard', 'enterprise')),
  add column if not exists company_name text,
  add column if not exists department text,
  add column if not exists allowed_ips text[] not null default '{}';

create index if not exists idx_keys_account_tier on public.keys (account_tier);
