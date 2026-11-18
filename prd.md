# PRD - Wedding Photo Gallery & Live Slideshow Platform
**Sistem**: Multi-Event Wedding Gallery with ERP Master Data Architecture  
**Versi**: v4.0.0-PROD  
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

## 2. Fitur & Penanganan Masalah Terkini (v4.0.0)

### 2.1 Isolasi Penuh Multi-Event (Fix "Pindah Event Revert ke 1 Tampilan")
- **Root Cause Sebelumnya**: Pemanggilan `fetchGalleryData` atau polling `syncFromSpreadsheetGViz` menimpa konfigurasi lokal dengan konfigurasi global lama dari server, sehingga saat admin berpindah event, data teks dan form kembali ke tampilan event lama.
- **Solusi Terapkan**:
  1. Guard terisolasi di `handleGalleryResponse`: saat respons server tiba, atribut event aktif (`EVENT_NAME`, `COUPLE_NAME`, `EVENT_DATE`, `EVENT_VENUE`, `DRIVE_FOLDER_ID`, `PHOTOBOOTH_URL`, `CUSTOM_CATEGORIES`) diproteksi dan tidak ditimpa oleh konfigurasi tunggal server.
  2. Resolusi prioritas event di `syncFromSpreadsheetGViz`: `state.currentEventId` memiliki prioritas tertinggi, disusul parameter URL `?event=...`, sehingga polling background tidak pernah me-reset event yang sedang diedit/dilihat.
  3. Form Admin (`openAdminSettingsModal` & `handleSelectEventChange`) secara otomatis mengunci `<select>` dropdown ke ID event aktif dan memuat input field (`Nama Event`, `Tanggal`, `Venue`, `Tautan Event`, `Folder Drive`, dll.) secara seketika.

### 2.2 Sinkronisasi Realtime Tanpa Hardcode (Anti-Fallback)
- Seluruh data dibaca secara realtime dari Google Sheets via GViz API dan Google Apps Script.
- Selama data belum termuat, sistem menampilkan efek skeleton loading modern tanpa pernah memunculkan teks/foto dummy hardcoded.

### 2.3 Download Otomatis & Cepat Tanpa Konfirmasi
- Download foto berbingkai dan original dieksekusi secara instan (`Blob` -> `a.download` -> `click()`).
- Indikator status progres download foto jamak diproses teratur melalui worker antrean.
