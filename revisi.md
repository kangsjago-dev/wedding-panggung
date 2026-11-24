# REVISI SISTEM (revisi.md) - v4.50.0
================================================================================
STATUS: PERENCANAAN SELESAI - MENUNGGU PERSETUJUAN PENGGUNA
TANGGAL: 25 November 2026
VERSI TARGET: v4.50.0-MULTI-LINK-PHOTOBOOTH-AND-EVENT-TOGGLE
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

> [!IMPORTANT]
> **PROTOKOL ZETTBOT DIJALANKAN SECARA KETAT & TUNTAS:**
> Sesuai instruksi mutlak pengguna:
> 1. *"tampilkan galeri on/off dapat di custom pada setiap event"*
> 2. *"link khusus photo booth bisa beberapa link (https://photos.app.goo.gl/ / https://fotoshare.co/ / https://drive.google.com/ / https://x1.kingphotobooth.co/)"*
> 3. *"ngerti ga maksud gw jgn ubah apapun dulu, update revisi.md"*
> 4. *"setelah itu baru 'OKE TERAPKAN'"*
> 
> **TIDAK ADA SATUPUN BERKAS KODE YANG DIUBAH PADA TAHAP INI.** Dokumen ini merinci rancangan teknis dan rencana implementasi yang presisi sesuai 2 instruksi di atas.

---

## 1. Analisis Kebutuhan & Permintaan Pengguna

Berdasarkan instruksi dan tangkapan layar Admin Panel (`media_1795555682529_e14ad073.png`):
1. **Galeri On/Off Dapat Dicustom Pada Setiap Event:**
   - Toggle checkbox "☑ Tampilkan di Galeri" untuk Photobooth / Kategori tidak boleh bersifat global yang menimpa semua event, melainkan **tersimpan dan berlaku unik per-event** (`matchedEv.customCategories` atau `matchedEv.photoboothEnabled`).
   - Jika suatu event mematikan galeri Photobooth (`enabled: false`), maka hanya event tersebut yang menyembunyikan tab Photobooth. Event lain tetap aktif sesuai pengaturannya masing-masing.
2. **Link Khusus Photobooth Dapat Menampung Beberapa Link Sekaligus:**
   - Input tautan Photobooth dapat diisi beberapa link sekaligus (dipisahkan spasi, koma, baris baru, atau diawali teks label seperti yang terlihat pada gambar: `pohotbooth https://photos.app.goo.gl/... https://x1.kingphotobooth.co/...`).
   - Format link yang didukung secara simultan:
     - `https://photos.app.goo.gl/...` (Google Photos Album)
     - `https://fotoshare.co/...` (Fotoshare / DSLRBooth)
     - `https://drive.google.com/...` (Google Drive Folder)
     - `https://x1.kingphotobooth.co/...` (Kingphotobooth Web Galeri)
   - Sistem wajib mengekstrak **seluruh link** yang valid, mengambil foto dari masing-masing penyedia secara paralel/gabungan, menggabungkan seluruh foto ke dalam 1 tab Photobooth, dan menghapus duplikasi.

---

## 2. Rencana Solusi Teknis & Arsitektur (v4.50.0)

### Modul A: Multi-Link Aggregator Khusus Photobooth (`js/categories.js`)
1. **Ekstraksi Multi-URL Otomatis:**
   - Membuat fungsi helper `extractAllUrls(rawText)` yang menggunakan regex toleran:
     ```javascript
     const urlRegex = /(https?:\/\/[^\s"',]+)/gi;
     ```
     Dengan regex ini, teks seperti `pohotbooth https://photos.app.goo.gl/xyz https://fotoshare.co/abc` akan otomatis diurai menjadi array 2 link bersih tanpa terganggu oleh kata label/typo di depannya.
2. **Penyedia Layanan (Vendor Dispatcher) Gabungan:**
   - Jika input Photobooth berisi lebih dari satu URL:
     - Jalankan fetcher masing-masing vendor secara paralel via `Promise.allSettled()`:
       - URL Google Photos -> `fetchGooglePhotos(url)`
       - URL Fotoshare -> `fetchFotosharePhotos(url)`
       - URL Google Drive -> `fetchDriveCategoryPhotos(folderId)`
       - URL Kingphotobooth -> `fetchKingPhotoboothPhotos(url)`
     - Gabungkan (*concat*) seluruh hasil foto ke dalam satu array `mergedPhotos`.
     - Simpan ke `state.categoryPhotosMap[cat]` dan render ke galeri.
   - Menyediakan tampilan foto gabungan dari semua link yang dimasukkan secara mulus.

### Modul B: Custom Galeri On/Off Tersimpan Per Event (`js/admin.js` & `js/app.js`)
1. **Isolasi Penyimpanan State Per Event:**
   - Pada `js/admin.js`, saat menyimpan pengaturan kategori (`saveCategoriesToGoogleSheets` atau event update):
     - Checkbox `#pbVisibilityCheck` ("Tampilkan di Galeri") dibaca dan disimpan ke objek event yang sedang aktif (`currentEvent.customCategories` dengan id `special_photobooth`, `enabled: pbVisCheck.checked`).
     - Pastikan saat memilih/berpindah event di dropdown admin, checkbox `#pbVisibilityCheck` otomatis membaca status `enabled` dari event yang dipilih, bukan mempertahankan status event sebelumnya.
2. **Penerapan di Frontend Galeri (`js/categories.js` & `js/app.js`):**
   - Saat galeri dibuka untuk event tertentu (misal via URL `?event=slug` atau event terpilih):
     - Baca konfigurasi kategori milik event tersebut.
     - Jika `photobooth.enabled === false`, tab "Photobooth" tidak dirender di deretan tab kategori, dan foto photobooth tidak ditampilkan.
     - Jika `photobooth.enabled !== false`, tab "Photobooth" dirender normal beserta foto-foto dari tautan yang telah diisi.

### Modul C: Pembersihan Header WAF Kingphotobooth (`api/kingphotobooth.js`)
- Bersihkan header `Sec-Fetch-*` pada backend proxy yang memicu deteksi WAF Cloudflare (`x-kingpb-blocked: 1`) sehingga thumbnail dan unduhan HD Kingphotobooth tidak lagi menampilkan banner placeholder krem.

---

## 3. Rencana Eksekusi Berkas (Setelah Pengguna Menyetujui "OKE TERAPKAN")

| Berkas | Rencana Perubahan |
|---|---|
| [js/categories.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/categories.js) | Tambahkan parser regex multi-link pada Photobooth handler, fetch paralel multi-vendor, dan gabungkan foto ke satu tab. |
| [js/admin.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/admin.js) | Pastikan checkbox on/off terikat spesifik ke ID event aktif, dan input vendor URL menerima multi-link tanpa validasi pemblokir. |
| [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) | Pastikan tab photobooth difilter berdasarkan status `enabled` event terpilih saat ini. |
| [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) | Bersihkan header `Sec-Fetch-*` agar request gambar lolos dari firewall vendor tanpa banner hotlink. |

================================================================================
KODE BELUM DIUBAH SAMA SEKALI. MENUNGGU INSTRUKSI: "OKE TERAPKAN".
================================================================================
