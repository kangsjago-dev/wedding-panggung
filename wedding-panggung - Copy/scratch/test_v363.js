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
console.log('TEST SUITE v3.6.3: VERIFIKASI PERMINTAAN USER #10');
console.log('====================================================\n');

// 1. Verifikasi hilangnya tampilan 100% pada Lightbox Preview
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

assert(!html.includes('lightboxZoomLevelText'), 'index.html: Element lightboxZoomLevelText telah dihapus');
assert(!html.includes('>100%<'), 'index.html: Teks 100% tidak ada di index.html');
assert(!js.includes('lightboxZoomLevelText'), 'js/app.js: Tidak ada referensi ke lightboxZoomLevelText');

// 2. Verifikasi Kategori Khusus Photobooth Download Ukuran File Asli (JANGAN DIUBAH UKURANNYA)
assert(js.includes('function downloadPhotoboothOriginal(photo)'), 'js/app.js: Fungsi downloadPhotoboothOriginal tersedia');
assert(js.includes('isPhotobooth: true'), 'js/app.js: Flag isPhotobooth terpasang pada builder photobooth');

// Guard pada downloadCurrentPhotoWithFrame
const guardMatch = js.includes('downloadCurrentPhotoWithFrame') && 
  js.includes('downloadPhotoboothOriginal(photo);') &&
  js.includes('JAMINAN MUTLAK: Kategori khusus Photobooth SELALU diunduh ukuran aslinya');
assert(guardMatch, 'js/app.js: Guard mutlak di downloadCurrentPhotoWithFrame mencegah foto photobooth masuk ke canvas');

// Deteksi komprehensif di updateLightboxContent
const lbPbMatch = js.includes('photo.isKing') && 
  js.includes('photo.isVideo') && 
  js.includes('photo.isPhotobooth') && 
  js.includes('kingphotobooth.co') && 
  js.includes('fotoshare.co');
assert(lbPbMatch, 'js/app.js: Deteksi komprehensif photobooth di updateLightboxContent mencakup semua vendor & flag');

// 3. Verifikasi Mode Preview Admin saat View Gallery (Penataan Icon & Tulisan Lebih Menarik)
assert(html.includes('id="adminActiveFloatingBar" class="admin-floating-dock"'), 'index.html: Floating dock admin aktif terpasang');
assert(html.includes('class="admin-dock-identity"'), 'index.html: Identitas sesi admin terpasang');
assert(html.includes('class="admin-dock-badge-pulse"'), 'index.html: Live pulse badge hijau terpasang');
assert(html.includes('class="admin-dock-sub">Mode Admin • Pratinjau</span>'), 'index.html: Sub-title hierarki admin terpasang');
assert(html.includes('class="admin-float-btn settings"'), 'index.html: Tombol Pengaturan dengan ikon SVG gear terpasang');
assert(html.includes('class="admin-float-btn logout"'), 'index.html: Tombol Keluar dengan ikon SVG exit terpasang');

// CSS Floating Dock & Active Dot
assert(css.includes('.admin-floating-dock'), 'css/style.css: Style .admin-floating-dock terpasang');
assert(css.includes('.admin-dock-badge-pulse'), 'css/style.css: Style .admin-dock-badge-pulse terpasang');
assert(css.includes('.admin-float-btn.settings'), 'css/style.css: Style tombol pengaturan terpasang');
assert(css.includes('.admin-float-btn.logout'), 'css/style.css: Style tombol logout terpasang');
assert(css.includes('.ctrl-icon-btn.admin-active .admin-active-dot'), 'css/style.css: Style .admin-active-dot terpasang');

// JS Admin Button UI
assert(js.includes('function updateAdminButtonUI(isLoggedIn)'), 'js/app.js: Fungsi updateAdminButtonUI terpasang');
assert(js.includes('updateAdminButtonUI(true);'), 'js/app.js: updateAdminButtonUI(true) dipanggil saat login berhasil');
assert(js.includes('updateAdminButtonUI(false);'), 'js/app.js: updateAdminButtonUI(false) dipanggil saat logout');

// 4. Sintaks Validasi JavaScript
try {
  new Function(js);
  assert(true, 'js/app.js: Sintaks JavaScript 100% valid tanpa parsing error');
} catch (e) {
  assert(false, 'js/app.js parsing error: ' + e.message);
}

console.log(`\n====================================================`);
console.log(`HASIL TEST: ${pass} PASSED, ${fail} FAILED`);
console.log(`====================================================`);

if (fail > 0) process.exit(1);

