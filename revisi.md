# RENCANA REVISI & CATATAN RILIS SISTEM: v3.4.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.4.0)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL 100% (Kustomisasi Tautan Vendor Photobooth, Penempatan Tautan Galeri Utama Berdampingan, Lightbox Bright Mode Terang Estetik, Redesain Modal Share Logo-Only Tanpa WhatsApp/Bagikan, View Display & Unduh Berbingkai Kategori Momen Lainnya Identik Kategori Utama)

### Rangkuman 5 Pembaruan Utama v3.4.0:
1. **Khusus Kategori Photobooth (Tautan Vendor Dapat Dicustom, Proteksi Lainnya Terkunci):**
   - **Tindakan:** Mengubah field input tautan pada kartu *📸 Kategori Spesial: Photobooth* menjadi dapat diedit secara bebas (`oninput="onCategoryRowInput()"`).
   - **Proteksi Terkunci:** Proteksi lainnya tetap terkunci rapi: tidak ada tombol hapus (anti-terhapus sembarangan), dilengkapi toggle tampilkan/sembunyikan di galeri (`#pbVisibilityCheck`), dan tombol sinkron instan.
   - **Manfaat:** Admin dapat mengganti tautan photobooth vendor (misal URL acara lain) kapan saja tanpa risiko merusak kartu vendor.
2. **Penempatan Input Tautan Galeri Utama Berdampingan dengan Fungsinya:**
   - **Tindakan:** Memindahkan field input tautan folder Google Drive galeri utama (`#cfgDriveFolderId`) dan tombol `[🔄 Sinkron Google Drive]` masuk tepat ke dalam kotak *🏷️ Kategori Galeri Utama*.
   - **Manfaat:** Input nama kategori ("Semua Foto") dan input tautan folder Google Drive kini berdampingan langsung dalam satu kesatuan menu. Menghilangkan kebingungan admin akibat input tautan yang sebelumnya terpisah jauh di atas.
3. **Penyempurnaan Lightbox Bright Mode ("Jangan Dikasih Gelap, Terangkan"):**
   - **Tindakan:** Mengubah latar belakang modal Lightbox (`.lightbox-modal`) dari gelap pekat (`rgba(15, 23, 42, 0.96)`) menjadi cerah, hangat, dan mewah dengan palet *Romantic Ivory Backdrop* (`rgba(253, 251, 247, 0.97)`) serta blur elegan `backdrop-filter: blur(14px)`.
   - **Tipografi & Kontrol:** Judul foto, counter, tombol navigasi panah kiri/kanan, tombol tutup (✕), dan bilah bawah diselaraskan dengan warna kontras tajam (deep slate `#0F172A`, gold `#9E7D47`, dan button background `#FFFFFF`). Foto terlihat sangat hidup, terang, dan tidak suram.
4. **Penyederhanaan Modal Bagikan (Logo-Only, Eliminasi WhatsApp & Bagikan):**
   - **Tindakan:** 
     - Menghapus tombol `[💬 WhatsApp]` dan tombol `[📤 Bagikan]`.
     - Tombol salin tautan dan unduh gambar QR Code diubah menjadi tombol **LOGO/ICON eksklusif** tepat di samping kolom tautan URL.
   - **Manfaat:** Antarmuka modal bagikan menjadi sangat ringkas, rapi, modern, dan estetik.
5. **View Display & Unduh Berbingkai Kategori Momen Lainnya Identik Kategori Utama:**
   - **Tindakan:** Menyelaraskan seluruh kategori momen lainnya (seperti *Event Test1*, *eded1*, dsb.) agar view display (kartu foto galeri native, thumbnail, badge counter, lightbox terang) dan fitur unduh berbingkai (`downloadCurrentPhotoWithFrame()`) otomatis diterapkan 100% sama seperti Kategori Utama ("Semua Foto").
   - **Manfaat:** Tamu yang menjelajahi kategori apa pun dapat menikmati pengalaman melihat foto native dan mengunduh foto berbingkai panggung resolusi tinggi.
6. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Seluruh fungsionalitas inti: unduh tanpa kompresi dan tanpa bingkai khusus photobooth, multi-event switcher, background queue non-blocking, serta otentikasi username & password admin (`admin` / `123`) 100% dipertahankan dan berjalan prima.
