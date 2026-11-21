# STATUS REVISI SISTEM (revisi.md) - v4.33.0
================================================================================
STATUS: SELESAI DITERAPKAN & TERVERIFIKASI (IMPLEMENTED & VERIFIED)
TANGGAL: 22 November 2026
VERSI RILIS: v4.33.0-ERP-SYNC-STABILITY
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

## 1. Ringkasan Eksekusi Revisi
1. **Penyimpanan Permanen 15 Kolom ERP Master Table di Google Sheets (`code.gs`, `js/admin.js`):**
   - **Akar Masalah:** Sebelumnya, `addEventToSheet` dan `syncEventsToSheet` di `code.gs` hanya menyimpan 11 kolom default dan memotong data `Pesan_Sambutan`, `Subjudul`, `Pesan_Footer`, serta `Label_Semua_Foto`. Objek `curEvToSync` di `js/admin.js` juga belum menyertakan keempat properti tersebut saat memanggil API backend. Akibatnya, pada perangkat lain (Device B), kustomisasi pesan sambutan tidak tersimpan di database event.
   - **Solusi Diterapkan:**
     * Memperluas skema `Daftar_Acara` menjadi 15 kolom lengkap: `['ID_Event', 'Nama_Acara', 'Tanggal_Acara', 'Venue_Lokasi', 'Tautan_Home_Event', 'Google_Drive_Folder_ID', 'Photobooth_Vendor_URL', 'Kategori_JSON', 'Bingkai_URL', 'Logo_Acara', 'Status', 'Pesan_Sambutan', 'Subjudul', 'Pesan_Footer', 'Label_Semua_Foto']`.
     * Memperbarui `curEvToSync` dan `saveAllSettings` agar menyimpan seluruh metadata acara ke baris Google Sheets secara persisten.

2. **Perbaikan Tombol "Lihat / Test Galeri" (`js/admin.js`):**
   - **Akar Masalah:** Ketika pengguna mengubah nama tab, tautan bingkai, atau pesan sambutan lalu menekan tombol *"Lihat / Test Galeri"*, fungsi `closeAdminSettingsModal()` sebelumnya hanya menutup modal tanpa menerapkan nilai input ke memori aktif, sehingga galeri masih menampilkan status lama.
   - **Solusi Diterapkan:** `closeAdminSettingsModal()` kini secara instan menerapkan perubahan form ke `state.activeConfig`, memperbarui tab galeri, dan memanggil `populateConfigToUI` saat modal ditutup.

3. **Global Binding Input Nama Tab Galeri (`js/core.js`):**
   - Mendaftarkan fungsi `handleAllPhotosLabelChange` ke objek global `window` guna menjamin input perubahan nama tab (misal: "Photostage") dan tombol "Reset" tidak memicu error JavaScript pada peramban mobile/desktop.

4. **Multi-Fallback & Notifikasi Unduh Berbingkai (`js/gallery.js`, `api/download-proxy.js`):**
   - Menambahkan jalur fallback thumbnail Google Drive (`https://drive.google.com/thumbnail?id=...&sz=w2500`) pada `loadSafeCanvasImage`.
   - Menampilkan notifikasi informatif yang jelas apabila izin berbagi file bingkai di Google Drive belum disetel publik ("Anyone with the link can view").
   - Memperbarui `api/download-proxy.js` agar mengenali URL Googleusercontent secara presisi.

5. **Sinkronisasi Otomatis Respons Galeri (`js/app.js`):**
   - Memastikan `handleGalleryResponse()` selalu memicu `populateConfigToUI(state.activeConfig)` setiap kali pembaruan konfigurasi backend diterima.

## 2. Hasil Verifikasi Otomatis
- `scratch/test_multidevice_and_frame.js`: 18 PASS, 0 FAIL.
- `scratch/test_all_fixed.js`: 16 PASS, 0 FAIL.
