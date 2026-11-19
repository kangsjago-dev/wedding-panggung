// Unit Test Suite: Verifikasi Penambahan & Sinkronisasi Sheet 'Daftar_Acara' (v4.25.0)
const fs = require('fs');
const assert = require('assert');

console.log("=== UNIT TEST: SINKRONISASI DAFTAR_ACARA & PENAMBAHAN REALTIME (v4.25.0) ===\n");

// 1. Uji setup.gs
console.log("[Test 1] Memeriksa setup.gs");
const setupContent = fs.readFileSync('setup.gs', 'utf8');
assert(setupContent.includes('function populateDaftarAcara()'), 'populateDaftarAcara() harus ada di setup.gs');
assert(setupContent.includes('andre-fayola-281'), 'Event andre-fayola-281 harus ada di setup.gs');
assert(setupContent.includes('wilson-felicia-133'), 'Event wilson-felicia-133 harus ada di setup.gs');
assert(setupContent.includes('tommy-natasha-594'), 'Event tommy-natasha-594 harus ada di setup.gs');
assert(setupContent.includes('sheetEvents.getLastRow() <= 1'), 'setupTargetSpreadsheetDatabase harus mendeteksi sheet kosong');
console.log("✓ PASS: setup.gs memiliki populateDaftarAcara() dan data 3 event lengkap\n");

// 2. Uji code.gs
console.log("[Test 2] Memeriksa code.gs");
const codeContent = fs.readFileSync('code.gs', 'utf8');
assert(codeContent.includes('function addEventToSheet('), 'addEventToSheet harus ada di code.gs');
assert(codeContent.includes('function syncAllEventsToSheet('), 'syncAllEventsToSheet harus ada di code.gs');
assert(codeContent.includes('function populateDaftarAcara()'), 'populateDaftarAcara harus ada di code.gs');
assert(codeContent.includes('action === "addEvent"'), 'action addEvent harus ada di handleApiRequest');
assert(codeContent.includes('action === "syncDaftarAcara"'), 'action syncDaftarAcara harus ada di handleApiRequest');
assert(codeContent.includes('Logo_Acara'), 'Header 11 kolom harus mencakup Logo_Acara');
console.log("✓ PASS: code.gs memiliki fungsi addEventToSheet, syncAllEventsToSheet, dan action API lengkap\n");

// 3. Uji index.html
console.log("[Test 3] Memeriksa index.html");
const indexContent = fs.readFileSync('index.html', 'utf8');
assert(indexContent.includes('triggerSyncDaftarAcara()'), 'Tombol Sinkronkan ke Sheets harus ada di index.html');
console.log("✓ PASS: index.html memiliki tombol Sinkronkan ke Sheets pada Tab Acara\n");

// 4. Uji js/app.js
console.log("[Test 4] Memeriksa js/app.js");
const appContent = fs.readFileSync('js/app.js', 'utf8');
assert(appContent.includes('function triggerSyncDaftarAcara()'), 'triggerSyncDaftarAcara harus ada di js/app.js');
assert(appContent.includes('window.triggerSyncDaftarAcara = triggerSyncDaftarAcara;'), 'triggerSyncDaftarAcara harus terikat ke window');
assert(appContent.includes('sheet=Daftar_Acara'), 'syncFromSpreadsheetGViz harus membaca sheet=Daftar_Acara');
assert(appContent.includes('callBackend("addEvent"'), 'handleAddNewEvent harus memicu addEvent ke backend');
console.log("✓ PASS: js/app.js memiliki triggerSyncDaftarAcara, pembacaan realtime Daftar_Acara, dan addEvent hook\n");

console.log("================================================================================");
console.log("SEMUA 4 PENGUJIAN SINKRONISASI DAFTAR_ACARA BERHASIL (100% PASS - 0 FAIL)!");
console.log("================================================================================");

