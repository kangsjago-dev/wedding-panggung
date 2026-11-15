# DRAF RENCANA REVISI: INTEGRASI 1 SPREADSHEET GOOGLE SEBAGAI DATABASE UTAMA
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: MENUNGGU PERSETUJUAN PENGGUNA ("OKE TERAPKAN")
TANGGAL PENGAJUAN: 16 November 2026 (Rencana v1.8.0)
================================================================================

### A. Latar Belakang & Kebutuhan Pengguna
Pengguna menginginkan **1 Google Spreadsheet terintegrasi** yang berfungsi sebagai basis data utama (central database) untuk:
1. Mengatur seluruh informasi acara/event (Nama Event/Mempelai, Tanggal Acara, Venue/Lokasi, Subjudul, Pesan Sambutan).
2. Mengelola konfigurasi teknis (ID Folder Google Drive, URL Bingkai PNG, PIN Admin, interval slideshow, dll).
3. Menyimpan katalog cache foto Google Drive dan log aktivitas.
4. Memberikan kemudahan bagi pengguna/panitia untuk mengedit data acara langsung dari Google Sheets (di HP atau laptop) maupun melalui panel admin web, dengan sinkronisasi 2 arah (*two-way sync*).

---

### B. Desain Struktur 1 Google Spreadsheet Database
Spreadsheet akan diberi nama resmi: **`Wedding Panggung - Database & Pengaturan`** yang memiliki 3 lembar kerja (*sheet*):

#### 1. Sheet `Pengaturan` (Key-Value Configuration Center)
Digunakan untuk membaca dan mengubah data event secara dinamis.
* **Kolom:** `Parameter` (Kolom A) | `Nilai` (Kolom B) | `Keterangan` (Kolom C)
* **Baris Bawaan:**
  * `EVENT_NAME` : *The Wedding of Romeo & Juliet*
  * `EVENT_DATE` : *15 November 2026*
  * `EVENT_VENUE` : *Grand Ballroom, Jakarta*
  * `SUBTITLE` : *The Wedding Gallery & Precious Memories*
  * `WELCOME_MESSAGE` : *Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih.*
  * `DRIVE_FOLDER_ID` : *(ID folder Google Drive foto)*
  * `FRAME_IMAGE_URL` : *(Tautan/ID bingkai foto PNG transparan)*
  * `ADMIN_PIN` : *123456*
  * `SLIDESHOW_INTERVAL_SEC` : *4*
  * `NEW_BADGE_MINUTES` : *10*

#### 2. Sheet `Daftar_Foto` (Katalog Foto Google Drive)
Menyimpan cache metadata foto yang valid agar pemanggilan galeri foto super cepat dan instan:
* **Kolom:** `ID_Foto` | `Nama_File` | `Kategori` | `URL_Thumbnail` | `URL_Download` | `Ukuran_Bytes` | `Waktu_Upload` | `Status`

#### 3. Sheet `Log_Aktivitas` (Riwayat Sistem)
Mencatat histori aktivitas perbaruan data:
* **Kolom:** `Timestamp` | `Aksi` | `Detail` | `Pengguna`

---

### C. Rencana Perubahan Berkas & Langkah Teknis

1. **`setup.gs` & `code.gs` (Backend Google Apps Script):**
   * **Fungsi Otomatis `setupDatabaseSpreadsheet()`:**
     * Otomatis membuat 1 Spreadsheet baru di Google Drive pengguna jika belum ada.
     * Mengatur formatting profesional: Warna header Gold (`#C5A880`) teks putih bold, freeze baris pertama, border rapi, dan auto-resize kolom.
     * Mengisi nilai bawaan dan menyimpan `SPREADSHEET_ID` ke `PropertiesService`.
   * **Fungsi `getDatabaseSpreadsheet()` & `getEffectiveConfig()`:**
     * Membaca konfigurasi event dan teknis langsung dari Sheet `Pengaturan`.
   * **Fungsi `saveAdminSettings()`:**
     * Mengupdate baris nilai di Sheet `Pengaturan` secara otomatis saat admin mengubah data via web.
   * **Fungsi `syncDrivePhotosToSheet()`:**
     * Menulis daftar foto hasil pemindaian Google Drive ke Sheet `Daftar_Foto`.
   * **API Endpoint (`handleApiRequest`):**
     * Menambahkan endpoint `getSpreadsheetInfo` & `createSpreadsheetDatabase`.

2. **`index.html` (Frontend Web App):**
   * Menambahkan bagian **"Database Google Sheets"** pada Panel Admin (`#adminSettingsModal`):
     * Input ID/URL Spreadsheet yang terhubung.
     * Tombol link instan: **"Buka Spreadsheet di Tab Baru"** agar admin/pengguna bisa langsung loncat membuka Google Sheets di Google Drive.
     * Tombol **"Inisialisasi / Hubungkan Spreadsheet Baru"** (one-click auto provision).
   * Sinkronisasi data event tetap live multi-device (Cloud KV + Google Sheets 2-way sync).

3. **Prinsip Non-Destruktif:**
   * Seluruh fitur yang sudah berjalan (Live Cloud sync, Live Auto-Sync 20-25s, New Photo Badge auto-expire 10m, Lightbox, Slideshow panggung, Canvas Frame Compositor) 100% dipertahankan dan beroperasi utuh.

---

### D. Konfirmasi Eksekusi
Apakah draf rancangan integrasi 1 Spreadsheet Database ini sudah sesuai dengan kebutuhan Anda?  
Jika Anda setuju dan siap untuk diterapkan, silakan balas dengan:  
👉 **"OKE TERAPKAN"**
