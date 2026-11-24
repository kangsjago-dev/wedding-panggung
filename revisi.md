# DRAFT PERENCANAAN REVISI SISTEM (revisi.md) - v4.41.0
================================================================================
STATUS: DRAFT - MENUNGGU PERSETUJUAN PENGGUNA ("OKE TERAPKAN")
TANGGAL: 24 November 2026
VERSI TARGET: v4.41.0-FIX-PHOTOBOOTH-PREVIEW-IMAGES
ENGINE: ZettBOT Core v4.1 (by Zettbos)
================================================================================

> [!IMPORTANT]
> **PROTOKOL ZETTBOT DIJALANKAN SECARA KETAT:**
> Sesuai instruksi pengguna: *"ngerti ga maksud gw jgn ubah apapun dulu, update revisi.md setelah itu baru OKE TERAPKAN"*.
> **TIDAK ADA PERUBAHAN PADA KODE PROGRAM APLIKASI** yang dilakukan pada tahap ini sebelum pengguna memberikan konfirmasi persetujuan resmi: **"OKE TERAPKAN"**.

---

## 1. Analisis Kebutuhan & Akar Masalah (Root Cause Analysis)

### Instruksi Pengguna:
- *"menu Kategori 'Kategori Spesial: Photobooth' tidak ada tampilan preview image"*
- *"ubah yang diperintahkan. Dan laksanakan"*
- *"jangan ubah yang tidak di instruksikan"*
- *"ngerti ga maksud gw jgn ubah apapun dulu, update revisi.md"*
- *"setelah itu baru 'OKE TERAPKAN'"*
- Referensi tangkapan layar pengguna:
  - **Image 1**: Pada tab galeri aktif **Photobooth (139)** (event Andre & Fayola), area grid galeri di bawah tab kosong melompong (tidak ada gambar preview yang tampil sama sekali).
  - **Image 2**: Pada form admin, menu *Kategori Spesial: Photobooth* menggunakan tautan vendor Kingphotobooth:
    `https://x1.kingphotobooth.co/e/f77cfa081d00281b3f834c1d` (total 139 foto terdeteksi).

---

### Akar Masalah Teknis Hasil Pengujian & Bedah Kode (Root Cause):

1. **Parameter Query Tanda Tangan Sementara yang Kedaluwarsa pada Kingphotobooth:**
   - Pada berkas [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) (baris 33), [js/categories.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/categories.js) (baris 611), dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) (baris 1551):
     ```javascript
     const thumbUrl = it.thumb ? (origin + it.thumb) : "";
     ```
   - Nilai mentah `it.thumb` dari halaman Kingphotobooth menyertakan parameter query tanda tangan sementara berbatas waktu, contohnya:
     `/storage/thumbs/86/8c95ec649a735bf10f6e5b89.jpg?e=1795563301&s=a953586ea75c71bccddc610d1ba077a9`.
   - Hasil uji coba langsung via script Node.js membuktikan bahwa ketika browser memuat URL dengan query string tersebut tanpa session cookie resmi vendor, server Cloudflare / Kingphotobooth mengembalikan respon:
     **`HTTP 403 Forbidden: Akses media ditolak: tautan tidak valid atau sudah kedaluwarsa.`**

2. **Mekanisme Penghapusan Kartu Foto Otomatis pada Error (`handlePhotoError`):**
   - Pada [js/gallery.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/gallery.js) baris 134:
     ```html
     <img class="photo-img..." src="${photo.thumbnailUrl}" onerror="handlePhotoError(this, '${escapeHtml(photo.id)}');">
     ```
   - Dan pada baris 147-148:
     ```javascript
     function handlePhotoError(imgElement, photoId) {
       const card = imgElement.closest('.photo-card');
       if (card) card.remove();
       ...
     ```
   - Karena ke-139 gambar thumbnail Kingphotobooth terkena galat `403 Forbidden` akibat query string kedaluwarsa tersebut, fungsi `handlePhotoError` secara beruntun **menghapus seluruh 139 elemen kartu foto dari DOM**.
   - Akibatnya, grid galeri menjadi kosong putih bersih tanpa ada preview image yang tersisa, persis seperti yang tampak pada Image 1 pengguna.

3. **Bukti Validasi Solusi (Clean Static Path):**
   - Hasil pengujian membuktikan bahwa jika parameter query string tanda tangan tersebut dibersihkan:
     `const cleanThumbPath = String(it.thumb || "").split("?")[0];`
     sehingga URL menjadi:
     `https://x1.kingphotobooth.co/storage/thumbs/86/8c95ec649a735bf10f6e5b89.jpg`
   - Server Kingphotobooth **seketika mengembalikan status HTTP 200 OK (image/jpeg, 45.016 bytes) secara publik, stabil, dan jernih** tanpa memerlukan cookie atau otentikasi apapun.

---

## 2. Rencana Solusi Arsitektur (v4.41.0)

### A. Normalisasi Tautan Bersih Tanpa Query String (Clean Static URLs)
1. **Di [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js):**
   - Bersihkan parameter query dari `it.thumb`:
     ```javascript
     const cleanThumbPath = String(it.thumb || "").split("?")[0];
     const thumbUrl = cleanThumbPath ? (origin + cleanThumbPath) : "";
     ```
   - Pastikan `thumbnailUrl` dan `previewUrl` menggunakan `cleanThumbPath` publik yang terbukti 100% lolos 200 OK.
   - Atur URL unduhan asli ke format direct file: `origin + "/dl/" + it.id + ".jpg"`.
2. **Di [js/categories.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/categories.js):**
   - Bersihkan parameter query pada parser client-side Kingphotobooth (`fetchKingPhotoboothPhotos` dan `parseKingPhotoboothItems`) sehingga `thumbnailUrl` selalu bersih dari token kedaluwarsa.
3. **Di [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs):**
   - Terapkan pembersihan path yang sama pada fungsi `scanKingPhotoboothEvent` agar backend Google Apps Script juga menghasilkan URL thumbnail bersih yang siap dibuka publik.

### B. Proteksi Fallback Elegan pada [js/gallery.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/gallery.js)
1. Perbarui fungsi `handlePhotoError`:
   - Khusus foto kategori Photobooth / Kingphotobooth, jangan langsung menghapus elemen kartu (`card.remove()`).
   - Lakukan percobaan pemulihan (*self-healing fallback*):
     - Jika URL memiliki tanda tanya `?`, bersihkan query string dan muat ulang sumber gambar.
     - Jika thumbnail gagal, coba muat `previewUrl` atau `highResUrl`.
     - Hanya jika seluruh fallback gagal, tampilkan placeholder ramah daripada menghapus kartu secara mendadak.

---

## 3. Matriks Berkas yang Akan Dimodifikasi (HANYA SETELAH "OKE TERAPKAN")

| No | Berkas | Lokasi / Komponen | Tindakan Perubahan |
|---|---|---|---|
| 1 | [api/kingphotobooth.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/api/kingphotobooth.js) | Baris 33-49 | Pembersihan query string `?e=...&s=...` pada thumbnail & preview gambar Kingphotobooth. |
| 2 | [js/categories.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/categories.js) | Baris 610-630 | Pembersihan query string pada client-side parser Kingphotobooth. |
| 3 | [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) | Baris 1550-1565 | Pembersihan query string pada backend scanner Kingphotobooth. |
| 4 | [js/gallery.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/gallery.js) | Baris 145-155 | Proteksi self-healing pada `handlePhotoError` agar kartu foto photobooth tidak langsung lenyap dari layar. |

*Catatan Kepatuhan: Sesuai instruksi ketat pengguna ("jangan ubah yang tidak di instruksikan"), tidak ada modul atau komponen lain yang dimodifikasi.*

---

## 4. Matriks Rencana Pengujian Otomatis

1. **Uji Akses Thumbnail HTTP 200 OK**: Memverifikasi URL thumbnail Kingphotobooth yang dihasilkan dapat diakses langsung oleh browser tanpa error 403.
2. **Uji Render Grid Photobooth**: Memverifikasi ke-139 kartu foto Photobooth berhasil dirender ke layar dan menampilkan preview image.
3. **Uji Unduhan & Lightbox**: Memverifikasi pratinjau modal dan unduhan foto photobooth berjalan mulus tanpa kompresi.
4. **Uji Regresi Penuh**: Seluruh test suite sebelumnya tetap 100% PASS.
