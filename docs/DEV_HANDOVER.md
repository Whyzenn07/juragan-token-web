# 🚀 Panduan Handover Tim Developer (2 Integrasi Kredensial Terakhir)

Seluruh kode aplikasi **Juragan Token Web** (Frontend UI/UX, Checkout Modal, Kalkulator Token, Database Cloud Supabase, Rate-Limiter 60/20 RPM, Stream Sanitizer, Pengiriman Bukti Transaksi Gmail SMTP, Outbound Payment Adapter, dan Webhook Settlement) telah **100% selesai dan teruji di Production Vercel**.

Tim Developer **tidak perlu mengubah kode apa pun**. Cukup tambahkan **2 kredensial eksternal** berikut pada **Vercel Environment Variables** (`Settings` $\rightarrow$ `Environment Variables`) lalu lakukan **Redeploy**.

---

## 1️⃣ Integrasi Master API Key LLM (`https://api.tokotokenai.com/`)

Sistem gateway di [`src/lib/gateway.ts`](../src/lib/gateway.ts) dan [`src/app/api/v1/chat/completions/route.ts`](../src/app/api/v1/chat/completions/route.ts) sudah terhubung secara *plug-and-play* ke endpoint `https://api.tokotokenai.com/v1/chat/completions`.

### Variabel Environment yang Diisi di Vercel:
```ini
UPSTREAM_ENGINE_URL="https://api.tokotokenai.com/v1"
UPSTREAM_ENGINE_KEY="isi-dengan-master-api-key-tokotokenai-anda"
# Opsional: Set "true" jika ingin model Gemini juga melewati api.tokotokenai.com
UPSTREAM_ROUTE_ALL="false"
```

### Cara Kerja Otomatis Setelah Diisi:
- Setiap request pelanggan yang menggunakan kunci `jt-live-...` ke `/api/v1/chat/completions` akan otomatis diteruskan ke `https://api.tokotokenai.com/v1/chat/completions` menggunakan header `Authorization: Bearer <UPSTREAM_ENGINE_KEY>`.
- Perhitungan token streaming (SSE) maupun non-streaming otomatis memotong saldo Rupiah di Supabase (`deduct_token_balance`) dan mencatat log ke tabel `public.usage_logs`.

---

## 2️⃣ Integrasi Payment Gateway (`Tripay` / `Midtrans` / `Xendit`)

Baik **Outbound Transaction Adapter** ([`src/lib/payment-gateway.ts`](../src/lib/payment-gateway.ts)) maupun **Inbound Webhook Receiver** ([`src/app/api/webhooks/payment/route.ts`](../src/app/api/webhooks/payment/route.ts)) sudah siap 100%.

### Langkah 1: Daftarkan URL Webhook di Dashboard Payment Gateway
Masukkan URL Callback/Webhook berikut di dashboard Tripay, Midtrans, atau Xendit:
```text
https://juragan-token-web-retail-git-main-whyzenn07s-projects.vercel.app/api/webhooks/payment
```
*(Atau sesuaikan dengan custom domain utama apabila sudah dihubungkan, misal `https://juragantoken.com/api/webhooks/payment`).*

### Langkah 2: Isi Variabel Environment di Vercel (Pilih Salah Satu Provider)

#### Opsi A — Menggunakan Tripay:
```ini
PAYMENT_GATEWAY_PROVIDER="tripay"
PAYMENT_GATEWAY_SANDBOX="false"
TRIPAY_MERCHANT_CODE="Txxxx"
TRIPAY_API_KEY="DEV-xxxx atau PROD-xxxx"
TRIPAY_PRIVATE_KEY="xxxxx-xxxxx-xxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

#### Opsi B — Menggunakan Midtrans:
```ini
PAYMENT_GATEWAY_PROVIDER="midtrans"
PAYMENT_GATEWAY_SANDBOX="false"
MIDTRANS_SERVER_KEY="Mid-server-xxxxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="Mid-client-xxxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

#### Opsi C — Menggunakan Xendit:
```ini
PAYMENT_GATEWAY_PROVIDER="xendit"
PAYMENT_GATEWAY_SANDBOX="false"
XENDIT_SECRET_KEY="xnd_production_xxxxxx"
XENDIT_CALLBACK_TOKEN="xxxxxx"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
```

---

## ✅ Verifikasi Pasca-Handover

Setelah kedua kredensial di atas dimasukkan ke Vercel:
1. Buka halaman **`/status`** di website untuk memastikan indikator **Frontier Models Engine (`https://api.tokotokenai.com/v1`)** berubah menjadi **`Live Master Key Aktif`** dan **Sistem Pembayaran** berubah menjadi **`Live (TRIPAY / MIDTRANS / XENDIT)`**.
2. Lakukan 1x transaksi percobaan dan 1x panggilan `POST /api/v1/chat/completions` dari halaman **`/docs`**.

