-- Seed Backup Data: Import Existing Orders and Keys to Supabase
-- Generated from local data/store.json backup

-- 1. Insert Existing Orders Backup
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
    'qris', 'QRIS (Instan)',
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

-- 2. Insert Existing API Keys Backup
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
