# RENCANA REVISI LENGKAP: MULTI-EVENT ARCHITECTURE, USERNAME/PASSWORD LOGIN, CUSTOM COVER SHOWCASE & LINTAS-PERANGKAT SYNC
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.0.0)
TANGGAL PENGAJUAN: 17 November 2026
VERIFIKASI SISTEM: BERHASIL (Kustomisasi Label "Semua Foto", Multi-Event Registry Per-Event Settings, Eliminasi Kedipan/Flicker Lintas Event, Share & QR Code Modal, Login Username & Password, Sinkronisasi Kategori Lintas Perangkat Server-First, Custom Front Page Wedding Cover Showcase)

### Rangkuman 7 Pembaruan Utama v3.0.0:
1. **Kustomisasi Nama "Semua Foto" (Custom Main Gallery Label):**
   - Menambahkan pengaturan `ALL_PHOTOS_LABEL` pada konfigurasi dan panel admin tab *💍 Acara & Event* (`cfgAllPhotosLabel`).
   - Admin bebas mengubah label galeri utama (misal: *"Semua Momen"*, *"Katalog Foto"*, *"All Photos"*). Tab galeri, penghitung foto, dan filter kategori secara dinamis mengikuti label kustom ini.
2. **Arsitektur Multi-Event (Tambah Event & Settingan Admin Mandiri Per-Event):**
   - Mendukung penambahan event tanpa batas melalui skema `EVENTS` dan `ACTIVE_EVENT_ID`.
   - Setiap event memiliki data tersendiri yang berdiri sendiri secara utuh: Nama Mempelai, Tanggal, Lokasi/Venue, ID Folder Google Drive, Bingkai Foto PNG, Kategori Momen & Tautan Display, Cover Halaman Depan, Pesan Sambutan, dan Pesan Penutup Footer.
   - Admin dapat berpindah antar-event dengan dropdown, menambah event baru via tombol `+ Tambah Event Baru`, menghapus event, dan membagikan tautan langsung per-event menggunakan parameter URL (`?event=event_id`).
3. **Eliminasi Total Kedipan (Flicker) & Perubahan Tiba-Tiba dari Event Sebelumnya:**
   - Menghapus teks statis pasangan lama dari berkas HTML dasar (diganti dengan container dinamis ber-transisi halus).
   - Menghapus pembacaan cache global tanpa filter yang sebelumnya menyebabkan nama event lama berkedip sesaat sebelum data event baru selesai dimuat.
   - Menerapkan cache terisolasi berbasis Event ID (`WEDDING_EVENT_CFG_[eventId]`). Pembukaan event baru tidak akan pernah membocorkan data dari event sebelumnya.
4. **Menu Berbagi (Share) & Tampilan QR Code Interaktif:**
   - Menambahkan tombol menu elegan `[📱 Bagikan & QR Code]` pada bar kontrol utama galeri.
   - Menyediakan modal interaktif `#shareQrModal` lengkap dengan:
     * Pratinjau QR Code resolusi tinggi dinamis sesuai URL event aktif.
     * Kolom tautan lengkap dengan tombol `📋 Salin Tautan` satu klik.
     * Tombol berbagi langsung ke WhatsApp dengan draf pesan undangan ramah.
     * Tombol berbagi via Web Share API native pada perangkat ponsel pintar.
     * Tombol `⬇️ Unduh Gambar QR Code (PNG)` untuk kemudahan cetak di meja tamu / kartu souvenir.
5. **Autentikasi Admin Berbasis Username dan Password:**
   - Memperbarui antarmuka login admin (`#adminLoginModal`) menggunakan form kredensial **Username** (default: `admin`) dan **Password** (default: `123`) yang dilengkapi tombol mata toggle *show/hide password*.
   - Tab *👥 Akun Admin* pada panel pengaturan memungkinkan admin memperbarui password akun aktif serta mendaftarkan akun admin baru dengan peran dan kredensial masing-masing.
6. **Perbaikan Sinkronisasi Kategori Lintas Perangkat (PC vs Mobile Photobooth):**
   - **Akar Masalah:** Sebelumnya, `localStorage` lokal menimpa data server dan mengisolasi penambahan kategori hanya pada perangkat tempat setting dibuat (sehingga folder Photobooth tampil di HP namun tidak muncul di PC).
   - **Solusi Diterapkan:** Menjadikan server backend dan `config.json` sebagai satu-satunya *Single Source of Truth*. Data kategori dimuat langsung dari server dan tidak lagi dibajak oleh cache lokal peramban yang usang. Sekarang folder Photobooth dan seluruh kategori kustom tampil konsisten 100% di semua perangkat (PC, HP, Tablet).
7. **Kustomisasi Halaman Depan Event Bertema Wedding (Cover Showcase):**
   - Menambahkan tab khusus *🎨 Cover Depan* di panel admin untuk mengonfigurasi halaman depan:
     * Sakelar aktifkan/nonaktifkan Cover Showcase.
     * Pilihan 3 gaya tata letak mewah Anti-AI:
       1. **Romantic Wedding Collage:** Susunan grid asimetris berbingkai emas lembut (1 foto utama + 2 foto pendamping).
       2. **Hero Slider Sinematik:** Banner layar lebar bergulir otomatis dengan kontrol titik navigasi.
       3. **Aesthetic Polaroid Board:** Kartu foto bergaya polaroid dengan sudut rotasi estetik.
     * Kustomisasi Judul Cover, Subjudul, dan Kalimat Mutiara / Quote Pernikahan.
     * Pengaturan foto-foto cover unggulan (bebas memasukkan beberapa tautan foto, dengan fallback cerdas ke foto galeri pertama jika belum diisi).
     * Tombol interaktif berkelas: `✨ Jelajahi Galeri Foto ↓` (smooth scroll) dan `📱 Bagikan & Lihat QR`.
8. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Seluruh fitur unduh resolusi asli 1:1, antrean unduh di latar belakang (background queue), penutupan otomatis status bar, dan format pesan footer multi-baris tetap 100% terjaga dan berfungsi normal.
