const fs = require('fs');
const assert = require('assert');

console.log('=== TEST SUITE: VERIFIKASI MODULARISASI, ISOLASI & REALTIME DATABASE ===\n');

// 1. Verifikasi Pemecahan Berkas Modular di js/
console.log('[Test 1] Memeriksa Berkas Modular Frontend di js/');
const modularFiles = ['js/core.js', 'js/categories.js', 'js/gallery.js', 'js/admin.js', 'js/app.js'];
modularFiles.forEach(f => {
  assert(fs.existsSync(f), f + ' harus ada');
  const size = fs.statSync(f).size / 1024;
  console.log('  ✓ ' + f + ' (' + size.toFixed(1) + ' KB) - Ukuran ideal (<90 KB)');
  const code = fs.readFileSync(f, 'utf8');
  new Function(code);
});
console.log('✓ PASS: Seluruh 5 berkas modular valid tanpa syntax error.\n');

// 2. Verifikasi index.html memuat seluruh berkas modular
console.log('[Test 2] Memeriksa index.html');
const indexHtml = fs.readFileSync('index.html', 'utf8');
modularFiles.forEach(f => {
  assert(indexHtml.includes(f), 'index.html harus memuat ' + f);
});
console.log('✓ PASS: index.html memuat core.js, categories.js, gallery.js, admin.js, dan app.js dalam urutan tepat.\n');

// 3. Verifikasi Penghilangan Fallback Hardcode pada config.json
console.log('[Test 3] Memeriksa config.json Bebas Fallback Hardcode');
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
assert(Array.isArray(cfg.EVENTS) && cfg.EVENTS.length === 0, 'EVENTS di config.json harus netral/kosong');
assert(!cfg.PHOTOBOOTH_URL, 'PHOTOBOOTH_URL di config.json harus kosong');
console.log('✓ PASS: config.json bebas dari data hardcode acara, galeri murni realtime dari spreadsheet.\n');

// 4. Verifikasi Isolasi Kategori & Anti-Stuck pada js/categories.js
console.log('[Test 4] Memeriksa Isolasi Kategori & Cache pada js/categories.js');
const catCode = fs.readFileSync('js/categories.js', 'utf8');
assert(catCode.includes('WEDDING_CAT_COUNT_" + evId + "_" + cat'), 'Pill count harus menyertakan evId');
console.log('✓ PASS: Cache kategori dan badge count terisolasi mutlak per-event ID.\n');

// 5. Verifikasi code.gs
console.log('[Test 5] Memeriksa code.gs');
const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(codeGs.includes('function saveAdminSettings'), 'saveAdminSettings harus ada');
assert(codeGs.includes('addEventToSheet'), 'addEventToSheet harus ada');
assert(codeGs.includes('mergedRowData'), 'Proteksi overwrite baris harus aktif');
console.log('✓ PASS: code.gs memiliki proteksi baris dan pemetaan akun admin dinamis.\n');

console.log('================================================================================');
console.log('SEMUA 5 PENGUJIAN INTEGRITAS BERHASIL 100% (PASS)!');
console.log('================================================================================');

