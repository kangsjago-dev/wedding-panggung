# STATUS REVISI SISTEM (revisi.md) - v4.32.0
================================================================================
STATUS: SELESAI DITERAPKAN & TERVERIFIKASI (IMPLEMENTED & VERIFIED)
TANGGAL: 22 November 2026
VERSI RILIS: v4.32.0-MULTI-DEVICE-FRAME-SYNC
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

## 1. Ringkasan Eksekusi Revisi
1. **Sinkronisasi Multi-Device 100% Realtime (`js/app.js`, `js/core.js`, `index.html`):**
   - **Akar Masalah:** Sebelumnya, engine sinkronisasi GViz (`syncFromSpreadsheetGViz`) hanya mengekstrak parameter login admin (`ADMIN_USERNAME` dan `ADMIN_PIN`) dari sheet `Pengaturan`, mengabaikan `WELCOME_MESSAGE`, `SUBTITLE`, `FOOTER_MESSAGE`, `FRAME_IMAGE_URL`, dan `ALL_PHOTOS_LABEL`. Akibatnya, pada perangkat lain (Device B) yang belum memiliki riwayat `localStorage`, teks sambutan pengantin (*"Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih..."*) tidak muncul.
   - **Solusi Diterapkan:**
     * Memperbarui parser GViz di `js/app.js` untuk mengekstrak seluruh kunci `WELCOME_MESSAGE`, `SUBTITLE`, `FOOTER_MESSAGE`, `FRAME_IMAGE_URL`, dan `ALL_PHOTOS_LABEL` dari sheet `Pengaturan` serta merekonsiliasinya dengan sheet `Daftar_Acara` dan `sheetMap.EVENTS`.
     * Mengatur nilai bawaan teks sambutan dan penutup yang elegan langsung di HTML markup (`index.html`) dan fungsi DOM core (`js/core.js`), sehingga pada saat pertama kali dimuat di perangkat baru sekalipun, teks sambutan langsung tampil tanpa jeda kosong.

2. **Kustomisasi & Pesan Khusus Kategori "Semua Foto" (`js/categories.js`, `js/gallery.js`):**
   - Nama tab kategori "Semua Foto" kini 100% dapat dikustomisasi (misal diubah menjadi *"Photostage"* atau nama lainnya) melalui form input `#cfgMainGalleryLabel` di modal admin.
   - Apabila tautan folder Google Drive untuk kategori utama tersebut kosong / belum ditautkan:
     * Menampilkan kartu estetis emas lembut dengan badge *"Momen Utama • [Nama Kategori]"*, judul *"Foto Belum Tersedia"*, dan keterangan khusus: *"Tautan folder Google Drive untuk kategori '[Nama Kategori]' belum ditautkan oleh penyelenggara acara. Foto dokumentasi momen bahagia akan otomatis tampil begitu folder ditautkan."*
   - Apabila folder telah ditautkan namun belum ada foto di dalamnya:
     * Menampilkan badge *"Momen Utama • [Nama Kategori]"* dan judul *"Momen Sedang Dipersiapkan"*.

3. **Kewajiban Unduh Berbingkai pada Kategori "Semua Foto" (`js/gallery.js`, `js/core.js`):**
   - Foto pada kategori utama ("Semua Foto" / label kustom seperti "Photostage") dikunci secara ketat agar **TIDAK** dideteksi sebagai Photobooth (`isPhotoPhotobooth(photo)` mengembalikan `false`).
   - Selama tautan bingkai PNG transparan dikonfigurasi pada event tersebut, seluruh foto pada kategori utama wajib diproses melalui komposit canvas beresolusi tinggi dengan bingkai acara dan diunduh berbingkai (`✨ Simpan Kenangan Berbingkai`).

4. **Input Realtime Tautan Bingkai & Indikator Lencana (`index.html`, `js/admin.js`, `js/core.js`):**
   - Menambahkan event handler `oninput="handleFrameUrlInput(this.value)"` pada elemen input `#cfgFrameImageUrl`.
   - Mengimplementasikan `updateFrameStatusBadge(frameUrl)` dan `handleFrameUrlInput(val)` yang secara langsung memperbarui lencana `#frameStatusBadge` menjadi *"✓ Bingkai Aktif"* (hijau) atau *"Tanpa Bingkai"* (abu-abu), mengaitkannya ke `state.activeConfig.FRAME_IMAGE_URL`, dan memuat aset bingkai ke memori kanvas secara asinkron.
   - Memastikan tombol *"Sinkronkan Kategori & Tautan"* dan *"Simpan Perubahan"* menyertakan parameter `FRAME_IMAGE_URL` ke database Google Spreadsheet.

5. **Seluruh Menu & Pengaturan Dapat Diedit dan Tersimpan:**
   - Nama Pasangan/Acara, Tanggal, Venue, Subjudul, Pesan Sambutan Tamu, Pesan Penutup Footer, Logo/Monogram, Bingkai Transparan, Label Tab Utama, Folder ID Google Drive, Tautan Photobooth Vendor, Akun Admin, dan Pengaturan Cloud/API dapat diubah bebas dan tersimpan konsisten.

## 2. Hasil Pengujian Otomatis
- Pengujian mandiri via `scratch/test_multidevice_and_frame.js` berhasil 100% (18 PASS, 0 FAIL):
  * Welcome message default rendering on fresh device (PASS)
  * Subtitle default rendering on fresh device (PASS)
  * Footer blessing default rendering on fresh device (PASS)
  * Live frame input handler & `state.activeConfig.FRAME_IMAGE_URL` update (PASS)
  * Live frame status badge update to "✓ Bingkai Aktif" & "Tanpa Bingkai" (PASS)
  * Empty main gallery without link showing special notice & badge (PASS)
  * Empty main gallery with link showing "Momen Sedang Dipersiapkan" (PASS)
  * Main gallery photo isolation from photobooth bypass (PASS)
  * Drive frame URL normalization to direct high-res image link (PASS)
  * Parallel GViz sync of welcome message, subtitle, frame URL, and allPhotosLabel (PASS)
  * UI DOM node update from realtime GViz sync (PASS)
- Pengujian regresi via `scratch/test_all_fixed.js` berhasil 100% (16 PASS, 0 FAIL).
