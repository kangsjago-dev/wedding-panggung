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
- **Versi Sistem:** 2.3.2 (Penyempurnaan Canvas Compositor Unduh Foto Berbingkai Kustom).
- **Runtime:** Vercel Global Edge CDN / GitHub Pages (Frontend) + Google Spreadsheet Dedicated Database ID `133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20` (Pengaturan, Daftar_Foto, Log_Aktivitas) + Google Apps Script REST API Backend.
- **Daftar Berkas Terpasang:**
  1. `ZettBOT.md`: Sakelar aktivasi lisensi & sistem arsitek ZettBOT.
  2. `prd.md`: Dokumen acuan spesifikasi produk & master context (file ini).
  3. `config.json`: Berkas konfigurasi live baseline default.
  4. `vercel.json`: Konfigurasi Vercel deployment.
  5. `package.json`: Metadata proyek untuk Vercel.
  6. `code.gs`: Backend Google Apps Script REST API (`doGet`, `doPost`, `handleApiRequest`, `saveAdminSettings` dengan dukungan kustomisasi lengkap nama, tanggal, venue, subtitle, welcome message, pemindai Google Drive ke sheet `Daftar_Foto`, sinkronisasi instan sheet `Pengaturan` dengan `SpreadsheetApp.flush()`) v2.3.2.
  7. `setup.gs`: Utilitas inisialisasi, pengujian spreadsheet database, generator setup satu klik spreadsheet pengguna (`setupTargetSpreadsheetDatabase`), dan reset PIN admin.
  8. `index.html`: Antarmuka galeri foto responsif universal dengan mesin Canvas Compositor unduh berbingkai yang disempurnakan (konversi otomatis Google Drive link ke CDN transparan CORS, label tombol unduh dinamis "🖼️ Unduh Foto + Bingkai", penempelan lapisan presisi HD), benteng anti-reset saat admin mengetik, kustomisasi lengkap nama event/pengantin, tanggal, venue, subjudul, dan pesan sambutan tamu, input tautan folder Google Drive & tombol sinkronisasi foto langsung, pemilih tanggal modern (Date Picker `<input type="date">`), Hero Header dinamis, badge foto baru, filter kategori otomatis, Lightbox layar penuh, dan Slideshow panggung.

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
  SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
  NEW_BADGE_MINUTES: 10
};
```

### C. Log Pembaruan Resmi (System Changelog)
- **v2.3.2 (Penyempurnaan Canvas Compositor Unduh Foto Berbingkai Kustom):**
  - **Normalisasi Tautan Bingkai Google Drive Otomatis:** Menambahkan fungsi `normalizeDriveImageUrl()` pada frontend `index.html` untuk mengonversi link Google Drive file bingkai PNG menjadi stream thumbnail CDN beresolusi tinggi (`sz=w2500`). Hal ini menjamin transparansi PNG 100% terjaga dan lolos validasi keamanan CORS canvas tanpa error.
  - **Penggabungan Berlapis (Layering HD):** Menempelkan foto di lapisan dasar dan bingkai transparan tepat di lapisan atasnya secara presisi, lalu mengekspornya ke format JPEG HD 95% dengan nama `[Nama-Foto]-berbingkai.jpg`.
  - **Dinamika Label Tombol Lightbox:** Tombol unduh otomatis berganti nama menjadi **"🖼️ Unduh Foto + Bingkai"** jika tautan bingkai aktif dan menampilkan pesan interaktif saat proses perenderan canvas berlangsung.
- **v2.3.1 (Benteng Anti-Reset Form Modal Admin & Kustomisasi Lengkap Acara):**
  - **Benteng Anti-Reset Saat Mengetik:** Menambahkan proteksi `!isModalActive` pada `populateConfigToUI()` sehingga isian form tidak lagi ter-reset atau tertimpa oleh interval auto-refresh 20 detik saat pengguna sedang membuka modal dan mengetik kustomisasi acara.
  - **Penambahan Input Subjudul & Pesan Sambutan:** Melengkapi formulir kustomisasi dengan input Subjudul Galeri dan Pesan Sambutan Tamu yang langsung tersimpan ke memori browser dan lembar kerja `Pengaturan` di Google Spreadsheet.
  - **Instant UI Update & Fallback Proteksi:** Nilai baru langsung diterapkan seketika pada Hero Header, Watermark Slideshow, dan Footer tanpa perlu menunggu respons jaringan.
- **v2.3.0 (Perbaikan Edit Pengaturan, Integrasi Sinkronisasi Google Drive & Pembersihan Tombol Dummy):**
  - **Perbaikan Total Edit Pengaturan (100% Tersimpan):** Menambahkan JSON parser otomatis di `handleApiRequest` dan `saveAdminSettings` pada `code.gs`, serta pemanggilan `SpreadsheetApp.flush()` di akhir penulisan sheet `Pengaturan` sehingga perubahan nama acara, tanggal, dan venue tersimpan permanen.
  - **Input & Sinkronisasi Folder Google Drive:** Menambahkan kotak input **Tautan / ID Folder Google Drive** di modal Admin web serta tombol **"🔄 Sinkronkan Foto Google Drive ke Galeri"**. Backend otomatis memindai folder Google Drive dan sub-folder momen, mengambil foto asli, dan menyimpannya langsung ke sheet `Daftar_Foto` di Google Spreadsheet.
  - **Pembersihan Tombol Dummy:** Menghapus tombol `⚡ Buat Tabel & Foto Dummy di Spreadsheet` beserta keterangannya dari modal admin web sesuai instruksi pengguna.
  - **Prinsip Non-Destruktif:** Menjaga 100% keutuhan tampilan Romantic Ivory & Soft Gold, Hero Banner, Date Picker, Bingkai Foto, Lightbox, dan Slideshow.
- **v2.2.0 (Integrasi Penuh Database pada Google Spreadsheet Tertentu Milik Pengguna):**
  - **Penguncian Spreadsheet ID Tunggal:** Menetapkan ID `133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20` sebagai pusat basis data primer aplikasi galeri panggung.
  - **Auto-Provisioning 3 Lembar Kerja:** `Pengaturan` (Konfigurasi Acara & Teknis), `Daftar_Foto` (Katalog Foto Wedding & Kategori), dan `Log_Aktivitas` (Audit Trail) langsung disiapkan dan ditata secara rapi dengan header berlatar Champagne Gold.
  - **Fungsi Setup Mandiri Satu Klik (`setupTargetSpreadsheetDatabase`):** Menambahkan fungsi di `setup.gs` yang dapat langsung dijalankan sekali klik dari Editor Google Apps Script untuk inisialisasi instan.
  - **Prinsip Non-Destruktif:** Seluruh komponen visual dan performa galeri panggung 100% dipertahankan.
- **v2.9.3 (Preservasi Resolusi Asli 1:1 Foto & Background Multi-Download Queue):**
  - **Preservasi Ukuran & Resolusi Asli Foto:** Memperbaiki masalah penyusutan ukuran file (dari 1.9MB menjadi 555KB). Kanvas komposit kini otomatis diskalakan mengikuti resolusi penuh asli foto (`scale = Math.max(1, pw / cutoutW, ph / cutoutH)`), memetakan piksel foto 1:1 tanpa downscale, memprioritaskan file kamera asli Google Drive (`downloadUrl`), serta mengekspor kualitas ultra-tinggi 0.98 sehingga ukuran file tetap setara dengan foto asli (~1.9MB - 2.8MB).
  - **Background Asynchronous Multi-Download Queue:** Mengeliminasi pembekuan antarmuka (kesan hang/stuck). Tombol unduh tidak lagi memblokir layar; sekali klik, proses langsung berjalan di antrean latar belakang. Pengguna bebas berpindah ke foto lain, menjelajahi galeri, atau mengunduh beberapa foto sekaligus (*multiple concurrent downloads*).
  - **Floating Download Progress Bar Widget:** Menghadirkan widget indikator progres mengambang (`#downloadProgressWidget`) di sudut bawah layar dengan bilah progres visual (persentase memuat, menggabungkan, dan menyimpan) serta counter jumlah antrean.
  - **Prinsip Non-Destruktif:** Seluruh fitur auto-sync 20 detik, date picker kalender, login admin PIN, dan responsive layout tetap terjaga 100%.
- **v2.9.2 (Refined Gallery Empty State & Minimalist Admin Login Language):**
  - **Penyempurnaan Teks Status Galeri:** Mengganti kalimat `"Belum ada foto dalam kategori ini."` menjadi kalimat yang ramah dan estetik: **`"Momen berharga akan segera hadir di sini."`**, serta menghapus tuntas instruksi teknis `"Unggah foto ke sub-folder terkait di Google Drive Anda."`.
  - **Minimalisasi & Pembersihan Halaman Login Admin:** Menghapus paragraf penjelasan panjang `"Masukkan PIN Admin untuk mengatur sambungan folder Google Drive, bingkai foto, dan koneksi API."` sehingga dialog login menjadi bersih dan ringkas. Tata bahasa disempurnakan: label menjadi `"PIN Keamanan"`, placeholder menjadi `"Masukkan PIN"`, tombol proses menjadi `"Memverifikasi..."`, dan pesan galat disempurnakan menjadi `"PIN yang Anda masukkan tidak sesuai. Silakan coba kembali."`.
  - **Prinsip Non-Destruktif:** Seluruh fitur unduh foto berbingkai, auto-sync Google Drive, kalender date picker, dan verifikasi multi-user tetap berjalan 100% normal.
- **v2.9.1 (Dual-Layer Zero-Sample Enforcement & LocalStorage Anti-Blink Auto-Purge):**
  - **Saring Ketat Foto Sampel di Frontend & Backend:** Menambahkan filter agresif di `index.html` yang membuang semua objek foto ber-ID demo (`demo-1` s/d `demo-8` atau URL Unsplash) yang bersumber dari spreadsheet lama. Jika folder Drive kosong, galeri dijamin 100% kosong tanpa foto sampel. Di `code.gs`, logika membaca sheet `Daftar_Foto` dihentikan sepenuhnya untuk fokus pada Google Drive murni.
  - **Auto-Purge Cache Browser "Hans & Yurike":** Menyuntikkan script pembersih otomatis pada startup yang mendeteksi dan menghapus cache lokal browser lama (`WEDDING_SAVED_CONFIG`), serta memblokir nama `"Hans & Yurike"` di seluruh renderer antarmuka.
  - **Hero Header Minimalis:** Menghapus bersih elemen tombol aksi ("Jelajahi Galeri" & "Mode Panggung") di hero header.
- **v2.9.0 (Eliminasi Blink Nama Wilson & Felicia, Zero-Sample Empty Drive & Clean Hero Header UI):**
  - **Eliminasi Total Blink Nama Pengantin:** Mengubah seluruh markup statis HTML, baseline `GLOBAL_CONFIG`, `config.json`, dan `code.gs` menjadi `"Wilson & Felicia"`, dilengkapi script hidrasi sinkron di awal dokumen. Menghilangkan total kedipan sesaat (blink) `"Hans & Yurike"` saat browser me-refresh halaman.
  - **Pengosongan Galeri Saat Folder Google Drive Kosong (Eliminasi Foto Sampel):** Logika backend `code.gs` dan fallback frontend kini tidak lagi menyuntikkan 8 foto demo Unsplash jika folder Google Drive kosong. Jika folder Drive kosong, galeri akan kosong murni (`photos: []`) dengan pesan panduan yang ramah dan banner demo tetap disembunyikan.
  - **Penghapusan Tombol Jelajahi Galeri & Mode Panggung (Slideshow):** Menghapus elemen `<div class="hero-actions">` di header hero `index.html` sehingga bagian atas halaman tampil sangat bersih, minimalis, dan elegan.
  - **Integritas Sistem:** Seluruh fitur unduh foto berbingkai full-HD, auto-sync 20 detik, date picker kalender, dan keamanan login admin PIN tetap berjalan 100% normal tanpa perubahan pada komponen yang tidak diinstruksikan.
- **v2.8.0 (Full-HD Frame Compositing 1920x1080, Clean Mobile Photo Grid & Minimalist Login UI):**
  - **Perbaikan Unduh Foto Berbingkai (Canvas Width Fix & Rasio Sempurna 1920x1080):** Memperbaiki bug dimensi kanvas unduhan yang sebelumnya terpotong menjadi strip sempit (353x1024) akibat `canvas.width` yang belum terset. Kanvas kini dijamin eksplisit `canvas.width = fw` dan `canvas.height = fh` pada resolusi asli bingkai (`1920 x 1080`), dengan penempatan foto presisi tanpa pemotongan subjek foto.
  - **Tampilan Mobile Bersih Bebas Teks di Depan Foto:** Menghilangkan badge kategori `"SEMUA FOTO"` dan teks nama file di depan foto pada layar HP/smartphone (`@media (max-width: 768px)` dan `@media (hover: none)`), sehingga foto pengantin, keluarga, dan para tamu tampil 100% jernih dan bebas tertutup teks.
  - **Pembersihan Teks Default PIN pada Halaman Login:** Menghapus tulisan `(Default: 123456)` dari placeholder password admin login (`placeholder="Masukkan PIN Rahasia"`), serta membersihkan pesan kesalahan login fallback agar tidak menampilkan angka default.
  - **Verifikasi Fungsi Utuh & Konsisten:** Memastikan 94 foto Google Drive, slideshow panggung, unduh bingkai ke perangkat, multi-user admin PIN, dan fail-safe GViz sync berfungsi optimal tanpa mengubah fungsi lainnya.
- **v2.7.0 (Integrasi Permanen Live Backend GAS, Penayangan 94 Foto Google Drive & Dual Fail-Safe GViz Sync):**
  - **Koneksi Live Google Apps Script Permanen:** Menyematkan Web App URL Apps Script (`https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec`) secara langsung ke `config.json` dan `GLOBAL_CONFIG` di `index.html`.
  - **Eliminasi Total Mode Demo pada Perangkat Lain:** Menghapus kemunculan banner kuning *"Mode Demo Aktif"* dan 8 foto sampel di seluruh perangkat lain (HP/tablet/laptop).
  - **Katalog 94 Foto Google Drive Aktif:** Seluruh 94 foto pernikahan dari folder Google Drive (`1AhdkSch9C-F2FvYKd_IO2O7RSsRDJxI5`) otomatis tayang secara live di Vercel pada semua HP dan laptop tamu undangan.
  - **Dual Fail-Safe GViz Auto-Discovery:** Menambahkan mekanisme fallback otomatis membaca baris `GAS_API_URL` dari Google Spreadsheet publik (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`) via GViz tanpa API key, sehingga perangkat apa pun di dunia dijamin langsung terhubung ke backend live.
- **v2.6.0 (Penyempurnaan Bahasa Unduh Bingkai, Keamanan Pesan Duplikasi PIN, Perbaikan Total Modal Admin & True Multi-Device Live Sync Vercel):**
  - **Penyempurnaan Tata Bahasa Unduh Foto:** Tombol unduh berbingkai kini berlabel **"✨ Simpan Kenangan Berbingkai"** dan feedback proses *"Menyiapkan Kenangan Berbingkai..."* yang lebih puitis, elegan, dan romantis.
  - **Privasi & Keamanan Duplikasi PIN:** Menghapus kebocoran nama dan PIN pengguna lain saat terjadi duplikasi PIN. Menggunakan bahasa rahasia elegan: *"Kombinasi PIN ini telah terdaftar demi menjaga privasi & keamanan akun. Mohon gunakan kombinasi angka rahasia lainnya yang unik."*
  - **Perbaikan Total Layout Modal Admin:** Memperbaiki penutupan tag HTML yang rusak, menata ulang nesting form, dan menerapkan `box-sizing: border-box; max-width: 100%;` sehingga textarea dan input tidak lagi bocor/melebar ke luar batas modal di mobile maupun desktop.
  - **Sinkronisasi Sentral Multi-Device Vercel (True Live Across Devices):** `index.html` memuat `config.json` saat startup untuk mendapatkan konfigurasi terpusat (termasuk URL Google Apps Script). Perubahan yang disimpan admin kini tersinkronisasi ke Google Apps Script dan Google Spreadsheet, sehingga perangkat lain (ponsel tamu/panitia) otomatis menerima data live via auto-refresh 20 detik tanpa perlu login lokal.
- **v2.5.0 (Redesain Minimalis Admin, Anti-FOUC Nama, 1-Klik Date Picker, Mandiri Ganti PIN & Smart Cutout Frame Compositor):**
  - **Zero FOUC (Anti-Kedip Nama Lama):** Micro-loader di `<head>` dan baseline default disinkronkan ke "Hans & Yurike" dan "13 November 2026", mengeliminasi total kedipan "Romeo & Juliet" saat refresh di mobile.
  - **Redesain Modern Minimalist Admin Dashboard:** Menggantikan border tebal bertingkat dengan antarmuka Segmented Navigation Tabs (Acara, Foto & Bingkai, Admin & PIN, Cloud Vercel) yang ramping, bersih, elegan, dan sangat ramah mobile.
  - **Pembersihan Teks PIN Bawaan:** Menghapus teks "PIN bawaan awal adalah: 123456..." dari modal login untuk privasi dan tampilan profesional.
  - **Date Picker 1-Klik:** Input tanggal langsung memanggil `this.showPicker()`, membuka kalender native seketika saat diklik di desktop maupun ponsel.
  - **Ganti PIN Mandiri & Validasi Keunikan:** Tersedia kontrol ganti PIN tersendiri dengan validasi ketat keunikan terhadap seluruh user admin.
  - **Smart Transparent Cutout Compositor:** Algoritma deteksi koordinat jendela transparan pada bingkai PNG dan penskalaan foto proporsional (*Aspect-Ratio Preserving Contain*). Menjamin 100% foto asli (lantai panggung, speaker, tamu di tepi) tampil utuh sempurna tanpa terpotong oleh banner atau border bingkai.
  - **Vercel Production Deployment:** Siap di-deploy langsung ke `vercel.app` dengan integrasi Google Apps Script backend headless.
- **v2.4.0 (Perbaikan Tampilan Mobile, Auto-Refresh Google Drive, Download Frame ke Device, Multi-User PIN):**
  - **Mobile Layout & Anti-Saling Tindih:** Memperbaiki layout flexbox pada `.filter-scroll` dengan `min-width: 0;`, penyesuaian `@media (max-width: 640px)`, serta menghapus duplikasi kategori "Semua Foto".
  - **Otomatisasi Penuh dari Google Drive:** Foto otomatis dibaca langsung dari folder Google Drive tanpa menulis ke sheet `Daftar_Foto`. Dilengkapi micro-cache 20 detik untuk efisiensi API.
  - **Auto-Refresh dengan Info/Tanda Foto Baru:** Deteksi background refresh menampilkan lencana visual `✨ Baru` dan toast notifikasi interaktif.
  - **Download Berbingkai Langsung ke Device:** Menggunakan Canvas Compositor beresolusi tinggi, ekspor Blob lokal, dan endpoint `getImageBase64` tanpa `target="_blank"`, sehingga file langsung tersimpan ke memori perangkat.
  - **Multi-User Admin (Login Hanya PIN, Tampilkan Nama):** Setiap admin memiliki PIN tersendiri yang wajib unik. Login murni menggunakan PIN, dan sistem menampilkan nama user yang sedang aktif serta menyediakan panel kelola admin (tambah/hapus).
- **v2.9.4 (Reposisi Progress Bar ke Area Atas & Penyempurnaan Antrean Unduh Multi-Foto Non-Blocking):**
  - **Reposisi Widget Progress Bar ke Atas Layar:** Memindahkan widget floating progress bar dari posisi bawah (`bottom: 16px`) ke area atas (`top: 72px` pada mobile dan `top: 20px` pada desktop). Dengan pemindahan ini, bilah bawah lightbox (`.lightbox-bottombar`) yang berisi tombol *"✨ Simpan Kenangan Berbingkai"* dan navigasi 100% bebas dari halangan dan dapat diklik kapan saja.
  - **Sequential Background Queue (Antrean Unduh Latar Belakang):** Pengguna dapat langsung berpindah/swipe ke foto-foto berikutnya dan menekan tombol simpan secara beruntun. Setiap foto otomatis masuk antrean (`downloadQueue.items`), tombol memberikan umpan balik instan `"✓ Masuk Antrean Unduh"`, dan badge widget memperbarui status antrean secara dinamis (misal: `"2 Antrean"`). Sistem memproses satu per satu di latar belakang tanpa menghambat navigasi dan interaksi pengguna.
  - **Tombol Dismiss Cepat:** Menambahkan tombol silang `✕` pada widget agar pengguna dapat menyembunyikan banner notifikasi jika diinginkan tanpa membatalkan proses unduh di latar belakang.
- **v2.1.0 (Migrasi Penuh ke Google Spreadsheet 'foto-panggung', Live Sync & Date Picker Admin):**
  - **Pelepasan Ketergantungan Google Drive:** Galeri foto tidak lagi membaca folder Google Drive mentah. Seluruh katalog foto, kategori, dan link gambar bersumber langsung dari Sheet **`Daftar_Foto`**.
  - **Live Central Sync:** Web galeri auto-sync live setiap 20 detik langsung dari Google Spreadsheet.
  - **Date Picker Modern untuk Tanggal Acara:** Input tanggal acara di panel admin web menggunakan HTML5 Date Picker (`<input type="date">`).
  - **Pembersihan Antarmuka Admin:** Menghapus input folder Google Drive dan elemen sinkronisasi Drive dari panel modal admin.
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

