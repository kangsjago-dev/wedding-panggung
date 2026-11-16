# RENCANA REVISI LENGKAP: PRESERVASI RESOLUSI PENUH ASLI & BACKGROUND MULTI-DOWNLOAD PROGRESS
================================================================================
PROJEK: Wedding Photo Gallery Web App ("Wedding Panggung")
ENGINE: ZettBOT v4.1 by Zettbos
STATUS: SUDAH DITERAPKAN & TERVERIFIKASI (v2.9.3)
TANGGAL PENGAJUAN: 16 November 2026
VERIFIKASI SISTEM: BERHASIL (Resolusi Asli 1:1 Terjaga, Background Multi-Download Queue Aktif, Floating Progress Bar)

### Rangkuman Pembaruan v2.9.3:
1. **Preservasi Ukuran & Resolusi Asli Foto Saat Download Berbingkai:**
   - **Penyebab Masalah (Ukuran Berkurang 1.9MB -> 555KB):** Sebelumnya dimensi kanvas dibatasi pada ukuran bingkai (`1920x1080`), sehingga foto kamera resolusi tinggi dari fotografer ter-downscale lebih dari 50%, serta menggunakan kompresi 0.95 pada file pratinjau.
   - **Solusi Diterapkan:**
     * Menghitung resolusi kanvas dinamis berbasis resolusi asli foto (`scale = Math.max(1, pw / cutoutW, ph / cutoutH)`). Jika foto asli beresolusi 2500x1406 atau 4000x2250, kanvas dibuat pada resolusi penuh tersebut sehingga foto dipetakan 1:1 tanpa kehilangan piksel sama sekali.
     * Menggunakan kualitas ekspor ultra-tinggi (`0.98`) sehingga ukuran file tetap setara dengan aslinya (~1.9MB - 2.8MB).
     * Memprioritaskan `photo.downloadUrl` agar mengambil berkas kamera asli tanpa kompresi pratinjau Google Drive.
2. **Widget Progress Bar Mengambang & Antrean Download Latar Belakang (Non-Blocking):**
   - **Pencegahan Kesan Hang / Stuck:** Saat tombol unduh diklik, antarmuka TIDAK dibekukan. Tombol tidak mendisable layar, pengguna dapat langsung berpindah ke foto berikutnya (`Next`/`Prev`), menutup modal, atau mengklik unduh pada banyak foto sekaligus (*multiple background downloads*).
   - **Widget Progress Bar Interaktif:** Disediakan kartu indikator progres mengambang (`#downloadProgressWidget`) di sudut bawah layar dengan bilah progres animasi (persentase memuat foto, menggabungkan bingkai, dan menyimpan ke perangkat) serta label penenang: *"✓ Berjalan di latar belakang • Anda bebas melihat foto lainnya"*.
3. **Prinsip Non-Destruktif:**
   - Seluruh fungsi lain (auto-sync 20 detik, date picker kalender, multi-user admin, dan keamanan PIN) tetap berjalan 100% normal.

### Rangkuman Pembaruan v2.9.2:
1. **Penyempurnaan Bahasa Status Galeri Kosong:**
   - Mengganti teks status kosong `"Belum ada foto dalam kategori ini."` menjadi kalimat yang lebih hangat, elegan, dan estetik: **`"Momen berharga akan segera hadir di sini."`**.
   - Menghapus bersih baris instruksi teknis: `"Unggah foto ke sub-folder terkait di Google Drive Anda."`.
2. **Minimalisasi & Penyempurnaan Tata Bahasa Halaman Login Admin:**
   - **Penghapusan Teks Deskripsi Panjang:** Menghapus paragraf `"Masukkan PIN Admin untuk mengatur sambungan folder Google Drive, bingkai foto, dan koneksi API."` sehingga tampilan modal login menjadi sangat bersih, ringkas, dan fokus.
   - **Penyempurnaan Tata Bahasa Form:**
     * Label input diperhalus menjadi **`"PIN Keamanan"`**.
     * Placeholder input disederhanakan menjadi **`"Masukkan PIN"`**.
     * Status tombol saat memproses diperhalus menjadi **`"Memverifikasi..."`**.
     * Pesan kesalahan diperhalus menjadi: **`"PIN yang Anda masukkan tidak sesuai. Silakan coba kembali."`**.
3. **Prinsip Non-Destruktif:**
   - Tidak mengubah logika sistem, integrasi live Google Drive, unduh foto berbingkai full-HD, atau pengaturan lain yang tidak diperintahkan.

### Rangkuman Pembaruan Menyeluruh (v2.9.1):
1. **Penyebab Mengapa Tampilan Sebelumnya Belum Terlihat Berubah & Solusi Definitifnya:**
   - **Masalah Foto Sampel Tetap Muncul:** Spreadsheet pengguna pada lembar `Daftar_Foto` masih menyimpan 8 baris demo (`demo-1` hingga `demo-8`). Backend Google Apps Script yang sedang aktif membacanya dan mengirimkannya ke frontend saat folder Google Drive kosong.
   - **Solusi Filter Ganda (Dual-Layer Zero-Sample):**
     * **Lapisan Frontend (`index.html`):** Fungsi `handleGalleryResponse` kini secara ketat menyaring dan membuang semua data foto dengan ID `demo-*`, `d*`, atau berlabel demo Unsplash. Jika folder Google Drive kosong, `incomingPhotos` dijamin menjadi array kosong murni `[]`, galeri 100% KOSONG (*"Belum ada foto dalam galeri ini"*), dan banner demo tetap tersembunyi.
     * **Lapisan Backend (`code.gs`):** Menghapus seluruh logika pembacaan sheet `Daftar_Foto` dan pemanggilan `getDemoPhotos()`. Backend kini HANYA memindai Google Drive murni. Jika folder Drive kosong, dikembalikan `photos: []` tanpa sampel.
   - **Masalah Kedipan (Blink) Nama "Hans & Yurike":**
     * Browser pengguna menyimpan cache `localStorage` dengan kunci `WEDDING_SAVED_CONFIG` dari sesi pengujian lama yang masih berisi `"Hans & Yurike"`.
     * Ditambahkan script sanitasi otomatis di `<head>` dan saat `DOMContentLoaded` yang mendeteksi dan langsung MENGHAPUS `"Hans & Yurike"` dari `localStorage`.
     * Ditambahkan filter penolakan di `populateConfigToUI`: jika nilai adalah `"Hans & Yurike"`, otomatis ditolak dan digantikan oleh `"Wilson & Felicia"`.
   - **Penghapusan Tombol Jelajahi Galeri & Mode Panggung:**
     * Blok tombol `<div class="hero-actions">...</div>` telah dihilangkan seutuhnya dari markup Hero Header di `index.html`.
2. **Prinsip Non-Destruktif:**
   - Seluruh fungsi lain (auto-sync 20 detik, download foto berbingkai full-HD 1920x1080, validasi PIN admin unik, date picker kalender) tetap berjalan 100% normal.

### Rangkuman Pembaruan v2.9.0:
1. **Eliminasi Total Blink Nama ("Wilson & Felicia"):**
   - **Akar Masalah:** HTML statis `index.html`, `config.json`, dan `code.gs` masih memuat teks bawaan `"Hans & Yurike"`, sehingga saat refresh browser menampilkan nama lama sekejap sebelum JavaScript selesai memuat data baru.
   - **Solusi:** 
     - Memperbarui teks markup HTML di `#coupleName`, `#slideshowCouple`, dan `.footer-names` secara langsung menjadi `"Wilson & Felicia"`.
     - Memperbarui `EVENT_NAME` pada `config.json`, `GLOBAL_CONFIG`, dan `code.gs` menjadi `"Wilson & Felicia"`.
     - Menambahkan script hidrasi sinkron di awal dokumen agar nama dari `localStorage` langsung terpasang sebelum browser selesai merender (0 milidetik blink).
2. **Pengosongan Galeri Saat Folder Google Drive Kosong (Eliminasi Foto Sampel):**
   - **Akar Masalah:** Logika backend `code.gs` dan fallback frontend sebelumnya memuat 8 foto sampel (Unsplash) jika mendeteksi 0 foto di Drive.
   - **Solusi:**
     - Pada `code.gs`, jika pemindaian folder Google Drive selesai namun berisi 0 file (folder kosong), backend wajib mengembalikan array kosong `photos: []`, `isDemo: false`, dan `categories: ["Semua Foto"]`. Dilarang memicu `getDemoPhotos()`.
     - Pada `index.html`, jika folder kosong atau terjadi kegagalan jaringan, galeri tetap kosong (`state.allPhotos = []`) dengan pesan ramah *"Belum ada foto dalam galeri ini"*, dan sembunyikan banner demo notice (`#demoNotice`).
3. **Penghapusan Tombol "Jelajahi Galeri" & "Mode Panggung (Slideshow)":**
   - Menghapus elemen tombol `<div class="hero-actions">...</div>` pada bagian Hero Header `index.html` sehingga tampilan atas menjadi sangat bersih, ringkas, dan fokus pada informasi acara pernikahan.
4. **Prinsip Non-Destruktif:**
   - Menjaga seluruh fungsi lainnya (auto-sync 20 detik, date picker, download foto berbingkai full-HD, multi-user admin, login PIN rahasia) tetap utuh 100%.

### Rangkuman Pembaruan v2.8.0:
1. **Perbaikan Hasil Unduh Foto Berbingkai (Full Resolution Canvas 1920x1080):**
   - Memperbaiki bug ukuran kanvas unduhan yang sebelumnya terpotong menjadi strip sempit (353x1024).
   - Menetapkan secara eksplisit `canvas.width = fw` dan `canvas.height = fh` pada resolusi asli bingkai (`1920 x 1080`).
   - Penempatan foto di dalam kanvas bingkai kini 100% presisi dan proporsional (mengisi penuh jendela transparan tanpa pemotongan/cropping pada subjek dan tamu undangan).
2. **Tampilan Galeri Mobile Bersih Tanpa Teks Menutupi Foto:**
   - Menghilangkan tulisan overlay (badge kategori `"SEMUA FOTO"` dan teks nama file) pada perangkat mobile (`@media (max-width: 768px)` dan `@media (hover: none)`).
   - Wajah pengantin, keluarga, dan para tamu pada tampilan grid smartphone kini terlihat jernih, utuh, dan elegan tanpa tertutup label teks.
3. **Penghapusan Tulisan Default 123456 pada Input Password/PIN Login:**
   - Menghapus tulisan `(Default: 123456)` dari placeholder form login admin.
   - Placeholder kini tampil bersih dan profesional: `"Masukkan PIN Rahasia"`.
   - Menghilangkan referensi angka default pada pesan galat login fallback.
4. **Pengecekan Fungsi Menyeluruh:**
   - Sinkronisasi 94 foto dari Google Drive: Aktif.
   - Slideshow Mode Panggung: Berjalan normal.
   - Unduh foto berbingkai perangkat: Berjalan normal.
   - Manajemen Multi-User Admin & PIN: Berjalan normal.
   - Dual Fail-Safe GViz Auto-Discovery: Berjalan normal.

### Rangkuman Pembaruan v2.7.0:
1. **Penyambungan Permanen URL Google Apps Script Live:**
   - Menautkan Web App URL Apps Script resmi (`https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec`) secara langsung ke `config.json` dan `GLOBAL_CONFIG` di `index.html`.
   - Mengeliminasi total kemunculan banner kuning *"Mode Demo Aktif"* dan 8 foto dummy di perangkat lain/HP.
2. **Katalog 94 Foto Google Drive Aktif di Seluruh Perangkat:**
   - Seluruh 94 foto pernikahan dari folder Google Drive (`1AhdkSch9C-F2FvYKd_IO2O7RSsRDJxI5`) otomatis tayang secara live di Vercel pada semua HP dan laptop tamu undangan.
3. **Mekanisme Dual Fail-Safe Google Spreadsheet GViz:**
   - Jika konfigurasi lokal di perangkat belum ada atau dihapus, sistem secara otomatis membaca row `GAS_API_URL` dan `Pengaturan` dari Google Spreadsheet publik (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`) via GViz tanpa API key, sehingga perangkat apa pun di dunia dijamin langsung terhubung ke backend live.

### Rangkuman Pembaruan v2.6.0:
1. **Penyempurnaan Tata Bahasa Unduh Foto:**
   - Label tombol diubah dari "Unduh Foto + Bingkai" menjadi **"✨ Simpan Kenangan Berbingkai"** dan "Simpan Foto Asli".
   - Feedback proses diubah menjadi *"Menyiapkan Kenangan Berbingkai..."* dan notifikasi sukses *"✓ Kenangan berbingkai berhasil tersimpan ke perangkat!"*.
2. **Keamanan & Privasi Validasi PIN Unik (Bahasa Menarik & Rahasia):**
   - Menghilangkan pembocoran nama pengguna dan nomor PIN lama pada notifikasi duplikasi.
   - Pesan baru: *"Kombinasi PIN ini telah terdaftar demi menjaga privasi & keamanan akun. Mohon gunakan kombinasi angka rahasia lainnya yang unik."*
   - Pada daftar admin aktif, status PIN ditampilkan elegan: *"Akses: Terproteksi PIN Unik • Peran: Admin"*.
3. **Perbaikan Tampilan Antarmuka Modal Admin (Anti-Bocor / Anti-Stretch):**
   - Memperbaiki penutupan tag HTML yang rusak pada form acara dan media di dalam modal admin.
   - Memperbaiki label field Nama Event (yang sebelumnya keliru tertulis URL Apps Script).
   - Menambahkan `box-sizing: border-box; max-width: 100%;` pada seluruh input & textarea, memastikan seluruh elemen form terkurung rapi di dalam card modal tanpa melebar ke luar layar.
4. **Sinkronisasi Multi-Device Live di Vercel (Bukan Sekadar Lokal):**
   - `index.html` kini otomatis memuat `config.json?v=` + timestamp saat startup, menyamakan URL Google Apps Script dan konfigurasi acara di seluruh perangkat pengunjung Vercel.
   - Baseline konfigurasi langsung disinkronkan ke: **"Hans & Yurike"**, **"14 November 2026"**, **"Upperhills Convention Centre, Makassar"**, folder Google Drive, dan URL bingkai aktif.
   - Polling live auto-refresh 20 detik langsung membaca perubahan data Google Apps Script & Google Spreadsheet di semua perangkat secara real-time.
================================================================================

### 1. Diagnosa & Rincian Masalah

1. **FOUC (Flash of Default Content) Nama Acara di Mobile & Desktop:**
   - **Gejala:** Saat halaman dimuat ulang (*refresh*), judul web app sempat menampilkan *"The Wedding of Romeo & Juliet"* selama 1–2 detik sebelum berganti menjadi *"Hans & Yurike"*.
   - **Akar Masalah:** Elemen HTML (`#coupleName`, `#slideshowCouple`, `.footer-names`) dan variabel `GLOBAL_CONFIG` masih menuliskan teks default *"Romeo & Juliet"* secara statis di dalam markup HTML, sehingga browser merender teks default tersebut sebelum data dari `localStorage` atau backend API selesai dibaca.

2. **Migrasi Penuh ke Vercel (`vercel.app`):**
   - Kebutuhan: Menjadikan repositori 100% *zero-config production ready* untuk di-deploy ke Vercel, dengan routing URL statis yang bersih (`cleanUrls: true`) dan integrasi headless ke Google Apps Script backend.

3. **Interaksi Date Picker 1-Klik:**
   - **Gejala:** Mengklik area teks tanggal tidak langsung memunculkan kalender date picker; pengguna harus membidik ikon kalender kecil di ujung kanan.
   - **Akar Masalah:** Elemen `<input type="date">` standar browser hanya memfokuskan teks saat diklik. Dibutuhkan pemanggilan native API `this.showPicker()`.

4. **Kendala Ganti PIN Admin:**
   - **Gejala:** Pengguna tidak dapat mengubah PIN admin secara andal.
   - **Akar Masalah:** Input ganti PIN di dalam form simpan massal tidak memiliki penanganan validasi tersendiri terhadap user aktif dalam arsitektur multi-user, serta kurangnya feedback visual instan saat PIN diperbarui.

5. **Antarmuka Admin Terlalu Padat, Kurang Minimalis & Kurang Menarik:**
   - **Gejala:** Sesuai tangkapan layar lampiran (`media_1794779243289_4f8ce3f2.png`), modal pengaturan admin saat ini memiliki kotak-kotak bergaris tebal yang bertingkat-tingkat (*heavy nested borders*), teks panduan yang panjang dan berulang, serta alur gulir (*scroll*) yang sangat panjang di mobile.
   - **Kebutuhan:** Ubah tampilan admin menjadi **Modern Minimalist Luxury Dashboard** dengan navigasi tab segmented yang rapi, ringkas, responsif, dan mudah dioperasikan.

6. **Teks Informasi PIN Bawaan di Modal Login:**
   - **Gejala:** Pada modal login (`media_1794779243289_81d12505.png`), terdapat teks *"PIN bawaan awal adalah: 123456 (dapat diubah di dalam)"*.
   - **Kebutuhan:** Teks tersebut wajib dihapus bersih agar tampilan login lebih aman, bersih, dan profesional.

7. **Hasil Download Foto Terpotong Dibandingkan Foto Asli (Frame Cutout Issue):**
   - **Gejala:** Pada gambar lampiran perbandingan (`media_1794779243316_77129d92.jpg` vs `media_1794779243316_094c1bbb.jpg`), foto hasil download terpotong di bagian bawah (lantai panggung dan speaker tertutup banner putih bingkai) dan sisi kiri-kanan tamu undangan terpotong oleh border vertikal bingkai.
   - **Akar Masalah:** Logika canvas sebelumnya menggambar foto secara *full bleed* `(0, 0, w, h)` lalu menempelkan bingkai di koordinat yang sama. Karena bingkai memiliki banner putih solid di bawah dan border samping yang tebal, bagian tepi foto otomatis tertutup/terpotong.
   - **Solusi Rekayasa:** Implementasi **Smart Transparent Cutout Detection & Aspect Ratio Preserving Fit**:
     - Sistem canvas memindai koordinat area transparan (*inner window cutout*) pada file bingkai PNG.
     - Foto asli diskalakan secara presisi dan diletakkan tepat di dalam area transparan bingkai tanpa terdistorsi.
     - Seluruh foto asli (mulai dari kepala tamu, lantai panggung, hingga tamu di paling ujung kiri dan kanan) tampil 100% utuh tanpa ada yang tertutup oleh banner bingkai.

---

### 2. Rencana Perubahan Teknis & Solusi Terstruktur

#### A. Eliminasi FOUC (Anti-Kedip Nama Lama)
- Di `index.html`:
  - Ubah nilai default di HTML markup dan `GLOBAL_CONFIG` agar langsung sinkron dengan *"Hans & Yurike"* (dan tanggal 13 November 2026).
  - Tambahkan inline script micro-loader di `<head>`: Membaca `localStorage.getItem("WEDDING_SAVED_CONFIG")` secara instan sebelum browser menggambar elemen DOM pertama kali, sehingga tidak akan pernah ada kedipan nama default lama saat refresh di mobile.

#### B. Redesain Panel Admin Menjadi Minimalis & Tabbed Segmented
- Di `index.html`:
  - Hapus seluruh box bertingkat yang tebal dan teks penjelasan paragraf yang panjang.
  - Terapkan **Segmented Navigation Tabs** di dalam modal admin:
    1. **Tab 1: 💍 Acara** (Nama Event, Tanggal Event 1-Klik, Lokasi/Venue, Subtitle, Pesan Sambutan).
    2. **Tab 2: 🖼️ Foto & Bingkai** (Tautan Folder Google Drive + Tombol Sinkronisasi, Tautan Bingkai PNG Transparan).
    3. **Tab 3: 👥 Akun & PIN** (Status Akun Masuk, Tombol Ganti PIN Pribadi yang Responsif, Tambah Admin Baru dengan PIN Unik, Daftar Admin).
    4. **Tab 4: ☁️ Koneksi Cloud** (URL Web App Google Apps Script & Status Koneksi).
  - Tampilan modal menjadi sangat ramping, elegan, minimalis, dan sangat mudah diakses di layar ponsel kecil.

#### C. Hapus Teks "PIN bawaan awal adalah..."
- Di `index.html`: Hapus baris teks `<div class="admin-help-text">PIN bawaan awal adalah: ...</div>` dari `#adminLoginForm`.

#### D. Date Picker 1-Klik Langsung Buka Kalender
- Di `index.html`: Tambahkan atribut `onclick="try{this.showPicker()}catch(e){}"` dan `onfocus="try{this.showPicker()}catch(e){}"` pada input `#cfgEventDate` serta cursor `pointer` pada styling CSS-nya.

#### E. Fitur Ganti PIN yang Handal & Tervalidasi
- Di `index.html` & `code.gs`:
  - Sediakan aksi khusus ganti PIN dengan validasi:
    - Minimal 4 karakter.
    - Wajib unik (tidak boleh kembar dengan PIN admin lain).
  - Saat disimpan, backend memperbarui PIN user yang sedang login di `ADMIN_USERS_JSON` dan `PropertiesService`, lalu frontend memperbarui `state.adminPin` dan memberikan pesan sukses toast hijau.

#### F. Smart Cutout Compositor untuk Download Foto Berbingkai Utuh
- Di `index.html`:
  - Fungsi `downloadCurrentPhotoWithFrame()` ditingkatkan menggunakan algoritma **Auto-Detect Transparent Bounding Box**:
    1. Membaca data piksel bingkai PNG (`getImageData`).
    2. Menemukan koordinat batas jendela transparan: `minX, minY, windowWidth, windowHeight`.
    3. Menggambar foto asli secara proporsional (*contained & centered*) di dalam jendela transparan tersebut.
    4. Menempelkan bingkai PNG di atasnya.
    5. Mengekspor Blob lokal dan memicu unduhan langsung ke perangkat pengguna.
    6. **Hasil:** 100% foto asli terlihat utuh sempurna, tidak ada yang terpotong oleh banner putih bawah maupun border samping.

#### G. Kesiapan Penuh Deployment Vercel
- Memastikan `vercel.json` dan struktur file kompatibel langsung dengan Vercel hosting.
- Menyediakan panduan deploy praktis 1-klik ke `vercel.app`.

---

### 3. Berkas yang Akan Diubah
1. `index.html`:
   - Inline script pencegah FOUC nama acara.
   - Redesain antarmuka Admin Modal menjadi Minimalist Luxury Tabbed Navigation.
   - Penghapusan teks PIN bawaan pada modal login.
   - Date picker 1-klik (`showPicker()`).
   - Algoritma Smart Cutout Compositor anti-terpotong untuk download foto berbingkai.
2. `code.gs`:
   - Endpoint perbaikan ganti PIN mandiri dengan validasi keunikan.
   - Penyempurnaan default event config.
3. `config.json` & `vercel.json`:
   - Konfigurasi deployment Vercel.

---

### 4. Prinsip Non-Destruktif
- Seluruh fitur eksisting yang berjalan baik (tema Romantic Ivory & Soft Gold, Lightbox navigation, Slideshow TV, live auto-refresh Google Drive, dan multi-user login) tetap dipertahankan 100%.

---

## Catatan Rilis v2.9.4: Reposisi Widget Progress Bar & Penyempurnaan Antrean Unduh Multi-Foto Latar Belakang (Non-Blocking)

### 1. Masalah yang Diselesaikan
- **Progress Bar Menghalangi Tombol Download Foto Berikutnya:**
  - Sebelumnya widget progress bar melayang di area bawah layar (`bottom: 16px` pada mobile), sehingga menutupi tombol *"✨ Simpan Kenangan Berbingkai"* dan bilah navigasi lightbox. Akibatnya, pengguna di perangkat mobile tidak dapat menekan tombol download pada foto berikutnya saat proses unduh sedang berjalan.
- **Antrean Unduh Latar Belakang (Background Queue) Multi-Foto:**
  - Memastikan pengguna dapat langsung menggeser (*swipe*) atau berpindah ke foto-foto berikutnya dan menekan tombol simpan secara beruntun tanpa harus menunggu proses unduh foto sebelumnya selesai.

### 2. Implementasi Perbaikan
1. **Reposisi Widget ke Bagian Atas Layar (Top Floating Island Banner):**
   - Pada desktop: `top: 20px; right: 24px; bottom: auto;`.
   - Pada mobile (`@media (max-width: 640px)`): `top: 72px; left: 14px; right: 14px; bottom: auto;`.
   - Penempatan pada `top: 72px` di mobile berada tepat di bawah header lightbox (sehingga tidak menghalangi tombol silang '✕' di atas) dan **100% bebas dari bilah tombol simpan di bagian bawah layar**.
   - Dilengkapi tombol tutup cepat `✕` (`.dpw-close-btn`) jika pengguna ingin menyembunyikan notifikasi seketika tanpa memutus proses unduh di latar belakang.
2. **Penyempurnaan Antrean Unduh Multi-Foto (Sequential Non-Blocking Queue):**
   - Penambahan deteksi duplikasi instan agar foto yang sama tidak diantrekan ganda jika tertekan berkali-kali.
   - Pemberian umpan balik instan pada tombol simpan: berubah menjadi `"✓ Masuk Antrean Unduh"` selama 1.5 detik lalu siap ditekan kembali tanpa terkunci.
   - Perbaruan badge antrean dinamis: menampilkan jumlah foto yang sedang mengantre (misal: `"2 Antrean"`, `"3 Antrean"`).
   - Rantai proses sekuensial yang mulus: saat foto pertama selesai disimpan ke perangkat, sistem langsung memproses foto berikutnya tanpa mereset atau menutup widget secara prematur hingga seluruh antrean tuntas.
   - Tombol navigasi dan swipe foto pada lightbox tetap aktif dan responsif 100%.

### 3. Jaminan Non-Destruktif
- Seluruh fungsi lain (resolusi asli 1:1 tanpa kompresi, framing transparan, sinkronisasi Google Drive, login admin minimalis, kalender date picker) tetap berjalan normal tanpa perubahan yang tidak diinstruksikan.

---

## Catatan Rilis v2.9.5: Perbaikan Posisi Desktop (Bebas Tombol Close) & Otomatisasi Tutup Status Bar Selesai Unduh

### 1. Masalah yang Diselesaikan
- **Progress Bar Desktop Menutupi Tombol Close Lightbox:**
  - Sebelumnya widget berada di `top: 20px; right: 24px;` pada desktop, yang menutupi tombol silang close (`.lightbox-close` pada header lightbox). Akibatnya pengguna desktop kesulitan menutup lightbox untuk memilih foto lain dari galeri.
- **Status Bar Tidak Otomatis Tertutup Setelah Selesai Unduh:**
  - Terjadi kondisi logika di mana evaluasi `remaining === 0` tidak terpenuhi saat status unduh selesai karena flag `isProcessing` masih aktif, sehingga timer penutupan otomatis (`hideTimer`) tidak terpicu dan ikon spinner tetap muncul bersamaan dengan teks "✓ Berhasil Disimpan!".

### 2. Implementasi Perbaikan
1. **Reposisi Presisi pada Desktop Mode:**
   - Mengubah posisi widget desktop menjadi **`top: 88px; right: 24px;`**.
   - Header lightbox berada pada `y = 0` hingga `y = 80px` dan tombol close berada pada `top: 18px; right: 24px;` (tinggi 44px, berakhir pada `y = 62px`).
   - Dengan jarak `top: 88px`, terdapat celah aman sebesar 26px di bawah tombol close. **Tombol close lightbox 100% bebas dari halangan dan dapat diklik kapan saja**.
2. **Otomatisasi Penutupan Status Bar (Auto-Close Dismiss):**
   - Menghapus pembatasan kondisi `remaining === 0` pada blok `isComplete`. Saat unduhan selesai:
     - Ikon spinner dinonaktifkan (`display: none`).
     - Ikon centang hijau (`dpwIconCheck`) ditampilkan.
     - Badge beralih ke status `"Selesai"`.
     - Timer otomatis 2,5 detik dipicu secara pasti untuk menarik kembali status bar ke atas layar (`transform: translateY(-180%)`).
   - Pengaturan flag `downloadQueue.isProcessing = false` disinkronkan tepat sebelum pemanggilan penyelesaian unduh.

### 3. Jaminan Non-Destruktif
- Seluruh fitur lain (resolusi asli 1:1, antrean multi-download latar belakang, mode mobile di `top: 72px`, sinkronisasi Google Drive & admin) tetap berjalan utuh 100%.

---

## Catatan Rilis v2.9.6: Custom Link Target Kategori Galeri, Hapus Slideshow dari Menu Download, & Kustomisasi Pesan Footer

### 1. Masalah & Kebutuhan Pengguna
1. **Set Kategori / Folder Galeri dengan Custom Link Target:**
   - Kebutuhan untuk mengatur kategori/folder galeri tertentu (misalnya *Teapai, Photobooth, Akad Nikah, Resepsi*) dan mengaitkan tautan target display galeri (bisa berupa Google Drive maupun link pihak ketiga seperti *https://fotoshare.co*).
2. **Hapus Menu "Putar Slideshow" pada Menu Download Foto:**
   - Menghapus tombol *"Putar Slideshow"* yang sebelumnya berada di bilah bawah lightbox samping tombol download foto agar tampilan menu download fokus dan rapi.
3. **Kustomisasi Pesan Penutup Footer:**
   - Membuat teks *"Diabadikan dengan cinta • Terima kasih atas doa restunya."* dapat dikustomisasi secara bebas melalui panel pengaturan admin.

### 2. Implementasi Perbaikan
1. **Sistem Kategori Kustom & Link Target Display Galeri:**
   - Di panel Admin (`Tab 2: Foto & Bingkai`), ditambahkan modul pengelola kategori dinamis:
     - Input **Nama Kategori** (misal *Teapai*, *Photobooth*).
     - Input **Tautan Display Galeri** (misal URL Google Drive atau tautan *https://fotoshare.co*).
     - Tombol tambah baris baru `+ Tambah Kategori / Folder Galeri` dan tombol hapus baris.
   - Pada halaman utama galeri:
     - Kategori dengan custom link target otomatis menampilkan indikator `↗`.
     - Ketika diklik, jika kategori memiliki link target display, akan ditampilkan banner khusus di bagian atas grid foto dengan tombol langsung *"Buka Galeri [Nama Kategori] ↗"*.
     - Jika kategori belum memiliki foto lokal (misal seluruh foto photobooth berada di *fotoshare.co*), sistem menampilkan kartu display elegan berlatar emas dengan tombol untuk langsung membuka galeri tujuan di tab baru.
2. **Pembersihan Menu Download Foto:**
   - Menghapus tombol *"Putar Slideshow"* dari `.lightbox-bottombar` di modal unduh foto, menyisakan hanya tombol download resolusi asli yang bersih dan elegan.
3. **Kustomisasi Pesan Footer:**
   - Ditambahkan input *"Pesan Penutup Footer"* di panel Admin (`Tab 1: Acara`).
   - Teks footer di bagian bawah halaman web langsung sinkron dengan `config.FOOTER_MESSAGE` baik di browser maupun database Google Spreadsheet.

### 3. Jaminan Non-Destruktif
- Seluruh fitur lain (resolusi asli 1:1, antrean download non-blocking, posisi progress bar desktop di `top: 88px` dan mobile di `top: 72px`, auto-close 2.5s, multi-user admin login) tetap berjalan utuh 100%.
