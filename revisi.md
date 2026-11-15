# STATUS REVISI: SELESAI & TELAH DITERAPKAN (MERGED)
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUKSES DITERAPKAN (v1.9.0)
TANGGAL PENERAPAN: 16 November 2026
================================================================================

Seluruh poin perbaikan dan penyesuaian dari pengguna telah berhasil diterapkan ke dalam kode basis dan disinkronkan pada `prd.md` (Living Context v1.9.0):

1. [x] **Dukungan Penuh File Spreadsheet 'foto-panggung':**
   - Script `code.gs` dan `setup.gs` diperbarui secara presisi dengan deteksi multi-layer untuk berkas bernama **`foto-panggung`**:
     * Mendeteksi otomatis jika script container-bound (`SpreadsheetApp.getActiveSpreadsheet()`).
     * Mendeteksi otomatis berkas Google Drive bernama `foto-panggung` (`DriveApp.getFilesByName("foto-panggung")`).
     * Mendeteksi via pencarian toleran Drive query.
   - Bersifat non-destruktif: Tidak menghapus atau menimpa isi data yang sudah ada di sheet `Pengaturan`.
   - Data event (Nama Event, Tanggal, Venue, Folder Drive, Bingkai PNG) yang diedit di file `foto-panggung` langsung aktif menjadi sumber acuan live web app.

2. [x] **Pembersihan Fitur Database Google Sheets dari Menu Admin Web:**
   - Seluruh blok antarmuka *"Database Google Sheets"* (input ID spreadsheet, tombol buka sheets, dan tombol inisialisasi) telah dihapus bersih dari modal admin `index.html`.
   - Menu Admin Web kembali bersih, fokus, dan bebas dari konfigurasi database teknis.

3. [x] **Prinsip Non-Destruktif Utuh:**
   - Seluruh fitur sebelumnya (Live Multi-Device Cloud Sync, Live Auto-Sync 20-25s, Badge Foto Baru auto-expire 10m, Canvas Frame Compositor, Filter Anti-File Rusak, Lightbox, Slideshow Panggung) 100% dipertahankan dan beroperasi prima.

Berkas `revisi.md` kini bersih dan siap untuk siklus kerja berikutnya.
