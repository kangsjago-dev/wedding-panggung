# PRD - Wedding Photo Gallery & Live Slideshow Platform
**Sistem**: Multi-Event Wedding Gallery with ERP Master Data Architecture  
**Versi**: v4.1.0-PROD  
**Arsitektur Database**: Google Sheets ERP Master Table + Google Drive Live Photo Catalog  
**Terakhir Diperbarui**: 19 November 2026

---

## 1. Ringkasan Eksekutif & Struktur ERP
Platform Galeri Foto Pernikahan & Slideshow Interaktif mendukung Multi-Event terisolasi penuh dengan arsitektur **ERP Master Data Spreadsheet** pada Google Sheets (`133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20`).

### 1.1 Tabel Master ERP: `Daftar_Acara` (10 Kolom Terstruktur)
Setiap baris mewakili 1 event independen dengan properti lengkap:
1. `ID_Event`: ID unik berbasis slug (contoh: `andre-fayola-281`, `wilson-felicia-133`)
2. `Nama_Acara`: Nama pasangan pengantin / judul acara
3. `Tanggal_Acara`: Tanggal pelaksanaan acara (format standar bahasa Indonesia)
4. `Venue_Lokasi`: Lokasi gedung / ballroom pelaksanaan
5. `Tautan_Home_Event`: URL langsung menuju galeri acara tersebut (`?event={ID_Event}`)
6. `Google_Drive_Folder_ID`: ID atau link folder katalog foto utama di Google Drive
7. `Photobooth_Vendor_URL`: Tautan khusus vendor photobooth (Fotoshare, Google Photos, dll.)
8. `Kategori_JSON`: Array JSON kategori kustom beserta link folder masing-masing
9. `Bingkai_URL`: Tautan file bingkai PNG transparan download otomatis
10. `Status`: Status acara (`Aktif`, `Selesai`, `Draft`)

### 1.2 Tabel Pendukung ERP di Google Spreadsheet
- **`Pengaturan`**: Parameter sistem global, endpoint Apps Script, interval refresh, durasi badge baru.
- **`Pengguna_Admin`**: Manajemen akun multi-admin (Super Admin, Admin) dengan ID, username, PIN, peran.
- **`Daftar_Foto`**: Pencatatan riwayat berkas foto yang disinkronkan dari Google Drive.
- **`Log_Aktivitas`**: Audit trail otomatis setiap perubahan pengaturan dan aksi admin.

---

## 2. Fitur & Penanganan Masalah Terkini (v4.1.0)

### 2.1 Navigasi Tab Admin Terkunci (Pinned / Sticky)
- Bilah navigasi tab (`💍 Acara & Event`, `🖼️ Foto & Kategori`, `👥 Akun Admin`, `☁️ Cloud & API`) diletakkan di dalam `.admin-tabs-sticky-wrapper` yang menempel di bagian atas modal dengan `position: sticky; top: 0; z-index: 25; background: #FFFFFF;`.
- Saat pengguna men-scroll konten formulir ke bawah, bilah navigasi **tetap terkunci rapi di atas** dan tidak tertutup.

### 2.2 Inisialisasi Database ERP Google Sheets
- Berkas `setup.gs` menempatkan fungsi `setupTargetSpreadsheetDatabase()` pada posisi paling atas sehingga otomatis menjadi fungsi default saat file dibuka di Google Apps Script.
- Eksekusi fungsi tersebut secara otomatis membuat dan menyusun ke-5 sheet database lengkap dengan styling header emas dan data aktual.
- Disediakan tombol inisialisasi langsung pada antarmuka admin (Tab Cloud & API).

### 2.3 Format Tanggal Halaman Depan dengan Nama Hari Otomatis (v4.4.0)
- Tanggal acara pada badge hero halaman depan (`#eventDate`), subtitle slideshow, dan kartu pratinjau bagikan kini otomatis menampilkan nama hari berbahasa Indonesia di depannya:
  - Contoh: `Minggu, 22 November 2026` atau `Senin, 16 November 2026`.
- Fungsi `formatIndonesianDateWithDay()` menghitung hari secara matematis dari tanggal kalender (`Date.getDay()`), menghindari duplikasi jika nama hari sudah ada, dan tetap memetakan nilai input kalender `YYYY-MM-DD` secara aman ke elemen `<input type="date">`.

### 2.4 Realtime Murni Tanpa Hardcode (Anti-Fallback)
- Seluruh data dibaca secara dinamis dari database tanpa data mockup.

### 2.5 Proteksi Halaman Tidak Ditemukan untuk URL Manual (v4.5.0)
- Mengetik link manual tanpa parameter event (`https://gallery.runway.my.id/`) menampilkan layar khusus **Halaman Tidak Ditemukan / Acara Tidak Ditemukan** (`#eventNotFoundScreen`).
- Galeri foto, banner sambutan, dan identitas pengantin disembunyikan total guna mencegah kebocoran data antar event dan menjaga privasi masing-masing pasangan.
- Tersedia tombol "Masuk Panel Admin" agar administrator tetap dapat mengelola atau membuka tautan home acara masing-masing.

### 2.6 Kustom Logo / Monogram Acara (v4.5.0)
- Logo atau monogram pernikahan (`#heroLogoContainer`) ditampilkan tepat di atas divider dan nama pasangan pengantin sesuai layout kartu mewah.
- Input logo ditempatkan di Tab 1 Admin (Acara & Event) di bawah nama event (`#cfgEventLogoUrl`) dengan kotak pratinjau live (`#adminLogoPreviewBox`).
- Mendukung link Google Drive yang otomatis dinormalisasi menjadi direct image view. Ukuran logo dibatasi proporsional (`max-height: 72px;`) agar menarik dan tidak terlalu besar.

### 2.7 Pembersihan Seketika & Penghapusan Fallback Foto Kategori (v4.6.0)
- Mengeliminasi bug tampilan foto lama saat link kategori diubah ("Muncul gambar sebelumnya baru berubah"):
  - `fallbackDrive` tidak lagi mengambil foto dari `state.allPhotos`. Jika folder kategori belum memiliki foto atau masih dalam proses pemanggilan, sistem mengembalikan array kosong `[]` sehingga tidak ada foto kategori lain yang bocor.
  - Saat berpindah kategori atau mengubah tautan, `state.filteredPhotos` seketika dikosongkan (`[]`) dan grid menampilkan animasi skeleton shimmer (`showGridSkeleton()`), menjamin foto lama langsung hilang seketika.
  - Setiap perubahan tautan pada formulir admin (`onCategoryRowInput` & `handleSaveAllSettings`) langsung menghapus cache foto lama (`state.categoryPhotosMap` & `state.categoryPhotosUrlMap`).

### 2.8 QR Code Berlogo Monogram dengan Latar Belakang Putih Solid (v4.6.0)
- Modal Bagikan & QR Code (`#shareQrModal`) menghasilkan QR Code beresolusi tinggi dengan logo monogram di bagian tengahnya:
  - Menggunakan tingkat koreksi galat tinggi (**`ecc=H`** / toleransi 30%) agar QR code tetap 100% terbaca dan discan oleh ponsel.
  - Bidang tengah di balik logo diberi badge **warna putih solid (`#FFFFFF`)** berukuran 24% dari QR code dengan sudut membulat (*rounded rectangle*) dan border halus. Hal ini menjamin logo berformat transparan (PNG) memiliki latar belakang putih pekat sehingga modul QR code di belakangnya tidak menembus dan merusak scan.
  - Logo diambil otomatis dari menu konfigurasi event aktif (`EVENT_LOGO_URL` / `logoUrl`).
  - Tombol unduh QR Code mendukung pengunduhan instan hasil komposit kanvas ke format PNG.

### 2.9 Pengurutan Kronologis Foto Terbaru di Paling Atas & Eliminasi Total Fallback Hardcode Semua Menu (v4.7.0)
- **Pengurutan Waktu Terbaru di Paling Atas (Newest First Across All Photos, Categories & Events)**:
  - Seluruh foto pada semua kategori (Semua Foto, Photobooth, Akad, Resepsi, Kategori Kustom), semua event, slideshow, dan lightbox diurutkan secara kronologis dengan foto yang paling baru di posisi paling atas.
  - Menggunakan komparator terpadu `sortPhotosNewestFirst` dan `getPhotoTimestamp` yang mengevaluasi epoch timestamp, ISO string, creation/update date, pola nama file ber-timestamp, dan pemecah seri (*tie-breaking*) descending alphanumeric natural filename (`b.name.localeCompare(a.name, undefined, { numeric: true })`) untuk file foto sekuensial kamera.
  - Diterapkan pada client-side (`js/app.js`), instant hydration, pergantian event, filter kategori, seluruh API endpoint (`api/drive-folder.js`, `api/fotoshare.js`, `api/google-photos.js`, `api/kingphotobooth.js`), dan backend Google Apps Script (`code.gs`).
- **Eliminasi Total Fallback Hardcode pada Semua Menu (100% Realtime Database)**:
  - Membersihkan seluruh hardcoded ID/URL fallback (folder Drive, album Fotoshare, event Kingphotobooth) dari seluruh API serverless.
  - Membersihkan akun admin dummy (`usr_superadmin / password: 123 / pin: 123456`) dan fallback list admin; autentikasi dan daftar admin murni divalidasi dan diambil 100% dari spreadsheet Google Sheets (`Akun_Admin` / ERP).
  - Tautan kategori dan photobooth murni terhubung realtime dengan data event aktif di spreadsheet tanpa data tiruan.

### 2.10 QR Share Logo Borderless & Bidang Proporsional Mengikuti Objek (v4.8.0)
- **Logo QR Share Tanpa Border**: Menghilangkan garis tepi (`border/stroke`) di sekeliling logo monogram pada QR Code, sehingga logo tampil bersih dan menyatu alami dengan modul kode QR.
- **Bidang Latar Belakang Putih Menyesuaikan Objek Logo**:
  - Ukuran bidang putih solid tidak lagi statis persegi (`144px x 144px`).
  - Sistem mendeteksi batas transparan gambar (*transparent trimming*) dan menyesuaikan lebar (`bw`) dan tinggi (`bh`) secara dinamis mengikuti rasio aspek logo sebenarnya dengan padding ringkas (`padX: 6px`, `padY: 4px`).
  - Menghilangkan ruang putih kosong yang terlalu besar di bagian atas dan bawah pada logo berbentuk memanjang (seperti logo teks RUNWAY).
- **Audit Backend Realtime**: Menghapus bypass login dan mock demo di `code.gs`. Autentikasi dan data murni 100% realtime dari database Google Sheets.

### 2.11 Pemulihan Mesin Preview, Lightbox & Download Serta Audit 3x Realtime (v4.9.0)
- **Pemulihan Mesin Preview Lightbox**:
  - Memperbaiki deklarasi `photo` yang hilang di `openLightbox` yang sebelumnya memicu `ReferenceError: photo is not defined`.
  - Memprioritaskan eksekusi `updateLightboxContent()` sehingga judul foto, penomoran urut, gambar beresolusi penuh, dan tombol aksi terpasang seketika (0ms).
  - Menyempurnakan pemetaan resolusi `getSharpPreviewUrl`: memisahkan protokol vendor Fotoshare, Kingphotobooth, Google Photos, dan Google Drive secara ketat sehingga URL Fotoshare tidak terdistorsi ke domain Google Drive (mencegah error 404 broken preview).
- **Pemulihan Mesin Download**:
  - Mendeteksi ketersediaan bingkai PNG secara dinamis. Jika acara tidak menggunakan bingkai, tombol unduh langsung berlabel *"⬇️ Unduh Foto Asli (Ukuran Penuh)"* dan memicu pengunduhan instan berkas master asli.
  - Jika berbingkai, sistem menggunakan pra-komposit Blob instan dari memori peramban atau antrean terencana dengan notifikasi progres.
- **Audit 3x Bebas Fallback**:
  - Putaran 1 (Frontend): Menghapus seluruh konstanta fallback folder dan kategori di `DEFAULT_CONFIG`.
  - Putaran 2 (API): Seluruh fungsi serverless 100% bergantung pada parameter dinamis.
  - Putaran 3 (Backend): Menghapus mock akun admin dan password bypass di `code.gs`. Autentikasi murni memvalidasi sheet `Pengguna_Admin`.

### 2.12 Pengunduhan Berkas Asli Tanpa Kompresi (Uncompressed Direct Master Download) (v4.10.0)
- **Streaming Master Biner Byte-for-Byte**:
  - Pengunduhan berkas Google Drive dialihkan dari thumbnail terkompresi `lh3.googleusercontent.com/d/{id}=w3200` ke endpoint stream berkas asli `https://drive.usercontent.google.com/download?id={id}&export=download`.
  - Berkas master diunduh dengan ukuran byte asli fotografer secara utuh 100% tanpa kompresi algoritma gambar, menjaga kejernihan piksel asli dan mempertahankan seluruh metadata EXIF kamera.
- **Bypass Kompresi Canvas pada Foto Polos**:
  - Untuk acara tanpa bingkai foto (`FRAME_IMAGE_URL` kosong), sistem langsung menyalurkan URL unduhan master asli (`executeDirectPhotoDownload`) tanpa melalui canvas re-encoding (`canvas.toBlob("image/jpeg", 0.94)`).
  - Fotoshare dibersihkan dari query pembatas resolusi (`?w=...`) menuju CDN master `cdn-bz-op.fotoshare.co`, dan Google Photos menggunakan flag `=d` untuk master download langsung.
- **Audit 3x Realtime Bebas Fallback**:
  - Pembersihan total fallback gambar cover Unsplash di `renderCoverSection()`, pembersihan fallback event di admin, dan penegasan arsitektur 100% realtime database.

### 2.13 Pengunduhan Berkas Fisik Seluler (Mobile Blob Streaming) & Eliminasi Total Fallback Realtime (v4.11.0)
- **Asynchronous Physical Blob Streaming pada Perangkat Seluler (HP)**:
  - Mengeliminasi kegagalan unduh pada perangkat seluler di mana tautan server langsung (`/api/download-proxy?...`) diblokir oleh peramban HP (Android Chrome, iOS Safari, Samsung Internet, Webview).
  - Alur pengunduhan kini mengambil *physical binary blob* terlebih dahulu ke memori lokal peramban via `fetch(proxyUrl)`, memvalidasi ukuran berkas riil (`blob.size > 0`), dan menyimpannya melalui `saveBlobToDevice` menggunakan `URL.createObjectURL(blob)`.
  - Status widget hanya diperbarui ke 100% ("✓ Berhasil Disimpan!") setelah berkas fisik berhasil disimpan ke penyimpanan HP, mencegah status berhasil semu (*false positive*).
- **Eliminasi Total Fallback Hardcode Master (Realtime Database)**:
  - Seluruh nilai `GLOBAL_CONFIG.EVENTS` dan `GLOBAL_CONFIG.ACTIVE_EVENT_ID` pada sisi klien dikosongkan (`[]` dan `""`).
  - Seluruh nilai `WEDDING_CONFIG` pada sisi backend Google Apps Script dikosongkan.
  - Menghapus fallback array event statis, fallback PIN default, dan fallback ID event dari `code.gs`.
  - Seluruh data event, konfigurasi, dan pengguna admin beroperasi 100% realtime membaca database Google Sheets (`Daftar_Acara`, `Pengaturan`, `Pengguna_Admin`, `Daftar_Foto`).

### 2.14 Konsolidasi Kendali Folder Google Drive & Eliminasi Duplikasi Bidang Admin (v4.12.0)
- **Eliminasi Duplikasi Bidang Folder Drive pada Tab 1**:
  - Menghapus input `#cfgEventDriveFolderId` dari Tab 1 (Acara & Event).
  - Tab 1 dikhususkan murni untuk parameter identitas acara: nama pasangan/event, logo acara monogram, tanggal, venue, pesan sambutan, dan pesan penutup.
- **Konsolidasi Single Source of Truth pada Tab 2 (Foto & Kategori)**:
  - Seluruh konfigurasi folder Google Drive untuk kategori utama "Semua Foto" event aktif dikelola terpadu pada Tab 2 via `#cfgDriveFolderId` yang dilengkapi tombol sinkronisasi instan (`#btnSyncDrivePhotos`) dan pengurutan kronologis.

### 2.15 Redesain Antarmuka & Tipografi Elegan Kategori Tanpa Foto (v4.13.0)
- **Komponen Luxury Wedding Empty State**:
  - Wadah kartu `.empty-gallery-card` dengan palet warna ivory dan aksen emas lembut (`rgba(197, 168, 128, 0.35)`), border-radius 24px, dan bayangan lembut.
  - Menggantikan raw emoji `🖼️` dan `🔄` dengan ikon vektor SVG kustom beresolusi tajam (`.empty-gallery-icon-wrap`).
  - Badge kategori elegan dengan uppercase tracking: `Kategori • [Nama Kategori]`.
  - Judul bernuansa puitis: *"Momen Indah Sedang Disiapkan"* menggunakan font serif *Cormorant Garamond*.
  - Narasi ramah dan puitis yang menjelaskan foto sedang dipersiapkan oleh fotografer.
  - Tombol aksi terpadu: *Segarkan Kategori Ini* dan *Buka Album Sumber* dengan SVG icon inline.
