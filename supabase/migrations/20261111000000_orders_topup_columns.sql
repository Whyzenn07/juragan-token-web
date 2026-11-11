-- Kolom top-up agar order top-up bisa dipulihkan lintas instance serverless.
alter table public.orders add column if not exists is_top_up boolean not null default false;
alter table public.orders add column if not exists target_key_hash text;
