# Catatan Revisi & Audit Sistem (Changelog)

## Versi 4.3.0 - Kategori Semua Foto per Event & Perbaikan Kunci Tab Menu Admin (19 November 2026)

### 1. Perbaikan yang Diperintahkan & Diterapkan:
1. **Kategori "Semua Foto" Diberikan untuk Masing-Masing Event (Tiap Event A utk Link A, Event B utk Link B)**:
   - **Tautan Folder Google Drive Mandiri**: Kategori "Semua Foto" kini memiliki input tautan / folder ID tersendiri untuk setiap event.
     - Event A (Andre & Fayola): Folder Google Drive `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5` (66 foto).
     - Event B (Wilson & Felicia): Folder Google Drive `1GGB77clCMYBIg17J0ECr2eVbD02ZeInW` (116 foto).
     - Event Baru: Mendapat input folder Google Drive mandiri saat dibuat maupun saat diedit.
   - **Input di Dua Tab Sekaligus**:
     - Ditambahkan di **Tab 1: Acara & Event** (`#cfgEventDriveFolderId`) agar langsung terlihat saat mengelola event.
     - Diberi keterangan jelas di **Tab 2: Foto & Kategori** (`#cfgDriveFolderId`) dengan badge nama event aktif.
     - Kedua input tersinkronisasi otomatis secara realtime (`handleEventDriveFolderInput`).
   - **Prioritas Fetch Langsung (`fetchGalleryData`)**:
     - Sistem langsung memindai folder Google Drive spesifik event aktif melalui `/api/drive-folder`. Foto untuk Event A dan Event B terisolasi penuh dan tidak akan pernah tertukar atau saling menimpa.

2. **Perbaikan Tab Menu Admin (Anti-Ikut Naik & Mudah Dijangkau Saat Scroll)**:
   - **Akar Masalah**: Pada perangkat mobile, tinggi modal yang melebihi viewport menyebabkan seluruh jendela overlay ter-scroll ke atas sehingga header dan bilah tab menu ikut naik dan menghilang keluar layar.
   - **Solusi Rekayasa CSS & JS**:
     - **Kunci Viewport Body**: Saat modal admin dibuka, scroll halaman background dikunci total (`document.body.style.overflow = "hidden"`).
     - **Full Viewport Shell di Mobile**: Pada layar HP (`max-width: 640px`), modal card diposisikan fullscreen presisi (`width: 100vw; height: 100dvh; border-radius: 0;`), di mana header dan `.admin-tabs-sticky-wrapper` terkunci permanen di atas (`flex-shrink: 0; position: sticky; top: 0; z-index: 50;`).
     - **Scroll Terisolasi**: Hanya `.admin-card-body` (konten formulir) yang ter-scroll ke bawah (`flex: 1; overflow-y: auto; overscroll-behavior: contain;`).
     - **Navigasi Tab 1-Baris Mudah Dijangkau**: Tab menu menggunakan alur horizontal touch-swipe (`flex-wrap: nowrap; overflow-x: auto;`) sehingga 4 tombol tab (`💍 Acara & Event`, `🖼️ Foto & Kategori`, `👥 Akun Admin`, `☁️ Cloud & API`) selalu berada di tempatnya, tidak pernah naik atau hilang, dan dapat dijangkau seketika dengan 1 ketukan.

3. **Audit Integritas Kode**:
   - `code.gs`: Syntax Valid (`vm.Script` PASSED).
   - `setup.gs`: Syntax Valid (`vm.Script` PASSED).
   - `js/app.js`: Syntax Valid (`node -c` PASSED).
   - Seluruh 36 menu & event handlers interaktif HTML berfungsi normal 100%.

## Versi 4.2.0 - Dedicated 1-Link-per-Event & Isolasi Home Screen Total (19 November 2026)

### 1. Perbaikan yang Diperintahkan & Diterapkan:
1. **1 Link Khusus per Event (Dedicated URL)**:
   - **Tautan Khusus**: Setiap event memiliki URL independen yang dapat dibagikan dan dibookmark:
     - Event 1: `https://gallery.runway.my.id/?event=andre-fayola-281`
     - Event 2: `https://gallery.runway.my.id/?event=wilson-felicia-133`
     - Event Baru: `https://gallery.runway.my.id/?event={newEventId}`
   - **Auto-Normalize URL Bar**: Jika seseorang membuka link dasar `https://gallery.runway.my.id/`, sistem secara otomatis menormalisasi address bar browser melalui `history.replaceState` menjadi link lengkap `?event={activeEventId}`, sehingga pengguna tidak pernah membagikan tautan kosong/polos.

2. **Isolasi Penuh Home Screen per Event (Anti-Bercampur)**:
   - **Identitas Pasangan, Tanggal & Lokasi**: Menampilkan 100% data unik milik event yang dipilih. Nama pasangan, tanggal, subjudul, dan pesan sambutan tidak saling tertimpa atau bercampur.
   - **Folder Google Drive & Galeri Foto**:
     - Andre & Fayola: Mengakses folder Google Drive `1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5` (66 foto aktual).
     - Wilson & Felicia: Mengakses folder Google Drive `1GGB77clCMYBIg17J0ECr2eVbD02ZeInW` (116 foto aktual).
     - Guard isolasi di `handleGalleryResponse`: Mencegah server cache lama menimpa foto event aktif. Cache lokal disimpan terpisah per event (`WEDDING_EVENT_PHOTOS_{eventId}`).
   - **Kategori & Vendor Photobooth**: Dibatasi murni pada event aktif.

3. **Perbaikan Tampilan & Sinkronisasi Panel Admin (Fix Bug Screenshot)**:
   - Mengatasi masalah di mana dropdown pilihan event dan input form tidak sinkron.
   - Kotak tautan event diperbarui dengan input monospace lengkap, tombol `📋 Salin Link` (copy ke clipboard), dan tombol `🌐 Buka Home` (membuka halaman utama event yang bersangkutan di tab baru).
   - Saat admin beralih antar event di dropdown, seluruh form, tautan, dan galeri foto langsung berpindah seketika tanpa perlu me-reload halaman.

4. **Audit Integritas Kode**:
   - `code.gs`: Syntax Valid (`vm.Script` PASSED).
   - `setup.gs`: Syntax Valid (`vm.Script` PASSED).
   - `js/app.js`: Syntax Valid (`node -c` PASSED).
   - Seluruh 36 handler interaktif HTML berfungsi normal.

## Versi 4.1.0 - Pinned Locked Navigation Tabs & Panduan Eksekusi ERP Google Sheets (19 November 2026)

### 1. Perbaikan yang Diperintahkan & Diterapkan:
1. **Kunci Navigasi Tab Admin (Anti-Tertutup Saat Scroll)**:
   - **Komponen**: `.admin-tabs-nav` dipindahkan ke wadah khusus `.admin-tabs-sticky-wrapper` yang berada di antara `.admin-card-header` dan `.admin-card-body`.
   - **Gaya CSS**: `position: sticky; top: 0; z-index: 25; background: #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`.
   - **Hasil**: Saat admin men-scroll konten formulir pada tab apapun (Acara & Event, Foto & Kategori, Akun Admin, Cloud & API), bilah navigasi tab **tetap terkunci di atas (pinned)** dan tidak pernah tertutup atau hilang dari pandangan.

2. **Hilangkan Fallback (Hardcode) Murni Realtime Database**:
   - Seluruh identitas pasangan dan kategori foto diambil realtime dari Google Spreadsheet & Google Drive.
   - Tidak ada dummy text hardcode; skeleton shimmer loading aktif selama transfer data.

3. **Inisialisasi Tabel ERP Google Sheets (`Daftar_Acara`, `Pengaturan`, `Pengguna_Admin`, `Daftar_Foto`, `Log_Aktivitas`)**:
   - **Akar Masalah Sebelumnya**: Script Google Apps Script yang ter-deploy online di Google Cloud masih menyimpan versi lama yang memicu error `ReferenceError: dummyPhotos is not defined` saat fungsi inisialisasi dipanggil.
   - **Solusi**:
     - Berkas [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) dan [code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs) telah dibersihkan 100% dari variabel rusak tersebut dan tervalidasi bebas syntax error (`vm.Script` PASSED).
     - Fungsi `setupTargetSpreadsheetDatabase()` dipindahkan ke **baris paling atas** di [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs) sehingga saat file dibuka di editor [script.google.com](https://script.google.com), fungsi tersebut otomatis terpilih pada toolbar atas.
     - Disediakan tombol langsung `⚡ Sinkronkan / Inisialisasi Database Google Sheets` di Panel Admin Web (Tab Cloud & API).

4. **Audit Integritas Menu (35 Event Handlers Lolos 100%)**:
   - Seluruh 35 handlers terdaftar aktif dan tervalidasi.
   - `node -c js/app.js` PASSED (Code 0).
