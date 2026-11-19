# STATUS REVISI SISTEM (revisi.md) - v4.25.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.25.0)
PERMINTAAN: Terapkan semua event ke sheet "Daftar_Acara" (ke-3 event saat ini) dan setiap penambahan event baru otomatis dimasukkan ke sheet tersebut.
TANGGAL PENGAJUAN: 20 November 2026
VERSI TARGET: v4.25.0-PROD
================================================================================

## 1. Analisis Akar Masalah (Root Cause Analysis)

Berdasarkan pemeriksaan langsung via query Google Sheets Visualization API (GViz) terhadap spreadsheet aktif (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`):
- Sheet `Daftar_Acara` **hanya memiliki 1 baris (baris header saja)**:
  `["ID_Event", "Nama_Acara", "Tanggal_Acara", "Venue_Lokasi", "Tautan_Home_Event", "Google_Drive_Folder_ID", "Photobooth_Vendor_URL", "Kategori_JSON", "Bingkai_URL", "Logo_Acara", "Status"]`.
- Baris data untuk 3 event aktif (`andre-fayola-281`, `wilson-felicia-133`, dan `tommy-natasha-594`) **belum terisi di dalam sheet Daftar_Acara**.

### Mengapa hal ini terjadi?
1. **Fungsi Inisialisasi Setup (`setup.gs`) Hanya Menulis Header**:
   Pada [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) baris 161–185, fungsi `setupTargetSpreadsheetDatabase()` hanya membuat lembar kerja dan menulis header 11 kolom. Tidak ada kode injeksi baris data event default ke sheet `Daftar_Acara`.
2. **Penambahan Event Baru Belum Memicu Append Baris Nyata**:
   Pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) saat fungsi `handleAddNewEvent()` dijalankan, data event baru dikirim ke `saveAdminSettings`. Di sisi Google Apps Script, fungsi `saveAdminSettings` baru mencatat `EVENTS` sebagai teks string JSON di sheet `Pengaturan`, sedangkan pemanggilan `syncEventsToSheet()` belum memiliki action khusus `addEvent` atau fallback mandiri jika deployment Web App GAS masih menggunakan versi cache lama.
3. **Ketiadaan Fungsi Mandiri 1-Klik**:
   Belum ada fungsi mandiri `populateDaftarAcara()` di baris teratas [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) yang dapat di-run langsung oleh pengguna di editor Google Apps Script untuk langsung mengisi ke-3 event ke Google Sheets.

---

## 2. Rencana Solusi & Implementasi (Action Plan)

### Langkah 1: Pembaruan `setup.gs` (Inisialisasi & Pengisian Instan 1-Klik)
1. **Buat Fungsi Paling Atas `populateDaftarAcara()`**:
   - Menempatkan fungsi `populateDaftarAcara()` di posisi paling atas [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) agar langsung terpilih sebagai default saat file dibuka di Google Apps Script editor.
   - Fungsi ini secara otomatis membuka spreadsheet `133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`, memeriksa sheet `Daftar_Acara`, menuliskan header emas 11 kolom, dan langsung menyisipkan ke-3 event aktif:
     * Event 1: `andre-fayola-281` (Andre & Fayola)
     * Event 2: `wilson-felicia-133` (Wilson & Felicia)
     * Event 3: `tommy-natasha-594` (Tommy & Natasha)
   - Lengkap dengan folder Google Drive, vendor photobooth, kategori JSON, dan tautan galeri masing-masing.
2. **Perbarui `setupTargetSpreadsheetDatabase()`**:
   - Jika sheet `Daftar_Acara` kosong (hanya header), otomatis isikan ke-3 data event tersebut tanpa menghapus data baru yang mungkin ditambahkan manual oleh admin.

### Langkah 2: Pembaruan `code.gs` (Backend Sinkronisasi & Penambahan Realtime)
1. **Fungsi `addEventToSheet(ss, eventObj)`**:
   - Membuat fungsi yang secara eksplisit melakukan append baris baru ke sheet `Daftar_Acara` setiap kali event baru dibuat.
2. **Fungsi Mandiri `syncAllEventsToSheet()`**:
   - Menyinkronkan seluruh daftar acara aktif ke sheet `Daftar_Acara`.
3. **Penyelarasan API Action di `handleApiRequest()` / `doPost()`**:
   - Menambahkan action `syncDaftarAcara` dan `addEvent` sehingga frontend Web Admin dapat langsung memerintahkan Google Apps Script untuk menulis baris ke sheet `Daftar_Acara`.
4. **Perbaikan Header di `setupDatabaseSpreadsheet`**:
   - Menyelaraskan baris 388 di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) agar konsisten 11 kolom (`Logo_Acara` disertakan).

### Langkah 3: Pembaruan `js/app.js` (Web Admin & Realtime GViz Sync)
1. **Pada `handleAddNewEvent()`**:
   - Saat admin membuat event baru, selain memanggil `saveAdminSettings`, frontend juga memanggil action `addEvent` / `syncDaftarAcara` sehingga baris baru langsung tercatat secara permanen di sheet `Daftar_Acara`.
2. **Dukungan Pembacaan Realtime dari Sheet `Daftar_Acara`**:
   - Di `syncFromSpreadsheetGViz()`, tambahkan pembacaan langsung terhadap sheet `Daftar_Acara` (`sheet=Daftar_Acara`). Dengan demikian, jika admin menambahkan atau mengubah data event langsung di Google Sheets, galeri web akan otomatis membaca perubahan tersebut secara realtime.
3. **Tombol "Sinkronkan ke Sheet Daftar_Acara"**:
   - Tambahkan tombol pintas di Web Admin (Tab Acara / Cloud) untuk memicu sinkronisasi seluruh event ke sheet `Daftar_Acara` kapan saja.

---

## 3. Data 3 Event yang Dimasukkan ke Sheet `Daftar_Acara`

| No | ID_Event | Nama_Acara | Tanggal_Acara | Venue_Lokasi | Google_Drive_Folder_ID | Photobooth_Vendor_URL | Status |
|:---:|:---|:---|:---|:---|:---|:---|:---:|
| 1 | `andre-fayola-281` | Andre & Fayola | 22 November 2026 | UPPERHILLS CONVENTION HALLS | `1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh` | `https://photos.app.goo.gl/QkqewYw4dWfocxfK8` | Aktif |
| 2 | `wilson-felicia-133` | Wilson & Felicia | 16 November 2026 | UpperHills Convention Hall, Makassar | `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5` | `https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs` | Aktif |
| 3 | `tommy-natasha-594` | Tommy & Natasha | Rabu, 25 November 2026 | UpperHills Convention Hall, Makassar | `1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh` | `https://photos.google.com/share/...` | Aktif |

---

## 4. Batasan Ketat (Strict Boundaries)
- TIDAK mengubah struktur database ERP Google Sheets (tetap 11 kolom baku).
- TIDAK menghapus atau merusak konfigurasi PIN admin atau foto yang sudah ada.
- Menjamin setiap event baru berikutnya otomatis tersinkronisasi ke sheet `Daftar_Acara`.

---

## 5. Hasil Pengujian & Verifikasi (Test Results)

1. **Unit Test Sinkronisasi & Penambahan Realtime (`scratch/test_sync_daftar_acara.js`)**:
   - `[Test 1] setup.gs`: Fungsi `populateDaftarAcara()` dan 3 event aktif: **PASS**
   - `[Test 2] code.gs`: Fungsi `addEventToSheet`, `syncAllEventsToSheet`, action API: **PASS**
   - `[Test 3] index.html`: Tombol "Sinkronkan ke Sheets" pada Tab Acara: **PASS**
   - `[Test 4] js/app.js`: Pembacaan realtime `sheet=Daftar_Acara` & hook `addEvent`: **PASS**
   - **Hasil: 4/4 Uji Lulus (100% PASS)**

2. **Regression Test Suite**:
   - `scratch/test_tab_spinner_fix.js`: 6/6 Uji Lulus (100% PASS)
   - `scratch/test_new_event_refresh_fix.js`: 7/7 Uji Lulus (100% PASS)
   - `scratch/test_frameless_photo_and_no_fallback.js`: 5/5 Uji Lulus (100% PASS)
   - `scratch/test_frameless_not_found.js`: 6/6 Uji Lulus (100% PASS)
   - Sintaks JavaScript `node --check js/app.js`: 0 Error (Exit Code 0)

================================================================================
