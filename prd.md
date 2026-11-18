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
- **v3.5.0 (Sinkronisasi Live Kategori Multi-Device Terpusat, Username Admin Kosong Saat Login, Redesain Share QR Tanpa Jam & Tanggal Nama Hari Bersama Logo Share, Dukungan Penuh Google Photos Album untuk Photobooth, Isolasi Ketat Target Link Tiap Kategori):**
  - **Sinkronisasi Live Kategori Multi-Device:** Mengaktifkan pemindaian Google Spreadsheet GViz secara kontinu (pada startup dan interval 25 detik) tanpa terblokir URL API, menyelaraskan `config.json` dengan kategori live (`Photobooth` Google Photos dan `Wedding` Google Drive) sehingga seluruh device (PC dan mobile) tersinkronisasi 100% konsisten seketika.
  - **Pembersihan Form Login Admin:** Menghapus nilai default `value="admin"` dari input username di `index.html` dan memastikan kolom username/password dikosongkan saat modal login admin dibuka.
  - **Format Hari & Tanggal Resmi pada Share QR:** Menghilangkan tampilan jam dan zona waktu GMT. Menggunakan fungsi `formatDayDateIndonesian()` untuk menampilkan nama hari, dd/mmmm/yyyy (contoh: *"Senin, 16 November 2026"*). Menambahkan tombol logo share link interaktif (`shareViaWebShare()`) berdampingan dengan logo salin dan unduh QR code.
  - **Dukungan Album Google Photos untuk Photobooth:** Menyediakan endpoint `api/google-photos.js`, pemindai backend `scanGooglePhotosAlbum()`, serta injeksi cache 115 foto album bersama pengguna. Mendukung unduhan asli dari CDN Google tanpa kompresi dan tanpa bingkai.
  - **Isolasi Ketat Foto Tiap Kategori:** Menghapus tuntas kode fallback yang meminjam foto dari galeri utama. Setiap kategori hanya menampilkan foto yang sesuai target tautannya masing-masing.
- **v3.4.0 (Kustomisasi Tautan Vendor Photobooth, Penempatan Tautan Galeri Utama Berdampingan, Lightbox Bright Mode Terang Estetik, Redesain Modal Share Logo-Only Tanpa WhatsApp/Bagikan, View Display & Unduh Berbingkai Kategori Momen Lainnya Identik Kategori Utama):**
  - **Khusus Kategori Photobooth (Tautan Vendor Dapat Dicustom, Proteksi Lainnya Terkunci):** Mengubah input tautan vendor Photobooth (`#pbUrlInput`) menjadi dapat diedit secara bebas (`oninput="onCategoryRowInput()"`). Proteksi khusus lainnya tetap terkunci: tanpa tombol hapus (anti-hapus tidak sengaja), dilengkapi sakelar tampilkan/sembunyikan di galeri, dan tombol sinkronisasi instan.
  - **Penempatan Tautan Galeri Utama Berdampingan dengan Fungsinya:** Memindahkan input tautan folder Google Drive galeri utama (`#cfgDriveFolderId`) dan tombol `[🔄 Sinkron Google Drive]` masuk tepat ke dalam kotak *🏷️ Kategori Galeri Utama* di samping input nama kategori. Menghilangkan redundansi dan kebingungan admin.
  - **Penyempurnaan Lightbox Bright Mode ("Jangan Dikasih Gelap, Terangkan"):** Mengganti latar belakang hitam pekat `.lightbox-modal` dengan palet cerah, hangat, dan romantis (`rgba(253, 251, 247, 0.97)` / blur 14px). Menyelaraskan teks judul (`#0F172A`), counter gold (`#9E7D47`), tombol close, dan tombol navigasi kiri/kanan agar sangat kontras, tajam, dan elegan di atas latar belakang terang.
  - **Penyederhanaan Modal Bagikan (Logo-Only, Eliminasi WhatsApp & Bagikan):** Menghapus tombol `[💬 WhatsApp]` dan `[📤 Bagikan]`. Mengganti tombol salin dan unduh gambar QR Code menjadi tombol logo/ikon berkelas tepat di sebelah kanan field URL input.
  - **View Display & Unduh Berbingkai Kategori Momen Lainnya Identik Kategori Utama:** Kategori momen kustom lainnya (seperti *Event Test1*, *eded1*, dsb.) otomatis disajikan dengan view display kartu foto native dan unduh berbingkai (`downloadCurrentPhotoWithFrame()`) 100% identik dengan Kategori Utama ("Semua Foto").
- **v3.3.0 (Modularisasi Berkas CSS & JS, Kustomisasi Bebas Nama Kategori Galeri Utama, Proteksi Kategori Khusus Photobooth, Lightbox & Unduh Langsung Kualitas Asli Tanpa Bingkai Khusus Photobooth, Tampilan Native Photo Cards untuk Kategori Lainnya, Tautan & Tombol Sinkronisasi Tiap Kategori, Sinkronisasi Multi-Device 100%):**
  - **Modularisasi Berkas Aplikasi (Penyelesaian Berkas Terlalu Besar / Berat):** Memecah berkas raksasa `index.html` (209 KB, 5.100+ baris) menjadi 3 modul bersih: `css/style.css` (~31 KB) untuk styling, `js/app.js` (~146 KB) untuk seluruh logika aplikasi, dan `index.html` (~43 KB / 730 baris) untuk markup semantik. Menghasilkan performa loading instan dan browser caching yang sangat cepat di perangkat mobile.
  - **Kustomisasi Bebas Nama Kategori Galeri Utama ("Semua Foto"):** Menyediakan field `🏷️ Nama Kategori Galeri Utama` di admin. Admin bebas mengganti nama "Semua Foto" menjadi nama kustom apa pun ("Semua Momen", "Katalog Utama", dll.) dan tab galeri langsung reaktif secara real-time.
  - **Khusus Kategori Photobooth (Proteksi Nama, Tampilkan/Sembunyikan & Anti-Hapus):** Photobooth disajikan dalam dedicated card terpisah di admin dengan nama yang dapat diubah bebas, toggle show/hide (`[✓] Tampilkan di Galeri`), tautan resmi yang terkunci aman, dan tombol hapus dihilangkan agar tidak terhapus tidak sengaja.
  - **Khusus Kategori Photobooth (Lightbox Langsung & Unduh Kualitas Asli Tanpa Bingkai):** Foto Photobooth saat diklik langsung membuka Lightbox layar penuh ("seperti biasa") tanpa dialihkan ke website lain. Tombol unduh di Lightbox berubah menjadi `[⬇️ Unduh Foto Asli Photobooth]` dan mengunduh berkas asli kualitas penuh dari CDN tanpa kompresi dan tanpa bingkai foto panggung.
  - **Tampilan Native Photo Cards untuk Kategori Lainnya (Bebas Iframe):** Kategori lain (seperti *Event Test*, *eded*, subfolder Google Drive) disajikan dalam kartu foto native (`.photo-card`) persis seperti galeri utama.
  - **Tombol & Tautan Sinkronisasi untuk Tiap Kategori:** Setiap baris kategori di admin memiliki tombol `[🔄]` untuk sinkronisasi mandiri. Disediakan tombol `[📋 Salin Tautan Sinkron Semua Device]` dengan parameter `?sync_cats=` untuk sinkronisasi 1-klik lintas-perangkat.
  - **Sinkronisasi Multi-Device 100%:** Mengintegrasikan `Photobooth`, `Event Test`, dan `eded` ke dalam `config.json` sebagai baseline default server, menjamin keseragaman 100% antara PC, Android, iPhone, dan tablet.
- **v3.2.0 (Penghapusan Cover Halaman Depan, Buka Web Asli & Unduh dari Web Asli Khusus Photobooth, Tampilan Kategori Lainnya & Display Galeri Google Drive Interaktif):**
  - **Penghapusan Cover Halaman Depan:** Menghapus tampilan cover showcase kartu "The Wedding Celebration" sesuai lampiran gambar user dan menyetel `coverSettings.enabled: false` secara default.
  - **Khusus Kategori Photobooth (Buka Link Asli & Unduh dari Web Asli):** Mengganti perilaku klik foto kartu Photobooth: mengeklik foto langsung membuka halaman detail web asli di fotoshare.co (`https://fotoshare.co/i/[hash]`) dan mengunduh berkas foto asli berkualitas tinggi langsung dari CDN aslinya tanpa bingkai panggung.
  - **Penyajian Kategori Lainnya (Website & Galeri):** Memperbaiki kendala kategori baru tidak tampil di website akibat data `[object Object]` dari Google Spreadsheet. Menjadikan input kategori reaktif seketika di tab bar, dan menyajikan display interaktif Google Drive beresolusi tinggi dengan tombol pembuka langsung saat kategori Google Drive dipilih di galeri.
- **v3.1.0 (Pembersihan Tombol Cover, Proporsi Foto Landscape Bebas Potong, Navigasi Tab Admin Flex-Wrap Bebas Potong, Galeri Native Kartu Foto untuk Photobooth, Pemisahan Foto Akurat Tiap Kategori Tanpa Fallback Palsu, Sinkronisasi Kategori Lintas-Perangkat Terpusat):**
  - **Pembersihan Tombol Aksi Cover Depan:** Menghapus tombol `[✨ Jelajahi Galeri Foto ↓]` dan `[📱 Bagikan & Lihat QR]` pada container cover showcase halaman depan sesuai instruksi dan lampiran gambar user.
  - **Perbaikan Proporsi Foto Halaman Depan (Anti-Terpotong / Landscape Friendly):** Mengganti container kaku 420px menjadi layout adaptif `aspect-ratio: 16 / 10;` dengan `object-position: center 25%;`. Di mobile, stack samping bertransformasi menjadi 2 kolom proporsional sehingga seluruh tamu dan dekorasi panggung tampil utuh tanpa terpotong.
  - **Perbaikan Navigasi Tab Admin (Anti-Terpotong):** Memperlebar modal admin menjadi `max-width: 600px;` pada desktop dan menerapkan `flex-wrap: wrap; gap: 6px;` pada `.admin-tabs-nav` dengan tombol fleksibel min-width 105px, sehingga tab ke-4 ("👥 Akun Admin") dan ke-5 ("☁️ Cloud & API") membungkus rapi dan tidak pernah terpotong lagi.
  - **Tampilan Galeri Native Kartu Foto untuk "Photobooth":** Menghapus iframe embed pada `renderPhotoGrid`. Foto dari fotoshare diparsing dan dirender langsung sebagai kartu foto galeri native dengan thumbnail, nama foto, lencana kategori, Lightbox layar penuh, dan tombol unduh foto berbingkai kualitas asli. Tab Photobooth menampilkan lencana jumlah foto real (318) tanpa ikon `↗ 🌐 Live`.
  - **Pemisahan Foto Akurat Tiap Kategori:** Menghapus tuntas kode fallback `matched = state.allPhotos` dari `applyCategoryFilter`. Setiap kategori kini menyajikan foto sesuai link/subfoldernya masing-masing. Jika kategori kosong, sistem menyajikan pemberitahuan kosong yang ramah dan tidak lagi menampilkan 59 foto dari galeri utama.
  - **Sinkronisasi Kategori Lintas-Perangkat:** Menyelaraskan daftar kategori kustom di `config.json` dan memuatnya secara terpusat agar tampilan kategori di PC dan smartphone identik 100%.
- **v3.0.0 (Multi-Event Architecture, Username & Password Admin, Custom Wedding Cover Showcase, Share & QR Code, Anti-Flicker & Lintas-Perangkat Sync):**
  - **Kustomisasi Label "Semua Foto":** Label tab utama galeri kini dapat dikustomisasi secara bebas (misal: "Semua Momen", "Katalog Utama", "All Photos") via input `ALL_PHOTOS_LABEL` di panel admin. Tab, badge counter, dan penyaringan foto mengikuti nama yang ditentukan admin.
  - **Arsitektur Multi-Event:** Mendukung penambahan banyak event tanpa batas (`EVENTS`, `ACTIVE_EVENT_ID`). Setiap event memiliki pengaturan mandiri yang lengkap (Mempelai, Tanggal, Venue, Folder Drive, Bingkai PNG, Kategori Momen, Cover Showcase, Pesan Sambutan, dan Footer). Tersedia selector event di admin, tombol tambah/hapus event, dan tautan langsung via parameter URL `?event=ID`.
  - **Eliminasi Total Flicker Lintas Event:** Menghapus teks pasangan hardcoded pada HTML. Menerapkan cache storage terisolasi per event ID (`WEDDING_EVENT_CFG_[eventId]`). Pembukaan event baru tidak lagi menampilkan kedipan sekilas data dari event sebelumnya.
  - **Menu Share & QR Code Interaktif:** Menambahkan tombol `[📱 Bagikan & QR Code]` pada bar kontrol. Modal `#shareQrModal` menyajikan QR Code dinamis resolusi tinggi sesuai URL event, tombol salin tautan 1-klik, share WhatsApp, native Web Share, dan unduh file gambar QR Code PNG.
  - **Autentikasi Admin Username & Password:** Mengganti otentikasi PIN tunggal dengan Username (default: `admin`) dan Password (default: `123`) lengkap dengan tombol toggle mata show/hide password. Panel pengaturan tab "👥 Akun Admin" mendukung ganti password dan pembuatan akun admin baru.
  - **Perbaikan Sinkronisasi Kategori Lintas Perangkat (PC vs Mobile Photobooth):** Menjadikan server backend dan `config.json` sebagai Single Source of Truth. Menghapus pembajakan cache lokal yang sebelumnya membuat kategori Photobooth muncul di HP namun tidak muncul di PC.
  - **Custom Cover Showcase Halaman Depan:** Menambahkan seksi cover wedding mewah di atas galeri dengan 3 pilihan tata letak (Romantic Wedding Collage, Hero Slider Sinematik, Aesthetic Polaroid Board), kustomisasi judul, subjudul, wedding quote, dan dukungan input beberapa foto unggulan.
- **v2.9.9 (Eliminasi Banner Target Kategori & Penyesuaian Kategori Google Drive 'test' Seperti 'Semua Foto'):**
  - **Eliminasi Banner `.category-target-banner`:** Menghapus seluruh elemen banner tebal ("Display Galeri: Photobooth", "Folder Google Drive: test") yang sebelumnya melintang di atas tampilan galeri. Menjadikan tampilan lebih bersih, minimalis, dan mewah. Untuk tautan eksternal (seperti `https://fotoshare.co`), sistem langsung mempersembahkan Live Embedded Web Viewer secara elegan.
  - **Tampilan Kategori Google Drive 'test' Seperti 'Semua Foto':** Pada kategori Google Drive seperti `test`, jika folder belum dipisahkan secara fisik di cloud, galeri secara cerdas menampilkan foto galeri penuh (grid foto, kartu thumbnail, lightbox layar penuh, serta tombol download foto berbingkai resolusi asli) persis seperti tab "Semua Foto". Tab penghitung menampilkan jumlah foto dinamis (misal `59`).
  - **Strict Non-Destructive:** Kepatuhan 100% pada instruksi pengguna, tanpa merombak fitur-fitur di luar instruksi.
- **v2.9.8 (Per-Category Target Folder & File Preview Sesuai Link, Live Embedded Web Viewer, Uji Coba Menu Tanpa Logout, Reaktivitas Real-Time Input Kategori):**
  - **Pemisahan Folder & File Preview Tiap Kategori:** Setiap kategori kini memiliki katalog folder dan berkas preview tersendiri sesuai link target yang diinputkan. Jika diisi tautan folder Google Drive (misal: `https://drive.google.com/drive/folders/...`), sistem memindai foto langsung dari folder Google Drive tersebut. Jika diisi tautan web eksternal (misal: `https://fotoshare.co/...`), sistem menyematkan **Live Interactive Web Viewer (iframe)** terpadu langsung di halaman galeri. Kategori "Semua Foto" tetap menampilkan foto dari katalog utama Google Drive.
  - **Uji Coba & Penjelajahan Galeri Tanpa Logout:** Menambahkan tombol *"👁️ Lihat / Test Galeri"* pada header dan footer modal pengaturan admin serta menyediakan **Floating Admin Bar** melayang di bawah layar. Admin dapat bebas menjelajahi web, menguji coba kategori, dan mengunduh foto kapan saja sambil tetap login, dan dapat membuka kembali pengaturan dengan 1 klik via tombol *"⚙️ Buka Pengaturan"*.
  - **Reaktivitas Penuh Input Kategori:** Menambahkan event listener `oninput` pada form baris kategori sehingga ketikan nama kategori dan link target otomatis tersimpan seketika di memori dan storage tanpa risiko terkunci atau kembali ke nilai sebelumnya.
- **v2.9.7 (Preview Image Photobooth, Footer Enter Multi-baris, Persistensi Kategori, Menu Sinkron, & Eliminasi Notifikasi Palsu):**
  - **Preview Image Kategori Lainnya (Photobooth):** Menampilkan preview galeri foto (kartu foto lengkap dengan thumbnail, Lightbox, dan opsi download) pada kategori kustom seperti Photobooth meskipun seluruh foto berada di root Google Drive tanpa subfolder khusus. Banner tautan display resmi (`https://fotoshare.co` atau Google Drive) tetap terpasang anggun di bagian atas.
  - **Pesan Penutup Footer Multi-baris (Dukungan Enter):** Mengubah input footer menjadi textarea dan menyematkan `white-space: pre-line;` pada teks `#footerBlessing`, memungkinkan admin mengetik beberapa baris (menekan enter) dan langsung dirender teratur di footer web.
  - **Persistensi Pengaturan Kategori & Penghapusan Teapai:** Menghapus permanen kategori default `Teapai`, menyimpan kategori yang diedit ke `WEDDING_SAVED_CUSTOM_CATEGORIES` di localStorage dan sheet Google Spreadsheet (diserialisasi via JSON), menjamin setelan tidak pernah kembali lagi saat di-refresh.
  - **Menu Sinkron Kategori & Tautan Display:** Menyediakan tombol *"🔄 Sinkronkan Kategori & Tautan"* pada modal admin untuk menyinkronkan data kategori dan display link seketika ke browser dan cloud backend.
  - **Eliminasi Total Notifikasi Palsu ("1 foto baru otomatis ditambahkan"):** Menambahkan `failedPhotoIds` tracker untuk menandai foto yang gagal memuat thumbnail sehingga foto tersebut tidak terus-menerus dideteksi sebagai foto baru saat auto-refresh 20 detik berjalan.
- **v2.9.6 (Kategori & Custom Link Target Display Galeri, Eliminasi Slideshow Lightbox, & Kustomisasi Footer Pesan):**
  - **Manajemen Kategori Dinamis & Custom Link Target Galeri:** Admin dapat menambah, mengubah, dan menghapus kategori galeri (misal: Teapai, Photobooth, Resepsi, dll.) sekaligus menyematkan tautan target (Google Drive / `https://fotoshare.co` / dsb) via Panel Admin (`Foto & Bingkai`) dan `CUSTOM_CATEGORIES`. Grid foto menampilkan banner berkelas serta tombol tautan langsung jika kategori memiliki link eksternal.
  - **Pembersihan Menu Download Lightbox:** Menghapus menu *"▶ Putar Slideshow"* pada bilah bawah Lightbox foto, menyisakan opsi unduh berbingkai yang bersih, elegan, dan fokus.
  - **Kustomisasi Footer Blessing:** Kalimat *"Diabadikan dengan cinta • Terima kasih atas doa restunya."* kini dapat dikustomisasi secara dinamis melalui form Admin (`FOOTER_MESSAGE`) dan tersinkronisasi multi-device via `config.json` dan cloud backend.
- **v2.9.5 (Perbaikan Posisi Desktop Mode & Otomatisasi Tutup Status Bar Selesai Unduh):**
  - **Reposisi Desktop Bebas Tombol Close:** Mengubah posisi widget progress bar pada desktop ke `top: 88px; right: 24px;` (tepat di bawah header lightbox yang berakhir pada `y = 80px`). Hal ini memberikan celah 26px di bawah tombol close (`.lightbox-close`), sehingga tombol close 100% bebas dari halangan dan dapat diklik kapan saja.
  - **Otomatisasi Tutup Status Bar (Auto-Close 2.5s):** Menghilangkan hambatan evaluasi flag antrean pada blok `isComplete`, memastikan ikon spinner otomatis beralih menjadi centang hijau, badge beralih ke "Selesai", dan timer otomatis 2,5 detik dipicu secara pasti untuk menyembunyikan status bar kembali ke atas.
- **v2.9.4 (Reposisi Progress Bar ke Area Atas & Penyempurnaan Antrean Unduh Multi-Foto Non-Blocking):**
  - **Reposisi Widget Progress Bar ke Atas Layar:** Memindahkan widget floating progress bar dari posisi bawah (`bottom: 16px`) ke area atas (`top: 72px` pada mobile dan `top: 20px` pada desktop). Dengan pemindahan ini, bilah bawah lightbox (`.lightbox-bottombar`) yang berisi tombol *"✨ Simpan Kenangan Berbingkai"* dan navigasi 100% bebas dari halangan dan dapat diklik kapan saja.
  - **Sequential Background Queue (Antrean Unduh Latar Belakang):** Pengguna dapat langsung berpindah/swipe ke foto-foto berikutnya dan menekan tombol simpan secara beruntun. Setiap foto otomatis masuk antrean (`downloadQueue.items`), tombol memberikan umpan balik instan `"✓ Masuk Antrean Unduh"`, dan badge widget memperbarui status antrean secara dinamis (misal: `"2 Antrean"`). Sistem memproses satu per satu di latar belakang tanpa menghambat navigasi dan interaksi pengguna.
  - **Tombol Dismiss Cepat:** Menambahkan tombol silang `✕` pada widget agar pengguna dapat menyembunyikan banner notifikasi jika diinginkan tanpa membatalkan proses unduh di latar belakang.
- **v3.6.6 (Sistem Auto-Rotate Foto Terbalik / Miring & Perbaikan Menyeluruh Penggantian Tautan Kategori Spesial & Momen Lainnya):**
  - **Sistem Auto-Rotate Foto Terbalik / Miring:**
    - Mendeklarasikan aturan CSS `image-orientation: from-image;` pada `img, .photo-img, .lightbox-img` agar metadata EXIF kamera dipatuhi perenderan browser.
    - Menambahkan tombol cepat `[ 🔄 Auto-Rotate ]` (`#btnAutoRotateCategory`) pada bar aksi atas galeri untuk memutar seluruh foto pada kategori aktif (0° -> 90° -> 180° -> 270° -> 0°) secara instan dan tersimpan di `localStorage`.
    - Menyematkan tombol rotasi mandiri `[ 🔄 ]` pada setiap kartu foto galeri (`.photo-card-rotate-btn`) untuk memutar foto spesifik sebesar 90°.
    - Menambahkan tombol rotasi `[ 🔄 Putar 90° ]` (`#lightboxRotateBtn`) di bilah atas modal Lightbox, yang otomatis memperbarui matriks zoom/pan secara presisi tanpa distorsi.
    - Menambahkan opsi selektor orientasi Auto-Rotate (0° Normal, 90° ↻ Tegak, 180° Balik, 270° ↺) pada form Admin untuk Kategori Spesial Photobooth dan setiap baris Kategori Momen Lainnya, tersimpan di `CUSTOM_CATEGORIES` dan disinkronkan ke seluruh perangkat.
    - Canvas Compositor Download: Foto yang memiliki status rotasi otomatis digambar tegak lurus pada kanvas unduh sebelum penempelan bingkai foto.
  - **Perbaikan Menyeluruh Penggantian Tautan Kategori Spesial & Momen Lainnya:**
    - *URL Invalidation Cache:* `state.categoryPhotosUrlMap` mencatat URL setiap kategori; jika target URL berubah, cache foto lama otomatis dihapus dan sistem memuat ulang foto dari tautan baru.
    - *Sinkronisasi Langsung dari DOM ke Backend:* Tombol sinkron `[ 🔄 ]` pada baris kategori dan `[ 🔄 Sinkron ]` pada Photobooth membaca nilai nama dan tautan terkini langsung dari input DOM, menghapus cache terkait, menyimpan ke `localStorage`, dan memanggil `saveAdminSettings` ke backend Google Apps Script / Sheet.
    - *Proteksi Background Polling:* Polling berkala `loadPublicSheetConfig` diproteksi agar tidak menimpa pengaturan kategori yang baru saja diedit lokal (`lastLocalCategoryEditTime < 60s`) atau saat modal pengaturan sedang dibuka.
    - *Pembersihan Fallback Hardcode:* Menghapus pemaksaan cache 116 foto pada `fetchDriveCategoryPhotos` saat ID folder Google Drive kustom disertakan oleh admin.
- **v3.6.5 (Desain Modal Share & QR Code Presisi PC/Desktop, Fleksibilitas Tautan Photobooth, Sinkronisasi Multi-Device 2-Arah & Anti-Reset Kategori, Backdrop Click Lightbox Close, & Ikon Toggle Password Simpel):**
  - **Desain Modal Share & QR Code Presisi PC/Desktop:** Menyesuaikan tampilan modal share QR code pada PC/desktop persis seperti gambar referensi (`media_1794998715544_2ef780f7.png`): card terpusat lebar `max-width: 460px` dengan sudut membulat mewah (`border-radius: 20px`), bayangan lembut, header judul font serif elegan dengan tombol close bulat, subheader nama mempelai tebal, tanggal acara teks emas (`#B4863A`), venue teks abu-abu (`#64748B`), bingkai QR code berlatar putih dengan border emas lembut (`border-radius: 18px`), dan 3 tombol aksi ikon terpusat (Web Share, Copy Link, dan Download PNG latar gold). Input teks URL disembunyikan.
  - **Fleksibilitas Tautan Kategori Spesial Photobooth:** Membuka fleksibilitas tautan Photobooth agar dapat menerima seluruh platform vendor: Google Photos (`photos.google.com`), Kingphotobooth (`kingphotobooth.co`), Fotoshare (`fotoshare.co`), maupun Google Drive Folder (`drive.google.com`). Sistem mendeteksi domain secara dinamis tanpa memaksa salah satu vendor.
  - **Sinkronisasi Multi-Device & Pencegahan Reset Pengaturan Kategori:** Memperbaiki akar masalah di mana pengaturan kategori kembali ke nilai awal (ter-reset) setelah beberapa saat atau di device lain. Di `code.gs` (`saveAdminSettings`), pembaruan `CUSTOM_CATEGORIES` disinkronkan dua arah ke properti event aktif di dalam `EVENTS` dan disimpan ke Google Sheet `Pengaturan`. Di `getGalleryData()`, konfigurasi kategori yang baru disimpan diprioritaskan sehingga tidak tertimpa cache event lama. Di `js/app.js` (`syncCategoriesAndDisplayLinks`), pembaruan kategori disinkronkan ke `state.events` dan dikirim bersama payload `EVENTS`.
  - **Fungsi Tutup Preview Foto (Backdrop Click Lightbox):** Menambahkan click listener pada backdrop `#lightboxBody` dan wrapper di luar frame/gambar foto agar mengklik area kosong di luar foto otomatis menutup modal Lightbox. Tombol close silang `✕` di bilah atas tetap dipertahankan.
  - **Ikon View/Toggle Password Admin Simpel & Profesional:** Mengganti emoji / karakter lama pada `#toggleAdminPassVisibility` dengan ikon vektor inline SVG mata (eye) dan mata tertutup (eye-off) yang bersih, tajam, dan elegan di `index.html` dan `js/app.js`.
- **v3.6.4 (Eliminasi Tombol Zoom "+ -", Unduh Berkas Asli Photobooth Kualitas Kamera 1.5MB Tanpa Konfirmasi & Tanpa Kompresi, Eliminasi Flicker Cover Depan Saat Refresh, & Pemisahan Berkas Cache Berat):**
  - **Eliminasi Total Tombol Zoom "+ -":** Menghapus markup toolbar zoom dari `index.html` dan menyembunyikannya secara mutlak via CSS; interaksi perbesaran gambar kini 100% menggunakan gestur alami (pinch 2 jari, double-click/tap, wheel) tanpa elemen visual yang menghalangi foto.
  - **Unduh Photobooth 1.5MB Penuh Tanpa Konfirmasi:** Membersihkan query string resize Fotoshare (`?width=450...`) pada `fetchFotosharePhotos()`, `downloadPhotoboothOriginal()`, dan `api/download-proxy.js`, sehingga berkas yang diunduh adalah berkas master kamera berukuran 1,5 MB (bukan thumbnail KB). Tombol lightbox menggunakan `handleCurrentLightboxDownload()` yang langsung mengunduh berkas asli tanpa konfirmasi simpan dan tanpa kompresi canvas.
  - **Eliminasi Flicker Cover Depan:** Inisialisasi default `state.coverSettings.enabled` diubah menjadi `false`, serta proteksi CSS `.wedding-cover-hero:not(.is-active) { display: none !important; }` menjamin cover yang dinonaktifkan tidak pernah berkedip saat refresh pertama.
  - **Pemisahan Berkas Cache Berat:** Memindahkan data cache statis (`GOOGLE_PHOTOS_INITIAL_CACHE`, `KING_PHOTOBOOTH_INITIAL_CACHE`, `WEDDING_INITIAL_CACHE`) dari `js/app.js` ke berkas modular baru `js/cache-data.js`, memangkas bobot file `js/app.js` sebesar >111 KB (penurunan 38%) agar galeri dimuat dan diproses lebih ringan dan cepat.
- **v3.6.3 (Eliminasi Indikator 100% Lightbox, Pengunduhan File Asli Photobooth Kualitas Penuh Tanpa Canvas/Kompresi, & Redesain Luxury Dock Mode Admin saat Preview Galeri):**
  - **Eliminasi Tampilan "100%" pada Lightbox Preview:** Elemen persentase zoom `<span id="lightboxZoomLevelText">` dihapus dari toolbar preview foto; toolbar kini bersih dan minimalis hanya menampilkan tombol zoom `[-]` dan `[+]`.
  - **Jaminan Pengunduhan File Asli Khusus Photobooth (JANGAN DIUBAH UKURANNYA):** Penambahan Guard Mutlak pada `downloadCurrentPhotoWithFrame()` dan deteksi komprehensif di `updateLightboxContent()` memastikan seluruh berkas photobooth (Kingphotobooth, Fotoshare, Google Photos) SELALU dialihkan ke `downloadPhotoboothOriginal()` dan tidak pernah melalui rendering canvas ataupun kompresi bingkai, menjaga ukuran dan kualitas berkas 100% asli dari kamera/vendor.
  - **Penataan Ikon & Tipografi Mode Admin saat View Gallery (Preview Sambil Login Admin):** Merombak `#adminActiveFloatingBar` menjadi **Luxury Floating Dock** beraksen gelap-emas (`rgba(15, 23, 42, 0.88)` dengan blur 16px, rounded pill, live pulse dot hijau, sub-title `Mode Admin • Pratinjau`, dan tombol aksi SVG tajam). Mengubah status ikon tombol admin di header menjadi gembok terbuka dengan titik aktif hijau saat login dan kembali terkunci saat logout.
- **v3.6.2 (Unduh Photobooth Hening Tanpa Window Baru, Unduh Kualitas Asli Tanpa Kompresi via API Proxy, & Restorasi Warna Asli Foto Semua Menu View Tanpa Lapisan Redup):**
  - **Unduh Hening Photobooth:** Seluruh perintah `window.open` dan `target="_blank"` dihapus dari alur unduh Photobooth. Diimplementasikan endpoint serverless [api/download-proxy.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/download-proxy.js) yang mengambil berkas biner di server dan mengalirkan ke browser via object Blob / invisible iframe. Proses unduh berjalan 100% senyap tanpa membuka tab atau jendela baru.
  - **Unduh Kualitas Penuh Tanpa Kompresi:** Endpoint `/dl/{id}` vendor Kingphotobooth dibersihkan dari akhiran ekstensi yang menimbulkan 404, menyajikan file asli uncompressed 191.979 bytes (foto) dan 83.876 bytes (video MP4).
  - **Restorasi Tampilan Warna Asli (Semua Menu View):** Menghapus atribut peredup `onerror="this.style.opacity='0.5';"` pada `lightboxImg` di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html). Menghilangkan lapisan gradasi gelap `.photo-overlay` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css), mengubah background modal lightbox menjadi putih solid `#FFFFFF` tanpa blur yang memperkeruh warna, serta memproteksi `.photo-img` dan `.lightbox-img` dengan `opacity: 1 !important; filter: none !important;` sehingga warna foto tampil 100% jernih, cerah, dan persis dengan foto dasarnya.
- **v3.6.1 (Pinch-to-Zoom dengan Jari, Retensi Badge Counter Photobooth Saat Refresh, Pemulihan Kategori Wedding 116 Foto Drive, & Pembersihan Modal Share Hanya Icon Buttons):**
  - **Pinch-to-Zoom Dua Jari (Semua Kategori):** Deteksi multi-touch gesture 2 jari (`Math.hypot`) di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada mode Lightbox. Pengguna dapat memperbesar dan memperkecil foto secara alami menggunakan cubitan jari di layar ponsel (skala 1x hingga 4x), dengan transisi halus ke drag-pan satu jari dan double-tap zoom (1x <-> 2.5x).
  - **Retensi Badge Counter Photobooth Saat Refresh:** Memori jumlah foto disimpan ke `localStorage` (`WEDDING_CAT_COUNT_{kategori}`) dan di-pre-seed saat `DOMContentLoaded` sehingga saat halaman di-refresh, angka lencana counter di samping nama tab kategori Photobooth tetap tampil dan tidak hilang atau kembali ke 0.
  - **Kategori Wedding 116 Foto & Integrasi Galeri Utama:** Pembuatan endpoint serverless [api/drive-folder.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/drive-folder.js) dan cache kilat `WEDDING_INITIAL_CACHE` berisi 116 foto resolusi tinggi dari folder Google Drive `1GGB77clCMYBIg17J0ECr2eVbD02ZeInW`. Seluruh kategori momen kustom mewarisi pengaturan galeri utama (format kartu, lightbox resolusi tajam, serta unduh kenangan berbingkai).
  - **Pembersihan Modal Bagikan (Hanya Icon Buttons):** Input link teks disembunyikan (`type="hidden"`). Area aksi modal Bagikan & QR Code menyajikan 3 icon button elegan di posisi tengah (Bagikan Web Share, Salin Link, dan Unduh Gambar QR Code PNG).
- **v3.6.9 (Orientasi Normal Kategori Momen Lainnya, Dukungan photos.app.goo.gl, Invalidation Cache Instan, Eliminasi Menu Duplikat & Anti-Revert Link Photobooth):**
  - **Rotasi Normal 0° Kategori Momen Lainnya:** Foto pada seluruh kategori selain "Semua Foto" (seperti Wedding, Akad, Resepsi, dll) dipastikan tidak dirotasi sama sekali (`getPhotoRotation()` mengembalikan 0°, `autoRotateDeg = 0` di `api/drive-folder.js`).
  - **Dukungan Format Shortlink Google Photos `photos.app.goo.gl`:** Ditambahkan fungsi helper `isGooglePhotosUrl()` yang mendukung domain penuh `photos.google.com` dan shortlink `photos.app.goo.gl`. Backend `api/google-photos.js` dan Apps Script `code.gs` menggunakan `redirect: "follow"` / `followRedirects: true` dengan regex ekstraksi fleksibel (`/pw/` maupun direktori gambar Google Photos).
  - **Sinkronisasi Galeri Sesuai Tautan & Tampil Instan:** Menyelesaikan bug `targetUrl` bernilai `undefined` pada `applyCategoryFilter()` dengan auto-resolve dari `state.customCategories`. Cache foto lama otomatis dibersihkan seketika tautan diperbarui, dan foto dimuat instan tanpa jeda 5 menit dengan visual skeleton card dan timeout 6 detik.
  - **Eliminasi Input Menu Duplikat:** Menghapus input `cfgAllPhotosLabel` pada tab "Acara & Event", memusatkan pengaturan nama kategori galeri utama secara tunggal di tab "Foto & Kategori" (`#cfgMainGalleryLabel`).
  - **Anti-Revert Link Photobooth & Kategori Momen:** Menyimpan `PHOTOBOOTH_URL` dan `CUSTOM_CATEGORIES` langsung ke Google Apps Script dan Google Spreadsheet sheet `Pengaturan`. Mengintegrasikan pembacaan `PHOTOBOOTH_URL` pada `syncFromSpreadsheetGViz` sehingga konfigurasi tidak kembali ke bawaan setelah beberapa saat.
- **v3.6.8 (Inisialisasi Database Penuh ke Google Spreadsheet: Postingan Foto, ID Admin, Username, & Seluruh Tautan Sistem):**
  - **Sinkronisasi Seluruh Tautan Sistem:** Google Spreadsheet sheet `Pengaturan` dan file `config.json` kini memuat seluruh tautan resmi sistem:
    * `SPREADSHEET_URL`: `https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit`
    * `GAS_API_URL`: `https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec`
    * `DRIVE_FOLDER_URL`: `https://drive.google.com/drive/folders/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5`
    * `WEDDING_FOLDER_URL`: `https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`
    * `FRAME_IMAGE_URL`: `https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk`
    * `PHOTOBOOTH_URL`: `https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs`
  - **Inisialisasi Seluruh Akun & ID Admin Lengkap dengan Username:**
    * Sheet `Pengguna_Admin` kini terstruktur lengkap dengan kolom `["ID_User", "Username", "Nama_Pengguna", "PIN", "Peran", "Tanggal_Dibuat"]`.
    * Memuat 3 akun admin resmi: Super Admin (`usr_superadmin`, username: `admin`), Admin Ilham (`usr_mwid2vkz_759`, username: `ilham`), dan Admin Wanta (`usr_mwii1zmz_598`, username: `Wanta`).
    * Nilai terangkum juga pada parameter `ADMIN_ACCOUNTS_INFO` di sheet `Pengaturan`.
  - **Pembersihan Serialisasi JSON di Google Spreadsheet:**
    * Parameter `EVENTS` dan `COVER_SETTINGS` di sheet `Pengaturan` dijamin tersimpan sebagai string JSON murni dan valid, mengeliminasi masalah `[object Object]`.
  - **Inisialisasi Postingan Foto Database Google Drive:**
    * Fungsi `setupTargetSpreadsheetDatabase()` di [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide\project\wedding-panggung\setup.gs) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide\project\wedding-panggung\code.gs) memindai seluruh postingan foto asli dari Folder Utama (`1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5` - 60 foto) dan Folder Wedding Panggung (`1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` - 30 foto) lengkap dengan metadata URL thumbnail, URL download resolusi penuh, ukuran berkas, dan waktu unggah ke sheet `Daftar_Foto`.
- **v3.6.7 (Penghapusan Tombol Rotate Manual, Auto-Rotate Sistem Otomatis, Multi-Device Central Sync, & 2-Tier Mobile Filter Bar):**
  - **Penghapusan Tombol Rotate Manual Total:** Menghapus seluruh tombol putar manual di galeri (`.photo-card-rotate-btn`), lightbox (`#lightboxRotateBtn`), kontrol bar (`#btnAutoRotateCategory`), serta dropdown rotasi di panel admin.
  - **Auto-Rotate Cerdas oleh Sistem:** Foto panggung (folder `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` dan kategori Wedding) otomatis dideteksi dan diputar 90° tegak lurus oleh sistem di kartu grid galeri, pratinjau lightbox, dan canvas download berbingkai.
  - **Sinkronisasi Multi-Device Sempurna:** Menghapus pre-seed hardcoded 116 foto lama, menyinkronkan `config.json` lokal dengan database spreadsheet Google, serta menambahkan invalidasi cache cerdas pada `syncFromSpreadsheetGViz` sehingga setiap perubahan kategori langsung tampil di perangkat lain tanpa kembali ke konfigurasi lama.
  - **Redesain 2-Tier Mobile Filter Container:** Pada mode ponsel (≤768px), memisahkan ikon aksi (Share, Refresh, Admin) ke dalam kapsul glassmorphism elegan di baris atas (order 1), dan memberikan 100% lebar layar penuh untuk tab kategori di baris bawah (order 2) agar navigasi tab kategori sangat leluasa, lega, dan nyaman di-swipe.
- **v3.6.0 (Resolusi Tajam & Lightbox Zoom Interaktif, Proteksi Swipe Up/Down, Pemisah Baris Share QR, Redesain Admin UI, Parameter ADMIN_USERNAME di Spreadsheet, Warisan Konfigurasi Galeri Utama, & Integrasi Spesial Kingphotobooth dengan Pemutar Video MP4):**
  - **Pratinjau Foto Tajam & Terang:** Menggunakan endpoint resolusi penuh Google `lh3.googleusercontent.com/d/{id}=w3200` dan `=w3200` untuk Google Photos sehingga foto saat di-review terlihat terang, jernih, dan tidak buram.
  - **Fitur Zoom Interaktif (Semua Kategori):** Toolbar zoom di lightbox (Zoom Out `[-]`, Reset `[1:1]`, Zoom In `[+]`), double-click / double-tap toggle (1x <-> 2.5x), mouse wheel zoom, serta drag to pan / touch pan saat foto sedang di-zoom.
  - **Proteksi Swipe Up/Down Photobooth:** Merekam sumbu koordinat vertikal `diffY`. Usapan vertikal (swipe up/down) tidak lagi memicu perpindahan foto. Navigasi swipe dinonaktifkan saat zoom aktif.
  - **Pemisah Baris Tanggal & Venue Share QR:** Teks tanggal dan venue dipisahkan 1x Enter menjadi dua baris vertikal rapi.
  - **Redesain Tata Letak Menu Admin:** Memperluas modal admin menjadi 680px, tab modern dengan soft border, dan grouping field yang intuitif.
  - **Sinkronisasi ADMIN_USERNAME ke Google Spreadsheet:** Parameter `ADMIN_USERNAME` ditambahkan ke sheet `Pengaturan` di [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs), dibaca dan disimpan di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs), serta diserap live oleh [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
  - **Kategori Momen Lainnya Mengikuti Galeri Utama:** Mewarisi otomatis opsi view display dan unduh berbingkai dari galeri utama.
  - **Integrasi Vendor Kingphotobooth:** Pemindai cerdas 274 item di [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs), mendeteksi 137 foto dan 137 video, lencana `▶ Video` pada galeri, pemutar `<video>` di lightbox, serta tombol unduh berkas asli `.mp4`.
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

- **v3.8.2 (Anti-Flicker Auto-Refresh Kategori, Anti-Ghosting Teks Pengantin, & Antrean Unduh Terpadu):**
  - **Eliminasi Total Kedipan Auto-Refresh pada Kategori Lainnya:** Menerapkan signature comparison pada `syncFromSpreadsheetGViz` dan smart diffing pada `renderPhotoGrid` agar saat proses background refresh berlangsung tiap 20 detik, sistem tidak lagi menghapus DOM atau memicu skeleton saat pengguna sedang melihat kategori Photobooth atau Wedding.
  - **Eliminasi Efek Ghosting / Kedipan Nama Pengantin:** Membuat mekanisme `setNodeTextIfChanged()` yang memblokir penulisan ulang teks jika nilai tidak berubah, mencegah layout reflow dan font re-rasterization di browser. Skrip hidrasi awal di [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) membaca konfigurasi tersimpan secara sinkron sebelum first paint.
  - **Arsitektur Antrean Unduh Terpadu (Unified Download Queue):** Mengintegrasikan seluruh jenis unduhan (Photobooth, video, dan foto berbingkai) ke dalam satu antrean berurutan (`queuePhotoDownload`) dengan jeda terukur (`pacing 1200ms`), menjamin seluruh foto yang diantrekan (lebih dari 1 atau 2 foto) terunduh 100% tanpa diblokir oleh browser ponsel Android.
  - **Unduhan Langsung Tanpa Dialog Konfirmasi Simpan Berkas:** Mengoptimalkan pemuatan berkas canvas melalui proxy same-origin, kompresi JPEG 0.94 berkualitas asli, serta trigger anchor tersembunyi berformat `Content-Disposition: attachment` langsung ke unduhan latar belakang.
- **v3.8.1 (Eliminasi Ghost Tab Kategori, Anti-Flicker Badge 0, & JSON Serialisasi Google Sheets):**
  - **Eliminasi Tab Hantu Muncul & Hilang Saat Refresh:** Memperbaiki fungsi `renderCategoryTabs()` agar tidak lagi membaca dari `state.categories` yang menampung sisa render sebelumnya. Tab kategori kini dirender murni dari `state.customCategories` dan `state.driveSubfolders` sehingga tab yang telah dihapus atau diubah namanya tidak pernah lagi muncul sekilas lalu hilang saat refresh.
  - **Anti-Flicker Lencana Jumlah Foto:** Menghilangkan kedipan angka 0 pada tombol tab "Semua Foto" saat inisialisasi awal sebelum respon jaringan tiba dengan memanfaatkan cache memori `localStorage` (`WEDDING_ALL_PHOTOS_COUNT`) dan membersihkan angka hardcoded 0 di `index.html`.
  - **Serialisasi JSON Bersih ke Google Spreadsheet:** Memperbaiki pengiriman parameter `CUSTOM_CATEGORIES` di `syncCategoriesAndDisplayLinks` dan `code.gs` agar selalu tersimpan sebagai JSON string valid, menuntaskan masalah `[object Object]` pada baris `Pengaturan` di Google Spreadsheet.
- **v3.8.0 (Perbaikan Penuh Menu Kategori Admin, Google Drive Sync, Multi-Admin PIN, & Konsistensi Header):**
  - **Kategori Galeri Utama ("Semua Foto") Bebas Ubah Tautan:** Input tautan Google Drive galeri utama (`#cfgDriveFolderId`) dan nama tab (`#cfgMainGalleryLabel`) dapat diubah bebas dan tidak lagi tertimpa periodik oleh background GViz sync.
  - **Eliminasi "Akses Ditolak" Saat Klik Sinkron Google Drive:** Menghentikan penimpaan `state.adminPin` oleh background GViz sync (yang sebelumnya menimpa PIN sesi aktif dengan nilai default). Dibuatkan helper `getEffectiveAdminPin()` dengan persistensi ke `sessionStorage` dan `localStorage` sehingga otorisasi admin multi-user (`ilham`/`121212`, `Wanta`/`888888`, `admin`/`111111`) selalu sah dan sinkronisasi 60 foto Google Drive berhasil 100%.
  - **Kategori Momen Lainnya Bebas Tambah & Hapus Tanpa Reset:** Baris kategori yang ditambah atau dihapus kini otomatis memicu event `onCategoryRowInput()` dan mengunci `state.lastLocalCategoryEditTime`, mencegah pembalikan (revert) oleh background sync. Tombol `[🔄 Sinkronkan Kategori & Tautan]` menyinkronkan seluruh perubahan ke Google Apps Script dan Google Spreadsheet sheet `Pengaturan`.
  - **Pencatatan Penuh ke Google Spreadsheet & Log Aktivitas:** Seluruh modifikasi kategori, folder Google Drive, label tab utama, dan tautan Photobooth tersimpan rapi ke lembar `Pengaturan` dan tercatat otomatis di lembar `Log_Aktivitas` dengan identitas nama admin yang aktif.
  - **Konsistensi Header Menu Admin (Anti Naik-Turun):** Modal admin `#adminSettingsModal` diposisikan fixed di bagian atas (`align-items: flex-start; padding-top: clamp(16px, 3.5vh, 36px);`) dengan tinggi tetap (`height: min(88vh, 800px);`) dan scroll internal, sehingga header modal tidak lagi melompat naik-turun saat berpindah antar tab.
- **v3.7.0 (Kustomisasi Bebas & Multi-Vendor Display Kategori Spesial Photobooth):**
  - **Tautan & Nama Tab Bebas Dicustom:** Input link dan nama tab kategori Photobooth 100% bebas diedit tanpa terkunci atau ter-reset periodik oleh GViz background sync.
  - **Multi-Vendor Support:** Mendukung tautan Google Photos (album bersama / photos.app.goo.gl), Google Drive folder, Fotoshare (`fotoshare.co`), dan Kingphotobooth (`kingphotobooth.co`).
  - **Invalidasi Cache Otomatis:** Perubahan tautan langsung menghapus cache foto lama dan memuat foto dari tautan baru ke galeri seketika.
  - **Identitas Kategori Permanen:** Menggunakan `id: "special_photobooth"` dan `isPhotobooth: true` sehingga penggantian nama tab tidak memecah konfigurasi atau membuat baris duplikat.
  - **Redundansi Pemuatan Foto:** Mendukung rute endpoint serverless (`/api/fotoshare`), direct fetch, serta Google Apps Script server-side fetch (`scanFotoshareAlbum`, `scanGooglePhotosAlbum`, `scanDriveFolderDirectly`) tanpa kendala CORS.
