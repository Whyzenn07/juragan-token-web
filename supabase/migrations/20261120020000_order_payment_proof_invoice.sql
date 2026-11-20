-- ============================================================================
-- MIGRATION: Order Payment Proof (SS Transaksi) & Transfer Reference Fields
-- Date: 2026-11-20
-- ============================================================================

alter table public.orders
  add column if not exists payment_proof_url text,
  add column if not exists payment_proof_name text,
  add column if not exists payment_proof_uploaded_at timestamptz,
  add column if not exists payment_proof_uploaded_by text,
  add column if not exists payment_reference text;
