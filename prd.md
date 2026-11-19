# PRD - Wedding Photo Gallery & Live Slideshow Platform
**Sistem**: Multi-Event Wedding Gallery with ERP Master Data Architecture  
**Versi**: v4.1.0-PROD  
**Arsitektur Database**: Google Sheets ERP Master Table + Google Drive Live Photo Catalog  
**Terakhir Diperbarui**: 19 November 2026

---

## 1. Ringkasan Eksekutif & Struktur ERP
Platform Galeri Foto Pernikahan & Slideshow Interaktif mendukung Multi-Event terisolasi penuh dengan arsitektur **ERP Master Data Spreadsheet** pada Google Sheets (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`).

### 1.1 Tabel Master ERP: `Daftar_Acara` (10 Kolom Terstruktur)
Setiap baris mewakili 1 event independen dengan properti lengkap:
1. `ID_Event`: ID unik berbasis slug (contoh: `andre-fayola-281`, `wilson-felicia-133`)
2. `Nama_Acara`: Nama pasangan pengantin / judul acara
3. `Tanggal_Acara`: Tanggal pelaksanaan acara (format standar bahasa Indonesia)
4. `Venue_Lokasi`: Lokasi gedung / ballroom pelaksanaan
5. `Tautan_Home_Event`: URL langsung menuju galeri acara tersebut (`?event={ID_Event}`)
6. `Google_Drive_Folder_ID`: ID atau link folder katalog foto utama di Google Drive
7. `Photobooth_Vendor_URL`: Tautan khusus vendor photobooth (Fotoshare, Google Photos, dll.)
8. `Kategori_JSON`: Array JSON kategori kustom beserta link folder masing-masing
9. `Bingkai_URL`: Tautan file bingkai PNG transparan download otomatis
10. `Status`: Status acara (`Aktif`, `Selesai`, `Draft`)

### 1.2 Tabel Pendukung ERP di Google Spreadsheet
- **`Pengaturan`**: Parameter sistem global, endpoint Apps Script, interval refresh, durasi badge baru.
- **`Pengguna_Admin`**: Manajemen akun multi-admin (Super Admin, Admin) dengan ID, username, PIN, peran.
- **`Daftar_Foto`**: Pencatatan riwayat berkas foto yang disinkronkan dari Google Drive.
- **`Log_Aktivitas`**: Audit trail otomatis setiap perubahan pengaturan dan aksi admin.

---

## 2. Fitur & Penanganan Masalah Terkini (v4.1.0)

### 2.1 Navigasi Tab Admin Terkunci (Pinned / Sticky)
- Bilah navigasi tab (`💍 Acara & Event`, `🖼️ Foto & Kategori`, `👥 Akun Admin`, `☁️ Cloud & API`) diletakkan di dalam `.admin-tabs-sticky-wrapper` yang menempel di bagian atas modal dengan `position: sticky; top: 0; z-index: 25; background: #FFFFFF;`.
- Saat pengguna men-scroll konten formulir ke bawah, bilah navigasi **tetap terkunci rapi di atas** dan tidak tertutup.

### 2.2 Inisialisasi Database ERP Google Sheets
- Berkas `setup.gs` menempatkan fungsi `setupTargetSpreadsheetDatabase()` pada posisi paling atas sehingga otomatis menjadi fungsi default saat file dibuka di Google Apps Script.
- Eksekusi fungsi tersebut secara otomatis membuat dan menyusun ke-5 sheet database lengkap dengan styling header emas dan data aktual.
- Disediakan tombol inisialisasi langsung pada antarmuka admin (Tab Cloud & API).

### 2.3 Format Tanggal Halaman Depan dengan Nama Hari Otomatis (v4.4.0)
- Tanggal acara pada badge hero halaman depan (`#eventDate`), subtitle slideshow, dan kartu pratinjau bagikan kini otomatis menampilkan nama hari berbahasa Indonesia di depannya:
  - Contoh: `Minggu, 22 November 2026` atau `Senin, 16 November 2026`.
- Fungsi `formatIndonesianDateWithDay()` menghitung hari secara matematis dari tanggal kalender (`Date.getDay()`), menghindari duplikasi jika nama hari sudah ada, dan tetap memetakan nilai input kalender `YYYY-MM-DD` secara aman ke elemen `<input type="date">`.

### 2.4 Realtime Murni Tanpa Hardcode (Anti-Fallback)
- Seluruh data dibaca secara dinamis dari database tanpa data mockup.

### 2.5 Proteksi Halaman Tidak Ditemukan untuk URL Manual (v4.5.0)
- Mengetik link manual tanpa parameter event (`https://gallery.runway.my.id/`) menampilkan layar khusus **Halaman Tidak Ditemukan / Acara Tidak Ditemukan** (`#eventNotFoundScreen`).
- Galeri foto, banner sambutan, dan identitas pengantin disembunyikan total guna mencegah kebocoran data antar event dan menjaga privasi masing-masing pasangan.
- Tersedia tombol "Masuk Panel Admin" agar administrator tetap dapat mengelola atau membuka tautan home acara masing-masing.

### 2.6 Kustom Logo / Monogram Acara (v4.5.0)
- Logo atau monogram pernikahan (`#heroLogoContainer`) ditampilkan tepat di atas divider dan nama pasangan pengantin sesuai layout kartu mewah.
- Input logo ditempatkan di Tab 1 Admin (Acara & Event) di bawah nama event (`#cfgEventLogoUrl`) dengan kotak pratinjau live (`#adminLogoPreviewBox`).
- Mendukung link Google Drive yang otomatis dinormalisasi menjadi direct image view. Ukuran logo dibatasi proporsional (`max-height: 72px;`) agar menarik dan tidak terlalu besar.

### 2.7 Pembersihan Seketika & Penghapusan Fallback Foto Kategori (v4.6.0)
- Mengeliminasi bug tampilan foto lama saat link kategori diubah ("Muncul gambar sebelumnya baru berubah"):
  - `fallbackDrive` tidak lagi mengambil foto dari `state.allPhotos`. Jika folder kategori belum memiliki foto atau masih dalam proses pemanggilan, sistem mengembalikan array kosong `[]` sehingga tidak ada foto kategori lain yang bocor.
  - Saat berpindah kategori atau mengubah tautan, `state.filteredPhotos` seketika dikosongkan (`[]`) dan grid menampilkan animasi skeleton shimmer (`showGridSkeleton()`), menjamin foto lama langsung hilang seketika.
  - Setiap perubahan tautan pada formulir admin (`onCategoryRowInput` & `handleSaveAllSettings`) langsung menghapus cache foto lama (`state.categoryPhotosMap` & `state.categoryPhotosUrlMap`).

### 2.8 QR Code Berlogo Monogram dengan Latar Belakang Putih Solid (v4.6.0)
- Modal Bagikan & QR Code (`#shareQrModal`) menghasilkan QR Code beresolusi tinggi dengan logo monogram di bagian tengahnya:
  - Menggunakan tingkat koreksi galat tinggi (**`ecc=H`** / toleransi 30%) agar QR code tetap 100% terbaca dan discan oleh ponsel.
  - Bidang tengah di balik logo diberi badge **warna putih solid (`#FFFFFF`)** berukuran 24% dari QR code dengan sudut membulat (*rounded rectangle*) dan border halus. Hal ini menjamin logo berformat transparan (PNG) memiliki latar belakang putih pekat sehingga modul QR code di belakangnya tidak menembus dan merusak scan.
  - Logo diambil otomatis dari menu konfigurasi event aktif (`EVENT_LOGO_URL` / `logoUrl`).
  - Tombol unduh QR Code mendukung pengunduhan instan hasil komposit kanvas ke format PNG.
