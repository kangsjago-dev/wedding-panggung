# RENCANA REVISI & CATATAN RILIS SISTEM: v3.3.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.3.0)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL (Modularisasi Berkas CSS & JS, Kustomisasi Bebas Nama Kategori Galeri Utama, Proteksi Kategori Khusus Photobooth, Lightbox & Unduh Langsung Kualitas Asli Tanpa Bingkai Khusus Photobooth, Tampilan Native Photo Cards untuk Kategori Lainnya Tanpa Iframe, Tautan & Tombol Sinkronisasi Tiap Kategori, Sinkronisasi Multi-Device 100%)

### Rangkuman 8 Pembaruan Utama v3.3.0:
1. **Modularisasi Berkas Aplikasi (Penyelesaian Berkas Berat / Terlalu Besar):**
   - **Tindakan:** Berkas raksasa `index.html` (yang sebelumnya berukuran 209 KB dan berisi lebih dari 5.100 baris) dipecah secara rapi dan profesional menjadi berkas-berkas modular:
     - [css/style.css](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/css/style.css) (~31 KB): Seluruh aturan gaya, palet warna, tipografi, dan media query responsif.
     - [js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js) (~146 KB): Seluruh mesin galeri, Lightbox, antrean unduh di latar belakang, komposit bingkai, manajemen admin, dan utilitas sinkronisasi.
     - [index.html](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/index.html) (turun drastis menjadi ~43 KB / 730 baris): Struktur HTML yang bersih, ringan, dan cepat dimuat.
   - **Manfaat:** Peramban di smartphone maupun PC dapat melakukan *browser caching* mandiri pada berkas CSS dan JS, menghasilkan waktu muat (*page load*) yang sangat ringan dan responsif.
2. **Kustomisasi Bebas Nama Kategori Galeri Utama ("Semua Foto"):**
   - Pada panel Admin tab *🖼️ Foto & Kategori*, kini tersedia kolom khusus:
     `🏷️ Nama Kategori Galeri Utama: [Semua Foto] [Reset]`
   - Admin bebas mengganti nama galeri utama (misal: *"Semua Momen"*, *"Katalog Foto"*, *"All Photos"*). Tab pertama di galeri dan seluruh filter langsung berubah seketika secara real-time.
3. **Khusus Kategori Photobooth (Proteksi Nama, Tampilkan/Sembunyikan & Anti-Hapus):**
   - Kategori **Photobooth** kini memiliki kartu pengelolaan khusus (*Dedicated Vendor Card*):
     - **Nama Kategori Bebas Diubah:** Admin dapat mengganti nama tampilan tab (misal: *"Photobooth"*, *"Photo Booth VIP"*, dll.).
     - **Tampilkan / Sembunyikan:** Dilengkapi sakelar/checkbox `[✓] Tampilkan di Galeri`. Jika dicentang, tab muncul di website; jika dimatikan, tab tersembunyi tanpa menghapus konfigurasinya.
     - **Tautan Sistem Terkunci:** Tautan resmi `https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs` dilindungi (`read-only`), dan tombol hapus dihilangkan agar vendor photobooth tidak terhapus secara tidak sengaja.
4. **Khusus Kategori Photobooth (Lightbox Langsung & Unduh Kualitas Asli Tanpa Bingkai):**
   - Saat kartu foto Photobooth diklik di galeri: **langsung terbuka di Lightbox layar penuh seperti biasa** (tidak diarahkan keluar atau membuka tab website fotoshare.co).
   - Di dalam Lightbox, tombol unduh berubah menjadi:
     `[⬇️ Unduh Foto Asli Photobooth]`
   - Mengklik tombol unduh langsung mengunduh berkas foto asli berkualitas penuh dari CDN fotoshare **tanpa kompresi dan tanpa bingkai foto panggung**.
5. **Tampilan Galeri Native Kartu Foto untuk Kategori Lainnya (Eliminasi Iframe):**
   - Seluruh kategori (seperti *Event Test*, *eded*, atau subfolder Google Drive) kini disajikan menggunakan **kartu foto native (`.photo-card`)** yang sama persis dengan galeri utama:
     - Thumbnail foto, nama foto, dan lencana kategori.
     - Klik membuka Lightbox layar penuh dengan opsi unduh kualitas asli.
     - Jika kategori masih kosong, sistem menyajikan kartu kosong berkelas disertai tombol cepat `[🔄 Sinkronkan Kategori Ini]` dan `[Buka Tautan Sumber ↗]`.
     - Tidak ada lagi iframe yang kaku atau membingungkan.
6. **Tombol & Tautan Sinkronisasi untuk Setiap Kategori:**
   - Pada panel Admin, setiap baris kategori (termasuk Photobooth dan kategori kustom) dilengkapi tombol `[🔄]` untuk memicu pembaruan dan sinkronisasi instan khusus untuk kategori tersebut.
   - Di bilah navigasi filter galeri utama, tersedia tombol `[🔄 Sinkron]` agar pengunjung maupun admin dapat menyegarkan foto kategori aktif kapan saja.
7. **Sinkronisasi Lintas-Perangkat (PC & Smartphone Konsisten 100%):**
   - Menyelaraskan [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json) untuk menyertakan seluruh kategori aktif (`Photobooth`, `Event Test`, `eded`).
   - Menyediakan fitur satu klik: `[📋 Salin Tautan Sinkron Semua Device]`, yang menghasilkan tautan sinkronisasi otomatis dengan parameter `?sync_cats=...`. Saat dibuka di smartphone atau browser lain, seluruh kategori langsung tersinkronisasi 100%.
8. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Fitur unduh berbingkai untuk kategori "Semua Foto", background download queue, multi-event switcher, dan login admin username & password (`admin` / `123`) tetap 100% aktif dan berjalan optimal.
