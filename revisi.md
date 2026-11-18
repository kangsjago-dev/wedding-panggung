# Catatan Revisi & Audit Sistem (Changelog)

## Versi 4.1.0 - Pinned Locked Navigation Tabs & Panduan Eksekusi ERP Google Sheets (19 November 2026)

### 1. Perbaikan yang Diperintahkan & Diterapkan:
1. **Kunci Navigasi Tab Admin (Anti-Tertutup Saat Scroll)**:
   - **Komponen**: `.admin-tabs-nav` dipindahkan ke wadah khusus `.admin-tabs-sticky-wrapper` yang berada di antara `.admin-card-header` dan `.admin-card-body`.
   - **Gaya CSS**: `position: sticky; top: 0; z-index: 25; background: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`.
   - **Hasil**: Saat admin men-scroll konten formulir pada tab apapun (Acara & Event, Foto & Kategori, Akun Admin, Cloud & API), bilah navigasi tab **tetap terkunci di atas (pinned)** dan tidak pernah tertutup atau hilang dari pandangan.

2. **Hilangkan Fallback (Hardcode) Murni Realtime Database**:
   - Seluruh identitas pasangan dan kategori foto diambil realtime dari Google Spreadsheet & Google Drive.
   - Tidak ada dummy text hardcode; skeleton shimmer loading aktif selama transfer data.

3. **Inisialisasi Tabel ERP Google Sheets (`Daftar_Acara`, `Pengaturan`, `Pengguna_Admin`, `Daftar_Foto`, `Log_Aktivitas`)**:
   - **Akar Masalah Sebelumnya**: Script Google Apps Script yang ter-deploy online di Google Cloud masih menyimpan versi lama yang memicu error `ReferenceError: dummyPhotos is not defined` saat fungsi inisialisasi dipanggil.
   - **Solusi**:
     - Berkas [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) telah dibersihkan 100% dari variabel rusak tersebut dan tervalidasi bebas syntax error (`vm.Script` PASSED).
     - Fungsi `setupTargetSpreadsheetDatabase()` dipindahkan ke **baris paling atas** di [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) sehingga saat file dibuka di editor [script.google.com](https://script.google.com), fungsi tersebut otomatis terpilih pada toolbar atas.
     - Disediakan tombol langsung `⚡ Sinkronkan / Inisialisasi Database Google Sheets` di Panel Admin Web (Tab Cloud & API).

4. **Audit Integritas Menu (35 Event Handlers Lolos 100%)**:
   - Seluruh 35 handlers terdaftar aktif dan tervalidasi.
   - `node -c js/app.js` PASSED (Code 0).
