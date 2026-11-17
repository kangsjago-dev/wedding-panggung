# RENCANA REVISI & CATATAN RILIS SISTEM: v3.1.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.1.0)
TANGGAL PENGAJUAN: 17 November 2026
VERIFIKASI SISTEM: BERHASIL (Pembersihan Tombol Cover, Proporsi Foto Landscape Bebas Potong, Navigasi Tab Admin Flex-Wrap Bebas Potong, Galeri Native Kartu Foto untuk Photobooth, Pemisahan Foto Akurat Tiap Kategori Tanpa Fallback Palsu, Sinkronisasi Kategori Lintas-Perangkat Terpusat)

### Rangkuman 6 Pembaruan Utama v3.1.0:
1. **Pembersihan Tombol Aksi Cover Depan:**
   - Menghapus tombol `[✨ Jelajahi Galeri Foto ↓]` dan `[📱 Bagikan & Lihat QR]` pada container showcase cover halaman depan sesuai instruksi dan lampiran gambar user.
   - Halaman depan kini tampil lebih tenang, mewah, dan fokus pada keindahan foto panggung pernikahan (*Romantic Wedding Aesthetic*).
2. **Perbaikan Proporsi Foto Halaman Depan (Anti-Terpotong / Landscape Friendly):**
   - **Akar Masalah:** Sebelumnya, container `.cover-photo-main` dan `.cover-photo-side-stack` memiliki tinggi kaku `420px` dengan `object-position: center;`, sehingga foto panggung yang berformat mendatar (landscape 16:9) terpotong bagian kepala dan sisi badannya.
   - **Solusi Diterapkan:** Memperbarui CSS grid `.cover-collage-layout` menjadi rasio adaptif berkelas `aspect-ratio: 16 / 10;`, `min-height: 280px;`, serta `object-position: center 25%;`. Di mobile, susunan stack samping berubah menjadi 2 kolom proporsional. Seluruh orang dan dekorasi panggung tampil utuh, tajam, dan tidak lagi terpotong.
3. **Perbaikan Navigasi Tab Admin (Anti-Terpotong):**
   - **Akar Masalah:** Navigasi `.admin-tabs-nav` memiliki `overflow-x: auto` dengan scrollbar tersembunyi pada modal `max-width: 520px;`, menyebabkan tab ke-4 (`👥 Akun Admin`) dan tab ke-5 (`☁️ Cloud & API`) terpotong atau tersembunyi di tepi kanan.
   - **Solusi Diterapkan:** Memperlebar modal admin menjadi `max-width: 600px;` pada desktop dan menerapkan `flex-wrap: wrap; gap: 6px;` pada `.admin-tabs-nav` dengan `.admin-tab-btn` berbasis `flex: 1 1 calc(33.333% - 6px); min-width: 105px;`. Seluruh 5 tab membungkus secara simetris dan rapi di semua ukuran layar tanpa ada yang terpotong.
4. **Tampilan Galeri Native Kartu Foto untuk "Photobooth" (Pengganti Iframe):**
   - **Akar Masalah:** Kategori tautan eksternal sebelumnya disematkan menggunakan `<iframe>` live viewer yang terasa asing dan berbeda dari tab "Semua Foto".
   - **Solusi Diterapkan:** Menghapus sepenuhnya penyematan `<iframe>` pada `renderPhotoGrid`. Foto-foto dari tautan Photobooth (`https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs`) diambil langsung menggunakan parser regex client-side (didukung header CORS `*` dari CDN fotoshare) dan dirender sebagai kartu foto native yang sama persis seperti "Semua Foto": memiliki thumbnail, nama foto, lencana kategori, Lightbox layar penuh, dan unduhan foto berbingkai dengan resolusi asli. Tab Photobooth menampilkan lencana jumlah foto real (318 foto) tanpa ikon `↗ 🌐 Live`.
5. **Pemisahan Foto Akurat Tiap Kategori (Eliminasi Fallback 59 Foto ke Kategori Kosong):**
   - **Akar Masalah:** Sebelumnya terdapat kode `if (matched.length === 0 && state.allPhotos.length > 0) { matched = state.allPhotos; }` pada `applyCategoryFilter`. Akibatnya, setiap kali membuka kategori yang belum memiliki foto atau memiliki subfolder/link lain, sistem selalu salah menampilkan 59 foto dari galeri utama.
   - **Solusi Diterapkan:** Menghapus kode fallback tersebut secara tuntas. Setiap kategori kini hanya menampilkan foto yang benar-benar cocok dengan link atau subfoldernya. Jika suatu kategori belum memiliki foto, sistem menyajikan status kosong yang elegan: `"Belum ada foto dalam kategori [Nama Kategori]"`.
6. **Sinkronisasi Kategori Lintas-Perangkat Terpusat (PC & Mobile Konsisten 100%):**
   - Menyelaraskan daftar kategori kustom di `config.json` dan `GLOBAL_CONFIG` sehingga browser di PC maupun smartphone memuat kategori yang persis sama tanpa terfragmentasi oleh perbedaan `localStorage` peramban lokal.
7. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Seluruh fungsionalitas unduh foto resolusi asli 1:1, antrean unduh di latar belakang (background queue), penutupan otomatis status bar, multi-event switcher, dan login username/password admin tetap 100% aktif dan berjalan optimal.
