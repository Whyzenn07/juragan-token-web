# Dokumentasi Perubahan & Panduan Penggunaan End-to-End — Juragantoken (v4 Enterprise + Standard)

**Entitas Resmi:** PT Rejeki Digital Cemerlang  
**Branch Pengembangan:** `feat/enterprise-revamp-v3`  
**Stack Teknologi:** Next.js `16.4.6` (App Router + Turbopack + `proxy.ts`), React `19.3`, TypeScript `5`, Supabase Auth & PostgreSQL, Nodemailer Gmail SMTP  
**Arsitektur Utama:** **1 Universal API Key (`jt-live-...`)** untuk mengakses 100+ model AI lintas 10 provider global & Asia — dirancang untuk **Enterprise B2B** (IP Whitelist, Invoice B2B, Faktur Pajak PT, Verifikasi Bukti SS) sekaligus **fleksibel untuk Standard** (Developer, Startup, & Individu).

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

### Fase 7 — Precision Docs Workbench `/docs` & OS Switcher Multi-Platform (`5c74745`, `fa69551`)
- **Interactive CLI Workbench (`/docs` & `SetupGuides.tsx`)**:
  - Mendukung pengalih OS **macOS / Linux / Windows PowerShell / Windows CMD** yang tersimpan di `localStorage` (`jt-docs-os`), pemilih model cepat dari **1 Universal API Key** ke 10 ekosistem AI, dan token syntax highlighting murni CSS.
  - Menyediakan panduan siap pakai untuk **Claude Code CLI, OpenAI Codex CLI, Cursor IDE, Windsurf IDE, Gemini CLI, Continue.dev, VS Code, Python SDK, Node.js SDK, dan cURL**.

### Fase 8 — Upgrade Security Patch Next.js `16.4.6` (`f733440`)
- Memperbarui `next` dan `eslint-config-next` dari `16.4.2` ke `16.4.6` (`npm audit --omit=dev` = `0 vulnerabilities`) dengan 32/32 route build bersih.

### Fase 9 — Redesign Panel Admin, Invoice Resmi PT & Screenshot Bukti Pembayaran (`d671849`)
- **Admin Console Anti-Tumpuk (`src/app/admin/AdminDashboardClient.tsx`, `src/app/admin/admin.css`)**:
  - Sidebar 4 tab (*Ringkasan*, *Pesanan & Invoice*, *User & API Key*, *Audit Log*), sel tabel terstruktur bebas tumpang tindih di desktop `1440px` maupun mobile `390px`, dan menyembunyikan widget *FloatingWhatsApp* khusus di `/admin`.
  - **Signature 760px Slide-Over Drawer**: Tab *Bukti Pembayaran (SS)* (pratinjau gambar, zoom penuh, unduh SS, sunting referensi/SS) dan tab *Invoice Resmi* siap cetak.
- **Komponen Invoice & Bukti Transaksi (`src/components/portal/`)**:
  - `InvoiceDocument.tsx`: Dokumen invoice & kwitansi resmi **PT Rejeki Digital Cemerlang** (kop perusahaan, status Lunas/Menunggu, NPWP, badge Faktur Pajak, API Key tersamarkan, cetak/PDF).
  - `ProofUploadDropzone.tsx`: Komponen unggah screenshot transfer (PNG/JPG/WebP terkompresi di sisi klien) dengan validasi ketat server `validatePaymentProofUrl()` yang menolak SVG/XSS (`400`) serta kontrol kepemilikan anti-IDOR (`403`).
- **Database Migration & Contoh Aset**:
  - `supabase/migrations/20261120020000_order_payment_proof_invoice.sql` + `public/images/sample-bukti-transfer.png`.

---

## 2. Peta Rute Halaman & API

| Rute | Akses | Fungsi |
| :--- | :--- | :--- |
| `/` | Publik | Landing Page Company Profile, Katalog 54 Model, Solusi Enterprise + Standard, & Panduan OS Switcher (`#panduan-setup`) |
| `/login` & `/signup` | Publik | Autentikasi Google (Gmail) OAuth & Email/Password |
| `/dashboard` | Login (`user` / `admin`) | Portal Akun: lihat 1 Universal API Key, saldo, status IP Whitelist, ajukan pesanan + upload SS, & lihat/cetak `Invoice Resmi` |
| `/admin` | Khusus `admin` | Dashboard Manajemen Pesanan + Slide-Over Drawer SS & Invoice, User & API Key, IP Whitelist, Saldo, & Audit Log |
| `/docs` | Publik | Precision Workbench integrasi CLI & IDE across Windows/macOS/Linux untuk 100+ model AI |
| `/status` | Publik | Pemantauan status live Gateway & Supabase |
| `/api/auth/*` | Publik / Sesi | `login`, `signup`, `google`, `callback`, `logout`, `me` |
| `/api/user/dashboard` | Login (`requireUser`) | `GET` data milik sendiri, `POST` ajukan pesanan + SS opsional, `PATCH` unggah/ganti bukti SS milik sendiri (dilindungi anti-IDOR) |
| `/api/admin/*` | Khusus `requireAdmin` | `overview`, `orders`, `orders/[id]` (`approve`, `update_proof`, `expire`, `note`), `keys`, `keys/[hash]` (`update_ip_whitelist`, `adjust_balance`, `suspend`, `activate`, `rotate`, `revoke`), `users` |
| `/v1/chat/completions`<br>`/api/v1/chat/completions` | Bearer `jt-live-...` | Endpoint OpenAI-compatible + validasi saldo, status key, & Enterprise IP Whitelist |

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
1. **Jalankan 3 Migrasi SQL di Supabase SQL Editor** (berurutan):
   - `supabase/migrations/20261120000000_auth_profiles_admin_keys.sql`
   - `supabase/migrations/20261120010000_enterprise_tier_ip_whitelist.sql`
   - `supabase/migrations/20261120020000_order_payment_proof_invoice.sql`
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

### Tahap 3 — Alur Pengguna: Cara Memesan, Unggah Bukti Pembayaran (SS), & Cek Invoice
1. Buka `/signup` (atau `/login` jika sudah punya akun), daftar dengan **Nama Lengkap + Email Gmail + Kata Sandi** (minimal 8 karakter) atau tombol **Google OAuth**. Sistem mengarahkan ke **`/dashboard`**.
2. Klik tombol biru **`+ Ajukan Pesanan Token`**:
   - Pilih jalur **Standard** (mandiri/developer) atau **Enterprise B2B (PT Rejeki Digital Cemerlang)** bila membutuhkan nama perusahaan (`companyName`), divisi (`department`), dan permintaan **Faktur Pajak (`NPWP`)**.
   - Pilih nominal deposit (misal `Rp 75.000` atau custom) dan metode bayar (`QRIS Juragantoken`, `Transfer Bank BCA / Mandiri`, atau `Invoice B2B & Transfer PT (IDR)`).
   - Isi **Top-Up ke Key Eksisting** jika hanya menambah saldo ke kunci yang sudah ada.
   - Unggah **Screenshot Bukti Pembayaran (SS)** langsung pada area dropzone (PNG/JPG/WebP) atau lengkapi belakangan setelah transfer.
3. Klik **`Kirim Pesanan ke Admin`** → status pesanan muncul sebagai **`Menunggu Admin`** di tabel *Riwayat Pesanan Anda*.
4. Untuk melihat tagihan atau mengunggah/memperbarui SS pembayaran susulan:
   - Klik tombol **`Invoice / Upload SS`** (atau **`Invoice & SS ✓`** jika sudah ada gambar) di kolom *INVOICE & BUKTI*.
   - Di modal yang terbuka, klik **`Cetak / Simpan PDF Invoice`** untuk mencetak invoice resmi **PT Rejeki Digital Cemerlang**, atau pilih gambar transfer baru + masukkan **Nomor Referensi Bank/QRIS** lalu klik **`Kirim Bukti ke Admin`**.
5. Setelah Admin menyetujui pesanan, status pesanan berubah menjadi **`Lunas`**, KPI **Total Saldo Aktif** bertambah, dan API Key Anda berstatus **`Aktif`** (kunci penuh `jt-live-...` diterima via salinan admin / email receipt; di portal tampil tersamarkan `jt-live-••••••••xxxx` beserta jumlah **IP Whitelist**).

---

### Tahap 4 — Alur Panel Admin (`/admin`): Verifikasi SS, Invoice, Penerbitan Key, & IP Whitelist
1. Masuk melalui `/login` sebagai Admin (`admin@juragantoken.id` / `Admin12345!`) — otomatis diarahkan ke **`/admin`**.
2. **Tab `Ringkasan`**: Pantau jumlah pesanan pending, total transaksi lunas + total bukti SS terlampir, API Key aktif, serta klik **`Periksa`** pada antrean verifikasi cepat.
3. **Tab `Pesanan & Invoice`**:
   - Gunakan filter pill (`Semua`, `Menunggu`, `Lunas`, `Ada Bukti SS`) atau kotak pencarian nomor invoice/Gmail/referensi.
   - Klik **`Lihat SS ✓`** / **`+ Upload SS`** / **`Invoice`** pada baris pesanan untuk membuka **Slide-Over Drawer 760px**:
     - **Tab `Bukti Pembayaran (SS)`**: Tinjau screenshot transfer ukuran besar (tersedia tombol **`Perbesar Penuh`** dan **`Unduh SS`**), periksa/ubah nomor referensi transaksi & catatan admin, lalu klik **`Simpan Bukti & Catatan`** jika ada koreksi.
     - **Tab `Invoice Resmi`**: Periksa preview **`InvoiceDocument`** beridentitas PT Rejeki Digital Cemerlang + salin nomor invoice atau cetak.
   - Setelah mutasi & bukti transfer dinyatakan sah, klik **`Setujui & Terbitkan API Key`** pada footer drawer (atau tombol cepat **`Setujui`** langsung di baris tabel):
     - Sistem otomatis mengubah status pesanan ke **`Lunas`**, menerbitkan **1 Universal API Key (`jt-live-...`)** (atau menambah saldo jika *top-up*), menautkannya ke Gmail pelanggan, dan memicu email kuitansi.
     - **Pop-up One-Time Reveal** menampilkan API Key penuh **1 kali saja** — klik **`Salin API Key`** untuk diserahkan ke user (bila email SMTP belum dikonfigurasi pada dev lokal).
   - Untuk transaksi WhatsApp/B2B offline, klik **`+ Pesanan Manual`** di kanan atas.
4. **Tab `User & API Key`**:
   - Klik **`+ Terbitkan Key`** di kanan atas untuk membuat kunci baru langsung ke akun Gmail tertentu (Standard/Enterprise, perusahaan, departemen, saldo awal IDR, IP Whitelist awal).
   - Pada tiap API Key tersedia aksi: **`IP / Tier`** (mengatur daftar IP kantor/subnet `/24` agar key hanya bisa dipanggil dari IP tersebut), **`± Saldo`** (tambah/kurang saldo manual), **`Suspend` / `Aktifkan`**, **`Rotasi`** (ganti secret key sambil mempertahankan sisa saldo), dan **`Revoke`**.
5. **Tab `Audit Log`**: Memverifikasi seluruh catatan kronologis aksi admin (`order.approve`, `key.update_ip_whitelist`, `key.adjust_balance`, `key.suspend`, `key.activate`, dll.).

---

### Tahap 5 — Cara Menjalankan 1 Universal API Key (`jt-live-...`) di Windows, macOS, & Linux
Setelah API Key aktif (`status = active`, `balanceIdr > 0`, dan IP pengirim sesuai daftar Whitelist bila Tier Enterprise), jalankan **1 Base URL** (`https://api.tokotokenai.com/v1` untuk produksi atau `http://localhost:3000/v1` untuk uji lokal):

1. **Claude Code CLI (Terminal Multi-OS — cukup ganti `--model` untuk lintas model):**
   - **macOS / Linux (Bash / Zsh):**
     ```bash
     export ANTHROPIC_BASE_URL="http://localhost:3000"   # Produksi: https://api.tokotokenai.com
     export ANTHROPIC_API_KEY="jt-live-kunci-anda"
     claude --model claude-sonnet-5-5
     ```
   - **Windows PowerShell:**
     ```powershell
     $env:ANTHROPIC_BASE_URL = "http://localhost:3000"   # Produksi: https://api.tokotokenai.com
     $env:ANTHROPIC_API_KEY  = "jt-live-kunci-anda"
     claude --model claude-sonnet-5-5
     ```
   - **Windows CMD:**
     ```cmd
     set ANTHROPIC_BASE_URL=http://localhost:3000
     set ANTHROPIC_API_KEY=jt-live-kunci-anda
     claude --model claude-sonnet-5-5
     ```
   > **Catatan Endpoint Lokal:** Pada server Next.js saat ini (`src/app/api/v1/`), baru tersedia `/api/v1/chat/completions` dan `/api/v1/models` (di-rewrite otomatis dari `/v1/:path*` lewat `next.config.ts`). Adapter native Anthropic **`/api/v1/messages`** belum tersedia di repo lokal, sehingga pengujian langsung di `localhost:3000` berjalan melalui klien berprotokol OpenAI (`/v1/chat/completions`, seperti cURL, Python/Node SDK, Cursor, Windsurf, Codex CLI), sedangkan pemanggilan native Claude Code CLI memerlukan penambahan `/api/v1/messages/route.ts` atau gateway produksi yang telah menyediakan endpoint `/v1/messages`.

2. **Uji Cepat Gateway via Terminal (`curl` — macOS/Linux/Windows):**
   ```bash
   curl -X POST http://localhost:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer jt-live-kunci-anda" \
     -d '{
       "model": "gemini-3.8-flash",
       "messages": [{"role": "user", "content": "Halo Juragantoken!"}]
     }'
   ```

3. **Python SDK & Cursor / Windsurf IDE:**
   ```python
   from openai import OpenAI

   client = OpenAI(
       base_url="http://localhost:3000/v1",  # Produksi: https://api.tokotokenai.com/v1
       api_key="jt-live-kunci-anda"
   )
   res = client.chat.completions.create(
       model="claude-sonnet-5-5",  # Bisa ganti: gpt-4o, deepseek-v4-pro, qwen3.7-max, gemini-4-argon
       messages=[{"role": "user", "content": "Review arsitektur API berikut..."}]
   )
   print(res.choices[0].message.content)
   ```
   - Di **Cursor / Windsurf**: buka *Settings → Models → Override OpenAI Base URL* ke `https://api.tokotokenai.com/v1` dan tempel `jt-live-...` pada kolom API Key. (Panduan interaktif lengkap 4 OS tersedia di `/docs`).

---

### Tahap 6 — Perintah Verifikasi Kualitas & Keamanan
```bash
npx tsc --noEmit                  # Verifikasi TypeScript (0 error)
npm run build                     # Verifikasi production build Next.js 16.4.6 (32/32 routes)
node scripts/security-audit.cjs   # Audit kebocoran secret di HTML & 19 client chunks (100% SECURE)
node scripts/test-errors.cjs      # Suite uji keamanan & error API (13/13 PASS)
```

---

## 4. Ringkasan Analisis Kesenjangan (*Gap Analysis* — Status 20 Nov 2026)

| Prioritas | Ringkasan Gap yang Masih Tersisa (Detail Lengkap di `docs/PRD_JURAGAN_TOKEN.md` Seksi 12) |
| :---: | :--- |
| **P0** | Kredensial `.env.local` produksi belum diisi aktif (`UPSTREAM_ENGINE_KEY`/`GEMINI_API_KEY` kosong $\rightarrow$ `awaiting_dev_key` memicu `503` saat inferensi, Supabase & SMTP masih fallback lokal/simulasi, nomor WA uji `0812-2698-3990`, `ENABLE_CHECKOUT = false`). |
| **P0** | Rate limiter `rateLimited()` (`60/20 RPM`, `5` concurrent streams) dan auth throttle masih berbasis `Map` in-memory per node — perlu migrasi ke **Upstash Redis** sebelum multi-instance production. |
| **P0** | `src/app/api/v1/` baru menyediakan `/chat/completions` dan `/models`, belum ada `/api/v1/messages/route.ts` (*Anthropic native Messages API adapter*) meski `ANTHROPIC_BASE_URL` sudah didokumentasikan di `/docs` & `SetupGuides.tsx`. |
| **P1** | Portal `/dashboard` user belum menampilkan kartu rekening/QRIS tujuan bayar di dalam modal order, belum memiliki mekanisme *One-Time API Key Reveal* untuk akun user, dan belum merender tabel histori `usageLogs`. |
| **P1** | UI `/admin` tab *User & API Key* belum mengekspos tombol UI untuk `PATCH /api/admin/users` (promote/demote role) serta belum memiliki tombol ekspor CSV laporan transaksi/audit; nominal `POST /api/user/dashboard` masih bulat tanpa kode unik/webhook gateway otomatis. |
| **P2** | Konsistensi penamaan entitas lama (`Juragan Token Indonesia`) & dead anchor `/#katalog-retail` masih tersisa di `status/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `PaymentModal.tsx`; suite E2E lengkap belum masuk `npm test` / CI workflow. |

---

## 5. Hasil Uji Live E2E Terbaru (20 November 2026)

- **`node scripts/security-audit.cjs`:** **PASS (100% SECURE)** — HTML & **19** client JS chunks bersih dari secret server.
- **`node scripts/test-errors.cjs`:** **13/13 PASS (100%)** — menolak request tanpa/palsu key (`401`), JSON rusak / tanpa `messages` (`400`), order invalid (`400`), `GET /api/keys/check` (`405`), dan endpoint admin/webhook tanpa otorisasi (`403`).
- **Suite E2E User + Admin + Gateway + Chrome CDP (`14/14` PASS):**
  - Verifikasi penuh alur: Signup user baru $\rightarrow$ RBAC user ditolak admin API (`403`) $\rightarrow$ buat order Enterprise + NPWP + upload SS PNG (`200`) $\rightarrow$ upload XSS SVG ditolak (`400`) $\rightarrow$ ganti SS/referensi (`200`) $\rightarrow$ proteksi IDOR lintas user (`403`) $\rightarrow$ login Admin & cek order $\rightarrow$ Admin *Approve* terbitkan key `jt-live-...` (`Rp 75.000`) $\rightarrow$ `POST /api/keys/check` (`Rp 75.000`) & `GET` ditolak (`405`) $\rightarrow$ set IP Whitelist `203.0.113.10` (IP lain ditolak `403`, IP terdaftar lolos auth+IP) $\rightarrow$ Admin `+ Rp 25.000` (`Rp 100.000`) $\rightarrow$ Admin `suspend` (`403`) & `activate` (lolos) $\rightarrow$ kelengkapan 5 entri Audit Log $\rightarrow$ **Chrome Headless CDP `1440x960`** memastikan `/dashboard` (`Rp 100.000`, `1 IP Terdaftar`, `LUNAS`, modal `Invoice & Bukti Transaksi`) dan `/admin` (Slide-Over Drawer berisi gambar SS + invoice) tampil utuh dengan `overflowX: false` dan `0 console errors`.
