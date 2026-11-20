# STATUS REVISI SISTEM (revisi.md) - v4.26.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.26.0)
PERMINTAAN: Perbaiki perbedaan data antara Google Spreadsheet (sheet Daftar_Acara) dan website live (dropdown modal admin).
TANGGAL PENGAJUAN: 21 November 2026
VERSI TARGET: v4.26.0-PROD
================================================================================

## 1. Analisis Akar Masalah (Root Cause Analysis)

Berdasarkan 2 gambar yang diunggah pengguna (`media_1795214014785_8df1a92e.png` dan `media_1795214014784_27930af1.png`) serta hasil audit langsung via API Google Sheets:

### A. Perbedaan Nyata yang Terjadi:
1. **Di Google Sheet (`Daftar_Acara`)**:
   Terdapat **hanya 3 Event resmi**:
   * `andre-fayola-281` (Andre & Fayola, 22 November 2026)
   * `wilson-felicia-133` (Wilson & Felicia, 16 November 2026)
   * `tommy-natasha-594` (Tommy & Natasha, Rabu, 25 November 2026)

2. **Di Website Live (Dropdown Admin & State Aplikasi)**:
   Muncul **5 Pilihan Event (terdapat 2 item liar/usang & duplikat)**:
   * `Andre & Fayola (Minggu, 22 November 2026)`
   * `Wilson & Felicia (Sabtu, 14 November 2026)`  ❌ **USANG & DUPLIKAT**: berasal dari slug lama `wilson-felicia` yang masih tertinggal di sheet `Pengaturan` baris 5 (`EVENTS`).
   * `Tommy & Natasha`
   * `Wilson & Felicia (Date(2026,10,16))` ❌ **CACAT FORMAT**: teks mentah Google Sheets `Date(...)` bocor ke UI karena GViz API mengembalikan objek serialisasi tanggal.
   * `EVT-202611-392` ❌ **PHANTOM EVENT**: sisa event dummy lama yang tersangkut di `localStorage` browser pengunjung/admin.

---

### B. Mengapa Hal Ini Terjadi?
1. **Mekanisme Penggabungan Longgar (*Loose Merge*) di `js/app.js`**:
   Logika penggabungan event saat ini mengambil semua isi `state.events` dan `localStorage`, lalu hanya me-merge entri baru tanpa pernah menghapus entri yang sudah **tidak ada lagi di master table `Daftar_Acara`**. Akibatnya, slug lama (`wilson-felicia`) dan event hantu (`EVT-202611-392`) tetap bercokol selamanya.
2. **Ketiadaan Parser Tanggal GViz**:
   Google Visualization API mengembalikan nilai cell tanggal sebagai formula serialisasi `Date(2026,10,16)`. Kode membaca `rowCells[dateIdx].v` mentah tanpa mem-parsing `cell.f` atau regex `Date(YYYY,MM,DD)`.
3. **Inkonsistensi Parameter `EVENTS` di Sheet `Pengaturan`**:
   Di sheet `Pengaturan` baris 5, kunci `EVENTS` menyimpan array 4 item yang masih mengikutsertakan `wilson-felicia` lama dengan tanggal `Sabtu, 14 November 2026`.

---

## 2. Rencana Solusi & Implementasi (Action Plan)

### Langkah 1: Jadikan Sheet `Daftar_Acara` sebagai Single Source of Truth Absolut di `js/app.js`
1. **Strict Reconciliation (Penyelarasan Ketat)**:
   - Ketika data dari sheet `Daftar_Acara` selesai diunduh via GViz, `state.events` diisi **murni** berdasarkan daftar acara yang ada di sheet `Daftar_Acara`.
   - Otomatis menghapus entri phantom seperti `EVT-202611-392` dan slug usang `wilson-felicia` dari memory dan `localStorage` (`WEDDING_EVENTS_REGISTRY` & `WEDDING_EVENT_CFG_...`).
2. **Parser Tanggal Cerdas (`parseGVizDate` / `normalizeSheetDate`)**:
   - Membaca `cell.f` (formatted text) terlebih dahulu.
   - Jika berbentuk `Date(YYYY,MM,DD)`, parsing tahun, bulan (0-indexed), dan hari, lalu format secara elegan menggunakan `formatIndonesianDateWithDay()` sehingga menghasilkan format resmi: `"Senin, 16 November 2026"`.
   - Tidak akan pernah lagi memunculkan teks mentah `Date(2026,10,16)` di antarmuka web.

### Langkah 2: Pembersihan Parameter `EVENTS` di Sheet `Pengaturan` via `code.gs` & `setup.gs`
1. Pada [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs):
   - Fungsi `populateDaftarAcara()` dan `syncAllEventsToSheet()` otomatis menyinkronkan array 3 event resmi ke sheet `Pengaturan` baris `EVENTS`.
   - Menghapus slug lama `wilson-felicia` secara permanen sehingga sheet `Pengaturan` dan sheet `Daftar_Acara` selaras 1:1.

### Langkah 3: Sanitasi Startup & Dropdown di `js/app.js`
1. Di `renderAdminEventsManager()`:
   - Pasang sanitasi otomatis untuk mendeteksi dan mengeliminasi event dengan ID pola `EVT-` yang tidak terdaftar di database resmi.
   - Jika ada duplikasi nama pengantin dengan slug berbeda, prioritaskan slug kanonikal yang ada di database (`wilson-felicia-133`).

---

## 3. Hasil yang Dijamin Setelah Perbaikan

| Parameter | Sebelum Perbaikan (Bug) | Sesudah Perbaikan (Bersih) |
|:---|:---|:---|
| **Daftar Dropdown Event** | 5 Event (Campur aduk item hantu & duplikat) | **3 Event Resmi** (Persis sama dengan Google Sheet) |
| **Event Wilson & Felicia** | Muncul 2 kali (`Sabtu, 14 Nov` & `Date(2026,10,16)`) | **Muncul 1 kali** (`Senin, 16 November 2026`) |
| **Format Tanggal** | Mentah `Date(2026,10,16)` | Terformat rapi bahasa Indonesia |
| **Event Hantu `EVT-...`** | Muncul di pilihan admin | **Dibersihkan total dari memori & storage** |

---

## 4. Batasan Ketat (Strict Boundaries)
- TIDAK mengubah tautan Google Drive atau link galeri aktif `andre-fayola-281`, `wilson-felicia-133`, dan `tommy-natasha-594`.
- Menjamin sinkronisasi otomatis berikutnya selalu menjadikan sheet `Daftar_Acara` sebagai acuan utama yang tak terbantahkan.

---

## 5. Hasil Pengujian & Verifikasi (Test Results)

1. **Unit Test Penyelarasan Data & Format Tanggal (`scratch/test_discrepancy_fix.js`)**:
   - `[Test 1] Parser Tanggal GViz`: `Date(2026,10,16)` berhasil dikonversi ke `"Senin, 16 November 2026"`: **PASS**
   - `[Test 2] js/app.js`: Implementasi `normalizeSheetDate`, filter phantom `EVT-`, strict override dari `Daftar_Acara`: **PASS**
   - `[Test 3] code.gs`: Sinkronisasi otomatis `cleanEventsJson` ke sheet `Pengaturan` baris `EVENTS`: **PASS**
   - `[Test 4] setup.gs`: Fungsi `populateDaftarAcara()` meng-update kedua sheet secara simultan: **PASS**
   - `[Test 5] config.json`: Tepat 3 event resmi (`andre-fayola-281`, `wilson-felicia-133`, `tommy-natasha-594`): **PASS**
   - **Hasil: 5/5 Uji Lulus (100% PASS)**

2. **Verifikasi Live Google Spreadsheet (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`)**:
   - Sheet `Daftar_Acara`: Tepat 3 baris event resmi (0 baris phantom / duplikat).
   - Sheet `Pengaturan` baris `EVENTS`: Terverifikasi berhasil disinkronkan langsung via API dan kini tepat memuat 3 event bersih.

3. **Regression Test Suites**:
   - `scratch/test_sync_daftar_acara.js`: 4/4 PASS
   - `scratch/test_tab_spinner_fix.js`: 6/6 PASS
   - `scratch/test_new_event_refresh_fix.js`: 7/7 PASS
   - `scratch/test_frameless_photo_and_no_fallback.js`: 5/5 PASS
   - `scratch/test_frameless_not_found.js`: 6/6 PASS
   - Sintaks JavaScript `node --check js/app.js`: 0 Error (Exit Code 0)

================================================================================
