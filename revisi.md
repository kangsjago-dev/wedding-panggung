# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.0)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Resolusi Tajam & Lightbox Zoom Interaktif Semua Kategori, Proteksi Swipe Up/Down Photobooth, Pemisah Baris Tanggal & Venue Share QR, Redesain Modern Tata Letak Menu Admin, Penambahan Parameter ADMIN_USERNAME di Google Spreadsheet, Warisan Konfigurasi Galeri Utama untuk Kategori Momen Lainnya, Sinkronisasi Folder Kategori Google Drive, Dukungan Vendor Spesial Kingphotobooth dengan Pemutar Video MP4 & Unduh Video Asli)

### Rangkuman 8 Pembaruan Utama v3.6.0:
1. **Resolusi Tajam Penuh & Fitur Zoom Interaktif di Lightbox (Semua Kategori):**
   - **Tampilan Tajam & Terang:** Menggantikan thumbnail terkompresi Google Drive dengan endpoint resolusi penuh Google `https://lh3.googleusercontent.com/d/{id}=w3200` (dan `=w3200` untuk Google Photos). Foto pratinjau kini tampil terang, tajam, dan jernih tanpa artefak blur atau kompresi kabur.
   - **Fitur Zoom Interaktif:**
     - Ditambahkan toolbar zoom elegan di topbar lightbox: Tombol Perkecil `[-]`, Reset Ukuran `[1:1 / 100%]`, dan Perbesar `[+]`.
     - Mendukung **Double-Click / Double-Tap** pada foto untuk beralih instan antara ukuran normal (100%) dan zoom detail (250%).
     - Mendukung **Mouse Wheel Zoom** (100% hingga 400%).
     - Mendukung **Drag to Pan / Touch Pan**: Saat foto di-zoom, pengguna dapat menggeser/menyeret foto ke segala arah dengan kursor grab/grabbing yang mulus.
2. **Proteksi Swipe Up/Down pada Menu Khusus Photobooth & Lightbox:**
   - **Akar Masalah:** Sebelumnya listener sentuh hanya merekam `screenX` tanpa mengecek pergerakan sumbu vertikal `screenY`, sehingga usapan vertikal (swipe up/down) memicu perpindahan foto.
   - **Tindakan:** `setupTouchSwipe` kini merekam koordinat `touchStartX, touchStartY` dan `touchEndX, touchEndY`. Perpindahan foto hanya diizinkan jika murni gerakan horizontal (`Math.abs(diffX) >= 65` dan `absX > 2 * absY`). Jika terdeteksi pergerakan vertikal (`absY >= absX` atau `absY > 50`) atau saat foto sedang di-zoom, navigasi foto otomatis diabaikan.
3. **Pemisah Baris Tanggal & Venue pada Menu Bagikan QR (Enter 1x):**
   - **Tindakan:** Pada modal Bagikan & QR Code, teks tanggal dan venue kini dipisahkan dengan enter (dua baris terpisah): Baris 1 menampilkan Hari & Tanggal (contoh: *"Senin, 16 November 2026"*), dan Baris 2 menampilkan Venue/Lokasi (contoh: *"UpperHills Convention Hall, Makassar"*).
4. **Pembaruan Tampilan & Tata Letak Menu Admin (Modern, Rapi & Mudah Digunakan):**
   - **Tindakan:** Memperluas lebar card modal admin menjadi 680px yang lebih leluasa, mendesain ulang navigasi tab dengan tab-pill modern, border halus, spacing konsisten, kontras teks yang nyaman di mata, dan pengelompokan card pengaturan yang intuitif.
5. **Penambahan Parameter ADMIN_USERNAME pada Google Spreadsheet:**
   - **Tindakan:** 
     - Di [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs): Menambahkan baris konfigurasi `ADMIN_USERNAME: "admin"` ke dalam sheet master `Pengaturan`.
     - Di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs): Menambahkan `DEFAULT_ADMIN_USERNAME: "admin"`, pembacaan parameter di `readConfigFromSheet()`, serta penulisan ke sheet di `writeConfigToSheet()`.
     - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js): Sinkronisasi live via GViz otomatis menyerap `ADMIN_USERNAME` dari spreadsheet dan mengirimkannya saat admin menyimpan pengaturan.
6. **Kategori Momen Lainnya Mengikuti Pengaturan Kategori Galeri Utama:**
   - **Tindakan:** Seluruh kategori momen kustom (seperti `Wedding`, `Akad`, `Resepsi`) secara otomatis mewarisi mode tampilan galeri utama, format kartu foto, serta unduh kenangan berbingkai (`downloadWithFrame`) dari template bingkai galeri utama.
7. **Kategori Momen Lainnya Siap Link & Fitur Sinkronisasi Langsung:**
   - **Tindakan:** Kategori `Wedding` dengan tautan Google Drive `https://drive.google.com/drive/folders/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW` telah terhubung. Tombol sinkronisasi per-kategori (`syncSingleCategory`) dan sinkronisasi menyeluruh (`syncCategoriesAndDisplayLinks`) langsung memindai item folder dan memperbarui badge counter seketika.
8. **Dukungan Spesial Vendor Kingphotobooth (Pratinjau Foto & Video MP4 + Unduh Asli):**
   - **Tindakan:**
     - Membuat endpoint backend [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) dan fungsi pemindai `scanKingPhotoboothEvent()` di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) yang mengekstrak 274 item dari `https://x1.kingphotobooth.co/e/23d0e80056ae8f2fbb5d116f`.
     - Mengidentifikasi status media secara cerdas: 137 item foto dan 137 item video (`is_video: true`).
     - Menyematkan lencana `▶ Video` pada kartu galeri untuk item bertipe video.
     - Di Lightbox: Menampilkan pemutar video responsif `<video>` dengan kontrol putar, putar otomatis (*autoplay*), dan tombol unduh khusus: `⬇️ Unduh Video Asli Photobooth` (mengunduh berkas video asli `.mp4` kualitas penuh dari server vendor).
     - Menyiapkan cache instan 274 item di `KING_PHOTOBOOTH_INITIAL_CACHE` pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) untuk menjamin pemuatan kilat tanpa jeda.

### Status Verifikasi Otomatis:
- Berkas pengujian: `scratch/test_v360.js` -> **26 dari 26 pengujian berhasil lulus 100%**.
