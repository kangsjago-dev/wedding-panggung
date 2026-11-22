# STATUS REVISI SISTEM (revisi.md) - v4.34.0
================================================================================
STATUS: SELESAI DITERAPKAN & TERVERIFIKASI (IMPLEMENTED & VERIFIED)
TANGGAL: 22 November 2026
VERSI RILIS: v4.34.0-FRAMED-FILENAME-AND-EMPTY-STATE
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

## 1. Ringkasan Eksekusi Revisi
1. **Preservasi 100% Nama Asli File Saat Download Berbingkai (`js/core.js`, `js/gallery.js`):**
   - **Instruksi Pengguna:** *"pada saat download kategori 'semua foto' gabungkan dengan bingkai yang telah diupload dan jangan ubah ukuran nama filenya"*.
   - **Akar Masalah:** Sebelumnya, fungsi `generateUniqueFileName` menambahkan akhiran `-berbingkai`, memotong nama menjadi 35 karakter, dan menyisipkan timestamp hash acak (contoh: `DSC_0012-berbingkai_081734_512.jpg`). Hal ini mengubah panjang dan format nama asli file foto.
   - **Solusi Diterapkan:**
     * Menambahkan helper `getExactPhotoFileName(photo, defaultExt)` di `js/core.js` dan mendaftarkannya ke `window`. Helper ini mempertahankan 100% panjang dan karakter nama file asli (misal: `DSC_0012.JPG` tetap `DSC_0012.JPG`, `IMG_20261121_191928.jpg` tetap `IMG_20261121_191928.jpg`) dan hanya membersihkan karakter terlarang filesystem OS tanpa memotong atau menambahkan suffix `-berbingkai`.
     * Mengganti seluruh pemanggilan `generateUniqueFileName` pada proses unduh berbingkai (`executeFramedPhotoDownload`, `handleCurrentLightboxDownload`, dan handler tombol unduh lightbox di `js/gallery.js`) dengan `getExactPhotoFileName`.

2. **Eliminasi Total Foto Dummy Saat Google Drive Kosong (`js/app.js`, `js/gallery.js`):**
   - **Instruksi Pengguna:** *"apabila googledrive kosong. Jangan tampilkan dummy. Tapi tampilkan text bahwa galery masih kosong dengan kata2 yang menarik dan elegan"*.
   - **Akar Masalah:** 
     * Di `js/app.js`, ketika pemindaian Google Drive mengembalikan array kosong (`data.photos.length === 0`), script melempar `throw new Error("Empty drive-folder response")` sehingga `handleGalleryResponse` tidak dipanggil dengan `photos: []`, dan foto lama di `localStorage` tetap tertahan.
     * Tidak adanya sanitasi penyaringan foto demo/dummy warisan sesi lawas di `localStorage`.
   - **Solusi Diterapkan:**
     * Di `js/app.js`: Memperbarui `fetchGalleryData` agar menerima array `photos: []` dari `/api/drive-folder` sebagai respons valid (tanpa melempar error), serta menambahkan filter pembersih foto demo (`p.isDemo`, `demo-`, unsplash) pada `handleGalleryResponse` dan pembacaan `localStorage` saat startup.
     * Di `js/gallery.js`: Merancang status galeri kosong dengan kata-kata romantis, hangat, dan berkelas tema pernikahan:
       - **Badge:** `✦ Momen Bahagia Segera Hadir ✦`
       - **Judul:** `Galeri Foto Masih Kosong`
       - **Deskripsi:** *"Setiap senyuman, tatapan penuh cinta, dan kehangatan momen istimewa ini sedang dalam proses kurasi terbaik. Foto-foto kenangan indah akan segera hadir di sini. Silakan periksa kembali beberapa saat lagi."*
       - Dilengkapi tombol elegan beraksen emas *"Segarkan Galeri"*.

## 2. Hasil Pengujian & Verifikasi Otomatis
- `scratch/test_framed_download_and_empty_state.js`: 5/5 PASS (100%).
- `scratch/test_multidevice_and_frame.js`: 18/18 PASS (100%).
- `scratch/test_all_fixed.js`: 16/16 PASS (100%).
- Total: 39 pengujian otomatis terverifikasi 100% SUKSES tanpa error.
