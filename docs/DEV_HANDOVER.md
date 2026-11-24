# 🚀 Panduan Handover Tim Developer (Integrasi API Upstream & Payment Gateway)

Dokumen ini ditujukan untuk **Tim Developer Eksternal / Partner (tokotokenai.id dan Tim Payment Gateway)** yang akan menghubungkan kredensial produksi ke platform **Juragan Token Web** (PT Rejeki Digital Cemerlang).

Seluruh sistem aplikasi (Frontend UI/UX, B2B Portal, Katalog 66 Model AI, Multi-Protocol Reverse Proxy Gateway, Atomic Saldo Deduct, SMTP Email Invoice, dan Adapter Payment Gateway) telah **100% selesai, teruji, dan berjalan di Vercel Production**.

---

## 🏗️ Peta Arsitektur & Peran Juragan Token Sebagai Jembatan (Reseller Middleware)

Juragan Token bertindak sebagai **jembatan penengah (reseller middleware)** antara pelanggan retail/B2B dengan server engine upstream:

```text
[ Klien AI: Cursor / Claude Code CLI / LibreChat / Python SDK ]
                               │
               Bearer jt-live-xxxx (API Key Pelanggan)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Juragan Token Gateway Engine                         │
│  • Endpoint OpenAI:       /v1/chat/completions & /v1/models            │
│  • Endpoint Anthropic:    /v1/messages (Claude Code CLI Native)        │
│  • Endpoint Gemini:       /v1beta/models/* (Google SDK Native)         │
│  • Autentikasi Kunci:     SHA-256 Zero-Knowledge & IP Whitelist       │
│  • Potong Saldo Atomik:   Supabase RPC deduct_token_balance (IDR)      │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
            Authorization: Bearer <UPSTREAM_ENGINE_KEY>
                               ▼
        ┌──────────────────────────────────────────────┐
        │   Upstream AI Engine (tokotokenai.id)        │
        │   https://api.tokotokenai.com/v1             │
        │   Claude 3.7/Sonnet, GPT-4o, DeepSeek, dll.  │
        └──────────────────────────────────────────────┘
```

---

## 📁 Struktur Direktori Bersih (Clean Architecture)

```text
juragan-token-web/
├── docs/                                # Spesifikasi & Panduan Handover
│   ├── ARCHITECTURE.md                  # Arsitektur sistem & alur kriptografi
│   ├── DEV_HANDOVER.md                  # Panduan handover untuk tim developer ini
│   ├── PRD_JURAGAN_TOKEN.md             # PRD lengkap (Retail & Enterprise B2B)
│   └── audits/                          # Laporan audit keamanan
├── public/                              # Aset statis (AI-Logo, payment-logos, email)
├── src/
│   ├── app/                             # Next.js 16 App Router (Pages & API Routes)
│   │   ├── admin/                       # Panel Admin B2B & Manajemen Order
│   │   ├── dashboard/                   # Portal Pengguna Gmail
│   │   ├── docs/                        # Dokumentasi Interaktif & API Tester
│   │   ├── status/                      # Health Check 4 Pilar Infrastruktur
│   │   ├── api/
│   │   │   ├── v1/                      # OpenAI Gateway (/chat/completions, /models, /messages)
│   │   │   ├── v1beta/                  # Gemini Native Gateway (/models/[...slug])
│   │   │   ├── orders/                  # Order checkout & konfirmasi
│   │   │   ├── webhooks/payment/        # Webhook handler (Tripay, Midtrans, Xendit, Manual)
│   │   │   ├── auth/                    # Supabase Auth & Google OAuth handler
│   │   │   └── admin/                   # REST endpoint panel admin
│   │   └── components/                  # Compatibility re-exports untuk modul komponen
│   ├── components/                      # Komponen UI Terstruktur Modular
│   │   ├── auth/                        # AuthCard (Login & Registrasi)
│   │   ├── landing/                     # Komponen halaman utama (HeroOrbit, ModelShowcase, dll)
│   │   ├── modals/                      # PaymentModal, ModelDetailModal, TokenBalanceModal, Dialog
│   │   ├── portal/                      # InvoiceDocument, ProofUploadDropzone
│   │   ├── sections/                    # SetupGuides, SavingsCalculator
│   │   └── ui/                          # ProviderLogo, Icon, PaymentSuccessMark, RegionBadge
│   ├── data/
│   │   └── catalog.ts                   # Katalog 66 Model AI, Paket Ritel & Channel Bayar
│   ├── lib/                             # Core Business Logic & Adapters
│   │   ├── gateway.ts                   # Universal AI Gateway reverse proxy & token meter
│   │   ├── payment-gateway.ts           # Outbound adapter (Tripay / Midtrans / Xendit / Manual)
│   │   ├── keys.ts                      # Kriptografi SHA-256 API Key & rate limiter
│   │   ├── orders.ts                    # Order lifecycle & atomic state
│   │   ├── auth.ts                      # Server session & Supabase Auth integration
│   │   ├── admin-service.ts             # Admin query, order approval, & audit logs
│   │   ├── site-config.ts               # Identitas legal PT Rejeki Digital Cemerlang
│   │   ├── receipt-email.ts             # Nodemailer Gmail SMTP HTML receipt sender
│   │   ├── store.ts                     # In-memory atomic data store
│   │   └── supabase-sync.ts             # Supabase sync adapter
│   └── types/                           # TypeScript interfaces
├── supabase/                            # Skema Database & Migrasi PostgreSQL
│   ├── setup_all.sql                    # Master 1-Click Setup Script untuk Supabase SQL Editor
│   └── migrations/                      # 7 file migrasi bertahap
├── .env.example                         # Template variabel environment lengkap
└── package.json                         # Dependensi (Next.js 16.4.6, React 19)
```

---

## 1️⃣ Integrasi Master API Key LLM (`https://api.tokotokenai.com/`)

Sistem gateway di [`src/lib/gateway.ts`](../src/lib/gateway.ts) dan API routes:
- `POST /v1/chat/completions` (OpenAI format)
- `POST /v1/messages` (Anthropic format untuk Claude Code CLI)
- `POST /v1beta/models/*` (Google Gemini SDK format)

sudah terhubung secara *plug-and-play* ke engine upstream.

### Variabel Environment di Vercel:
```ini
UPSTREAM_ENGINE_URL="https://api.tokotokenai.com/v1"
UPSTREAM_ENGINE_KEY="isi-dengan-master-api-key-tokotokenai-anda"
# Opsional: Set "true" jika ingin model Gemini juga melewati api.tokotokenai.com
UPSTREAM_ROUTE_ALL="false"
```

---

## 2️⃣ Integrasi Payment Gateway (`Tripay` / `Midtrans` / `Xendit`)

Adapter pembayaran outbound ([`src/lib/payment-gateway.ts`](../src/lib/payment-gateway.ts)) dan inbound webhook ([`src/app/api/webhooks/payment/route.ts`](../src/app/api/webhooks/payment/route.ts)) mendukung 4 provider:

### Langkah 1: Daftarkan URL Webhook di Dashboard Provider
```text
https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/webhooks/payment
```

### Langkah 2: Variabel Environment di Vercel (Pilih Salah Satu)

#### Tripay:
```ini
PAYMENT_GATEWAY_PROVIDER="tripay"
PAYMENT_GATEWAY_SANDBOX="false"
TRIPAY_MERCHANT_CODE="Txxxx"
TRIPAY_API_KEY="PROD-xxxx"
TRIPAY_PRIVATE_KEY="xxxxx-xxxxx-xxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

#### Midtrans:
```ini
PAYMENT_GATEWAY_PROVIDER="midtrans"
PAYMENT_GATEWAY_SANDBOX="false"
MIDTRANS_SERVER_KEY="Mid-server-xxxxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-xxxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

#### Xendit:
```ini
PAYMENT_GATEWAY_PROVIDER="xendit"
PAYMENT_GATEWAY_SANDBOX="false"
XENDIT_SECRET_KEY="xnd_production_xxxxxx"
XENDIT_CALLBACK_TOKEN="xxxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

---

## 3️⃣ Setup Database Supabase 1-Click

Jika menghubungkan ke database Supabase baru, cukup salin dan jalankan seluruh isi file:
[`supabase/setup_all.sql`](../supabase/setup_all.sql)
pada **Supabase Dashboard $\rightarrow$ SQL Editor $\rightarrow$ New Query $\rightarrow$ Run**.

Skrip tersebut mencakup:
1. Tabel `profiles` (sinkron otomatis akun Google/Email Supabase Auth)
2. Tabel `orders` (retail + enterprise B2B + kolom faktur pajak + bukti transfer)
3. Tabel `keys` (virtual API key, saldo IDR, label IDE, allowed IPs)
4. Tabel `usage_logs` (audit inferensi token & biaya per transaksi)
5. Tabel `admin_audit_logs` (riwayat tindakan admin)
6. Row Level Security (RLS) policies ketat (Service Role defense-in-depth)
7. Stored Procedure atomik `public.deduct_token_balance` (anti race-condition pemotongan saldo)

---

## 4️⃣ Verifikasi Cepat & QA

Setelah mengisi environment variables dan redeploy:
1. Buka halaman **`/status`** untuk memverifikasi 4 indikator pilar hijau (Supabase, SMTP, Payment Gateway, Upstream AI).
2. Lakukan pengujian cURL via endpoint OpenAI-compatible:
```bash
curl -X POST https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1/chat/completions \
  -H "Authorization: Bearer jt-live-xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "Halo Juragan Token"}]
  }'
```
3. Lakukan pengujian cURL via endpoint Anthropic native (Claude Code CLI):
```bash
curl -X POST https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1/messages \
  -H "x-api-key: jt-live-xxxx" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "Halo dari Claude Code CLI"}]
  }'
```
