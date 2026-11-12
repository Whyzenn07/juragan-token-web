# 🪐 Juragan Token — Universal AI Gateway & Multi-AI Prepaid Token Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase_PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)
[![Version](https://img.shields.io/badge/Release-v1.0.0--stable-emerald)](#)

> **Platform marketplace kredit API AI prabayar pertama di Indonesia.** Akses model frontier kelas dunia (**Claude 3.5 Sonnet, Claude Opus, OpenAI GPT-4o, DeepSeek V3, Google Gemini, Alibaba Qwen**) menggunakan **1 Virtual API Key (`jt-live-...`)** terpadu berbasis mata uang Rupiah (IDR) tanpa kartu kredit internasional.

---

## 📑 Daftar Isi

- [1. Arsitektur & Gambaran Umum Sistem](#1-arsitektur--gambaran-umum-sistem)
- [2. Tech Stack](#2-tech-stack)
- [3. Struktur Direktori Proyek](#3-struktur-direktori-proyek)
- [4. Panduan Memulai Cepat (Quick Start)](#4-panduan-memulai-cepat-quick-start)
- [5. Konfigurasi Environment (.env.local)](#5-konfigurasi-environment-envlocal)
- [6. Spesifikasi API Gateway & Endpoint](#6-spesifikasi-api-gateway--endpoint)
- [7. Skema Database & Persistensi](#7-skema-database--persistensi)
- [8. Panduan Integrasi Klien (Cursor, Claude Code, Python)](#8-panduan-integrasi-klien-cursor-claude-code-python)
- [9. Dokumen Arsitektur & PRD](#9-dokumen-arsitektur--prd)

---

## 1. Arsitektur & Gambaran Umum Sistem

Juragan Token menghubungkan ekosistem pembayaran lokal Indonesia dengan API model AI global:

```
[ Klien AI: Cursor / Windsurf / Claude Code / Chatbox / Python ]
                               │
            (HTTPS: Authorization: Bearer jt-live-xxxx)
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Juragan Token Gateway Engine                         │
│  • Endpoint OpenAI-Compatible (/api/v1/chat/completions)               │
│  • Autentikasi SHA-256 Zero-Knowledge & Cek Status Saldo IDR           │
│  • Rate Limiting & Stream Sanitizer (SSE Real-Time)                    │
│  • Atomic Token Metering & Saldo IDR Deduction                         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
            (Direct Master Key)              (Pass-Through / Proxy)
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────────┐
       │ Google Gemini Studio   │      │ Central Engine / Upstream LLM │
       │ (gemini-3.5-flash-lite)│      │ Claude Sonnet, GPT-4o,        │
       │                        │      │ DeepSeek V3, Alibaba Qwen     │
       └────────────────────────┘      └───────────────────────────────┘
```

### Nilai Tambah Utama:
1. **Bebas Kartu Kredit Internasional**: Pembelian kredit instan mulai **Rp 15.000** via **QRIS**, Virtual Account (BCA, Mandiri, BRI, BNI, SeaBank, Permata, CIMB, BSI), dan e-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja).
2. **Universal OpenAI-Compatible**: URL `https://juragantoken.com/v1` langsung cocok dengan SDK resmi `openai` di Node.js/Python, Cursor IDE, Claude Code CLI, LibreChat, Chatbox, dan Aider.
3. **Masa Aktif Selamanya**: Saldo prabayar berlaku permanen tanpa sistem kedaluwarsa bulanan (*no use-it-or-lose-it*).
4. **Keamanan Kriptografis Zero-Knowledge**: Server hanya menyimpan hash SHA-256 dari API Key. Kunci mentah `jt-live-...` hanya ditampilkan satu kali ke pembeli saat checkout berhasil dan dikirimkan via email tanda terima.

---

## 2. Tech Stack

- **Framework**: [Next.js 16.4.2](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **UI Engine**: [React 19.3.0](https://react.dev/) + Vanilla CSS Modular (Design System 1200px Centered Container)
- **Bahasa**: [TypeScript 5.x](https://www.typescriptlang.org/) (Strict Mode)
- **Database & Auth**: [Supabase](https://supabase.com/) (Managed PostgreSQL, RPC Stored Procedures, Dual-Sync Fallback)
- **Email Transaksional**: [Nodemailer](https://nodemailer.com/) (Gmail SMTP / Google Workspace App Password)
- **Kriptografi**: Node.js `crypto` (SHA-256 Hashing, CSPRNG Token Generation, Safe Timing Equality)

---

## 3. Struktur Direktori Proyek

```
juragan-token-web/
├── docs/                                # Dokumentasi Spesifikasi & Arsitektur
│   ├── ARCHITECTURE.md                  # System Design, Algoritma, & Database DDL
│   ├── DEV_HANDOVER.md                  # Panduan Handover 2 Kredensial (Payment & LLM Key)
│   ├── PRD_JURAGAN_TOKEN.md             # Product Requirement Document (PRD v2.4.0)
│   └── audits/                          # Laporan Audit Kepatuhan & Keamanan
├── public/                              # Aset Statis Publik
│   ├── assets/
│   │   ├── AI-Logo/                     # Vektor Logo Provider AI (Anthropic, OpenAI, dll)
│   │   ├── email/                       # Aset Badge Centang Retina Struk Email
│   │   └── payment-logos/               # 17 Logo Vektor Resmi Bank & E-Wallet (BCA, Mandiri, QRIS)
│   └── images/                          # Aset Gambar & Template QRIS Resmi
├── scripts/                             # Utilitas Build, Audit Keamanan, & Generator Badge
├── src/
│   ├── app/                             # Next.js App Router (Halaman & Endpoint)
│   │   ├── api/                         # REST API Route Handlers
│   │   │   ├── keys/check/              # POST: Cek Saldo, Status, & 10 Usage Logs Terakhir
│   │   │   ├── models/sync/             # GET: Sinkronisasi Kurs BI/Forex & Katalog Gateway
│   │   │   ├── orders/                  # POST: Buat Invoice Order Baru (Outbound Gateway)
│   │   │   │   └── [id]/                # GET: Polling Status Order
│   │   │   │       └── confirm/         # POST: Konfirmasi Pembayaran (Simulasi/Admin)
│   │   │   ├── supabase/status/         # GET/POST: Health Check 4 Pilar & Sinkronisasi DB
│   │   │   ├── test-email/              # GET: Diagnostic Test SMTP Gmail
│   │   │   ├── webhooks/payment/        # POST: Universal Webhook (Tripay, Midtrans, Xendit)
│   │   │   └── v1/                      # AI Gateway (OpenAI Compatible)
│   │   │       ├── chat/completions/    # POST: AI Inference Proxy, Rate-Limit, & Billing
│   │   │       └── models/              # GET: Daftar Model Tersedia (/v1/models)
│   │   ├── docs/                        # Halaman Dokumentasi Integrasi & Interactive Tester
│   │   ├── status/                      # Halaman Status Uptime & Kesiapan 4 Pilar Sistem
│   │   ├── privacy/                     # Kebijakan Privasi
│   │   ├── terms/                       # Syarat & Ketentuan Layanan
│   │   ├── globals.css                  # Core Design System, Utility, & Responsive Layout
│   │   ├── layout.tsx                   # Master Root Layout + Floating WhatsApp Widget
│   │   └── page.tsx                     # Landing Page (Katalog, Checkout, Setup Guide)
│   ├── components/                      # UI Components Terstruktur
│   │   ├── modals/                      # Modal Interaktif
│   │   │   ├── PaymentModal.tsx         # Checkout Modal, Tiket QRIS Enterprise & VA
│   │   │   ├── TokenBalanceModal.tsx    # Modal Cek Saldo & Riwayat Pemakaian (usage_logs)
│   │   │   ├── CurrencyRateModal.tsx    # Modal Kurs Real-time Bank Indonesia
│   │   │   ├── ModelDetailModal.tsx     # Modal Detail Spesifikasi & Biaya per Model
│   │   │   └── Dialog.tsx               # Accessible Modal Wrapper
│   │   ├── sections/                    # Komponen Seksi Landing Page
│   │   │   ├── SavingsCalculator.tsx    # Kalkulator Penghematan Token Interaktif
│   │   │   └── SetupGuides.tsx          # Panduan Integrasi Klien AI
│   │   └── ui/                          # Atomik UI (Icon, FloatingWhatsApp, PaymentSuccessMark, dll)
│   ├── data/                            # State Katalog & Definisi Produk
│   │   └── catalog.ts                   # 66 Model AI Terkurasi, Paket Ritel, & Channel Bayar
│   ├── lib/                             # Core Logic & Backend Services
│   │   ├── gateway.ts                   # Autentikasi Gateway, Rate-Limit, & Metering
│   │   ├── keys.ts                      # Generator Kunci Kriptografis, Hashing, & Rate Limiter
│   │   ├── orders.ts                    # Transaksi Order, Lifecycle Status, & Delivery Kunci
│   │   ├── payment-gateway.ts           # Outbound Plug-and-Play Adapter (Tripay/Midtrans/Xendit)
│   │   ├── receipt-email.ts             # Template & Transporter Email Nodemailer
│   │   ├── store.ts                     # Penyimpanan Lokal Atomik (Failover Fallback)
│   │   └── supabase-sync.ts             # REST Client Sinkronisasi Supabase Cloud
│   └── types/                           # Definisi TypeScript Interfaces
├── supabase/                            # Skrip Database & Migrasi PostgreSQL
│   ├── migrations/                      # Skrip Migrasi SQL Berurutan
│   ├── setup_all.sql                    # Skrip Inisialisasi Skema Lengkap + RPC Atomic Deduct
│   └── seed.sql                         # Data Awal / Seeder
├── .env.example                         # Contoh Format Environment Variables (Siap Handover)
├── package.json                         # Dependensi Node.js & Script NPM
├── tsconfig.json                        # Konfigurasi TypeScript Compiler
└── README.md                            # Dokumentasi Pengembang Ini
```

---

## 4. Panduan Memulai Cepat (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) v18.18+ atau v20+
- NPM atau PNPM

### 1. Clone Repositori & Install Dependensi
```bash
git clone https://github.com/Whyzenn07/juragan-token-web.git
cd juragan-token-web
npm install
```

### 2. Konfigurasi Environment
Salin template environment:
```bash
cp .env.example .env.local
```
Sesuaikan variabel di file `.env.local` (lihat panduan pada [Bagian 5](#5-konfigurasi-environment-envlocal)).

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka browser di **[http://localhost:3000](http://localhost:3000)**.

### 4. Validasi Type Check & Build
```bash
# Validasi tipe TypeScript bebas error
npx tsc --noEmit

# Validasi build bundle Next.js
npm run build
```

---

## 5. Konfigurasi Environment (.env.local)

```ini
# ==============================================================================
# JURAGAN TOKEN - ENVIRONMENT VARIABLES
# ==============================================================================

# 1. Base URL Gateway
GATEWAY_BASE_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_GATEWAY_URL="http://localhost:3000/api/v1"

# 2. Master Key Upstream AI (Direct Engine)
# Dapatkan di: https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSy..."

# 3. Upstream Central Engine (Pass-Through Model Frontier)
UPSTREAM_ENGINE_URL="https://api.tokotokenai.com/v1"
UPSTREAM_ENGINE_KEY=""

# 4. Transaksional Email (Gmail SMTP / Google Workspace)
# Sandi Aplikasi 16 Karakter dari https://myaccount.google.com/apppasswords
GMAIL_USER="halo@juragantoken.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
GMAIL_FROM_NAME="Juragan Token Indonesia"

# 5. Nomor Layanan Pelanggan WhatsApp (Format: 628xxxxxxxxxx)
NEXT_PUBLIC_WHATSAPP_NUMBER="6281226983990"

# 6. Mode Pembayaran & Keamanan
# Set "true" untuk menampilkan tombol Simulasi Bayar di modal checkout (staging)
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
ADMIN_SECRET="ganti_dengan_string_acak_panjang_untuk_konfirmasi_manual"

# 7. Supabase PostgreSQL Cloud (Opsional tapi Direkomendasikan)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-or-publishable-key"
```

---

## 6. Spesifikasi API Gateway & Endpoint

### 1. AI Chat Completions (OpenAI Compatible)
- **Endpoint**: `POST /api/v1/chat/completions` *(atau via rewrite: `POST /v1/chat/completions`)*
- **Header**:
  ```http
  Authorization: Bearer jt-live-xxxxxxxxxxxxxxxxxxxx
  Content-Type: application/json
  ```
- **Payload**:
  ```json
  {
    "model": "gemini-3.5-flash-lite",
    "messages": [
      { "role": "user", "content": "Halo, buatkan fungsi kalkulasi diskon di TypeScript!" }
    ],
    "stream": true
  }
  ```
- **Response Headers**:
  - `x-juragan-model`: Model yang dieksekusi di upstream.
  - `x-juragan-cost-idr`: Nominal rupiah yang dipotong dari saldo.
  - `x-juragan-balance-remaining-idr`: Sisa saldo kredit API Key.

### 2. Cek Saldo Kunci
- **Endpoint**: `POST /api/keys/check`
- **Body**: `{ "key": "jt-live-xxxx" }`
- **Response**: Mengembalikan nama paket, sisa saldo IDR, tanggal aktif, dan status.

### 3. Sinkronisasi Kurs & Model
- **Endpoint**: `GET /api/models/sync`
- **Deskripsi**: Mengambil kurs real-time USD/IDR dari API Forex dan menyinkronkan rasio pricing token terkini.

---

## 7. Skema Database & Persistensi

Proyek ini menggunakan arsitektur **Dual-Persistence**:
1. **Primary Cloud**: Managed PostgreSQL di Supabase Cloud (tabel `orders`, `keys`, `usage_logs`).
2. **Local Fallback**: File penyimpanan terenkripsi di `.data/store.json` untuk failover otomatis jika koneksi internet server ke Supabase terputus sesaat.

Skrip SQL lengkap untuk menginisialisasi tabel, indeks, dan stored procedure atomik tersedia di:
- [`supabase/setup_all.sql`](supabase/setup_all.sql)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#3-skema-database-postgresql)

---

## 8. Panduan Integrasi Klien (Cursor, Claude Code, Python)

### A. Konfigurasi Cursor AI
1. Buka **Cursor Settings** $\rightarrow$ **Models**.
2. Centang **Override OpenAI Base URL**.
3. Masukkan Base URL: `https://juragantoken.com/api/v1`
4. Masukkan API Key: `jt-live-xxxx` Anda.
5. Tambahkan model yang diinginkan (misal: `claude-3-5-sonnet`, `gpt-4o`, `gemini-3.5-flash-lite`).

### B. Python SDK Resmi OpenAI
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://juragantoken.com/api/v1",
    api_key="jt-live-xxxx"
)

response = client.chat.completions.create(
    model="gemini-3.5-flash-lite",
    messages=[{"role": "user", "content": "Jelaskan konsep arsitektur microservices!"}],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
```

---

## 9. Dokumen Arsitektur & PRD

Untuk tim developer, lead architect, dan QA engineer yang ingin meninjau spesifikasi teknis lebih dalam:
- 🚀 **[DEV_HANDOVER.md](docs/DEV_HANDOVER.md)**: Panduan Handover 2 Kredensial Terakhir (Payment Gateway & Master API Key `https://api.tokotokenai.com/v1`).
- 📘 **[PRD_JURAGAN_TOKEN.md](docs/PRD_JURAGAN_TOKEN.md)**: Product Requirement Document lengkap, metrik produk, dan user flow.
- 🏗️ **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Arsitektur teknis, diagram alir, algoritma pemotongan saldo atomik, dan panduan keamanan.
- 🎨 **[DESIGN.md](DESIGN.md)**: Standar desain visual, token warna fintech, dan pedoman tipografi.

---

## 🛡️ Lisensi & Kontribusi

Seluruh hak cipta dimiliki oleh **Juragan Token Indonesia**. Proyek ini dikembangkan untuk kebutuhan operasional komersial. Untuk kontribusi tim internal, buat pull request ke branch `main` dengan menyertakan pengujian type check `npx tsc --noEmit`.
