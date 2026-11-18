# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.3
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.3)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Hilangkan Indikator 100% pada Preview Foto, Jaminan Pengunduhan File Asli Photobooth Kualitas Penuh Tanpa Canvas/Kompresi, Desain Ulang Luxury Dock & Status Mode Admin saat Preview Galeri)

### Rangkuman 3 Pembaruan Utama v3.6.3:
1. **Eliminasi Tampilan "100%" pada Lightbox Preview Foto:**
   - **Akar Masalah:** Sebelumnya terdapat elemen `<span id="lightboxZoomLevelText">100%</span>` pada toolbar perbesaran foto di Lightbox modal. Nilai persentase ini terus tampil dan ter-update saat foto di-zoom, mengganggu kebersihan visual foto saat tamu sedang melihat pratinjau foto.
   - **Tindakan:**
     - Menghapus elemen `<span id="lightboxZoomLevelText">100%</span>` dan tombol reset dari `lightboxZoomToolbar` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html). Toolbar kini tampil ultra-clean, minimalis, dan elegan hanya dengan tombol zoom out `[-]` dan zoom in `[+]`.
     - Menghapus manipulasi `lightboxZoomLevelText` di fungsi `applyLightboxZoom()` pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
     - Menyesuaikan styling toolbar di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css).

2. **Jaminan Pengunduhan File Asli Khusus Photobooth (JANGAN DIUBAH UKURANNYA):**
   - **Akar Masalah:**
     - Jika admin mengubah nama kategori Photobooth (misalnya menjadi nama lain) atau tab aktif berubah, evaluasi `isPhotobooth` berbasis string nama kategori menghasilkan `false`.
     - Hal tersebut menyebabkan berkas Photobooth dialihkan ke `downloadCurrentPhotoWithFrame()`, yang memuat foto ke `<canvas>` HTML5 berbingkai dan mengekspornya dengan resolusi dan kompresi JPEG baru, sehingga ukuran file asli berubah dan terkompresi.
   - **Tindakan:**
     - Memasang **Guard Mutlak** di baris awal `downloadCurrentPhotoWithFrame()` pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js): jika berkas terdeteksi sebagai Photobooth (berdasarkan `photo.isKing`, `photo.isVideo`, `photo.isPhotobooth`, atau domain sumber `kingphotobooth.co`, `fotoshare.co`, `photos.google.com`), eksekusi canvas dihentikan seketika dan langsung dialihkan ke `downloadPhotoboothOriginal(photo)`.
     - Memperluas deteksi Photobooth di `updateLightboxContent()` agar mengevaluasi seluruh flag dan domain vendor terlepas dari apa pun nama kategori yang diinput admin.
     - Menyematkan flag eksplisit `isPhotobooth: true` pada builder [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js), [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js), dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs).
     - Menjamin pengunduhan berkas asli byte-for-byte melalui server binary stream proxy [api/download-proxy.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/download-proxy.js) dan direct fetch/invisible iframe, tanpa melalui kompresi canvas maupun bingkai.

3. **Penataan Ikon & Tipografi Mode Admin saat View Gallery (Preview Sambil Login Admin):**
   - **Akar Masalah:** Bar floating admin sebelumnya menggunakan div gelap sederhana dengan emoji dan teks kaku. Ikon tombol `#adminBtn` di sticky filter bar juga tetap menampilkan gembok terkunci meskipun admin sudah berhasil masuk.
   - **Tindakan:**
     - Merombak total `#adminActiveFloatingBar` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) menjadi **Luxury Floating Dock** beraksen gading-emas gelap (`rgba(15, 23, 42, 0.88)` dengan blur 16px, border gold halus, dan rounded pill).
     - Menambahkan hierarki visual profesional:
       - Green live pulse status badge (`.admin-dock-badge-pulse`).
       - Kolom teks bertingkat: Sub-label uppercase modern (`Mode Admin • Pratinjau`) dan nama administrator tebal (`Administrator`).
       - Garis pemisah vertikal elegan (`.admin-dock-divider`).
       - Tombol aksi berikon SVG tajam: Tombol Pengaturan (ikon gear) dengan gradasi gold berkilau, dan Tombol Keluar (ikon logout) beraksen transparan lembut.
     - Mengembangkan fungsi `updateAdminButtonUI(isLoggedIn)` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js): saat admin login, tombol `#adminBtn` di bar utama berubah menjadi **gembok terbuka** (*unlocked*) dengan status dot hijau bercahaya (`.admin-active-dot`) dan tooltip interaktif; saat logout, tombol kembali ke status gembok terkunci secara otomatis.
     - Menambahkan aturan responsivitas mobile di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css) `@media (max-width: 640px)`.

---

### Status Verifikasi Otomatis:
- Berkas pengujian: `scratch/test_v363.js` -> **22 dari 22 pengujian berhasil lulus 100% (PASS)**.

================================================================================
ARSIP RIWAYAT VERSI SEBELUMNYA:
================================================================================
(v3.6.2): Unduh photobooth hening tanpa window baru, unduh kualitas asli uncompressed, eliminasi lapisan abu-abu/gelap di semua menu view.
(v3.6.1): Pinch-to-zoom 2 jari di lightbox, retensi badge counter photobooth saat refresh, kategori wedding 116 foto drive, menu share icon-only.
(v3.6.0): Resolusi tajam w3200, proteksi swipe up/down, pemisah baris tanggal/venue share, redesain tata letak admin, penambahan ADMIN_USERNAME, dukungan Kingphotobooth video player & unduh asli MP4.
(v3.5.0): Dukungan album Google Photos, perbaikan counter badge lintas device, sinkronisasi tautan Google Drive per kategori.
(v3.4.0): Sinkronisasi live konfigurasi Google Spreadsheet via GViz, proteksi form login admin, perbaikan format tanggal hari Indonesia.
