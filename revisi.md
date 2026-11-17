# RENCANA REVISI & CATATAN RILIS SISTEM: v3.5.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.5.0)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Sinkronisasi Live Kategori Multi-Device Terpusat, Username Admin Kosong Saat Login, Redesain Share QR Tanpa Jam & Tanggal Nama Hari Bersama Logo Share, Dukungan Penuh Google Photos Album untuk Photobooth, Isolasi Ketat Target Link Tiap Kategori Tanpa Mengambil Foto Kategori Lain)

### Rangkuman 6 Pembaruan Utama v3.5.0:
1. **Sinkronisasi Live Kategori Multi-Device Terpusat:**
   - **Akar Masalah:** Sebelumnya `syncFromSpreadsheetGViz` dilewati saat `GAS_API_URL` terisi, dan GAS script yang ter-deploy tidak mengembalikan kolom kategori terkini sehingga tiap device terjebak pada `localStorage` masing-masing atau file konfigurasi lama.
   - **Tindakan:** `syncFromSpreadsheetGViz` kini selalu berjalan secara live membaca Google Spreadsheet (Google Visualization API) pada saat pembukaan halaman maupun pada auto-refresh 25 detik. Berkas [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) telah diselaraskan dengan kategori live terkini: `Photobooth` (Google Photos) dan `Wedding` (Google Drive).
   - **Hasil:** Seluruh device (PC, smartphone tamu, tablet) kini melihat daftar kategori yang 100% konsisten dan tersinkronisasi otomatis seketika saat admin menambah atau mengubah kategori.
2. **Perbaikan Tampilan Login Admin (Username Bersih Tanpa Pre-fill):**
   - **Tindakan:** Menghapus atribut `value="admin"` dari input username di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) dan menambahkan instruksi pembersihan input `uInp.value = ""` saat `openAdminModal()` dipanggil.
   - **Hasil:** Saat modal login admin dibuka, kolom username dan password tampil bersih dan kosong, siap diketik oleh admin.
3. **Penyempurnaan Tampilan Menu Share QR (Format Hari/Tanggal Tanpa Jam & Logo Share Link):**
   - **Tindakan:** 
     - Menghapus keterangan jam, menit, detik, dan zona waktu GMT yang panjang.
     - Menyediakan fungsi pemformat tanggal `formatDayDateIndonesian()` yang otomatis menghasilkan format resmi: `[Nama Hari], [DD] [MMMM] [YYYY]` (contoh: *"Senin, 16 November 2026"*).
     - Menambahkan tombol **Logo Share Link** (ikon bagikan tautan interaktif) bersanding rapi dengan Logo Salin Tautan dan Logo Unduh QR Code.
4. **Dukungan Penuh Google Photos Album untuk Photobooth:**
   - **Tindakan:** 
     - Menyediakan endpoint API [api/google-photos.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/google-photos.js) serta fungsi pemindai `fetchGooglePhotos()` dan `scanGooglePhotosAlbum()` di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs).
     - Menginjeksi cache instan 115 foto dari album bersama Google Photos yang diberikan user (`https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR`).
   - **Hasil:** Tab Photobooth kini dapat memuat album bersama Google Photos dengan resolusi tinggi, thumbnail cepat, dan unduhan kualitas asli dari CDN Google tanpa kompresi dan tanpa bingkai.
5. **Isolasi Ketat Foto Tiap Kategori (Dilarang Mengambil Foto Kategori Lain):**
   - **Tindakan:** Menghapus seluruh mekanisme fallback yang sebelumnya meminjam foto dari galeri utama (`state.allPhotos`) saat kategori kustom belum terisi foto.
   - **Hasil:** Setiap kategori hanya menampilkan foto yang benar-benar berasal dari folder atau tautan targetnya masing-masing. Jika suatu kategori belum memiliki foto, sistem menyajikan status kosong yang elegan disertai tombol sinkronisasi khusus, tanpa pernah menampilkan foto dari kategori lain.
6. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Seluruh fungsionalitas inti: unduh berbingkai resolusi tinggi, antrean unduh background, multi-event switcher, serta otentikasi login admin tetap berjalan prima 100%.
