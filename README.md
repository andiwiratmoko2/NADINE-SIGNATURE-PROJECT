# Nadine Signature — Toko Konfeksi Premium

Next.js 14 + Neon (Postgres) + Vercel Blob (foto). Semua memakai paket gratis.

## Fitur
- Pembeli: lihat produk, pilih ukuran (sampai XXXL) dan warna (termasuk multi color), keranjang, pesan, bayar via transfer ke rekening toko.
- Penjual (`/admin`): lihat terjual, stok, dan pendapatan; tambah, edit, hapus barang; unggah foto (maks. 4 per produk); atur warna, deskripsi, latar; ubah rekening bank; konfirmasi pesanan (Lunas, Dikirim, Batalkan).

## Cara deploy (gratis)
1. **Neon** — daftar di neon.tech, buat project, salin *connection string* (diawali `postgresql://`).
2. **GitHub** — buat repo baru, lalu unggah seluruh isi folder ini (bukan file zip-nya). Semua nama folder sudah polos, tanpa tanda kurung atau titik tiga, sehingga aman diunggah lewat web GitHub.
3. **Vercel** — vercel.com → *Add New → Project* → pilih repo tadi. Pada *Environment Variables* isi:
   - `DATABASE_URL` = connection string dari Neon
   - `ADMIN_PASSWORD` = password login penjual (buat yang kuat)
   - `AUTH_SECRET` = teks acak panjang (minimal 32 karakter)
4. Klik **Deploy**. Setelah selesai, buka tab **Storage** di proyek Vercel → **Create → Blob** → hubungkan ke proyek (ini otomatis menambah `BLOB_READ_WRITE_TOKEN`) → **Redeploy**.
5. Buka `alamat-situs/admin`, login, lalu buka `alamat-situs/api/setup` **sekali** untuk membuat tabel dan mengisi 18 produk contoh.
6. Di `/admin`: ubah rekening, ganti harga/stok, unggah foto produk.

## Dijalankan di komputer sendiri (opsional)
```
npm install
cp .env.example .env.local   # isi nilainya
npm run dev
```

## Catatan keamanan
- Halaman dan API penjual hanya bisa dipakai setelah login (cookie httpOnly bertanda tangan, berlaku 7 hari).
- Harga dan stok selalu dihitung ulang di server; pembeli tidak bisa mengubah harga.
- Pembayaran dikonfirmasi manual oleh penjual (cocokkan dengan mutasi rekening).

## Link pembeli dan penjual terpisah (opsional)
Header toko tidak lagi menampilkan tombol penjual. Penjual membuka `alamat-situs/admin` langsung (simpan sebagai bookmark).
Untuk memisahkan alamat sepenuhnya, buat dua proyek Vercel dari repo yang sama dengan variabel yang sama, lalu tambahkan:
- proyek pembeli: `SITE_MODE` = `buyer` (halaman /admin tidak bisa dibuka)
- proyek penjual: `SITE_MODE` = `seller` (halaman awal langsung ke /admin; hubungkan juga Blob store yang sama)

## Struk pembayaran
- Pembeli: setelah menekan "Saya Sudah Transfer", struk tampil dan bisa dicetak atau disimpan sebagai PDF (status: Menunggu Konfirmasi).
- Penjual: tiap pesanan punya tombol "Cetak Struk"; setelah "Tandai Lunas" ada tawaran cetak struk berstatus LUNAS. Ukuran struk 80 mm (printer thermal) dan juga bisa dicetak di kertas biasa.
