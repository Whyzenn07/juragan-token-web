# 🪐 Juragan Token — Universal AI Gateway & Prepaid LLM Token Marketplace

[![Live Demo Vercel](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Release-v2.3.0--stable-emerald)](#)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

> **Platform marketplace kredit API AI prabayar berbasis Rupiah (IDR).** Akses beragam model AI frontier (**Claude Sonnet/Opus, OpenAI GPT, DeepSeek, Google Gemini, Qwen, dll.**) melalui **1 Virtual API Key (`jt-live-...`)** yang kompatibel dengan standar OpenAI API, tanpa kartu kredit internasional.

---

## 🌐 Live Demo & Uji Coba (Vercel)

| Halaman / Layanan | URL Live Demo | Kegunaan Uji Coba |
| :--- | :--- | :--- |
| **🏠 Aplikasi Utama & Checkout** | https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/ | Jelajahi katalog 66 model AI, kalkulator hemat, alur checkout QRIS/VA/e-Wallet, serta cek saldo API Key. |
| **📚 Dokumentasi & API Tester** | https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/docs | Uji request OpenAI-compatible (`/v1/chat/completions`) dan lihat contoh konfigurasi IDE/SDK. |
| **🩺 Status 4 Pilar Sistem** | https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/status | Monitoring real-time koneksi Supabase, SMTP Gmail, adapter Payment Gateway, dan Upstream LLM Engine. |

> **Catatan Uji Coba:** Pada lingkungan demo (`DEMO_MODE=true`), tombol simulasi konfirmasi pembayaran dapat digunakan untuk mengetes penerbitan Virtual API Key `jt-live-...` dan pengiriman invoice email secara end-to-end.

---

## 📑 Daftar Isi

- [🌐 Live Demo & Uji Coba (Vercel)](#-live-demo--uji-coba-vercel)
- [1. Arsitektur & Nilai Tambah Sistem](#1-arsitektur--nilai-tambah-sistem)
- [2. Tech Stack](#2-tech-stack)
- [3. Struktur Direktori Proyek](#3-struktur-direktori-proyek)
- [4. Panduan Menjalankan Lokal (Quick Start)](#4-panduan-menjalankan-lokal-quick-start)
- [5. Konfigurasi Environment (.env.local)](#5-konfigurasi-environment-envlocal)
- [6. Spesifikasi API Gateway & Endpoint](#6-spesifikasi-api-gateway--endpoint)
- [7. Skema Database & Keamanan](#7-skema-database--keamanan)
- [8. Panduan Integrasi Klien (Cursor, Python, cURL)](#8-panduan-integrasi-klien-cursor-python-curl)
- [9. Dokumentasi Teknis & Handover](#9-dokumentasi-teknis--handover)

---

## 1. Arsitektur & Nilai Tambah Sistem

```text
[ Klien AI: Cursor / Claude Code / Windsurf / Python SDK / cURL ]
                                │
             HTTPS (Authorization: Bearer jt-live-xxxx)
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Juragan Token Gateway Engine                         │
│  • Endpoint OpenAI-Compatible (/v1/chat/completions & /v1/models)      │
│  • Autentikasi SHA-256 Zero-Knowledge & Validasi Saldo IDR             │
│  • Rate Limiting (RPM & Stream Concurrency Guard)                      │
│  • Atomic Token Metering & Pemotongan Saldo IDR                        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         (Hybrid Gemini Fallback)          (Central Engine Pass-Through)
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────────┐
       │ Google Gemini Direct   │      │ https://api.tokotokenai.com/v1│
       │ (GEMINI_API_KEY)       │      │ Claude, GPT, DeepSeek, Qwen   │
       └────────────────────────┘      └───────────────────────────────┘
```

### Keunggulan Utama
1. **Pembayaran Lokal IDR:** Pembelian kredit mulai **Rp 15.000** mendukung QRIS, Virtual Account (BCA, Mandiri, BRI, BNI, SeaBank, Permata, CIMB, BSI), serta e-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja).
2. **Standar OpenAI-Compatible:** Endpoint `/api/v1` dan rewrite `/v1` langsung kompatibel dengan SDK `openai`, Cursor IDE, Claude Code CLI, Windsurf, Continue, Chatbox, dan Aider.
3. **Saldo Berlaku Permanen:** Tidak ada hangus saldo bulanan; mendukung mode **Beli Baru** maupun **Top-Up Key Lama**.
4. **Kriptografi Zero-Knowledge:** Server hanya menyimpan hash **SHA-256** dari API Key di Supabase PostgreSQL. Kunci mentah `jt-live-...` hanya ditampilkan satu kali saat transaksi lunas dan dikirim melalui email invoice HTML (dengan ikon badge inline CID).

---

## 2. Tech Stack

- **Framework:** [Next.js 16.4.2](https://nextjs.org/) (App Router, Turbopack, Cache Components)
- **UI Engine:** [React 19.3.0](https://react.dev/) + Modular CSS Design System (`globals.css`)
- **Bahasa:** [TypeScript 5.x](https://www.typescriptlang.org/) (Strict Mode)
- **Database:** [Supabase PostgreSQL](https://supabase.com/) (RLS + Stored Procedure Atomic Deduct + Local Failover Store)
- **Email Transaksional:** [Nodemailer](https://nodemailer.com/) (Gmail SMTP / App Password dengan inline PNG CID badge)
- **Keamanan:** Node.js `crypto` (SHA-256 Key Hashing, HMAC Webhook Verification, `timingSafeEqual`, Fail-Closed Auth)

---

## 3. Struktur Direktori Proyek

```text
juragan-token-web/
├── docs/                                # Spesifikasi Teknis, Handover, & Audit Keamanan
│   ├── ARCHITECTURE.md                  # System design, algoritma metering, & DDL database
│   ├── DEV_HANDOVER.md                  # Panduan handover 2 kredensial (Payment & LLM Key)
│   ├── PRD_JURAGAN_TOKEN.md             # Product Requirement Document (v2.4.0)
│   └── audits/                          # Laporan audit keamanan & QA
├── public/                              # Aset Statis Publik
│   ├── assets/
│   │   ├── AI-Logo/                     # Logo vektor provider AI
│   │   ├── email/                       # Badge centang email struk (success-check-badge.png)
│   │   └── payment-logos/               # 17 logo vektor Bank, QRIS, & e-Wallet
│   └── images/                          # Aset gambar & template QRIS
├── scripts/                             # Utilitas Developer & Pengujian
│   ├── make-badge.cjs                   # Generator PNG badge email identik PaymentSuccessMark
│   ├── security-audit.cjs               # Uji deteksi kebocoran secret di HTML & JS chunks
│   └── test-errors.cjs                  # Suite 13 pengujian validasi & keamanan endpoint
├── src/
│   ├── app/                             # Next.js App Router (Pages & API Routes)
│   │   ├── api/
│   │   │   ├── keys/check/              # POST: Cek saldo IDR, status, & 10 usage_logs terakhir
│   │   │   ├── models/sync/             # GET: Sinkronisasi kurs USD/IDR & katalog model
│   │   │   ├── orders/                  # POST: Buat order checkout & adapter gateway
│   │   │   │   └── [id]/                # GET: Polling status order (+ /confirm untuk admin/demo)
│   │   │   ├── supabase/status/         # GET/POST: Health check 4 pilar & sync DB
│   │   │   ├── test-email/              # GET: Diagnostic SMTP email (terproteksi ADMIN_SECRET)
│   │   │   ├── webhooks/payment/        # POST: Webhook Tripay, Midtrans, Xendit (fail-closed)
│   │   │   └── v1/                      # OpenAI-Compatible AI Gateway (/chat/completions, /models)
│   │   ├── docs/                        # Dokumentasi integrasi & interactive tester
│   │   ├── status/                      # Halaman status kesiapan 4 pilar sistem
│   │   ├── privacy/ & terms/            # Kebijakan Privasi & Syarat Ketentuan
│   │   ├── globals.css                  # Design system & responsive styles
│   │   ├── layout.tsx                   # Root layout + widget FloatingWhatsApp
│   │   └── page.tsx                     # Landing page katalog & checkout utama
│   ├── components/                      # Komponen UI terstruktur (modals, sections, ui)
│   ├── data/                            # Katalog 66 model AI, paket ritel, & channel bayar
│   ├── lib/                             # Gateway, keys, orders, payment-gateway, receipt-email, supabase-sync
│   └── types/                           # Definisi TypeScript interfaces
├── supabase/                            # Migrasi SQL, setup_all.sql, & seed data
├── .env.example                         # Template variabel environment siap handover
├── DESIGN.md                            # Pedoman desain visual & token warna
├── package.json                         # Dependensi & npm scripts (v2.3.0)
└── README.md                            # Dokumentasi utama repositori
```

---

## 4. Panduan Menjalankan Lokal (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) v18.18+ atau v20+
- `npm`

### Langkah Instalasi
```bash
git clone https://github.com/Whyzenn07/juragan-token-web.git
cd juragan-token-web
npm install
```

Salin template environment dan sesuaikan kredensial lokal Anda:
```bash
cp .env.example .env.local
```

Jalankan server development:
```bash
npm run dev
```
Buka **[http://localhost:3000](http://localhost:3000)** di browser.

### Verifikasi Build, Keamanan, & Pengujian Error
```bash
# 1. Validasi TypeScript
npx tsc --noEmit

# 2. Build produksi Next.js
npm run build

# 3. Jalankan server produksi lokal lalu uji audit & suite error (13/13 test)
npm run start
node scripts/security-audit.cjs
node scripts/test-errors.cjs
```

---

## 5. Konfigurasi Environment (`.env.local`)

Referensi lengkap tersedia pada [`.env.example`](.env.example). Ringkasan variabel utama:

```ini
# 1. Upstream LLM Engine (Handover Item #1)
GATEWAY_BASE_URL="https://api.tokotokenai.com/v1"
UPSTREAM_ENGINE_URL="https://api.tokotokenai.com/v1"
UPSTREAM_ENGINE_KEY=""                  # Isi dengan Master API Key https://api.tokotokenai.com/v1
UPSTREAM_ROUTE_ALL="false"              # "true" untuk merutekan semua model ke Central Engine
GEMINI_API_KEY="AIzaSy..."              # Direct Gemini fallback engine

# 2. Payment Gateway Adapter (Handover Item #2)
PAYMENT_GATEWAY_PROVIDER="manual"       # "manual" | "tripay" | "midtrans" | "xendit"
PAYMENT_GATEWAY_SANDBOX="false"
DEMO_MODE="true"                        # Ubah ke "false" saat Payment Gateway live
NEXT_PUBLIC_DEMO_MODE="true"
# Kredensial spesifik provider: TRIPAY_*, MIDTRANS_*, XENDIT_* (lihat .env.example)

# 3. Domain, WhatsApp CS, & Email Struk
NEXT_PUBLIC_APP_URL="https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app"
NEXT_PUBLIC_WHATSAPP_NUMBER="6281226983990"
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
GMAIL_FROM_NAME="Juragan Token Indonesia"

# 4. Supabase Cloud & Secret Admin
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-publishable-or-anon-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-or-anon-key"
SUPABASE_SECRET_KEY="your-supabase-service-role-secret-key"
ADMIN_SECRET="your-random-32-chars-secret"
```

---

## 6. Spesifikasi API Gateway & Endpoint

### 1. AI Chat Completions (OpenAI-Compatible)
- **Endpoint:** `POST /api/v1/chat/completions` *(rewrite aktif: `POST /v1/chat/completions`)*
- **Header:**
  ```http
  Authorization: Bearer jt-live-xxxxxxxxxxxxxxxxxxxx
  Content-Type: application/json
  ```
- **Response Headers Tambahan:**
  - `x-juragan-model` — Model yang dieksekusi di upstream
  - `x-juragan-cost-idr` — Biaya rupiah yang dipotong pada request ini
  - `x-juragan-balance-remaining-idr` — Sisa saldo IDR API Key

### 2. Cek Saldo & Riwayat Pemakaian
- **Endpoint:** `POST /api/keys/check`
- **Body:** `{ "key": "jt-live-xxxx" }`
- **Response:** Nama paket, sisa saldo IDR, status aktif, dan hingga 10 entri `usage_logs` terakhir.

### 3. Endpoint Pendukung & Operasional
- `GET /api/v1/models` — Daftar seluruh model katalog dalam format OpenAI `/v1/models`.
- `GET /api/models/sync` — Sinkronisasi kurs USD/IDR real-time & estimasi biaya token.
- `POST /api/orders` & `GET /api/orders/[id]` — Pembuatan invoice checkout & polling status pembayaran.
- `POST /api/webhooks/payment` — Penerima webhook Tripay / Midtrans / Xendit (fail-closed signature verification).
- `GET /api/supabase/status` — Status 4 pilar sistem (Supabase, Email, Payment Gateway, Upstream Engine).

---

## 7. Skema Database & Keamanan

- **Dual-Persistence:** Menggunakan **Supabase PostgreSQL** (`orders`, `keys`, `usage_logs`) dengan stored procedure atomik (`deduct_key_balance`) serta fallback penyimpanan lokal yang diabaikan oleh Git (`/data/`, `/backups/`).
- **Kebersihan Secret & Keamanan:**
  - File `.env*` (kecuali template `.env.example`) tidak pernah di-commit ke Git dan dilindungi di [`.gitignore`](.gitignore).
  - Seluruh webhook pembayaran & endpoint admin (`/api/orders/[id]/confirm`, `/api/test-email`, `POST /api/supabase/status`) menerapkan verifikasi HMAC/secret secara *fail-closed* (`timingSafeEqual`).
  - Skrip migrasi lengkap tersedia di [`supabase/setup_all.sql`](supabase/setup_all.sql) dan [`supabase/migrations/`](supabase/migrations/).

---

## 8. Panduan Integrasi Klien (Cursor, Python, cURL)

> Untuk menguji langsung ke deployment Vercel saat ini, gunakan Base URL:
> **`https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1`**

### A. Cursor IDE / Windsurf / Cline
1. Buka **Settings → Models** (atau OpenAI Compatible Provider).
2. Aktifkan **Override OpenAI Base URL** dan isi:
   `https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1`
3. Masukkan API Key `jt-live-...` hasil checkout/simulasi.

### B. Python (`openai` SDK)
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1",
    api_key="jt-live-xxxx",
)

stream = client.chat.completions.create(
    model="gemini-2.5-flash",
    messages=[{"role": "user", "content": "Halo! Jelaskan cara kerja API gateway."}],
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

### C. cURL Quick Test
```bash
curl -X POST "https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/v1/chat/completions" \
  -H "Authorization: Bearer jt-live-xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Tes koneksi Juragan Token"}]
  }'
```

---

## 9. Dokumentasi Teknis & Handover

- 🚀 **[DEV_HANDOVER.md](docs/DEV_HANDOVER.md)** — Panduan serah terima 2 kredensial akhir (Payment Gateway & Upstream Master API Key `api.tokotokenai.com/v1`)
- 📘 **[PRD_JURAGAN_TOKEN.md](docs/PRD_JURAGAN_TOKEN.md)** — Product Requirement Document (v2.4.0)
- 🏗️ **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Arsitektur teknis, diagram alir, & DDL PostgreSQL
- 🛡️ **[audit-002-2026-11-13.md](docs/audits/audit-002-2026-11-13.md)** — Laporan audit keamanan & QA terbaru
- 🎨 **[DESIGN.md](DESIGN.md)** — Pedoman visual & sistem desain UI

---

## 🛡️ Lisensi & Kontribusi

Seluruh hak cipta dimiliki oleh **Juragan Token Indonesia**. Untuk kontribusi tim internal, pastikan lulus pemeriksaan `npx tsc --noEmit`, `npm run build`, `node scripts/security-audit.cjs`, dan `node scripts/test-errors.cjs` sebelum melakukan merge ke branch `main`.
