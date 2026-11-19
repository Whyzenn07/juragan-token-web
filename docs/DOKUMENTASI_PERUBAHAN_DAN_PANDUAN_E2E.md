# Dokumentasi Perubahan & Panduan Penggunaan End-to-End — Juragantoken (v3 Enterprise + Standard)

**Entitas Resmi:** PT Rejeki Digital Cemerlang  
**Branch Pengembangan:** `feat/enterprise-revamp-v3`  
**Stack Teknologi:** Next.js `16.4.2` (App Router + Turbopack + `proxy.ts`), React `19.3`, TypeScript `5`, Supabase Auth & PostgreSQL, Nodemailer Gmail SMTP  
**Arsitektur Utama:** **1 Universal API Key (`jt-live-...`)** untuk mengakses 100+ model AI lintas 10 provider global & Asia — dirancang untuk **Enterprise B2B** (IP Whitelist, Invoice B2B, Faktur Pajak PT) sekaligus **fleksibel untuk Standard** (Developer, Startup, & Individu).

---

## 1. Ringkasan Perubahan dari Awal hingga Akhir

Seluruh pengembangan pada branch `feat/enterprise-revamp-v3` mencakup **7 fase utama**:

### Fase 1 — Transformasi Company Profile & Sistem Desain Royal Blue + Pure White (`fb572d1` – `258962b`)
- **Feature Flag Checkout (`src/lib/site-config.ts`)**: `ENABLE_CHECKOUT = false` secara default agar halaman depan tampil bersih sebagai Company Profile & Katalog Keahlian Model AI tanpa harga ritel.
- **Floating Pill Navbar (`src/app/page.tsx`, `src/app/landing.css`)**: Navbar kapsul melayang dengan brand `juragantoken.`, navigasi utama (`Solusi`, `Integrasi`, `Keunggulan`, `Panduan`, `FAQ`), dan aksi kanan yang ringkas.
- **Hero Balanced Motion Frame (`src/components/landing/HeroOrbit.tsx`)**: Headline 2 baris dengan animasi slide-down kata bergantian, tombol cepat provider, pill model aktif interaktif, serta orbit polar SVG yang terpusat matematis mengelilingi logo Juragantoken.
- **Pure White AI Brand Marquee (`src/components/landing/LogoMarquee.tsx`)**: Latar putih bersih tanpa kotak/kapsul, hanya menampilkan logo dan nama 10 ekosistem AI (`Claude`, `OpenAI`, `Gemini`, `Grok`, `DeepSeek`, `Qwen`, `Kimi`, `MiniMax`, `GLM`, `ByteDance`).
- **Showcase Keahlian & Arsitektur Gateway (`ModelExpertiseShowcase.tsx`, `GatewayFlow.tsx`)**: Tab rekomendasi berdasarkan kebutuhan (`Ngoding & Arsitektur`, `Riset & Penalaran`, `Hemat & Efisien`) bernuansa Royal Blue mix putih, plus diagram routing SVG animasi & 3 kartu langkah.

### Fase 2 — Kurasi 54 Model AI Simetris & Tombol Putih Tunggal 100+ Model (`f563c1c` – `5bd0741`)
- **Katalog 54 Model Terkurasi Tanpa Duplikat (`src/data/catalog.ts`)**: Menggunakan ID model asli dari gateway `api.tokotokenai.com` tanpa duplikat, dengan jumlah setiap kategori habis dibagi 3 sehingga grid 3 kolom desktop (dan 2 kolom untuk total 54) tidak memiliki ruang kosong:
  - `Semua`: **54** | `Ngoding`: **21** | `Tugas & Riset`: **12** | `Chat Hemat`: **15** | `Gambar`: **6**
- **1 Tombol CTA Putih Tunggal (`src/app/page.tsx`, `src/app/landing.css`)**: Mengganti kontrol expand/collapse ganda dan teks status counter dengan satu tombol putih bersih **`Tampilkan 100+ Model Lainnya ↗`** yang mengarah ke `https://api.tokotokenai.com/model-picker`.

### Fase 3 — Penambahan Elemen Pendukung Lengkap (`78779b5`)
- **Metrik Infrastruktur (`PlatformMetricsBar.tsx`)**: 4 kartu angka utama (`100+ Model`, `10 Provider`, `99.98% SLA + Cek Status Live ↗`, `TLS 1.3 Zero-Training`).
- **Skenario Penerapan Nyata (`UseCasesGrid.tsx`)**: 4 kartu segmen pengguna dengan 1-klik filter langsung ke katalog.
- **Pre-Footer Final CTA (`PreFooterCta.tsx`)**: Banner penutup setelah FAQ menuju WhatsApp, Cek Saldo Key, dan Dokumentasi.
- **Footer Live Status Badge & Floating Back-to-Top (`BackToTop.tsx`)**: Indikator hijau operasional menuju `/status` di footer serta tombol kembali ke atas melayang di atas Floating WhatsApp.

### Fase 4 — Autentikasi Gmail, Portal Pengguna (`/dashboard`) & Panel Admin Minimalis (`/admin`) (`5bc5836` – `213af41`)
- **Navbar Auth**: Tombol `Hubungi Tim` dan tautan redundant `Docs` di Navbar diganti menjadi **`Sign In`** (`/login`) & **`Sign Up`** (`/signup`) — dan otomatis berubah menjadi **`Admin Panel`** / **`Dashboard`** + **`Keluar`** setelah login.
- **Keamanan Sesi & RBAC (`src/lib/auth.ts`, `src/proxy.ts`)**:
  - Sesi disimpan pada **HttpOnly Cookie** (`SameSite=Lax`, `Secure` di produksi).
  - Mendukung **Google OAuth (PKCE via Supabase Auth)** + **Email & Kata Sandi**, serta mode fallback development lokal (`scrypt` + HMAC-SHA256) yang otomatis non-aktif di produksi.
  - `src/proxy.ts` (Next.js 16) mengarahkan akses tanpa sesi ke `/login?next=...`, dan setiap route `/api/admin/**` memverifikasi `requireAdmin()` di server (`401` / `403`).
- **Panel Admin Minimalis (`/admin`)**:
  - **Ringkasan**: KPI real-time (Pesanan Pending, Transaksi Lunas, API Key Aktif, Akun Gmail Terdaftar).
  - **Pesanan Masuk**: Filter status, pencarian, 1-klik **Setujui & Terbitkan Key**, **Expired**, dan **+ Pesanan Manual**.
  - **User Gmail & API Key**: Daftar akun Gmail terdaftar & semua API Key terhubung (`jt-live-••••••••XXXX`), modal **+ Integrasikan API Key ke Gmail**, **± Saldo**, **Suspend / Aktifkan**, **Rotasi Key**, **Revoke**, dan **One-Time Reveal** (Zero-Knowledge SHA-256).
  - **Audit Log**: Pencatatan kronologis setiap tindakan admin.
- **Portal Pengguna (`/dashboard`)**: Melihat saldo aktif, daftar API Key terintegrasi akun Gmail sendiri, salin Base URL, riwayat pesanan, dan form **+ Ajukan Pesanan Token**.
- **Security Headers & Tipografi (`next.config.ts`, `portal.css`)**: Penambahan `Strict-Transport-Security` & `Content-Security-Policy` dengan izin `https://fonts.googleapis.com` & `https://fonts.gstatic.com` agar font asli **`Plus Jakarta Sans`** dan **`IBM Plex Sans`** tampil konsisten di seluruh halaman.

### Fase 5 — Penyelarasan PDF 12 Slide (`PT Rejeki Digital Cemerlang`) & Enterprise IP Whitelist (`da5ae6d`)
- **Dual-Track Enterprise B2B + Standard Fleksibel (`EnterpriseStandardSection.tsx`, `WhyChooseUs.tsx`)**:
  - Menampilkan solusi atas 3 risiko divisi (`Tim IT`, `Tim Purchasing`, `Legal & Compliance`), alur *Transformasi Proses* tanpa reimbursement, serta legalitas resmi **`PT Rejeki Digital Cemerlang`** (Faktur Pajak, Invoice B2B IDR, Dukungan Principal, tabel komparasi netral, WA testing `0812-2698-3990`).
- **Kontrol Keamanan Enterprise IP Whitelist (`src/lib/gateway.ts`, `/api/v1/chat/completions`, `/admin`, `/dashboard`)**:
  - Migrasi SQL `supabase/migrations/20261120010000_enterprise_tier_ip_whitelist.sql` menambahkan `account_tier` (`standard` | `enterprise`), `company_name`, `department`, `requires_tax_invoice`, `npwp`, dan `allowed_ips`.
  - Di gateway `/api/v1/chat/completions`: jika `allowed_ips` kosong (**Standard**), API Key fleksibel dipakai dari mana saja; jika diisi (**Enterprise**), IP di luar daftar otomatis ditolak **`403 ip_not_whitelisted_or_inactive`**.
  - Mendukung **Top-Up ke API Key Eksisting** (Dual-Lifecycle sesuai PRD) agar pengguna tidak perlu mengganti API Key di IDE.

### Fase 6 — Perbaikan Bug Double Scrollbar & Optimasi Animasi Scroll Dua Arah (`a441695` + perbaikan terbaru)
- **Fix Bug Double Scrollbar (`src/app/globals.css`, `src/app/landing.css`)**:
  - Menghapus `overflow-x: hidden` ganda pada `html, body` (yang memicu nested vertical scroll container di Chrome/Edge Windows) dan menggantinya dengan `overflow-x: clip` pada `html` & `.site-canvas` serta `overflow: visible` pada `body`.
- **Slide + Fade Scroll Animation Lebih Cepat & Smooth (`src/app/page.tsx`, `src/app/landing.css`)**:
  - `IntersectionObserver` menggunakan `rootMargin: "48px 0px 48px 0px"` dan `threshold: 0.01` sehingga elemen mulai muncul lebih awal sebelum telat di layar.
  - Jarak slide dirapikan menjadi `14px` dengan durasi cepat `0.28s–0.32s` (`cubic-bezier(0.22, 1, 0.36, 1)`) dan micro-stagger maksimal `90ms`, bekerja halus dua arah (scroll ke bawah maupun scroll ke atas).

---

## 2. Peta Rute Halaman & API

| Rute | Akses | Fungsi |
| :--- | :--- | :--- |
| `/` | Publik | Landing Page Company Profile, Katalog 54 Model, Solusi Enterprise + Standard |
| `/login` & `/signup` | Publik | Autentikasi Google (Gmail) OAuth & Email/Password |
| `/dashboard` | Login (`user` / `admin`) | Portal Akun Gmail: lihat 1 Universal API Key, saldo, status IP, & ajukan pesanan/top-up |
| `/admin` | Khusus `admin` | Dashboard Manajemen Pesanan, Akun Gmail, API Key, Saldo, IP Whitelist, & Audit Log |
| `/docs` | Publik | Dokumentasi integrasi API Gateway (Cursor, Claude Code, Python, cURL) |
| `/status` | Publik | Pemantauan status live Gateway & Supabase |
| `/api/auth/*` | Publik / Sesi | `login`, `signup`, `google`, `callback`, `logout`, `me` |
| `/api/user/dashboard` | Login (`requireUser`) | `GET` data milik sendiri, `POST` ajukan pesanan Standard/Enterprise/Top-Up |
| `/api/admin/*` | Khusus `requireAdmin` | `overview`, `orders`, `orders/[id]`, `keys`, `keys/[hash]`, `users` |
| `/api/v1/chat/completions` | Bearer `jt-live-...` | Endpoint OpenAI-compatible + validasi saldo & Enterprise IP Whitelist |

---

## 3. Panduan Penggunaan Step-by-Step (End-to-End)

### Tahap 1 — Menjalankan Aplikasi di Komputer Lokal
1. Pastikan dependensi terpasang:
   ```bash
   npm install
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser ke `http://localhost:3000`.
   > **Catatan Mode Lokal:** Jika `.env.local` belum diisi kredensial Supabase, sistem otomatis berjalan pada **Mode Development Lokal** (data tersimpan di `data/store.json`) dengan akun bawaan:
   > - **Admin Demo:** `admin@juragantoken.id` / `Admin12345!`
   > - **User Demo:** `budi.dev@gmail.com` / `UserDemo123!`

---

### Tahap 2 — Aktivasi Mode Produksi (Supabase Live + Google OAuth + Gmail SMTP)
1. **Jalankan 2 Migrasi SQL Baru di Supabase SQL Editor** (berurutan):
   - `supabase/migrations/20261120000000_auth_profiles_admin_keys.sql`
   - `supabase/migrations/20261120010000_enterprise_tier_ip_whitelist.sql`
2. **Aktifkan Google OAuth di Supabase Dashboard**:
   - Masuk ke *Authentication → Providers → Google* → aktifkan dan masukkan Google Client ID & Secret.
   - Tambahkan Redirect URL: `https://<domain-anda>/api/auth/callback` (dan `http://localhost:3000/api/auth/callback` untuk lokal).
3. **Atur Environment Variables** (`.env.local` / Vercel Project Settings):
   - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `ADMIN_EMAILS="admin@juragantoken.id,emailadmin@gmail.com"`
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_FROM_NAME="PT Rejeki Digital Cemerlang - Juragantoken"`
   - `GEMINI_API_KEY` / `UPSTREAM_ENGINE_URL` / `UPSTREAM_ENGINE_KEY`

---

### Tahap 3 — Alur Pengguna (`Sign Up` → Pesanan Standard / Enterprise → Cek API Key)
1. Klik **`Sign Up`** di pojok kanan atas Navbar (`http://localhost:3000/signup`).
2. Daftar menggunakan **Google (Gmail)** atau form **Nama Lengkap + Email Gmail + Kata Sandi**.
3. Setelah masuk, Anda otomatis diarahkan ke **Portal Pengguna (`/dashboard`)**.
4. Klik **`+ Ajukan Pesanan Token`**:
   - Pilih jalur **Standard (Mandiri)** untuk QRIS/Transfer fleksibel, **atau** **Enterprise B2B (PT Rejeki Digital Cemerlang)** bila butuh nama perusahaan, departemen, Invoice B2B, dan **Faktur Pajak (NPWP)**.
   - Jika sudah memiliki API Key aktif, Anda bisa memilih **Top-Up ke Key Eksisting** agar saldo langsung bertambah tanpa ganti kunci.
5. Klik **`Kirim Pesanan ke Admin`** → status pesanan tampil `Menunggu Admin`.

---

### Tahap 4 — Alur Panel Admin (`/admin`) — Manajemen Pesanan & API Key
1. Masuk di `/login` menggunakan akun Admin (otomatis diarahkan ke `/admin`).
2. **Tab `Ringkasan`**: Lihat jumlah pesanan pending, total transaksi lunas, jumlah API Key aktif, dan daftar akun Gmail terdaftar.
3. **Tab `Pesanan Masuk`**:
   - Filter `Pending` atau cari berdasarkan nomor invoice / Gmail pelanggan.
   - Klik **`Setujui & Terbitkan Key`** pada pesanan masuk:
     - Sistem otomatis menerbitkan **1 Universal API Key (`jt-live-...`)** (atau menambah saldo jika pesanan berupa top-up), menautkannya ke akun Gmail user, dan mengirim receipt via Gmail SMTP.
     - Pop-up **One-Time Reveal** muncul menampilkan API Key utuh **1 kali saja** — klik **`Salin API Key`** untuk dibagikan/arsip jika perlu.
   - Untuk pesanan offline (via WhatsApp/Invoice PT), klik **`+ Pesanan Manual`** di kanan atas.
4. **Tab `User Gmail & API Key`**:
   - Lihat seluruh akun Gmail terdaftar dan API Key yang terhubung ke masing-masing akun.
   - Klik **`+ Integrasikan API Key`** untuk menerbitkan API Key baru langsung ke email Gmail tertentu (pilih Tier `Standard` atau `Enterprise`, isi Perusahaan/Departemen, saldo awal, dan IP Whitelist opsional).
   - Pada setiap baris API Key, Admin dapat:
     - **`± Saldo`**: Top-up cepat atau koreksi saldo IDR.
     - **`IP / Tier`**: Atur tier `Enterprise` / `Standard` serta daftar **IP Whitelist** (kosong = bebas akses; isi misal `103.45.12.88, 202.150.10.0/24` untuk kunci akses kantor).
     - **`Suspend` / `Aktifkan`**: Jeda sementara atau aktifkan kembali API Key.
     - **`Rotasi`**: Cabut kunci lama dan terbitkan kunci baru dengan sisa saldo utuh.
     - **`Revoke`**: Cabut permanen jika kunci bocor.
5. **Tab `Audit Log`**: Periksa rekam jejak seluruh aksi admin secara kronologis.

---

### Tahap 5 — Menggunakan 1 Universal API Key di Aplikasi / IDE
Cukup pasang **1 Base URL** (`https://api.tokotokenai.com/v1` atau `http://localhost:3000/v1` saat uji lokal) dan **1 API Key (`jt-live-...`)**:

- **Python (OpenAI SDK) — Ganti Model Cukup Ubah `model`:**
  ```python
  from openai import OpenAI

  client = OpenAI(
      base_url="https://api.tokotokenai.com/v1",
      api_key="jt-live-kunci-universal-anda"
  )

  # Cukup ubah parameter model untuk berpindah antar 100+ AI:
  # "claude-opus-5-5", "chatgpt-6-astra", "gemini-4-argon", "deepseek-v4-pro", "qwen3.7-max"
  res = client.chat.completions.create(
      model="claude-sonnet-5-5",
      messages=[{"role": "user", "content": "Review arsitektur API berikut..."}]
  )
  print(res.choices[0].message.content)
  ```
- **Cursor IDE / Windsurf**: Settings → Models → aktifkan *Override OpenAI Base URL* ke `https://api.tokotokenai.com/v1` → masukkan `jt-live-...` sebagai API Key.
- **Claude Code CLI (PowerShell)**:
  ```powershell
  $env:ANTHROPIC_BASE_URL = "https://api.tokotokenai.com"
  $env:ANTHROPIC_API_KEY  = "jt-live-kunci-universal-anda"
  claude --model claude-sonnet-5-5
  ```

---

### Tahap 6 — Perintah Verifikasi Kualitas & Keamanan
```bash
npx tsc --noEmit                  # Verifikasi TypeScript (0 error)
npm run build                     # Verifikasi production build Next.js 16
node scripts/security-audit.cjs   # Audit kebocoran secret di client bundle (100% SECURE)
node scripts/test-errors.cjs      # Suite uji keamanan & error API (13/13 PASS)
```
