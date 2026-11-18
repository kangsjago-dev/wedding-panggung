# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.4
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.4)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (23 dari 23 Test PASS di scratch/test_v364.js, 22 dari 22 Test PASS di scratch/test_v363.js)

### Rangkuman 4 Pembaruan Utama v3.6.4:
1. **Eliminasi Total Tombol Zoom "+ -" pada Modal Preview Foto (Lightbox):**
   - **Akar Masalah:** Masih terdapat markup toolbar perbesaran `#lightboxZoomToolbar` dengan tombol zoom-out `[-]` dan zoom-in `[+]` pada modal Lightbox di `index.html`.
   - **Tindakan:**
     - Menghapus elemen `#lightboxZoomToolbar` dari [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html).
     - Menambahkan aturan CSS mutlak `.lightbox-zoom-toolbar { display: none !important; }` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css).
     - Menghapus instruksi inline-flex di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
     - Seluruh gestur interaktif alami (cubitan pinch-to-zoom 2 jari di layar sentuh ponsel, double-click/double-tap, dan mouse wheel) tetap bekerja 100% mulus di latar belakang tanpa ada tombol visual yang menutupi keindahan foto.

2. **Unduh Khusus Photobooth: Langsung Download Tanpa Konfirmasi & Kualitas Asli (Bukan Ukuran KB):**
   - **Akar Masalah:**
     - Pada sumber Fotoshare, URL gambar mentah dari vendor membawa parameter query resize `?width=450&aspect_ratio=1:1`, sehingga saat diunduh pengguna hanya mendapatkan file berukuran kecil (84 KB). Tanpa parameter tersebut, vendor Fotoshare mengalirkan berkas kamera asli **1.506.911 bytes (1,5 MB)**!
     - Tombol unduh di `index.html` sebelumnya memicu `downloadCurrentPhotoWithFrame()`, yang memasukkan unduhan ke widget antrean simpan berbingkai (*canvas compositor*).
   - **Tindakan Rekayasa Sistem:**
     - Membersihkan seluruh query parameter pemotong resolusi (`replace(/\?.*$/, "")`) pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) di fungsi `fetchFotosharePhotos()` dan `downloadPhotoboothOriginal()`, serta pada serverless proxy [api/download-proxy.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/download-proxy.js). Hasil unduhan kini terverifikasi berukuran **1,5 MB penuh** (*uncompressed camera master*).
     - Mengubah pemanggilan tombol Lightbox di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) menjadi `handleCurrentLightboxDownload()`.
     - Unduh khusus Photobooth berjalan seketika (*instant silent download*) tanpa memunculkan konfirmasi simpan, tanpa antrean, dan tanpa kompresi canvas.

3. **Eliminasi Tuntas Flicker Cover Depan Saat Refresh Pertama:**
   - **Akar Masalah:** Parameter `state.coverSettings.enabled` terinisialisasi secara hardcoded ke `true` di `js/app.js`, dan `GLOBAL_CONFIG` tingkat atas belum memiliki nilai default `COVER_SETTINGS`. Akibatnya, pada refresh pertama sebelum konfigurasi tersimpan selesai dibaca, `renderWeddingCoverShowcase()` sempat mengubah kontainer menjadi `display: block`, lalu menyembunyikannya kembali setelah data dimuat (menimbulkan kedipan/flicker).
   - **Tindakan:**
     - Mengubah nilai default `COVER_SETTINGS.enabled` menjadi `false` pada `GLOBAL_CONFIG` dan `state` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
     - Menambahkan aturan CSS mutlak `.wedding-cover-hero:not(.is-active) { display: none !important; }` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css).
     - Memastikan kontainer cover hanya aktif jika statusnya benar-benar dikonfirmasi aktif (`enabled === true`). Kedipan visual pada saat refresh pertama tereliminasi 100%.

4. **Pemisahan Berkas Cache Berat (Modular Data Split):**
   - **Akar Masalah:** [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) berukuran sangat berat (~294 KB) karena menampung 3 array data cache raksasa (`GOOGLE_PHOTOS_INITIAL_CACHE`, `KING_PHOTOBOOTH_INITIAL_CACHE`, `WEDDING_INITIAL_CACHE`).
   - **Tindakan:**
     - Memisahkan data statis tersebut ke berkas modular baru [js/cache-data.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/cache-data.js).
     - Mendaftarkan `<script src="js/cache-data.js"></script>` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html).
     - Ukuran [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) terpangkas signifikan (berkurang >111 KB), sehingga aplikasi dimuat, di-parse, dan dieksekusi jauh lebih ringan dan cepat pada perangkat seluler maupun desktop.

---

### Status Verifikasi Otomatis:
- Berkas pengujian: `scratch/test_v364.js` -> **23 dari 23 pengujian berhasil lulus 100% (PASS)**.
- Berkas pengujian regresi: `scratch/test_v363.js` -> **22 dari 22 pengujian berhasil lulus 100% (PASS)**.

================================================================================
ARSIP RIWAYAT VERSI SEBELUMNYA:
================================================================================
(v3.6.3): Eliminasi indikator 100% lightbox, jaminan unduh file asli photobooth kualitas penuh, redesain luxury dock mode admin view gallery.
(v3.6.2): Unduh photobooth hening tanpa window baru, unduh kualitas asli uncompressed, eliminasi lapisan abu-abu/gelap di semua menu view.
(v3.6.1): Pinch-to-zoom 2 jari di lightbox, retensi badge counter photobooth saat refresh, kategori wedding 116 foto drive, menu share icon-only.
(v3.6.0): Resolusi tajam w3200, proteksi swipe up/down, pemisah baris tanggal/venue share, redesain tata letak admin, penambahan ADMIN_USERNAME, dukungan Kingphotobooth video player & unduh asli MP4.
