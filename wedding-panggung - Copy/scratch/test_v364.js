const fs = require('fs');
const path = require('path');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    pass++;
  } else {
    console.error(`[FAIL] ${message}`);
    fail++;
  }
}

console.log('====================================================');
console.log('TEST SUITE v3.6.4: VERIFIKASI PERMINTAAN USER #11');
console.log('====================================================\n');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const proxy = fs.readFileSync(path.join(__dirname, '../api/download-proxy.js'), 'utf8');

// 1. Verifikasi Hilangnya Tampilan "+ -" pada Preview Foto
assert(!html.includes('id="lightboxZoomToolbar"'), 'index.html: Element lightboxZoomToolbar telah dihapus');
assert(!html.includes('id="lightboxZoomOutBtn"'), 'index.html: Tombol lightboxZoomOutBtn (-) telah dihapus');
assert(!html.includes('id="lightboxZoomInBtn"'), 'index.html: Tombol lightboxZoomInBtn (+) telah dihapus');
assert(css.includes('.lightbox-zoom-toolbar {\n      display: none !important;'), 'css/style.css: .lightbox-zoom-toolbar disembunyikan mutlak');
assert(!js.includes('zoomToolbar.style.display = "inline-flex"'), 'js/app.js: Tidak ada lagi instruksi menampilkan toolbar zoom');

// 2. Verifikasi Unduh Khusus Photobooth Kualitas Asli (Tanpa Kompresi, Bukan Ukuran KB) & Tanpa Konfirmasi
assert(html.includes('onclick="handleCurrentLightboxDownload()"'), 'index.html: Tombol unduh menggunakan handleCurrentLightboxDownload dispatcher');
assert(js.includes('function handleCurrentLightboxDownload()'), 'js/app.js: Fungsi handleCurrentLightboxDownload tersedia');
assert(js.includes('rawUrl.replace(/\\?.*$/, "")'), 'js/app.js: Pembersihan query string fotoshare (?width=450) aktif di downloadPhotoboothOriginal');
assert(js.includes('rawMasterUrl = (it.url_hires || it.highres || it.img || it.url || "").replace(/\\?.*$/, "")'), 'js/app.js: Pembersihan query string aktif di fetchFotosharePhotos session');
assert(js.includes('const rawMasterUrl = u.replace(/\\?.*$/, "")'), 'js/app.js: Pembersihan query string aktif di fetchFotosharePhotos regex');
assert(proxy.includes('fileUrl = fileUrl.replace(/\\?.*$/, "")'), 'api/download-proxy.js: Server proxy membersihkan query string resize Fotoshare');

// 3. Verifikasi Eliminasi Flicker Cover Depan Saat Refresh
assert(js.includes('COVER_SETTINGS: {\n        enabled: false,'), 'js/app.js: GLOBAL_CONFIG.COVER_SETTINGS.enabled bernilai false secara default');
assert(js.includes('coverSettings: {\n        enabled: false,'), 'js/app.js: state.coverSettings.enabled bernilai false secara default');
assert(css.includes('.wedding-cover-hero:not(.is-active) {\n      display: none !important;\n    }'), 'css/style.css: .wedding-cover-hero:not(.is-active) display none !important');
assert(js.includes('container.style.setProperty("display", "none", "important")'), 'js/app.js: renderWeddingCoverShowcase menjaga display none important saat dinonaktifkan');

// 4. Verifikasi Pemisahan Berkas Berat (Modular Split)
assert(fs.existsSync(path.join(__dirname, '../js/cache-data.js')), 'js/cache-data.js: Berkas cache modular terpisah berhasil dibuat');
const cacheJs = fs.readFileSync(path.join(__dirname, '../js/cache-data.js'), 'utf8');
assert(cacheJs.includes('GOOGLE_PHOTOS_INITIAL_CACHE'), 'js/cache-data.js: Menampung data GOOGLE_PHOTOS_INITIAL_CACHE');
assert(cacheJs.includes('KING_PHOTOBOOTH_INITIAL_CACHE'), 'js/cache-data.js: Menampung data KING_PHOTOBOOTH_INITIAL_CACHE');
assert(cacheJs.includes('WEDDING_INITIAL_CACHE'), 'js/cache-data.js: Menampung data WEDDING_INITIAL_CACHE');
assert(html.includes('<script src="js/cache-data.js"></script>'), 'index.html: Memuat script js/cache-data.js');

const appJsStat = fs.statSync(path.join(__dirname, '../js/app.js'));
console.log(`[INFO] Ukuran js/app.js saat ini: ${appJsStat.size} bytes (sebelumnya ~294 KB)`);
assert(appJsStat.size < 200000, 'js/app.js: Ukuran berkas berhasil dipangkas signifikan');

// 5. Validasi Sintaks JavaScript
try {
  new Function(js);
  assert(true, 'js/app.js: Sintaks JavaScript 100% valid');
} catch (e) {
  assert(false, 'js/app.js parsing error: ' + e.message);
}

try {
  new Function(cacheJs);
  assert(true, 'js/cache-data.js: Sintaks JavaScript 100% valid');
} catch (e) {
  assert(false, 'js/cache-data.js parsing error: ' + e.message);
}

console.log(`\n====================================================`);
console.log(`HASIL TEST: ${pass} PASSED, ${fail} FAILED`);
console.log(`====================================================`);

if (fail > 0) process.exit(1);

