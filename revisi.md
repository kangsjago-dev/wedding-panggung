# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.7
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.6.7) - 100% SUKSES
TANGGAL: 18 November 2026

### 3 Poin Instruksi Utama Pengguna:
1. **Hapus Semua Tombol Rotate & Otomatiskan Rotasi Sistem:**
   - Seluruh tombol putar/rotate manual dihapus total:
     - Dihapus: Tombol putar di bar kontrol galeri (`#btnAutoRotateCategory`).
     - Dihapus: Tombol putar di setiap kartu foto galeri (`.photo-card-rotate-btn`).
     - Dihapus: Tombol putar di dalam modal Lightbox (`#lightboxRotateBtn` & `#lightboxRotateLabel`).
     - Dihapus: Dropdown orientasi di modal pengaturan admin (`#pbRotationSelect` & `.cat-rotation-select`).
   - Sistem auto-rotate otomatis mendeteksi foto panggung (folder `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` / kategori Wedding stage) dan otomatis memutarnya 90° tegak lurus pada tampilan galeri (`.rotate-90`), pratinjau lightbox (`rotate(90deg)`), dan canvas generator unduhan berbingkai tanpa perlu diklik manual oleh pengguna.

2. **Kategori Spesial & Momen Lainnya Berubah Akurat di Semua Device:**
   - **Akar Masalah:**
     - `config.json` lokal masih menyimpan tautan lama (Kingphotobooth & folder 116 foto).
     - `DOMContentLoaded` di `js/app.js` memiliki pre-seed hardcoded `state.categoryPhotosMap["Wedding"] = WEDDING_INITIAL_CACHE` (116 foto) yang meracuni cache pada device baru.
     - `syncFromSpreadsheetGViz` tidak menginvalidasi cache saat Google Sheet diperbarui.
   - **Solusi Tuntas:**
     - Sinkronisasi `config.json` dengan nilai resmi: Photobooth (`https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs`) dan Wedding (`https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`).
     - Pre-seed statis hardcoded dihapus sehingga device baru selalu membaca konfigurasi aktif.
     - `syncFromSpreadsheetGViz` mendeteksi perubahan URL, mengosongkan cache lama, mem-prefetch data baru, merender tab kategori, dan me-refresh galeri jika kategori aktif sedang dibuka.
     - API endpoint `api/drive-folder.js` dan fallback default di `code.gs` diperbarui secara sinkron.

3. **Perbaikan Tampilan & Navigasi Kategori pada Mode Mobile:**
   - **Akar Masalah:**
     - Pada layar ponsel (≤768px), ikon Share, Refresh, dan Admin diletakkan sejajar di samping kategori dalam 1 baris sempit, menyebabkan tab kategori terdesak dan sulit di-scroll saat jumlah kategori bertambah.
   - **Solusi Tuntas (2-Tier Mobile Layout):**
     - Tier Atas (Order 1): Ikon aksi (Share, Refresh, Admin) dirangkum rapi di pojok kanan atas dalam kapsul glassmorphism elegan (`background: rgba(255,255,255,0.9); border: 1px solid rgba(197,168,128,0.35); border-radius: 9999px;`).
     - Tier Bawah (Order 2): Tab kategori (`.filter-scroll`) mendapatkan **100% lebar layar penuh** dengan padding halus dan horizontal swipe alami yang leluasa disentuh jari, tanpa terhalang atau terhimpit ikon aksi.

---
### File yang Dimodifikasi:
1. `index.html`: Penghapusan tombol `#lightboxRotateBtn` dari topbar modal lightbox.
2. `css/style.css`: Penghapusan style `.photo-card-rotate-btn` dan implementasi layout responsif 2-tier mobile untuk `.filter-container`, `.action-controls-group`, dan `.filter-scroll`.
3. `config.json`: Sinkronisasi tautan Photobooth dan Wedding terbaru untuk inisialisasi lintas perangkat.
4. `api/drive-folder.js`: Deteksi folder panggung `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` dan penetapan tag `autoRotate: 90`.
5. `js/app.js`: Auto-rotate cerdas di `getPhotoRotation()`, penghapusan tombol rotate di `renderPhotoGrid()`, pembersihan dropdown rotate di modal admin, penghapusan pre-seed hardcoded lama, dan invalidasi cache dinamis di `syncFromSpreadsheetGViz()`.
6. `code.gs`: Sinkronisasi tautan default `CUSTOM_CATEGORIES` dan `EVENTS`.
7. `scratch/test_v367.js`: Pengujian otomatis regresi & fitur (100% PASS).
