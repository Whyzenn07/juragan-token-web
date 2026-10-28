# DESIGN.md: Juragan Token

Sumber arah: jawaban pemilik produk pada sesi 2026-10-23. Tidak ada isi yang ditambahkan agen selain format.

## Identitas
- Produk: marketplace kredit API prabayar untuk developer dan pekerja kreatif Indonesia.
- Mood: terang bersih, satu aksen hangat, kesan fintech dan marketplace Indonesia yang terpercaya.
- Tema: terang saja. Tidak ada tombol tema.

## Palet
- Inti: biru tinta `#0a2442`, biru `#0a4ea3`
- Netral: kertas `#f5f8fb`, putih, garis `#c8d5e1`
- Aksen tunggal: oranye `#ee7d39`, hanya di momen membeli (tombol tambah ke keranjang, checkout, hitungan keranjang). Teks di atas oranye selalu biru tinta.

## Tipografi
- Heading: Plus Jakarta Sans
- Isi: IBM Plex Sans

## Dial
Dial: ENERGY 2 / RHYTHM 2 / MOTION 2

## Motion
Reveal saat scroll, parallax halus pada motif token hero, hero memudar saat keluar viewport, transisi filter katalog, garis alur terisi saat scroll. Tanpa animasi berulang tanpa akhir. Menghormati `prefers-reduced-motion`.

## Motif identitas
Tiga balok miring (jalur kredit bertingkat) sebagai simbol Juragan Token. Status: kandidat dari Codex, menunggu persetujuan pemilik.

## Logo provider
Wordmark teks sementara. Logo resmi diletakkan pemilik di `public/logos/<id>.svg`, lalu `hasLogo` di `src/app/data/catalog.ts` diubah menjadi `true`.

## Data
Semua harga dan jumlah token adalah contoh dan diberi label di UI. Kurs USD adalah mock Rp16.250.
