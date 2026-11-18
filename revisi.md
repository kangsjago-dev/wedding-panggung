# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.1
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.1)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Pinch-to-Zoom 2 Jari di Lightbox, Retensi Badge Counter Photobooth Saat Refresh, Pemulihan Kategori Wedding dengan 116 Foto Drive & Mode Unduh Berbingkai Galeri Utama, Minimalisir Modal Share Hanya Menampilkan Icon Buttons)

### Rangkuman 4 Pembaruan Utama v3.6.1:
1. **Fitur Pinch-to-Zoom dengan Dua Jari di Lightbox (Semua Kategori):**
   - **Tindakan:** Mengintegrasikan pendeteksian multi-touch 2 jari pada event `touchstart`, `touchmove`, dan `touchend` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
   - **Formula Skala:** Menggunakan rumus jarak Euclidean 2 sentuhan (`Math.hypot(x0 - x1, y0 - y1)`). Rasio jarak saat ini dibagi jarak awal (`currentDist / initialPinchDist`) dikalikan dengan skala awal untuk menghasilkan perbesaran dan perkecilan yang mulus serta presisi (antara 1.0x hingga 4.0x).
   - **Navigasi Gabungan:** Mendukung transisi mulus antara pinch-to-zoom dua jari, double-tap zoom instan (100% <-> 250%), dan drag-pan satu jari saat foto dalam kondisi perbesaran.

2. **Retensi Badge Counter Photobooth & Kategori Lainnya Saat Halaman Di-refresh:**
   - **Akar Masalah:** Saat pengguna me-refresh halaman, objek runtime `state.categoryPhotosMap` kembali kosong, dan tab Photobooth sempat kehilangan angka jumlah fotonya sebelum diklik manual.
   - **Tindakan:**
     - Menambahkan penyimpanan otomatis jumlah foto ke browser cache `localStorage` (`WEDDING_CAT_COUNT_{kategori}`) di fungsi `updateCategoryPillCount`.
     - Pada `renderCategoryTabs()`, pill counter langsung membaca nilai dari `localStorage` atau cache bawaan (`KING_PHOTOBOOTH_INITIAL_CACHE` / `GOOGLE_PHOTOS_INITIAL_CACHE`) sehingga angka counter tidak pernah hilang atau menjadi 0 saat refresh.
     - Melakukan pre-seeding `state.categoryPhotosMap` pada awal `DOMContentLoaded` untuk Photobooth dan Wedding agar data foto siap tampil seketika saat tab diklik.

3. **Kategori Wedding & Kategori Momen Lainnya Siap Foto & Mengikuti Galeri Utama:**
   - **Akar Masalah:** Folder Google Drive publik `1GGB77clCMYBIg17J0ECr2eVbD02ZeInW` pada kategori Wedding sebelumnya gagal diambil karena simulasi backend di Vercel belum meneruskan pemindaian folder secara live, dan fallback lokal menghasilkan 0 foto.
   - **Tindakan:**
     - Membuat endpoint Vercel Serverless [api/drive-folder.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/drive-folder.js) yang memindai folder Google Drive publik secara langsung via `embeddedfolderview` dan mengembalikan daftar foto lengkap beserta tautan resolusi tinggi `lh3.googleusercontent.com/d/{id}=w3200`.
     - Menyematkan cache instan `WEDDING_INITIAL_CACHE` berisi 116 foto beresolusi tinggi di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) sebagai cadangan instan tanpa latensi jaringan.
     - Kategori Wedding dan seluruh kategori momen kustom lainnya secara konsisten mewarisi seluruh konfigurasi galeri utama: pratinjau kartu foto, lightbox resolusi tinggi, serta unduh kenangan berbingkai (`downloadWithFrame`).

4. **Penyempurnaan Menu Bagikan / Share QR (Hanya Menampilkan Icon Tombol):**
   - **Tindakan:** Pada modal Bagikan & QR Code di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html), elemen kotak input tautan teks diubah menjadi `<input type="hidden" id="shareUrlInput">` sehingga teks tautan panjang tidak lagi tampil di layar.
   - **Tata Letak Icon Elegan:** Tiga tombol aksi utama ditempatkan sejajar di posisi tengah (*centered*) dengan jarak 14px dan ukuran seragam 48x48px:
     1. **Icon Bagikan Tautan** (Web Share API untuk WhatsApp, Instagram, Telegram, SMS, dll).
     2. **Icon Salin Tautan** (Salin URL ke papan klip dengan konfirmasi toast).
     3. **Icon Unduh QR Code** (Unduh file gambar QR Code format `.png` beresolusi tinggi).

---

### Status Verifikasi Otomatis:
- Berkas pengujian: `scratch/test_v361.js` -> **13 dari 13 pengujian berhasil lulus 100%**.
- Berkas pengujian regresi: `scratch/test_v360.js` -> **26 dari 26 pengujian berhasil lulus 100%**.
- Seluruh kode berstatus bebas error konsol dan kompatibel di layar sentuh Mobile (Android/iOS) maupun PC Desktop.

================================================================================
ARSIP RIWAYAT VERSI SEBELUMNYA:
================================================================================
(v3.6.0): Resolusi tajam w3200, proteksi swipe up/down, pemisah baris tanggal/venue share, redesain tata letak admin, penambahan ADMIN_USERNAME, dukungan Kingphotobooth video player & unduh asli MP4.
(v3.5.0): Dukungan album Google Photos, perbaikan counter badge lintas device, sinkronisasi tautan Google Drive per kategori.
(v3.4.0): Sinkronisasi live konfigurasi Google Spreadsheet via GViz, proteksi form login admin, perbaikan format tanggal hari Indonesia.
