# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.6
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.6.6)
TANGGAL: 18 November 2026

### 2 Poin Instruksi Utama Pengguna:
1. **Auto Rotate Foto yang Terbalik / Miring:**
   - Foto panggung pernikahan (seperti pada tangkapan layar `media_1795002524179_62da3757.jpg` kategori "Wedding 30") yang berorientasi miring / rebah 90° dibuat menjadi auto-rotate agar tampil tegak dan rapi.
   - Tersedia sistem rotasi foto otomatis & kontrol rotasi:
     a) Deteksi & deklarasi CSS `image-orientation: from-image;` agar metadata EXIF kamera dipatuhi browser.
     b) Tombol cepat `[ 🔄 Auto-Rotate ]` pada bar kontrol galeri untuk memutar seluruh foto pada kategori aktif (0° -> 90° -> 180° -> 270° -> 0°) dan tersimpan di `localStorage`.
     c) Tombol rotasi individual `[ 🔄 ]` pada setiap kartu foto galeri.
     d) Tombol rotasi `[ 🔄 Putar 90° ]` di dalam modal Lightbox (topbar & actions), terintegrasi dengan fungsi zoom/pan.
     e) Pengaturan rotasi kategori (0°, 90°, 180°, 270°) di Admin Modal agar orientasi tegak dapat disetel permanen untuk semua perangkat.
     f) Canvas Compositor: saat foto yang diputar diunduh dengan bingkai, foto otomatis digambar tegak lurus sesuai sudut rotasi.

2. **Perbaikan Tautan Kategori Spesial & Momen Lainnya Tidak Bisa Diganti:**
   - **Akar Masalah:**
     a) Cache foto kategori (`state.categoryPhotosMap`) hanya diindeks dengan nama kategori tanpa mencocokkan URL. Saat URL diganti di form, galeri tetap menyajikan foto lama dari folder sebelumnya.
     b) Tombol sinkron `[ 🔄 ]` pada baris kategori dan Photobooth tidak membaca URL langsung dari input DOM yang baru diketik, melainkan mencari data lama di memori, dan TIDAK memanggil `saveAdminSettings` ke backend/spreadsheet.
     c) Polling auto-refresh (Google Sheet `loadPublicSheetConfig`) menimpa `state.customCategories` lokal dengan data sheet lama jika belum tersimpan.
     d) Fallback `fetchDriveCategoryPhotos` memaksakan cache 116 foto jika nama mengandung "wedding".
   - **Solusi Komprehensif:**
     a) URL Invalidation Cache: `state.categoryPhotosUrlMap` mencatat URL setiap cache; jika URL berubah, cache foto otomatis dihapus dan di-fetch ulang.
     b) Sinkronisasi Langsung dari DOM: Tombol `[ 🔄 ]` pada baris dan `[ 🔄 Sinkron ]` pada Photobooth membaca nilai terkini dari input teks, menghapus cache kategori terkait, menyimpan ke `localStorage`, dan memanggil `saveAdminSettings` ke backend Google Apps Script / Sheet.
     c) Proteksi Polling: Background polling sheet tidak akan menimpa input admin saat modal pengaturan sedang dibuka atau setelah diedit lokal (<60 detik).
     d) Penghapusan fallback hardcoded 116 foto pada Google Drive kategori kustom.

---
### File yang Dimodifikasi:
1. `index.html` (Markup Tombol Auto-Rotate Galeri & Tombol Putar Lightbox)
2. `css/style.css` (CSS Image Orientation, Transform Rotasi Kartu Foto, Lightbox, & Styling Tombol Rotasi)
3. `js/app.js` (Logika Auto-Rotate, Rotasi Foto, URL Cache Invalidation, Sinkronisasi Langsung DOM ke Backend, Penghapusan Fallback Hardcode)
4. `code.gs` (Penyimpanan rotasi kategori pada CUSTOM_CATEGORIES & EVENTS di ScriptProperties & Sheet)
5. `prd.md` (Pencatatan Master Context & Logika Sistem Terkini v3.6.6)
