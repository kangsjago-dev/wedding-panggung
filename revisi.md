# STATUS REVISI SISTEM (revisi.md) - v4.34.1
================================================================================
STATUS: SELESAI DITERAPKAN & TERVERIFIKASI (IMPLEMENTED & VERIFIED)
TANGGAL: 22 November 2026
VERSI RILIS: v4.34.1-NATIVE-RESOLUTION-AND-REALTIME-SYNC
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

## 1. Ringkasan Eksekusi Revisi Terkini
1. **Preservasi 100% Ukuran & Resolusi Fisik Berkas Foto Saat Penggabungan Bingkai (`js/gallery.js`, `js/core.js`):**
   - **Instruksi Pengguna:** *"pada saat download kategori 'semua foto' gabungkan dengan bingkai yang telah diupload dan jangan ubah ukuran dari filenya"*.
   - **Akar Masalah:**
     * Sebelumnya, kanvas penulisan bingkai dikompresi ke dimensi bingkai (2400x1600) atau diskalakan, sehingga foto kamera beresolusi tinggi (misal: 6000x4000) terpangkas ukurannya.
     * Pengambilan gambar Google Drive menggunakan parameter resolusi terbatas (`=w2500`).
     * `toBlob` menggunakan kualitas kompresi JPEG rendah (0.94).
   - **Solusi Diterapkan:**
     * Kanvas rendering (`executeFramedPhotoDownload`, `prepareLightboxFramedBlob`, `precompositeLightboxPhoto`) kini diatur 100% sama dengan dimensi piksel asli foto (`canvasW = isRotated90 ? ph : pw; canvasH = isRotated90 ? pw : ph`).
     * Foto digambar secara 1:1 tanpa pengurangan resolusi, dan bingkai dihamparkan secara proporsional di atasnya.
     * URL fetch foto menggunakan `=s0` (full uncompressed native image dari Google CDN).
     * Kompresi ekspor ditingkatkan ke `0.98` (kualitas tertinggi) untuk menjaga ukuran dan ketajaman berkas.

2. **Perbaikan Sinkronisasi Realtime & Pencegahan Revert Pengaturan Photobooth / Bingkai / Tab (`js/app.js`, `js/admin.js`):**
   - **Akar Masalah:**
     * Background GViz auto-refresh (`syncFromSpreadsheetGViz`) berjalan tiap 20-25 detik membaca baris `Daftar_Acara`. Jika baris Google Sheets belum diperbarui atau kolom bernilai null, nilai lama menimpa konfigurasi yang baru disimpan oleh admin.
     * Pada `js/admin.js`, sinkronisasi kategori tidak memperbarui properti `photoboothUrl` pada objek event aktif di `state.events`.
     * Saat beralih event di panel admin, pembacaan `localStorage` tidak menyaring foto dummy lawas.
   - **Solusi Diterapkan:**
     * `js/app.js`: Prioritaskan data segar dari `extraEv.photoboothUrl`, `sheetMap.PHOTOBOOTH_URL`, `sheetMap.FRAME_IMAGE_URL`, dan `state.activeConfig` agar tidak tertimpa baris statis lama `Daftar_Acara`.
     * `js/admin.js`: Pastikan `curEv.photoboothUrl` langsung disinkronkan saat tombol simpan ditekan.
     * `js/admin.js`: Terapkan pembersihan foto demo/dummy saat event diubah di admin.

3. **Preservasi 100% Nama Asli File & Status Galeri Kosong Elegan (`js/core.js`, `js/gallery.js`):**
   - Nama asli file dipertahankan utuh via `getExactPhotoFileName` tanpa penambahan suffix `-berbingkai`.
   - Galeri kosong menampilkan kartu pesan cinta yang hangat, romantis, dan elegan tanpa menampilkan foto contoh dummy.

## 2. Hasil Pengujian & Verifikasi Otomatis
- `scratch/test_resolution_and_sync.js`: 10/10 PASS (100%).
- `scratch/test_framed_download_and_empty_state.js`: 5/5 PASS (100%).
- `scratch/test_multidevice_and_frame.js`: 18/18 PASS (100%).
- `scratch/test_all_fixed.js`: 16/16 PASS (100%).
- **Total: 49/49 pengujian otomatis terverifikasi 100% BERHASIL.**
