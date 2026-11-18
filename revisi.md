# RENCANA REVISI & CATATAN RILIS SISTEM: v3.6.5
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.6.5)
TANGGAL: 18 November 2026
VERIFIKASI: BERHASIL 100% (35 PASS di test_v365.js, 23 PASS di test_v364.js, 22 PASS di test_v363.js)

### 5 Poin Pembaruan Utama v3.6.5:
1. **Desain Ulang Modal Share & QR Code pada Mode PC/Desktop Lebih Menarik & Presisi:**
   - Menyesuaikan tampilan persis seperti gambar referensi (`media_1794998715544_2ef780f7.png`):
     - Card modal terpusat (max-width ~460px) dengan sudut melengkung mewah (border-radius 20px) dan bayangan elegan.
     - Header: Ikon grid minimalis + teks "Bagikan & QR Code Galeri" + tombol bulat close (`✕`).
     - Subheader: Nama mempelai (*Wilson & Felicia*) font Playfair/Serif tebal, baris tanggal teks emas/amber terpusat (*Senin, 16 November 2026*), dan venue terpusat (*UpperHills Convention Hall, Makassar*).
     - Kotak QR Code berbingkai putih dengan lengkungan sudut rapi (radius 18px) dan border emas halus.
     - 3 Tombol Aksi Ikon terpusat berdampingan di bawah QR (Share, Salin Link, dan Unduh PNG berlatar emas). Input link teks disembunyikan.

2. **Fleksibilitas Tautan Kategori Spesial Photobooth:**
   - Menghapus pembatasan kaku pada tautan Photobooth.
   - Mendukung fleksibel seluruh domain tautan yang dimasukkan admin:
     - `https://fotoshare.co` -> diproses via engine Fotoshare.
     - `https://photos.google.com` -> diproses via engine Google Photos.
     - `https://x1.kingphotobooth.co` atau `kingphoto` -> diproses via engine Kingphotobooth (foto & video player).
     - `https://drive.google.com` -> diproses via engine Google Drive.
     - Domain lain / kustom -> diproses sesuai target tautan.

3. **Sinkronisasi Multi-Device & Pencegahan Reset Pengaturan Kategori:**
   - **Akar Masalah:** Di `code.gs`, fungsi `getGalleryData()` membaca objek event aktif di dalam `EVENTS`, yang menyimpan array `customCategories` lama. Ketika admin mengubah `CUSTOM_CATEGORIES`, data lama di dalam objek event menimpa kembali pengaturan baru setiap auto-refresh 20 detik atau saat dibuka di perangkat lain.
   - **Solusi:** Di `code.gs` (`saveAdminSettings`), lakukan sinkronisasi 2 arah antara `CUSTOM_CATEGORIES` dan `customCategories` pada objek event aktif di `EVENTS`, serta simpan ke `ScriptProperties` dan Google Sheet `Pengaturan`. Di `js/app.js` (`syncCategoriesAndDisplayLinks`), kirimkan payload `CUSTOM_CATEGORIES` beserta `EVENTS` yang telah diperbarui ke backend dan simpan ke `state.events` & `localStorage`.

4. **Fungsi Tutup Preview Foto (Backdrop Click Lightbox):**
   - Tombol close `✕` di pojok kanan atas tetap dipertahankan.
   - Menambahkan event listener pada backdrop preview `#lightboxBody` / wrapper di luar frame/gambar foto agar mengklik area luar foto otomatis menutup modal Lightbox.

5. **Ikon View / Toggle Password Admin Simpel & Profesional:**
   - Mengganti emoji / karakter lama pada tombol intip password (`#toggleAdminPassVisibility`) dengan ikon vektor inline SVG mata (eye) & mata tertutup garis miring (eye-off) yang bersih, elegan, dan profesional tanpa emoji aneh.

---
### File yang Dimodifikasi:
1. `index.html` (Markup Share QR Modal & Ikon Password SVG)
2. `css/style.css` (Styling Desktop Share QR Modal & Backdrop Lightbox)
3. `js/app.js` (Logika Fleksibilitas URL Photobooth, Backdrop Click Lightbox, Sinkronisasi Kategori 2 Arah, Ikon Password)
4. `code.gs` (Sinkronisasi CUSTOM_CATEGORIES & EVENTS di ScriptProperties & Sheet)
5. `config.json` (Sinkronisasi Konfigurasi Kategori Lokal)
6. `prd.md` (Pencatatan Master Context & Logika Sistem Terkini)
