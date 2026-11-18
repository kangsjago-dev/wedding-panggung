# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.9
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.6.9) - 100% SUKSES
TANGGAL: 18 November 2026

### 6 Poin Instruksi Utama Pengguna:
1. **Kategori Momen Lainnya = JANGAN DI-ROTATE:**
   - Foto pada kategori momen lainnya (seperti Wedding, Akad Nikah, Resepsi, dll) dipastikan tidak dirotasi sama sekali (rotasi normal 0°).
   - `getPhotoRotation()` diatur ketat: jika kategori bukan "Semua Foto" dan bukan "Photobooth", rotasi selalu mengembalikan 0°.
   - `api/drive-folder.js` menetapkan `autoRotateDeg = 0` secara konsisten.

2. **Kategori Spesial Photobooth Mendukung Format Link `https://photos.app.goo.gl/`:**
   - Ditambahkan helper `isGooglePhotosUrl()` yang mengenali domain `photos.google.com` dan shortlink `photos.app.goo.gl`.
   - Backend `api/google-photos.js` dan Apps Script `code.gs` (`scanGooglePhotosAlbum`) menggunakan `redirect: "follow"` / `followRedirects: true` dan matcher regex fleksibel (`/pw/` maupun direktori gambar Google Photos).

3. **Sinkronisasi Tampilan Galeri Sesuai Link yang Diberikan:**
   - Menyelesaikan masalah fallback paksa ke `fotoshare.co` saat `targetUrl` tidak dioper pada pemanggilan `applyCategoryFilter()`.
   - `targetUrl` kini di-resolve secara dinamis dari `state.customCategories`.
   - Invalidation cache instan: begitu link diganti, cache foto kategori lama langsung dihapus dan foto baru langsung dimuat seketika.

4. **Percepatan Loading & Anti Delay 5 Menit:**
   - `fetchGooglePhotos` dilengkapi dengan `AbortController` timeout 6 detik sehingga tidak terjadi freeze atau hang jika endpoint API tertahan.
   - Foto langsung ditampilkan dengan skeleton loader elegan dan ter-render otomatis tanpa perlu refresh halaman berulang-ulang.

5. **Eliminasi Menu Duplikat Label Tab Galeri Utama:**
   - Input duplikat `cfgAllPhotosLabel` pada tab "Acara & Event" (`tabPane-event`) telah dihapus.
   - Pengaturan nama kategori galeri utama kini terpusat dan satu-satunya di tab "Foto & Kategori" (`tabPane-media`) pada `#cfgMainGalleryLabel`.

6. **Anti-Revert Link Photobooth & Kategori Momen:**
   - Menyimpan parameter `PHOTOBOOTH_URL` dan `CUSTOM_CATEGORIES` secara terpadu ke Google Apps Script dan Google Spreadsheet sheet `Pengaturan`.
   - `syncFromSpreadsheetGViz` menyinkronkan kedua kolom secara simultan sehingga tautan tidak akan kembali ter-reset ke bawaan setelah beberapa saat.

---

# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.8
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.6.8) - 100% SUKSES
TANGGAL: 18 November 2026

### Permintaan Pengguna:
"semua poastingan yang berbentuk database, isi ke dalam googlesheet, termasuk id admin dan semua link yang berhubungan dengan system"
- ubah yang diperintahkan. Dan laksanakan
- jangan ubah yang tidak di instruksikan

### Solusi & Implementasi:
1. **Pengisian Seluruh Tautan Sistem ke Google Spreadsheet & Konfigurasi:**
   - `SPREADSHEET_ID`: `133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`
   - `SPREADSHEET_URL`: `https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit`
   - `GAS_API_URL`: `https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec`
   - `DRIVE_FOLDER_ID`: `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5`
   - `DRIVE_FOLDER_URL`: `https://drive.google.com/drive/folders/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5`
   - `FRAME_IMAGE_URL`: `https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk`
   - `PHOTOBOOTH_URL`: `https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs`
   - `WEDDING_FOLDER_URL`: `https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`

2. **Pengisian Akun & ID Admin Lengkap dengan Username:**
   - Ditulis ke sheet `Pengguna_Admin` dan `Pengaturan` (`ADMIN_ACCOUNTS_INFO`):
     - Super Admin: ID `usr_superadmin`, Username `admin`, PIN `111111` / `123456`, Peran `Super Admin`
     - Admin 2: ID `usr_mwid2vkz_759`, Username `ilham`, PIN `121212`, Peran `Admin`
     - Admin 3: ID `usr_mwii1zmz_598`, Username `Wanta`, PIN `888888`, Peran `Admin`

3. **Inisialisasi Seluruh Postingan Foto Database Google Drive ke Sheet `Daftar_Foto`:**
   - Memindai berkas foto asli dari Folder Utama Google Drive (`1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5`) dan Folder Wedding Panggung (`1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`).
   - Menyimpan seluruh kolom: `ID_Foto`, `Nama_File`, `Kategori`, `URL_Thumbnail`, `URL_Download`, `Ukuran_Bytes`, `Waktu_Upload`, dan `Status`.
   - Menghilangkan bug `ReferenceError: dummyPhotos is not defined` pada `setup.gs` dan menyinkronkan `setupTargetSpreadsheetDatabase()` ke dalam `code.gs`.

4. **Pembersihan Serialisasi JSON:**
   - Memastikan properti `EVENTS` dan `COVER_SETTINGS` di Google Spreadsheet tersimpan sebagai string JSON murni dan valid, tanpa label `[object Object]`.

---
# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.7
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.6.7) - 100% SUKSES
TANGGAL: 18 November 2026

### 3 Poin Instruksi Utama Pengguna:
1. **Hapus Semua Tombol Rotate & Otomatiskan Rotasi Sistem:**
   - Seluruh tombol putar/rotate manual dihapus total:
     - Dihapus: Tombol putar di bar kontrol galeri (`#btnAutoRotateCategory`).
     - Dihapus: Tombol putar di setiap kartu foto galeri (`.photo-card-rotate-btn`).
     - Dihapus: Tombol putar di dalam modal Lightbox (`#lightboxRotateBtn` & `#lightboxRotateLabel`).
     - Dihapus: Dropdown orientasi di modal pengaturan admin (`#pbRotationSelect` & `.cat-rotation-select`).
   - Sistem auto-rotate otomatis mendeteksi foto panggung (folder `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` / kategori Wedding stage) dan otomatis memutarnya 90° tegak lurus pada tampilan galeri (`.rotate-90`), pratinjau lightbox (`rotate(90deg)`), dan canvas generator unduhan berbingkai tanpa perlu diklik manual oleh pengguna.

2. **Kategori Spesial & Momen Lainnya Berubah Akurat di Semua Device:**
   - **Akar Masalah:**
     - `config.json` lokal masih menyimpan tautan lama (Kingphotobooth & folder 116 foto).
     - `DOMContentLoaded` di `js/app.js` memiliki pre-seed hardcoded `state.categoryPhotosMap["Wedding"] = WEDDING_INITIAL_CACHE` (116 foto) yang meracuni cache pada device baru.
     - `syncFromSpreadsheetGViz` tidak menginvalidasi cache saat Google Sheet diperbarui.
   - **Solusi Tuntas:**
     - Sinkronisasi `config.json` dengan nilai resmi: Photobooth (`https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs`) dan Wedding (`https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI`).
     - Pre-seed statis hardcoded dihapus sehingga device baru selalu membaca konfigurasi aktif.
     - `syncFromSpreadsheetGViz` mendeteksi perubahan URL, mengosongkan cache lama, mem-prefetch data baru, merender tab kategori, dan me-refresh galeri jika kategori aktif sedang dibuka.
     - API endpoint `api/drive-folder.js` dan fallback default di `code.gs` diperbarui secara sinkron.

3. **Perbaikan Tampilan & Navigasi Kategori pada Mode Mobile:**
   - **Akar Masalah:**
     - Pada layar ponsel (≤768px), ikon Share, Refresh, dan Admin diletakkan sejajar di samping kategori dalam 1 baris sempit, menyebabkan tab kategori terdesak dan sulit di-scroll saat jumlah kategori bertambah.
   - **Solusi Tuntas (2-Tier Mobile Layout):**
     - Tier Atas (Order 1): Ikon aksi (Share, Refresh, Admin) dirangkum rapi di pojok kanan atas dalam kapsul glassmorphism elegan (`background: rgba(255,255,255,0.9); border: 1px solid rgba(197,168,128,0.35); border-radius: 9999px;`).
     - Tier Bawah (Order 2): Tab kategori (`.filter-scroll`) mendapatkan **100% lebar layar penuh** dengan padding halus dan horizontal swipe alami yang leluasa disentuh jari, tanpa terhalang atau terhimpit ikon aksi.

---
### File yang Dimodifikasi:
1. `index.html`: Penghapusan tombol `#lightboxRotateBtn` dari topbar modal lightbox.
2. `css/style.css`: Penghapusan style `.photo-card-rotate-btn` dan implementasi layout responsif 2-tier mobile untuk `.filter-container`, `.action-controls-group`, dan `.filter-scroll`.
3. `config.json`: Sinkronisasi tautan Photobooth dan Wedding terbaru untuk inisialisasi lintas perangkat.
4. `api/drive-folder.js`: Deteksi folder panggung `1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI` dan penetapan tag `autoRotate: 90`.
5. `js/app.js`: Auto-rotate cerdas di `getPhotoRotation()`, penghapusan tombol rotate di `renderPhotoGrid()`, pembersihan dropdown rotate di modal admin, penghapusan pre-seed hardcoded lama, dan invalidasi cache dinamis di `syncFromSpreadsheetGViz()`.
6. `code.gs`: Sinkronisasi tautan default `CUSTOM_CATEGORIES` dan `EVENTS`.
7. `scratch/test_v367.js`: Pengujian otomatis regresi & fitur (100% PASS).

---

## Update Versi 3.7.0 (Kustomisasi Bebas & Tampilan Galeri Kategori Spesial Photobooth)

### Masalah yang Dilaporkan:
- Baris konfigurasi **Kategori Spesial: Photobooth** di panel admin tidak dapat diubah (terkunci/ter-reset otomatis).
- Tautan baru tidak dapat dicustom atau foto dari tautan baru tidak tampil di galeri.

### Akar Masalah yang Ditemukan & Diperbaiki:
1. **Pembalikan Nilai Otomatis (Periodic Auto-Revert):**
   - Fungsi sinkronisasi periodik Google Spreadsheet (GViz) menimpa `state.activeConfig.PHOTOBOOTH_URL` setiap 20 detik tanpa proteksi `isEditingLocally` / `isModalOpen`, sehingga input yang baru diketik pengguna langsung dikembalikan ke tautan lama.
   - **Solusi:** Menempatkan pembaruan `PHOTOBOOTH_URL` dan `CUSTOM_CATEGORIES` di dalam proteksi ketat `if (!isEditingLocally && !isModalOpen)`.
2. **Cache Foto Tidak Terinvalidasi (Stale Cache Loop):**
   - `state.categoryPhotosUrlMap` tidak pernah diperbarui oleh pemanggilan Fotoshare, Kingphotobooth, atau Drive, sehingga sistem mengira tautan tidak berubah dan terus menyajikan 637 foto cache lama.
   - **Solusi:** Menerapkan invalidasi cache ketat: setiap perubahan `targetUrl` otomatis menghapus cache foto lama (`categoryPhotosMap`), memicu pemuatan ulang, dan menyimpan URL aktif di `categoryPhotosUrlMap`.
3. **Kerapuhan Deteksi Kategori Saat Di-rename:**
   - Kategori Photobooth sebelumnya hanya dideteksi via `name.includes("photobooth")`. Jika pengguna mengubah nama tab menjadi "Foto Booth", "Dokumentasi", dll., sistem mengira kategori Photobooth hilang, membuat baris duplikat di kategori momen, dan mengunci input.
   - **Solusi:** Memberikan penanda identitas permanen `id: "special_photobooth"` dan `isPhotobooth: true`. Nama tab bebas diubah tanpa menghilangkan fungsi spesialnya.
4. **Ketiadaan Handler Backend Google Apps Script:**
   - Lingkungan GAS (`google.script.run`) sebelumnya belum memetakan aksi `getCategoryPhotos` dan `getFolderPhotos`, sehingga jika link diubah ke album Google Photos atau Drive, panggilan gagal secara diam-diam.
   - **Solusi:** Menambahkan fungsi `getCategoryPhotos`, `getFolderPhotos`, dan `scanFotoshareAlbum` di `code.gs` serta memetakan `action === "getCategoryPhotos"` di `callBackend`.
5. **CORS & Endpoint Redundansi:**
   - Direct fetch Fotoshare dari browser rentan terhambat CORS.
   - **Solusi:** Dibuat rute serverless `api/fotoshare.js` dan fallback otomatis ke `code.gs` `scanFotoshareAlbum` via `UrlFetchApp.fetch`.

### Hasil Verifikasi:
- Input link & nama tab Photobooth di admin dapat diedit bebas tanpa ter-reset.
- Mendukung Google Photos (`photos.google.com`, `photos.app.goo.gl`), Google Drive folder, Fotoshare (`fotoshare.co`), dan Kingphotobooth.
- Galeri langsung memperbarui foto seketika saat disimpan atau disinkronkan.
- Syntax `code.gs` dan `js/app.js` 100% valid dan lolos uji integrasi.

---

# RENCANA REVISI & CATATAN RILIS SISTEM: v3.8.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: IMPLEMENTASI & VERIFIKASI (v3.8.0) - 100% SUKSES
TANGGAL: 18 November 2026

### 5 Poin Masalah yang Diperbaiki:
1. **Kategori Galeri Utama: Semua Foto Tidak Bisa Ganti Link & Nama Tab:**
   - **Akar Masalah:** Sinkronisasi background GViz menimpa nilai `DRIVE_FOLDER_ID` dan `ALL_PHOTOS_LABEL` setiap 20 detik saat admin sedang mengedit.
   - **Solusi:** Proteksi ketat `if (!isModalActive && !isEditingLocally)` pada `populateConfigToUI` dan `syncFromSpreadsheetGViz`. Input folder dan nama tab kini otomatis mengunci status editing lokal (`state.lastLocalCategoryEditTime`) sehingga tidak tertimpa.

2. **Error "Akses Ditolak. PIN Salah atau Sesi Kedaluwarsa" Saat Sinkron Google Drive:**
   - **Akar Masalah:** Fungsi periodic GViz sync menimpa variabel `state.adminPin` dengan PIN bawaan spreadsheet (`123456`), sehingga saat admin aktif (`ilham` dengan PIN `121212`) mengeklik sinkronisasi, PIN yang dikirim ke backend menjadi `123456` dan ditolak oleh Google Apps Script.
   - **Solusi:** 
     - Menghapus penimpaan `state.adminPin` di GViz jika admin sedang login atau PIN telah terisi.
     - Menyimpan PIN aktif ke `sessionStorage` dan `localStorage` (`WEDDING_ADMIN_PIN`).
     - Menyediakan helper terpusat `getEffectiveAdminPin()` yang digunakan oleh seluruh pemanggilan backend admin (`testAndSyncDriveFolder`, `saveAdminSettings`, `addAdminUser`, `deleteAdminUser`, `getAdminUsers`).

3. **Kategori Momen Lainnya = Tambah & Hapus Kategori Tidak Hilang / Kembali Normal:**
   - **Akar Masalah:** `addCategoryConfigRow` dan `removeCategoryConfigRow` tidak langsung memperbarui `state.lastLocalCategoryEditTime` saat baris ditambah/dihapus, sehingga GViz yang berjalan di latar belakang mengembalikan daftar kategori ke data lama.
   - **Solusi:** 
     - `addCategoryConfigRow` langsung memicu `onCategoryRowInput()`, mengaktifkan lock waktu edit lokal, dan memfokuskan kursor ke input baru.
     - `removeCategoryConfigRow` langsung menghapus baris, mengunci waktu edit, dan memanggil `onCategoryRowInput()`.
     - Tombol `[🔄 Sinkronkan Kategori & Tautan]` menyinkronkan seluruh kategori, folder Google Drive, label tab utama, dan URL Photobooth langsung ke Google Apps Script dan Google Spreadsheet sheet `Pengaturan`.

4. **Pencatatan Penuh ke Google Spreadsheet (`Pengaturan` & `Log_Aktivitas`):**
   - Setiap sinkronisasi folder Google Drive (`testAndSyncDriveFolder`) dan simpan pengaturan (`saveAdminSettings`) mencatat pembaruan ke sheet `Pengaturan` serta merekam riwayat aksi secara real-time ke sheet `Log_Aktivitas` lengkap dengan nama admin yang bertugas.

5. **Header Menu Admin Pengaturan Naik-Turun (Konsistensi Posisi Modal):**
   - **Akar Masalah:** `.admin-modal-overlay` menggunakan `align-items: center` dengan tinggi modal dinamis (`max-height: 90vh`). Saat berpindah dari tab pendek (seperti tab Keamanan) ke tab panjang (seperti tab Foto & Kategori), tinggi kartu berubah drastis dan posisi tengah menyebabkan header bergerak naik-turun.
   - **Solusi:** Modal `#adminSettingsModal` diposisikan fixed di atas dengan `align-items: flex-start`, padding atas `clamp(16px, 3.5vh, 36px)`, dan tinggi kartu tetap `height: min(88vh, 800px);` dengan area scroll internal di `.admin-card-body`. Header modal terkunci kokoh dan tidak bergerak sama sekali saat berpindah tab.

### Hasil Uji Otomatis & Verifikasi (scratch/test_v380.js):
- `js/app.js` syntax check: 100% VALID.
- `code.gs` syntax check: 100% VALID.
- CSS Modal Header lock test: PASS.
- `getEffectiveAdminPin` fallback test: PASS.
- Live GAS `testAndSyncDriveFolder` (PIN 121212): SUKSES (membaca 60 foto langsung dari Google Drive).
- Live GAS `saveAdminSettings` (PIN 121212): SUKSES (tersimpan ke Google Spreadsheet sheet `Pengaturan` & `Log_Aktivitas`).
