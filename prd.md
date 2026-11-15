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
- **Versi Sistem:** 1.6.0 (Unified Live Multi-Device Sync via config.json & Cloud PropertiesService).
- **Runtime:** Vercel Global Edge CDN / GitHub Pages (Frontend) + Google Apps Script REST API (Backend Google Drive).
- **Daftar Berkas Terpasang:**
  1. `ZettBOT.md`: Sakelar aktivasi lisensi & sistem arsitek ZettBOT.
  2. `prd.md`: Dokumen acuan spesifikasi produk & master context (file ini).
  3. `config.json`: Berkas konfigurasi live server terpusat (single source of truth untuk seluruh perangkat di dunia).
  4. `vercel.json`: Konfigurasi Vercel deployment.
  5. `package.json`: Metadata proyek untuk Vercel.
  6. `code.gs`: Backend Google Apps Script REST API (`doGet`, `doPost`, `handleApiRequest`, Drive scanner, persistent config mutation) v1.6.0.
  7. `setup.gs`: Utilitas inisialisasi, pengujian folder drive, dan reset PIN admin.
  8. `index.html`: Antarmuka galeri foto responsif universal dengan sinkronisasi live otomatis dari `config.json` dan cloud Google, Hero Header dinamis, badge foto baru ("✨ Baru" auto-expire 10 menit), filter kategori, Lightbox, Slideshow panggung, Modal Admin dengan export config live, Live Auto-Sync (25s), auto-cull foto error (`onerror`), Anti-Cache meta tags, dan Canvas Compositor unduh berbingkai.

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
  NEW_BADGE_MINUTES: 10
};
```

### C. Log Pembaruan Resmi (System Changelog)
- **v1.6.0 (Unified Live Multi-Device Sync via config.json & Cloud Properties):**
  - Mengatasi masalah perbedaan settingan antar device: Dibuat berkas `config.json` di root repositori server live yang otomatis dimuat oleh semua browser di seluruh perangkat saat halaman dibuka (`cache: no-store`).
  - Menghapus isolasi `localStorage` lokal agar semua perangkat (HP, laptop, tablet, layar panggung) membaca konfigurasi tunggal yang sama persis.
  - Penambahan tombol "Unduh config.json" pada panel admin untuk memudahkan ekspor konfigurasi live ke repositori.
  - Mempertahankan 100% fitur sebelumnya (Buka kunci admin, Live Auto-Sync 25d, Badge Baru auto-expire 10m, Canvas Frame Compositor, Filter Anti-Corrupt File, Lightbox, Slideshow Panggung).
- **v1.5.0 (Buka Kunci Kustomisasi Acara & Badge Foto Baru Auto-Expire):**
  - Membuka kunci Informasi Pernikahan: Field Nama Event, Tanggal Acara, dan Venue di Panel Admin web kini dapat diedit bebas oleh Admin.
  - Lencana Foto Baru ("✨ Baru"): Foto baru (< 10 menit atau dari Live Auto-Sync) diberi badge beranimasi elegan di sudut kartu dan otomatis hilang setelah 10 menit.
- **v1.4.0 (Custom Event, Tanggal, Venue & Proteksi Informasi Pernikahan):**
  - Penambahan badge Venue berdampingan dengan badge Tanggal di Hero Header.
  - Penambahan Nama Event, Tanggal, dan Venue pada watermark Mode Panggung (Slideshow).
- **v1.3.0 (Migrasi Vercel Ready):** 
  - Penambahan file konfigurasi `vercel.json` dan `package.json` untuk deployment Vercel.
  - Refaktor `code.gs` menjadi Headless REST API (CORS-friendly, `doGet` & `doPost` routing).
  - Refaktor `index.html` dengan dual-runtime data fetching (Vercel `fetch()` API + local storage `WEDDING_GAS_API_URL` + GAS `google.script.run`).
- **v1.2.0 (Anti-Corrupt File, Live Auto-Sync & Custom Frame Compositor):** Eliminasi file corrupt, live auto-sync, dan Canvas frame compositor.
- **v1.1.0 (Menu Admin & Sinkronisasi Drive):** Login admin PIN, modal pengaturan web.
- **v1.0.0 (Inisialisasi PRD):** Blueprint awal sistem.

