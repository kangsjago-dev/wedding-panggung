# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.2
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.2)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Unduh Photobooth Hening Tanpa Window Baru, Unduh Kualitas Asli Tanpa Kompresi via API Proxy, Eliminasi Total Lapisan Gelap/Redup & Restorasi Warna Asli Foto Semua Menu View)

### Rangkuman 3 Pembaruan Utama v3.6.2:
1. **Unduh Photobooth Hening (Tanpa Buka Window / Tab Baru):**
   - **Akar Masalah:** Sebelumnya, saat terjadi pembatasan CORS dari server vendor Photobooth (seperti Kingphotobooth), browser memicu blok `.catch()` yang mengeksekusi `a.target = "_blank"` atau `window.open()`, sehingga browser membuka tab/jendela baru yang mengganggu kenyamanan tamu.
   - **Tindakan:**
     - Dihapus seluruh perintah `window.open` dan `target = "_blank"` pada alur pengunduhan Photobooth di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
     - Mengembangkan endpoint [api/download-proxy.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/download-proxy.js) yang mengambil data biner langsung di tingkat server tanpa batasan CORS browser dan menyematkan header `Content-Disposition: attachment`.
     - Menggunakan mekanisme unduh di latar belakang secara hening: via binary `Blob` object URL yang langsung memicu unduhan lokal, dengan fallback ke invisible iframe (`display: none; width: 0; height: 0;`). Pengunduhan berjalan 100% senyap tanpa membuka jendela baru.

2. **Unduh Kategori Khusus Berkas Asli Penuh Tanpa Kompresi:**
   - **Akar Masalah:** Pada Kingphotobooth, penambahan ekstensi `.jpg` atau `.mp4` pada tautan `/dl/{id}` menyebabkan status HTTP 404 dari server vendor.
   - **Tindakan:**
     - Memperbaiki [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) agar menggunakan format tautan unduh asli `https://x1.kingphotobooth.co/dl/{id}`.
     - Endpoint [api/download-proxy.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/download-proxy.js) menyalurkan berkas byte asli uncompressed kualitas penuh: terverifikasi 191.979 bytes untuk foto dan 83.876 bytes untuk video MP4.

3. **Restorasi Tampilan Foto: Warna Asli Terang & Bebas Lapisan Redup/Abu-Abu (Semua Menu View):**
   - **Akar Masalah:**
     1. Pada [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) elemen `lightboxImg`, terdapat atribut `onerror="this.style.opacity='0.5';"` yang membuat foto menjadi transparan 50% dan bercampur dengan latar belakang, sehingga foto tampak redup, berkabut, dan abu-abu.
     2. Pada [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css), elemen `.photo-overlay` memiliki gradasi gelap `linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 60%)` yang menutupi lebih dari separuh foto.
     3. Modal Lightbox menggunakan warna latar belakang gading semi-transparan dengan `backdrop-filter: blur(14px)` yang membuat konten halaman belakang tembus dan memperkeruh warna foto.
   - **Tindakan:**
     - Menghapus atribut `onerror="this.style.opacity='0.5';"` pada `lightboxImg` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html).
     - Pada [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css), `.photo-overlay` diubah menjadi `background: transparent !important;`, sehingga tidak ada lagi lapisan gradasi gelap yang menutupi gambar. Nama foto ditempatkan pada chip elegan tersendiri.
     - Mengubah latar belakang `.lightbox-modal`, `.lightbox-topbar`, dan `.lightbox-bottombar` menjadi putih bersih solid `#FFFFFF` tanpa efek blur yang menggelapkan.
     - Memproteksi `.photo-img` dan `.lightbox-img` dengan aturan CSS mutlak: `opacity: 1 !important; filter: none !important; background-color: transparent !important;`.
     - Pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) fungsi `updateLightboxContent`, foto selalu dipaksa ke `opacity = '1'` dan `filter = 'none'`.
     - Menambahkan styling desktop yang proporsional untuk `.cover-collage-layout`.

---

### Status Verifikasi Otomatis:
- Berkas pengujian: `scratch/test_v362.js` -> **12 dari 12 pengujian berhasil lulus 100%**.
- Berkas pengujian regresi: `scratch/test_v361.js` -> **13 dari 13 pengujian berhasil lulus 100%**.
- Berkas pengujian regresi: `scratch/test_v360.js` -> **26 dari 26 pengujian berhasil lulus 100%**.

================================================================================
ARSIP RIWAYAT VERSI SEBELUMNYA:
================================================================================
(v3.6.1): Pinch-to-zoom 2 jari di lightbox, retensi badge counter photobooth saat refresh, kategori wedding 116 foto drive, menu share icon-only.
(v3.6.0): Resolusi tajam w3200, proteksi swipe up/down, pemisah baris tanggal/venue share, redesain tata letak admin, penambahan ADMIN_USERNAME, dukungan Kingphotobooth video player & unduh asli MP4.
(v3.5.0): Dukungan album Google Photos, perbaikan counter badge lintas device, sinkronisasi tautan Google Drive per kategori.
(v3.4.0): Sinkronisasi live konfigurasi Google Spreadsheet via GViz, proteksi form login admin, perbaikan format tanggal hari Indonesia.
