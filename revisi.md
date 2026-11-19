# STATUS REVISI SISTEM (revisi.md) - v4.23.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.23.0)
PERMINTAAN: Perbaiki event baru dibuat, saat di-refresh tetap loading (skeleton cards shimmer tidak berhenti).
TANGGAL PENERAPAN: 19 November 2026
HASIL VERIFIKASI: 7 PENGUJIAN OTOMATIS PASS 100% (0 FAIL)
================================================================================

## 1. Ringkasan Eksekusi & Solusi yang Diterapkan:
1. **Pembersihan Skeleton Instan di Awal (`initApp`)**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 619–635:
     Pada event baru dibuat yang belum memiliki cache foto di `localStorage`, fungsi `initApp()` seketika memanggil `renderPhotoGrid()` dalam 0 milidetik. Kartu skeleton awal segera digantikan oleh status *"Momen Indah Sedang Disiapkan"* tanpa menunggu request jaringan.
2. **Pencegahan Abort Prematur di `config.json`**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 670:
     Menghilangkan pemanggilan abort 404 pada pembacaan `config.json` statis sehingga alur inisialisasi selalu mengalir ke `syncFromSpreadsheetGViz()` yang membaca data event baru dari database Google Spreadsheet.
3. **Fail-Safe Watchdog Timer (3.5 Detik)**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada `fetchGalleryData()` dan `showGridSkeleton()`:
     Memasang pengaman otomatis berdurasi 3.5 detik yang langsung menghentikan animasi loading dan merender galeri jika jaringan eksternal/backend mengalami latensi.
   - Menambahkan `AbortController` 4 detik pada pemanggilan `/api/drive-folder` sehingga otomatis fallback ke Google Apps Script backend jika scraper serverless kosong/tidak merespons.
4. **Pembersihan Total Skeleton di `handleGalleryResponse()`**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 1331–1343:
     Jika galeri menerima 0 foto (event baru), seluruh elemen `.skeleton-card` dipastikan dihapus dan `renderPhotoGrid()` langsung dipanggil.
5. **Penyelarasan Backend Google Apps Script (`code.gs`)**:
   - Di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) baris 1020–1058:
     Menjamin bahwa seluruh return data dari `getGalleryData()` (termasuk saat folder kosong atau baru dibuat) selalu menyertakan `events: eventsList` dan `activeEventId: selectedEventId`.
6. **Hasil Verifikasi Otomatis**:
   - Seluruh 7 pengujian di [scratch/test_new_event_refresh_fix.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/scratch/test_new_event_refresh_fix.js) **PASS 100% (0 Fail)**.
   - Seluruh 5 pengujian di [scratch/test_frameless_photo_and_no_fallback.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/scratch/test_frameless_photo_and_no_fallback.js) **PASS 100% (0 Fail)**.
   - Pengecekan sintaks `node --check js/app.js` **Exit Code 0 (Bebas Syntax Error)**.

## 1. Analisis Akar Masalah (Root Cause Analysis)

Berdasarkan investigasi menyeluruh pada alur inisialisasi aplikasi ([index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) dan [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js)), ditemukan penyebab utama mengapa halaman event baru yang baru dibuat tetap terkunci pada animasi loading (kartu skeleton abu-abu bersinar/shimmer tiada henti) saat di-refresh:

1. **HTML Awal Memuat Kartu Skeleton Permanen Tanpa Pembersih Awal untuk Event Baru**:
   - Pada [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) baris 252–257, `#photosGrid` secara default berisi 6 elemen `<div class="skeleton-card"></div>`.
   - Pada event lama, fungsi `initApp()` langsung memanggil `renderPhotoGrid()` di baris 628 karena cache foto (`WEDDING_EVENT_PHOTOS_<id>`) sudah ada di `localStorage`, sehingga skeleton hilang dalam 0 milidetik.
   - Namun pada **event yang baru dibuat**, foto masih 0 (belum ada cache). Akibatnya, `renderPhotoGrid()` **tidak pernah dipanggil** di `initApp()`, sehingga kartu skeleton tetap menggantung di layar sambil menunggu seluruh rangkaian request jaringan (config.json, spreadsheet GViz, API endpoint, GAS) yang memakan waktu lama atau rentan pending.

2. **Abort Prematur & Race Condition pada `fetch("config.json")`**:
   - Pada [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 664–673:
     `config.json` merupakan file statis di server yang hanya berisi event default (`andre-fayola-281` dan `wilson-felicia-133`).
     Jika event baru dibuka pada tab baru / browser baru yang belum membaca sinkronisasi spreadsheet, kode melakukan:
     `if (!matchedEv) { showEventNotFoundScreen(true, explicitUrl); return; }`
     Hal ini memutus alur normal sebelum `syncFromSpreadsheetGViz()` sempat mengambil data event dari database Google Spreadsheet!

3. **`fetchGalleryData()` Menimpa Grid dengan Skeleton Tanpa Batas Waktu Fail-Safe**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 1094–1103:
     Setiap kali `fetchGalleryData()` dipanggil saat foto kosong (`state.allPhotos.length === 0`), `#photosGrid` disetel ulang menjadi 6 kartu skeleton.
     Jika pemanggilan `/api/drive-folder` atau backend Google Apps Script mengalami latensi, redirect 302, kuota Google Drive, atau folder kosong, tidak ada timer pengaman (*fail-safe timeout*). Akibatnya kartu skeleton terjebak (*deadlock*) dan tidak pernah digantikan oleh kartu status kosong (`.empty-gallery-card`).

4. **Kategori Kustom Memanggil `showGridSkeleton()` yang Mengunci Tampilan**:
   - Di baris 2350 pada `applyCategoryFilter()`, setiap perpindahan/sinkronisasi kategori non-utama memanggil `showGridSkeleton()`. Jika link Photobooth atau folder belum selesai di-fetch atau memakan waktu hingga belasan detik, skeleton kembali dipasang dan terkunci.

---

## 2. Rencana Solusi & Implementasi (Action Plan)

### Langkah 1: Resolusi Instan di `initApp()` (Zero Skeleton Stuck)
- Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada blok inisialisasi cache foto:
  - Jika event terdeteksi aktif (baik dari URL maupun registry lokal) tetapi belum memiliki foto tersimpan (`savedPhotos` kosong / null), **segera panggil `renderPhotoGrid()`** agar kartu skeleton langsung digantikan oleh tampilan bersih *"Momen Indah Sedang Disiapkan"* secara instan tanpa menunggu request jaringan.

### Langkah 2: Jangan Abort di `fetch("config.json")` Sebelum Spreadsheet Sync
- Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 670:
  - Hapus pemanggilan `showEventNotFoundScreen(true)` di dalam `config.json`.
  - Jika event URL belum ditemukan di `config.json`, biarkan alur berlanjut secara elegan ke `syncFromSpreadsheetGViz()` karena event-event baru tersimpan secara realtime di Google Spreadsheet Database.

### Langkah 3: Tambahkan Fail-Safe Timeout pada `fetchGalleryData()` (Maksimal 3.5 Detik)
- Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada `fetchGalleryData()`:
  - Pasang timer pengaman (*fail-safe watchdog* 3.5 detik). Jika dalam 3.5 detik backend/API belum selesai mengembalikan data, skeleton card otomatis dihentikan dan `#photosGrid` segera dirender menggunakan `renderPhotoGrid()`.
  - Pada pemanggilan `/api/drive-folder`, tambahkan `AbortController` dengan timeout 4 detik agar tidak menggantung tanpa batas jika serverless/scraped Google Drive mengalami kendala.

### Langkah 4: Pastikan `handleGalleryResponse()` Menjamin Skeleton Hilang 100%
- Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada `handleGalleryResponse()`:
  - Jika data foto yang diterima kosong (`sortedIncoming.length === 0`), pastikan `state.filteredPhotos = []`, hapus seluruh elemen `.skeleton-card`, dan jalankan `renderPhotoGrid()` secara langsung.
  - Hentikan animasi putar refresh (`refreshIconSvg.classList.remove("spin")`) di seluruh blok keberhasilan maupun kegagalan.

### Batasan Ketat (Strict Boundaries):
- TIDAK mengubah struktur database, pin admin, atau fitur-fitur lain yang sudah berjalan normal.
- Seluruh tampilan tetap frameless & borderless sesuai standar v4.22.0.

================================================================================
