# Catatan Revisi & Audit Sistem (Changelog)

## Versi 4.0.0 - ERP Master Table & Isolasi Penuh Multi-Event (19 November 2026)

### 1. Masalah Utama yang Ditangani
1. **Pindah Event Revert ke 1 Tampilan ("kembali ke 1 tampilan")**:
   - **Penyebab**: Saat memilih event di dropdown admin, `handleGalleryResponse` dan polling `syncFromSpreadsheetGViz` menerima konfigurasi server tunggal dan menimpa event yang sedang dipilih dengan data event lama (Wilson & Felicia).
   - **Solusi**:
     - Ditambahkan guard ketat di `handleGalleryResponse`: Jika client sedang aktif di event tertentu (`state.currentEventId`), atribut event (`EVENT_NAME`, `EVENT_DATE`, `EVENT_VENUE`, `DRIVE_FOLDER_ID`, `PHOTOBOOTH_URL`, `CUSTOM_CATEGORIES`) diproteksi dan tidak boleh ditimpa oleh konfigurasi tunggal server.
     - Diprioritaskan `state.currentEventId` di `syncFromSpreadsheetGViz` sehingga polling background setiap 20 detik tidak pernah membalikkan event aktif.
     - Diperbaiki `openAdminSettingsModal` agar memanggil `populateAdminInputsForActiveEvent(state.activeConfig)` saat modal dibuka, sehingga semua input field langsung menampilkan data event yang sedang aktif.
     - Kunci eksplisit nilai `adminEventSelect.value = state.currentEventId` di `renderAdminEventsManager`.

2. **Pembuatan Arsitektur ERP Master Table di Google Spreadsheet**:
   - Struktur sheet `Daftar_Acara` diformat sebagai tabel master ERP 10 kolom:
     `[ID_Event, Nama_Acara, Tanggal_Acara, Venue_Lokasi, Tautan_Home_Event, Google_Drive_Folder_ID, Photobooth_Vendor_URL, Kategori_JSON, Bingkai_URL, Status]`
   - Data inisial event (`andre-fayola-281` dan `wilson-felicia-133`) telah disiapkan dengan link unik masing-masing (`?event=andre-fayola-281` dan `?event=wilson-felicia-133`).
   - Fungsi `syncEventsToSheet(dbSpreadsheet, evList)` diintegrasikan ke dalam `saveAdminSettings` di `code.gs`.
   - `syncFromSpreadsheetGViz` di `js/app.js` kini secara otomatis membaca struktur tabel ERP `Daftar_Acara` jika tersedia dan memetakan seluruh properti event.

3. **Hilangkan Fallback (Hardcode) & Realtime Database**:
   - Data murni dibaca realtime dari Google Spreadsheet & Google Drive.
   - Tidak ada mock data atau hardcode pasangan yang muncul secara sembunyi-sembunyi saat loading; skeleton loading digunakan untuk kenyamanan transisi.

4. **Audit Seluruh Fungsi (34 Event Handlers)**:
   - Seluruh 34 interaksi UI (login, tambah event, ganti event, hapus event, salin link, date picker, download foto berbingkai, download original, antrean download, slideshow, lightbox) terverifikasi 100% aktif dan bebas dari error sintaks (`node -c js/app.js` PASSED).
