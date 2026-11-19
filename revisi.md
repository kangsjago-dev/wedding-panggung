# STATUS REVISI SISTEM (revisi.md) - v4.22.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.22.0)
PERMINTAAN: Galeri Frameless, Hapus Tombol Photobooth & Pembersihan Total Hardcoded Fallback
TANGGAL PENERAPAN: 19 November 2026
HASIL VERIFIKASI: 5 PENGUJIAN OTOMATIS PASS 100% (0 FAIL)
================================================================================

## 1. Ringkasan Eksekusi & Solusi yang Diterapkan:
1. **Penghapusan Frame pada Foto & Area Foto**:
   - Di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css):
     - Mengubah styling `.empty-gallery-card` menjadi `background: transparent; border: none; box-shadow: none; border-radius: 0; padding: 48px 20px;` serta menyembunyikan garis aksen atas `::before`.
     - Mengubah styling `.photo-card` menjadi `border: none;` sehingga seluruh kartu foto tampil bersih, elegan, dan *edge-to-edge* (borderless).
2. **Penghapusan Tombol "Buka Foto Photobooth (130 Foto) →"**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) pada fungsi `renderPhotoGrid()`:
     - Menghapus blok logika `switchButtonHtml` dan variabel `${switchButtonHtml}` secara total.
     - Area foto kosong hanya menyajikan tombol *"Segarkan Kategori Ini"* (dan *"Buka Album Sumber"* jika link eksternal disetel).
3. **Pembersihan Total Fallback Hardcode (100% Realtime Database Murni)**:
   - Di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json):
     - Mengosongkan seluruh fallback statis di level root:
       - `FRAME_IMAGE_URL: ""`
       - `DRIVE_FOLDER_ID: ""`
       - `DRIVE_FOLDER_URL: ""`
       - `PHOTOBOOTH_URL: ""`
       - `WEDDING_FOLDER_URL: ""`
       - `ACTIVE_EVENT_ID: ""`
       - `EVENT_NAME: ""`
       - `EVENT_DATE: ""`
       - `EVENT_VENUE: ""`
       - `COUPLE_NAME: ""`
       - `SUBTITLE: ""`
       - `WELCOME_MESSAGE: ""`
       - `FOOTER_MESSAGE: ""`
       - `CUSTOM_CATEGORIES: []`
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js):
     - Membatasi `state.activeConfig.FRAME_IMAGE_URL` agar murni hanya mengambil nilai dari `matchedEv.frameImageUrl || ""` tanpa fallback ke parameter frame global.
4. **Hasil Verifikasi Otomatis**:
   - Seluruh 5 unit test di [scratch/test_frameless_photo_and_no_fallback.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/scratch/test_frameless_photo_and_no_fallback.js) **PASS 100% (0 Fail)**.
   - Seluruh 6 unit test di [scratch/test_frameless_not_found.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/scratch/test_frameless_not_found.js) **PASS 100% (0 Fail)**.
   - Pengecekan sintaks `node --check js/app.js` **Exit Code 0 (Bebas Syntax Error)**.

## 1. Analisis Akar Masalah (Root Cause Analysis)

Berdasarkan screenshot pengguna (`media_1795100743618_fe0c7552.jpg`) dan audit kode sumber:
1. **Frame pada Foto / Area Foto**:
   - Pada tangkapan layar, wadah informasi status kosong galeri (`.empty-gallery-card`) di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css) memiliki frame tebal kaku: `border: 1px solid rgba(197, 168, 128, 0.35);`, `background: radial-gradient(...)`, aksen garis atas `.empty-gallery-card::before`, serta `box-shadow`.
   - Kartu foto individual (`.photo-card`) juga memiliki `border: 1px solid rgba(197, 168, 128, 0.15);` dan `box-shadow: var(--shadow-soft);`.
   - Pada [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) baris 96, terdapat hardcoded watermark bingkai foto `"FRAME_IMAGE_URL": "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NEIeRNa-/view?usp=sharing"`.
   - **Solusi**: 
     - Hilangkan border, shadow, dan background pada `.empty-gallery-card` agar bersih menyatu dengan latar (*frameless minimal*).
     - Hilangkan border pada `.photo-card` agar foto tampil *edge-to-edge* modern tanpa garis batas (*borderless*).
     - Kosongkan hardcoded fallback `FRAME_IMAGE_URL` di `config.json`.

2. **Tombol "Buka Foto Photobooth (130 Foto) →"**:
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 2491–2509, fungsi `renderPhotoGrid()` menyuntikkan variabel `switchButtonHtml` yang merender tombol emas:
     `<button class="empty-gallery-btn-refresh"><span>Buka Foto ${escapeHtml(pbCat.name)} ${pbCount ? '(' + pbCount + ' Foto) ' : ''}&rarr;</span></button>`.
   - Tombol ini muncul di tengah kartu kosong saat tab Photostage dibuka.
   - **Solusi**: Hapus variabel dan blok kode `switchButtonHtml` secara total dari [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).

3. **Fallback Hardcode di File Konfigurasi & Script**:
   - Di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json), terdapat sisa parameter fallback statis pada tingkat root:
     - `"EVENT_NAME": "Andre & Fayola"`
     - `"EVENT_DATE": "22 November 2026"`
     - `"EVENT_VENUE": "UPPERHILLS CONVENTION HALLS"`
     - `"FRAME_IMAGE_URL": "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NEIeRNa-/view?usp=sharing"`
     - `"DRIVE_FOLDER_ID": "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh"`
     - `"PHOTOBOOTH_URL": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8"`
     - `"WEDDING_FOLDER_URL": "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI"`
     - `"CUSTOM_CATEGORIES": [...]`
   - Di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) baris 887:
     `if (sheetMap.FRAME_IMAGE_URL) state.activeConfig.FRAME_IMAGE_URL = sheetMap.FRAME_IMAGE_URL;` berpotensi mewariskan frame global jika sheet Pengaturan memiliki nilai frame.
   - **Solusi**:
     - Kosongkan seluruh string fallback statis di root [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) menjadi `""` dan `[]`.
     - Pastikan seluruh parameter acara (nama, tanggal, venue, folder Google Drive, link Photobooth, kategori kustom, dan bingkai) dibaca 100% murni secara realtime dari Google Spreadsheet (sheet `Daftar_Acara` dan `Pengaturan`).

4. **Batasan Ketat (Strict Boundary)**:
   - Tidak mengubah logika lain di luar 3 poin yang diminta oleh pengguna.

---

## 2. Rencana Implementasi Bertahap (Step-by-Step Plan)

### Langkah 1: Modifikasi Styling [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css)
1. Pada `.empty-gallery-card`:
   - Setel `border: none;`
   - Setel `box-shadow: none;`
   - Setel `background: transparent;`
   - Hapus / sembunyikan garis aksen `::before`.
2. Pada `.photo-card`:
   - Setel `border: none;`
   - Setel `border-color` pada hover menjadi transparan / hapus penambahan border.

### Langkah 2: Pembersihan Tombol Pintas di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js)
1. Pada fungsi `renderPhotoGrid()`:
   - Hapus blok evaluasi `switchButtonHtml` (baris 2491–2509).
   - Hapus `${switchButtonHtml}` dari template `grid.innerHTML`.
   - Hanya tampilkan tombol *"Segarkan Kategori Ini"* dan *"Buka Album Sumber"* (jika URL sumber tersedia).
2. Pada fungsi `syncFromSpreadsheetGViz()`:
   - Pastikan `state.activeConfig.FRAME_IMAGE_URL` terisolasi pada `matchedEv.frameImageUrl || ""` tanpa fallback global.

### Langkah 3: Eliminasi Hardcode Fallback di [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json)
1. Kosongkan nilai fallback statis root:
   - `FRAME_IMAGE_URL: ""`
   - `DRIVE_FOLDER_ID: ""`
   - `DRIVE_FOLDER_URL: ""`
   - `PHOTOBOOTH_URL: ""`
   - `WEDDING_FOLDER_URL: ""`
   - `CUSTOM_CATEGORIES: []`
   - `EVENT_NAME: ""`
   - `EVENT_DATE: ""`
   - `EVENT_VENUE: ""`
   - `COUPLE_NAME: ""`
   - `SUBTITLE: ""`
   - `WELCOME_MESSAGE: ""`
   - `FOOTER_MESSAGE: ""`

---

## 3. Matriks Komparasi Sebelum vs Sesudah

| Elemen / Komponen | Kondisi Sebelum Revisi | Rencana Sesudah Revisi |
| :--- | :--- | :--- |
| **Frame Kartu Status Kosong** | Kotak putih dengan garis batas emas (`border: 1px solid...`), garis aksen atas, dan bayangan | **Frameless**: Bersih, transparan, tanpa kotak/border batas (*Minimal Aesthetic*) |
| **Border Kartu Foto (`.photo-card`)** | Memiliki garis batas `border: 1px solid rgba(197, 168, 128, 0.15)` | **Borderless**: Bebas garis batas, foto tampil bersih *edge-to-edge* |
| **Tombol Photobooth di Layar Kosong**| Muncul tombol `→ Buka Foto Photobooth (130 Foto) →` | **Dihapus Total**: Hanya menyisakan tombol *"Segarkan Kategori Ini"* |
| **Fallback Root di config.json** | Berisi hardcoded folder Drive, URL Photobooth, URL Frame Google Drive, nama Andre & Fayola | **Dibersihkan**: Berisi string kosong `""`, data 100% realtime diserap dari Spreadsheet ERP |

---

## 4. Rencana Verifikasi Otomatis
- Buat test script [scratch/test_frameless_photo_and_no_fallback.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/scratch/test_frameless_photo_and_no_fallback.js):
  1. Validasi ketiadaan teks `Buka Foto Photobooth` di [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js).
  2. Validasi `.empty-gallery-card` dan `.photo-card` tidak lagi memiliki `border` di [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css).
  3. Validasi [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) bebas dari hardcoded fallback (`FRAME_IMAGE_URL: ""`, dsb).
  4. Jalankan `node --check js/app.js` (Exit Code 0).

================================================================================
PANDUAN PENGGUNA:
Rencana revisi di atas telah selesai disusun sesuai SOP ZettBOT.
Jika Anda sudah menyetujui rencana perbaikan ini, silakan ketik:
👉 **"OKE TERAPKAN"**
================================================================================
