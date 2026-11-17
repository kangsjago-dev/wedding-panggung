# RENCANA REVISI & CATATAN RILIS SISTEM: v3.2.0
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v3.2.0)
TANGGAL PENGAJUAN: 18 November 2026
VERIFIKASI SISTEM: BERHASIL (Penghapusan Cover Halaman Depan Sesuai Lampiran, Pembukaan Link Web Asli & Unduh Otomatis dari Web Asli Khusus Kategori Photobooth, Reaktivitas Real-Time Kategori Momen & Penampilan Display Galeri Google Drive / Web Interaktif untuk Kategori Lainnya)

### Rangkuman 3 Pembaruan Utama v3.2.0:
1. **Penghapusan Cover Halaman Depan (Sesuai Lampiran Gambar 1):**
   - Menghapus tampilan cover showcase pernikahan (`#weddingCoverSection`) yang berisi kartu *"💍 The Royal Celebration - The Wedding Celebration"* dan foto panggung.
   - Mengatur `coverSettings.enabled = false` pada konfigurasi sentral [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json), `GLOBAL_CONFIG`, serta menambahkan perlindungan `display: none !important;`. Halaman langsung berfokus pada galeri foto utama yang bersih dan cepat diakses.
2. **Khusus Kategori Photobooth: Klik Foto Membuka Link Asli & Mengunduh dari Web Asli:**
   - **Alur Kerja Baru:** Saat pengunjung mengeklik kartu foto di tab **Photobooth**:
     1. Secara otomatis membuka halaman tautan asli foto di website fotoshare (`https://fotoshare.co/i/[hash]`) pada tab peramban baru.
     2. Secara otomatis memicu pengunduhan berkas foto asli berkualitas tinggi langsung dari server CDN web aslinya (`cdn-bz.fotoshare.co`) ke perangkat pengunjung tanpa kompresi dan tanpa bingkai foto panggung.
   - Parsing foto fotoshare ditingkatkan untuk membaca objek `sessionImages` secara mendalam, menghasilkan 600+ foto lengkap dengan hash dan tautan web spesifik per-foto.
   - Kartu foto Photobooth dilengkapi tanda visual `↗ Buka web asli & unduh` pada bagian overlay.
3. **Penyajian Kategori Lainnya (Tampilan Kategori pada Website & Display Galeri):**
   - **Tampilan pada Website (Kategori Bar):**
     * Mengatasi kendala di mana kategori baru (seperti *Event Test*, *eded*) tidak muncul di tab bar website.
     * Mengoreksi *data corruption* dari Google Spreadsheet yang sebelumnya menyimpan array objek sebagai `[object Object]` sehingga mereset kategori menjadi kosong saat dimuat ulang.
     * Mengaktifkan `renderCategoryTabs()` seketika pada fungsi `onCategoryRowInput()`, sehingga saat admin mengetik nama kategori baru di modal pengaturan, tab kategorinya langsung muncul di bilah navigasi website secara real-time.
   - **Tampilan pada Galeri (Display Galeri):**
     * Untuk kategori yang ditautkan ke folder Google Drive (misal: `https://drive.google.com/drive/folders/...`): jika foto belum diindeks secara lokal, galeri secara cerdas menyematkan **Display Interaktif Google Drive** beresolusi tinggi lengkap dengan tombol aksi cepat `[📂 Buka Folder Google Drive ↗]`.
     * Untuk kategori dengan tautan galeri web lain: menampilkan penyemat tampilan interaktif beserta tombol tautan resmi.
     * Pengunjung dan admin dapat langsung melihat dan menjelajahi isi foto dari link yang telah dimasukkan tanpa hambatan layar kosong.
4. **Prinsip Non-Destruktif (Strict Non-Destructive):**
   - Seluruh fitur unduh foto berbingkai pada kategori "Semua Foto", multi-event selector, autentikasi username & password admin, dan background download queue tetap 100% terjaga dan berfungsi normal.
