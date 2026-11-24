# DRAFT PERENCANAAN REVISI SISTEM (revisi.md) - v4.37.0
================================================================================
STATUS: DRAFT - MENUNGGU PERSETUJUAN PENGGUNA ("OKE TERAPKAN")
TANGGAL: 22 November 2026
VERSI TARGET: v4.37.0-REALTIME-CATEGORY-REFRESH
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

> [!IMPORTANT]
> **PROTOKOL ZETTBOT DIJALANKAN:**
> Sesuai instruksi pengguna: *"ngerti ga maksud gw jgn ubah apapun dulu, update revisi.md setelah itu baru OKE TERAPKAN"*.
> Tidak ada perubahan pada kode aplikasi yang dilakukan sebelum pengguna memberikan konfirmasi persetujuan resmi: **"OKE TERAPKAN"**.

---

## 1. Analisis Kebutuhan & Akar Masalah (Root Cause Analysis)

Berdasarkan instruksi pengguna serta 4 tangkapan layar (screenshot) yang dilampirkan:

### Poin 1: Eliminasi Fallback Hardcode agar Data Realtime dari Database
- **Akar Masalah:**
  - Pada beberapa fungsi sinkronisasi, ketika kategori atau label kustom diperbarui (misalnya tab "Semua Foto" diganti namanya menjadi "Photostage"), sistem masih memiliki ketergantungan pada nilai string bawaan `"Semua Foto"` sebagai fallback prioritas atau penimpa data saat parsing database GViz.
  - Terdapat potensi fallback foto dummy/demo lama yang masih aktif jika fetch eksternal terhambat.
- **Rencana Solusi:**
  - Memastikan seluruh konfigurasi tab dan tautan dibaca murni 100% secara realtime dari database Google Spreadsheet (`Daftar_Acara` & `Pengaturan`) dan GAS Script Properties.
  - Jika nama kategori diubah di admin (misal "Photostage"), maka tab galeri, header, dan filter wajib merefleksikan nilai tersebut dari database tanpa pernah kembali ke hardcode `"Semua Foto"`.
  - Jika link kosong atau belum ada foto, tampilkan *Empty State* elegan murni ("Momen Kenangan Segera Hadir") tanpa pernah menyuntikkan foto dummy/sample/fallback.

---

### Poin 2: Refresh Kategori Photobooth di Latar Belakang (Silent Auto-Refresh)
- **Akar Masalah:**
  - Saat ini, siklus auto-refresh 20 detik di `startLiveAutoRefresh()` memicu `applyCategoryFilter()` atau `syncSingleCategory()`. Jika fungsi tersebut dipanggil, ia mengosongkan grid (`state.filteredPhotos = []`) dan menampilkan `skeleton-card` berkedip (flicker) yang mengganggu pengalaman pengguna saat sedang melihat foto.
- **Rencana Solusi:**
  - Tambahkan mode `isSilent = true` pada alur pengambilan foto kategori (`fetchGooglePhotos`, `fetchKingPhotoboothPhotos`, `fetchFotosharePhotos`, dan `applyCategoryFilter`).
  - Dalam mode *silent*, sistem mengambil data terbaru di balik layar tanpa mengosongkan grid dan tanpa memunculkan skeleton.
  - Data foto dan lencana jumlah foto (`pill-count`) diperbarui secara mulus (smooth update) hanya jika ada pembaruan nyata dari vendor photobooth.

---

### Poin 3: Notifikasi / Icon 'BARU' Hanya untuk Foto yang Benar-Benar Baru Bertambah
- **Akar Masalah:**
  - Pada tangkapan layar kedua, terlihat 130 foto Photobooth semuanya berpotensi memunculkan lencana hijau `BARU` (atau lencana muncul di semua foto) karena endpoint Photobooth memberikan timestamp dinamis `Date.now() - idx * 1000` yang semuanya berada di bawah ambang batas `newBadgeDurationMs` (10 menit).
- **Rencana Solusi (Delta Detection Mechanism):**
  - Implementasikan mekanisme pelacakan ID foto yang telah diketahui (`KNOWN_PHOTO_IDS`) per event dan per kategori di `localStorage`:
    `SEEN_PHOTOBOOTH_IDS_<eventId>`
  - **Kunjungan Pertama (Baseline):** Saat pertama kali membuka Photobooth, seluruh ID foto yang sudah ada disimpan sebagai baseline (sehingga tidak ada foto lama yang dilabeli `BARU` secara keliru).
  - **Deteksi Pertambahan (Delta):** Saat auto-refresh latar belakang atau manual refresh berjalan, sistem mencocokkan ID foto yang didapat:
    * Foto dengan ID yang **BELUM PERNAH ADA** di baseline akan ditandai `isNewlyAdded: true`.
    * Hanya foto-foto baru ini yang memunculkan icon/lencana `BARU` dengan animasi dot-pulse (`photo-badge-new`).
    * Foto lama (130 foto awal) tetap tampil bersih tanpa label `BARU`.
    * ID baru kemudian dicatat ke daftar yang telah dilihat sehingga tidak terus-menerus dianggap baru di sesi berikutnya.

---

### Poin 4: Refresh Halaman Menjaga Tab Aktif (Tidak Pindah ke Halaman Utama)
- **Akar Masalah:**
  - Saat `fetchGalleryData(true)` atau background auto-refresh selesai diproses, fungsi `handleGalleryResponse()` mengecek:
    ```javascript
    if (!state.activeCategory || state.activeCategory === "Semua Foto" || state.activeCategory === mainLabel)
    ```
    Dan di beberapa titik navigasi, status tab aktif pengguna tidak dipertahankan sehingga pengguna terpental kembali ke tab "Semua Foto" saat data diperbarui.
- **Rencana Solusi:**
  - Simpan dan pertahankan state `state.activeCategory` secara persisten selama sesi berlangsung.
  - Saat proses sinkronisasi / auto-refresh selesai, sistem **TIDAK BOLEH** mengubah tab aktif. Jika pengguna sedang membuka "Photobooth" atau kategori kustom lainnya, tampilan tetap berada di kategori tersebut dan langsung memperbarui fotonya.

---

### Poin 5: Tombol Refresh di Samping Share Berlaku untuk Semua Kategori
- **Akar Masalah:**
  - Tombol refresh di samping tombol share pada file `index.html` (baris 231) saat ini memanggil:
    `onclick="fetchGalleryData(true)"`
    Fungsi ini secara keras hanya menyegarkan folder Google Drive kategori utama ("Semua Foto").
- **Rencana Solusi:**
  - Buat fungsi cerdas `triggerActiveCategoryRefresh(forceRefresh)`:
    * Memutar ikon putar `#refreshIconSvg` saat proses refresh dimulai.
    * Memeriksa kategori yang sedang dibuka pengguna (`state.activeCategory`):
      - Jika di tab utama ("Semua Foto" / "Photostage"): panggil `fetchGalleryData(forceRefresh, false)`.
      - Jika di tab "Photobooth" atau tab kategori lainnya: panggil `syncSingleCategory(state.activeCategory, false)` untuk menyegarkan tautan vendor/kategori aktif saat itu juga.
    * Menghentikan animasi ikon putar dan menampilkan konfirmasi toast setelah selesai.
  - Perbarui tombol di `index.html` untuk memanggil `triggerActiveCategoryRefresh(true)`.

---

## 2. Rincian Berkas yang Akan Dimodifikasi (Setelah "OKE TERAPKAN")

| No | File | Komponen yang Dimodifikasi |
|---|---|---|
| 1 | [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) | Ubah `onclick` tombol `#refreshBtn` dari `fetchGalleryData(true)` menjadi `triggerActiveCategoryRefresh(true)` |
| 2 | [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) | Definisikan `triggerActiveCategoryRefresh()`, pertahankan `state.activeCategory` saat refresh, dan sesuaikan `startLiveAutoRefresh()` agar silent |
| 3 | [js/categories.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/categories.js) | Tambahkan mode `isSilent` pada `syncSingleCategory`, integrasikan delta detection `KNOWN_PHOTO_IDS` untuk badge `BARU` Photobooth, dan hilangkan sisa fallback hardcode |
| 4 | [js/gallery.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/gallery.js) | Pastikan lencana `BARU` hanya dirender jika `photo.isNewlyAdded === true` (atau delta baru), bukan ke seluruh foto |

---

## 3. Matriks Pengujian Otomatis yang Akan Dijalankan
1. **Tes Realtime Category Label & No Fallback**: Memverifikasi label tab utama (misal "Photostage") tersinkron dari database tanpa kembali ke "Semua Foto".
2. **Tes Retensi Tab Aktif**: Memverifikasi saat berada di tab Photobooth / kategori custom, refresh tidak mengembalikan ke tab utama.
3. **Tes Tombol Refresh Universal**: Memverifikasi tombol refresh di samping share memanggil sinkronisasi untuk kategori aktif.
4. **Tes Silent Background Refresh**: Memverifikasi auto-refresh tidak menampilkan skeleton-card pada tab aktif.
5. **Tes Selektivitas Badge 'BARU' Photobooth**: Memverifikasi pada baseline 130 foto awal tidak diberi badge 'BARU', dan hanya penambahan foto ke-131+ yang memunculkan badge 'BARU'.
