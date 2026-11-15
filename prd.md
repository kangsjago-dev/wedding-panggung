# DOKUMEN SPESIFIKASI PRODUK (PRD) & MASTER CONTEXT
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE & SISTEM: ZettBOT v4.1 by Zettbos
STATUS: AKTIF & SELESAI DIIMPLEMENTASIKAN (PRODUCTION READY)
================================================================================

<!-- ======================================================================= -->
<!-- ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)                 -->
<!-- ======================================================================= -->

## 1. Nama Projek & Problem Statement
- **Nama Projek:** Wedding Panggung - Elegant Google Drive Photo Gallery Web App.
- **Problem Statement:** 
  Pada acara pernikahan, momen bahagia didokumentasikan oleh fotografer profesional maupun panitia dan tersimpan dalam folder Google Drive. Namun, membagikan tautan folder Google Drive mentah kepada tamu undangan terasa kaku, membosankan, lambat dimuat di ponsel pintar, dan tidak ramah bagi tamu yang ingin melihat foto secara estetik.
- **Solusi Sistem:**
  Sebuah web app galeri foto pernikahan modern berbasis Google Apps Script (GAS) dan Google Drive API yang gratis tanpa biaya server. Mengubah folder Google Drive menjadi galeri foto digital mewah bernuansa *Romantic Ivory & Soft Gold* (Anti-AI Aesthetic), dilengkapi fitur filter kategori momen otomatis, tampilan galeri responsif, Lightbox layar penuh dengan download kualitas asli, serta Mode Slideshow Otomatis untuk tayangan panggung/TV venue.

---

## 2. Peran Pengguna (User Roles)
1. **Tamu Undangan (Guest / Visitor):**
   - Mengakses web app melalui tautan web atau scan QR code di meja/undangan.
   - Menjelajahi foto-foto pernikahan berdasarkan kategori momen (Semua, Lamaran, Akad, Resepsi, Photobooth).
   - Membuka foto dalam mode Lightbox layar penuh, memperbesar (zoom), dan menggeser (swipe di HP / panah di PC).
   - Mengunduh foto berkualitas asli (resolusi penuh dari Google Drive).
   - Mengaktifkan mode tayangan panggung (Slideshow otomatis) jika ingin menikmati alur foto tanpa menyentuh layar.
2. **Pengantin / Admin / Fotografer:**
   - Cukup mengunggah foto-foto pernikahan ke dalam folder Google Drive utama atau sub-folder momen.
   - Mengatur konfigurasi praktis (Nama Mempelai, Tanggal Pernikahan, Pesan Sambutan, dan ID Folder Google Drive) pada satu file konfigurasi terpusat.
   - Memperbarui atau menambahkan foto kapan saja tanpa perlu menyentuh atau merombak kode aplikasi.

---

## 3. Arsitektur & Lingkungan Kerja
- **Platform Runtime:** Google Apps Script (GAS) Web App (100% Gratis, Serverless, Terintegrasi Langsung dengan Akun Google pengguna).
- **Backend Service:** Google Apps Script (`code.gs` & `setup.gs`) dengan hak akses `DriveApp` untuk membaca struktur folder dan berkas gambar di Google Drive.
- **Frontend Layer:** `index.html` (Modern HTML5, Tailwind CSS via CDN / Native CSS Berkelas, Font Google: *Cormorant Garamond / Playfair Display* & *Plus Jakarta Sans*, Vanilla JavaScript berperforma tinggi).
- **Pola Arsitektur:** Clean Monolith Modular (Seluruh fungsi backend terpusat di `code.gs` dan `setup.gs`, antarmuka terintegrasi aman di `index.html` agar mudah disalin langsung ke Editor Google Apps Script tanpa proses build/bundling yang rumit).
- **Data Source:** Google Drive Folder ID (otomatis memindai file gambar dengan format JPEG, PNG, WEBP, dan sub-folder momen).

---

## 4. Alur Kerja Aplikasi (User Flow)
1. **Inisialisasi & Pembukaan Halaman:**
   - Tamu membuka URL Web App.
   - Sistem menampilkan *Hero Header* pernikahan yang anggun: Nama Pasangan Mempelai, Tanggal Bahagia, dan Pesan Sambutan hangat.
   - Sistem mengambil daftar kategori (sub-folder) dan daftar foto dari backend secara asinkron.
2. **Penyajian Galeri & Filter Kategori:**
   - Foto disajikan dalam bentuk Grid Responsif (2 kolom di HP, 3-4 kolom di Laptop/PC).
   - Tamu dapat mengeklik tab kategori momen (misal: "Semua", "Akad Nikah", "Resepsi").
   - Filter berjalan instan (0 detik) berkat mekanisme *In-Memory Caching* di browser tanpa membebani server Google Drive.
3. **Eksplorasi Foto (Lightbox Layar Penuh):**
   - Tamu mengeklik salah satu foto.
   - Muncul modal Lightbox layar penuh dengan latar belakang gelap elegan.
   - Tamu dapat menggeser ke foto berikutnya/sebelumnya (tombol panah, tombol keyboard, atau gestur sentuh swipe di HP).
   - Tersedia tombol "Unduh Foto Asli" yang langsung mengunduh file gambar resolusi tinggi dari Google Drive.
4. **Mode Panggung / TV Slideshow (Live Venue Display):**
   - Pengantin atau operator panggung dapat mengeklik tombol "Mode Panggung (Slideshow)".
   - Web app bertransisi ke tampilan layar penuh (*fullscreen*) tanpa elemen pengganggu.
   - Foto berganti otomatis setiap 4 detik dengan transisi fade halus yang mewah dan romantis.

---

## 5. Struktur Data & Konfigurasi Google Drive
Karena web app ini mengambil sumber langsung dari Google Drive, tidak diperlukan skema tabel database SQL yang rumit. Seluruh data dikendalikan melalui:

### A. Struktur Folder Google Drive (Bebas Fleksibel)
- **Model 1 (Sub-Folder Momen - Disarankan):**
  ```text
  📁 [Folder Utama Wedding] (ID dikonfigurasi di code.gs)
     ├── 📁 01. Prewedding
     │    ├── IMG_001.jpg
     │    └── IMG_002.jpg
     ├── 📁 02. Akad Nikah
     │    ├── IMG_101.jpg
     │    └── IMG_102.jpg
     └── 📁 03. Resepsi
          ├── IMG_201.jpg
          └── IMG_202.jpg
  ```
- **Model 2 (Folder Tunggal):**
  Semua foto langsung diletakkan di dalam satu folder utama. Sistem otomatis mendeteksi dan menampilkan seluruh foto dalam kategori default "Semua Foto".

### B. Struktur Objek Data Foto (JSON Payload dari Backend ke Frontend)
```javascript
{
  id: "1a2b3c4d5e...",          // ID Berkas Google Drive
  name: "Akad-01.jpg",          // Nama Berkas
  category: "Akad Nikah",       // Nama Kategori (dari Sub-Folder atau "Semua Foto")
  thumbnailUrl: "https://...",   // URL Thumbnail Cepat (Google UserContent CDN)
  downloadUrl: "https://...",    // URL Unduh Resolusi Asli Google Drive
  dateCreated: "15/11/2026"     // Tanggal file diunggah
}
```

---

## 6. Aturan Validasi & Rekayasa Logika Khusus
1. **Konfigurasi Praktis Terpusat (`WEDDING_CONFIG`):**
   Tersedia satu objek konfigurasi yang sangat jelas di baris teratas `code.gs`:
   - `COUPLE_NAME`: Nama pasangan (contoh: "Romeo & Juliet").
   - `EVENT_DATE`: Tanggal pernikahan (contoh: "15 November 2026").
   - `WELCOME_MESSAGE`: Kalimat sambutan manis untuk tamu.
   - `DRIVE_FOLDER_ID`: ID Folder Google Drive tempat foto disimpan.
2. **Fast Image CDN Loading:**
   Menggunakan format tautan langsung Google Drive thumbnail (`https://lh3.googleusercontent.com/d/{id}=w800` untuk galeri dan `=w2048` atau direct download URL untuk resolusi asli) sehingga foto terbuka kilat, tajam, dan tidak memberatkan bandwidth.
3. **Client-Side In-Memory Caching:**
   Data foto hanya di-fetch 1 kali saat web pertama kali dimuat. Perpindahan filter tab kategori dilakukan secara instan di memori JavaScript browser tanpa loading ulang.
4. **Benteng Anti-Freeze UI & Safe Preview:**
   - Seluruh pemanggilan backend dilindungi dengan `.withFailureHandler()` agar tombol tidak pernah mati atau macet.
   - Pengecekan aman `if (typeof google !== 'undefined' && google.script && google.script.run)` sehingga file HTML tetap aman dibuka secara lokal untuk pengujian antarmuka.

---

## 7. Rencana Antarmuka & Estetika Desain (Anti-AI Aesthetic)
- **Filosofi Visual:** *Romantic Ivory & Soft Gold* (Elegan, Hangat, Berkelas).
- **Palet Warna:**
  - Background Utama: Warm Ivory Cream (`#FAF8F5`).
  - Card & Container: Pure Warm White (`#FFFFFF`) dengan bayangan halus (`box-shadow: 0 10px 30px rgba(0,0,0,0.04)`).
  - Teks Utama: Deep Slate Charcoal (`#2C3E50` / `#1E293B`) untuk keterbacaan sempurna.
  - Aksen Mewah: Champagne Soft Gold (`#C5A880` / `#D4AF37`) pada border halus, badge tanggal, dan tombol interaktif.
- **Tipografi:**
  - Judul Mempelai & Hero: Font Serif Klasik (*Playfair Display* / *Cormorant Garamond*).
  - Teks Konten & Navigasi: Font Sans-Serif Modern (*Plus Jakarta Sans*).
- **Elemen Antarmuka:**
  1. *Hero Banner:* Judul nama pengantin, tanggal, hiasan ornamen minimalis SVG, dan tombol pintas "Buka Galeri" & "Mode Panggung".
  2. *Bilah Kategori (Filter Bar):* Kapsul tombol filter horizontal yang dapat di-scroll mulus di layar ponsel.
  3. *Galeri Foto (Masonry Grid):* Kartu foto bersudut halus (`rounded-2xl`), efek zoom lembut saat kursor melayang (hover), dan tombol unduh cepat.
  4. *Modal Lightbox:* Tampilan layar penuh, tombol Next/Previous, indikator nomor foto (contoh: "12 dari 84"), dan tombol "Unduh Kualitas Asli".
  5. *Mode Slideshow Panggung:* Tampilan layar penuh bebas distraksi dengan timer otomatis 4 detik dan kontrol Play/Pause.

---

## 8. Kriteria Pengujian Sistem (Acceptance Criteria)
- [ ] Folder Google Drive dapat dihubungkan hanya dengan memasukkan Folder ID ke dalam konfigurasi `code.gs`.
- [ ] Web app berhasil membaca foto di dalam folder utama maupun sub-folder momen.
- [ ] Tab filter kategori otomatis terisi sesuai nama-nama sub-folder di Google Drive.
- [ ] Foto muncul dalam grid rapi di layar ponsel (2 kolom) dan laptop (3-4 kolom).
- [ ] Klik pada foto membuka Lightbox layar penuh dengan navigasi geser (panah / swipe HP).
- [ ] Tombol unduh berfungsi mengunduh foto kualitas asli langsung ke galeri ponsel/laptop pengguna.
- [ ] Mode Slideshow Panggung dapat diputar otomatis dengan transisi foto yang halus dan elegan.
- [ ] Jika folder Google Drive belum diisi atau ID salah, sistem menampilkan panduan ramah tanpa melempar layar blank/error.

---

<!-- ======================================================================= -->
<!-- ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)       -->
<!-- ======================================================================= -->

### A. Status Arsitektur & Lingkungan Aktif
- **Versi Sistem:** 2.1.0 (Pure Google Spreadsheet Architecture, Live Central Sync & Admin Date Picker).
- **Runtime:** Vercel Global Edge CDN / GitHub Pages (Frontend) + Google Spreadsheet 'foto-panggung' (Pengaturan, Daftar_Foto, Log_Aktivitas) + Google Apps Script REST API Backend.
- **Daftar Berkas Terpasang:**
  1. `ZettBOT.md`: Sakelar aktivasi lisensi & sistem arsitek ZettBOT.
  2. `prd.md`: Dokumen acuan spesifikasi produk & master context (file ini).
  3. `config.json`: Berkas konfigurasi live baseline default.
  4. `vercel.json`: Konfigurasi Vercel deployment.
  5. `package.json`: Metadata proyek untuk Vercel.
  6. `code.gs`: Backend Google Apps Script REST API (`doGet`, `doPost`, `handleApiRequest`, direct Google Spreadsheet `foto-panggung` photo catalog reader from Sheet `Daftar_Foto`, two-way config sync via Sheet `Pengaturan`, setupDemo handler) v2.1.0.
  7. `setup.gs`: Utilitas inisialisasi, pengujian spreadsheet database, generator demo spreadsheet murni (`setupDemoSystemWithDummyFiles`), dan reset PIN admin.
  8. `index.html`: Antarmuka galeri foto responsif universal dengan arsitektur Google Spreadsheet murni (bebas Google Drive), pemilih tanggal modern (Date Picker `<input type="date">`) dengan konversi otomatis format bahasa Indonesia, modal admin ringkas dan elegan, input admin 100% unlocked (Nama Event, Tanggal Acara, Venue), Hero Header dinamis, badge foto baru ("✨ Baru" auto-expire 10 menit), filter kategori otomatis dari tabel spreadsheet, Lightbox layar penuh, Slideshow panggung, Live Auto-Sync (20s), auto-cull foto error (`onerror`), Anti-Cache meta tags, dan Canvas Compositor unduh berbingkai.

### B. Konfigurasi Sistem Terkini
```javascript
const WEDDING_CONFIG = {
  EVENT_NAME: "The Wedding of Romeo & Juliet",
  EVENT_DATE: "15 November 2026",
  EVENT_VENUE: "Grand Ballroom, Jakarta",
  SUBTITLE: "The Wedding Gallery & Precious Memories",
  WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
  DRIVE_FOLDER_ID: "",
  DEFAULT_ADMIN_PIN: "123456",
  SLIDESHOW_INTERVAL_SEC: 4,
  AUTO_REFRESH_INTERVAL_SEC: 25,
  FRAME_IMAGE_URL: "",
  SPREADSHEET_ID: "",
  NEW_BADGE_MINUTES: 10
};
```

### C. Log Pembaruan Resmi (System Changelog)
- **v2.1.0 (Migrasi Penuh ke Google Spreadsheet 'foto-panggung', Live Sync & Date Picker Admin):**
  - **Pelepasan Ketergantungan Google Drive:** Galeri foto tidak lagi membaca folder Google Drive mentah. Seluruh katalog foto, kategori, dan link gambar bersumber langsung dari Sheet **`Daftar_Foto`** di Google Spreadsheet **`foto-panggung`**.
  - **Live Central Sync:** Web galeri auto-sync live setiap 20 detik langsung dari Google Spreadsheet `foto-panggung`. Penambahan baris foto baru atau perubahan status langsung terupdate di seluruh perangkat secara sinkron.
  - **Date Picker Modern untuk Tanggal Acara:** Input tanggal acara di panel admin web menggunakan HTML5 Date Picker (`<input type="date">`), terintegrasi dengan fungsi konversi tanggal bahasa Indonesia (`formatIndonesianDate`) sehingga tampil anggun di Hero Banner dan Watermark Panggung.
  - **Pembersihan Antarmuka Admin:** Menghapus input folder Google Drive dan elemen sinkronisasi Drive dari panel modal admin. Seluruh pemanggilan DOM elemen tervalidasi aman 100% tanpa risiko error null.
  - **Prinsip Non-Destruktif:** Seluruh fitur visual (Hero Header dinamis, Badge Foto Baru auto-expire 10m, Canvas Frame Compositor, Lightbox, Slideshow Panggung) 100% dipertahankan dan beroperasi utuh.
- **v2.0.0 (Eliminasi Error 405 Pengaturan Admin & Penyiapan Demo Setup dengan Dummy Files):**
  - **Eliminasi Total Error HTTP 405:** Menghapus ketergantungan pada endpoint pihak ketiga `api.restful-api.dev` yang rentan menolak method `PUT`.
  - **Alur Penyimpanan Tangguh & Langsung (Fail-Safe Save Handler):**
    * Saat URL Google Apps Script terisi, tombol "Simpan Perubahan" langsung mengirim data ke Google Apps Script yang otomatis menulis ke `ScriptProperties` dan ke sheet `Pengaturan` di berkas `foto-panggung`.
    * Jika URL Apps Script belum diisi (mode pratinjau), data langsung tersimpan aman di memori browser dan langsung diaplikasikan ke antarmuka seketika tanpa memicu pesan error 405.
  - **Generator Demo Lengkap dengan Berkas Dummy (`setupDemoSystemWithDummyFiles`):**
    * Menyiapkan berkas Google Spreadsheet `foto-panggung` lengkap dengan sheet `Pengaturan`, `Daftar_Foto`, dan `Log_Aktivitas`.
  - **Prinsip Non-Destruktif:** Seluruh fitur esensial 100% dipertahankan.
- **v1.9.0 (Otomatisasi Spreadsheet 'foto-panggung' & Pembersihan Menu Admin Web):**
  - Deteksi cerdas multi-layer 'foto-panggung' dan pembersihan antarmuka admin web.
- **v1.8.0 (1 Spreadsheet Google untuk Database & Pengaturan Event Terintegrasi):**
  - **1 Spreadsheet Google Database:** Dibuatkan 3 lembar kerja (*Pengaturan*, *Daftar_Foto*, *Log_Aktivitas*).
  - **Sinkronisasi 2 Arah (Two-Way Sync):** Mengubah data event langsung di Google Sheets otomatis memperbarui tampilan web live.
- **v1.7.0 (True Live Cloud Central Sync & 100% Unlocked Admin Input):**
  - **Menu Config Diketik Manual (Unlocked):** Seluruh form input di Panel Admin 100% dapat diketik manual secara bebas.
  - **Hapus Menu Unduh config.json:** Dihapus bersih dari antarmuka modal admin.
  - **Sinkronisasi Live Multi-Device (Cloud Central KV):** Menghilangkan isolasi `localStorage`.
- **v1.6.0 (Unified Live Multi-Device Sync via config.json & Cloud Properties):**
  - Konfigurasi live baseline default server.
- **v1.5.0 (Buka Kunci Kustomisasi Acara & Badge Foto Baru Auto-Expire):**
  - Lencana Foto Baru ("✨ Baru") auto-expire 10 menit.
- **v1.4.0 (Custom Event, Tanggal, Venue & Proteksi Informasi Pernikahan):**
  - Penambahan badge Venue di Hero Header dan watermark Slideshow.
- **v1.3.0 (Migrasi Vercel Ready):** 
  - Rest API headless dan konfigurasi deploy.
- **v1.2.0 (Anti-Corrupt File, Live Auto-Sync & Custom Frame Compositor):**
  - Eliminasi file corrupt, live auto-sync, dan Canvas frame compositor.
- **v1.1.0 (Menu Admin & Sinkronisasi Drive):** Login admin PIN.
- **v1.0.0 (Inisialisasi PRD):** Blueprint awal sistem.

