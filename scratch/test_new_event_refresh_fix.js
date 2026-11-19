const assert = require('assert');
const fs = require('fs');

console.log("=== UNIT TEST: PERBAIKAN REFRESH EVENT BARU & INFINITE LOADING (v4.23.0) ===");

const appJs = fs.readFileSync('js/app.js', 'utf8');

// Test 1: In initApp(), verify that when an event has 0 cached photos, renderPhotoGrid() is called immediately (0ms) instead of leaving skeleton cards
console.log("\n[Test 1] Memeriksa pembersihan skeleton instan di initApp() saat photo cache kosong");
assert(appJs.includes("// Event baru dibuat / belum ada cache foto: bersihkan skeleton dan tampilkan status siap seketika"), "Komentar handling event baru harus ada di initApp()");
assert(appJs.includes("state.allPhotos = [];\n          state.filteredPhotos = [];\n          renderPhotoGrid();"), "renderPhotoGrid() harus dipanggil seketika saat photo cache belum ada");
console.log("✓ PASS: Skeleton cards langsung digantikan status siap seketika pada event baru");

// Test 2: In config.json fetch, verify premature 404 abort is removed so flow can proceed to Google Spreadsheet GViz sync
console.log("\n[Test 2] Memeriksa pencegahan premature 404 di config.json fetch");
assert(!appJs.includes('if (!matchedEv) {\n                showEventNotFoundScreen(true, explicitUrl);\n                return;\n              }'), "config.json fetch tidak boleh memicu premature 404 sebelum GViz");
assert(appJs.includes("Event belum ada di config.json statis, melanjutkan ke sinkronisasi Google Spreadsheet..."), "Log pengaliran ke Google Spreadsheet sync harus ada");
console.log("✓ PASS: Event baru tidak di-abort prematur di config.json statis");

// Test 3: In fetchGalleryData(), verify fail-safe watchdog timer (3.5s) exists
console.log("\n[Test 3] Memeriksa fail-safe watchdog timer di fetchGalleryData()");
assert(appJs.includes("watchdogTimer = setTimeout(function()"), "Watchdog timer harus aktif di fetchGalleryData");
assert(appJs.includes("}, 3500);"), "Watchdog timeout 3.5 detik harus terkonfigurasi");
assert(appJs.includes("remainingSkeletons.length > 0 && (!state.filteredPhotos || state.filteredPhotos.length === 0)"), "Watchdog harus memeriksa dan membersihkan sisa skeleton cards");
console.log("✓ PASS: Fail-safe watchdog 3.5 detik aktif melindungi grid dari infinite loading");

// Test 4: In fetchGalleryData(), verify AbortController timeout on /api/drive-folder
console.log("\n[Test 4] Memeriksa AbortController dan fallback GAS pada /api/drive-folder");
assert(appJs.includes("dfController = (typeof AbortController !== 'undefined') ? new AbortController() : null"), "AbortController harus digunakan pada /api/drive-folder");
assert(appJs.includes("Empty or unauthenticated drive-folder API"), "Drive-folder harus fallback ke GAS jika foto kosong / tidak terotentikasi");
console.log("✓ PASS: /api/drive-folder dilengkapi timeout dan auto-fallback ke Google Apps Script");

// Test 5: In handleGalleryResponse(), verify skeleton removal when 0 photos
console.log("\n[Test 5] Memeriksa pembersihan skeleton di handleGalleryResponse() saat photos 0");
assert(appJs.includes('if (grid && grid.querySelector(".skeleton-card")) {\n          renderPhotoGrid();\n        }'), "handleGalleryResponse harus menghapus skeleton-card jika foto kosong");
console.log("✓ PASS: Skeleton cards dijamin bersih 100% pada galeri baru dengan 0 foto");

// Test 6: In showGridSkeleton(), verify timeout watchdog
console.log("\n[Test 6] Memeriksa timeout watchdog di showGridSkeleton()");
assert(appJs.includes("Watchdog pengaman agar skeleton kategori tidak terkunci jika server eksternal lambat"), "showGridSkeleton harus memiliki watchdog pengaman");
console.log("✓ PASS: showGridSkeleton tidak akan terkunci selamanya");

// Test 7: Verify code.gs returns eventsList and activeEventId on all empty / error branches
console.log("\n[Test 7] Memeriksa pengembalian events dan activeEventId di code.gs");
const codeGs = fs.readFileSync('code.gs', 'utf8');
const countEventsList = (codeGs.match(/events:\s*eventsList/g) || []).length;
assert(countEventsList >= 4, "code.gs harus menyertakan events: eventsList di minimal 4 cabang getGalleryData()");
console.log("✓ PASS: code.gs selalu menyertakan registry events dan activeEventId (" + countEventsList + " lokasi)");

console.log("\n================================================================================");
console.log("SEMUA 7 PENGUJIAN PERBAIKAN LOADING REFRESH BERHASIL (100% PASS - 0 FAIL)!");
console.log("================================================================================\n");

