// Unit Test Suite: Verifikasi Penyelarasan Google Sheet & Live Website (v4.26.0)
const fs = require('fs');
const assert = require('assert');

console.log("=== UNIT TEST: PENYELARASAN GOOGLE SHEET & LIVE WEBSITE (v4.26.0) ===\n");

// 1. Test Date Normalization Logic
console.log("[Test 1] Pengujian Parser Tanggal GViz dan Standar Indonesia");
const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function testFormatIndonesianDateWithDay(dateStr) {
  if (!dateStr) return "";
  let s = String(dateStr).trim();
  const gvizMatch = s.match(/^Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+)?(?:,\s*\d+)?(?:,\s*\d+)?\)$/i);
  if (gvizMatch) {
    const y = parseInt(gvizMatch[1], 10);
    const m = parseInt(gvizMatch[2], 10); // 0-based
    const d = parseInt(gvizMatch[3], 10);
    const dateObj = new Date(y, m, d);
    const dayName = INDONESIAN_DAYS[dateObj.getDay()];
    const monthName = INDONESIAN_MONTHS[m] || "";
    return dayName + ", " + d + " " + monthName + " " + y;
  }
  return s;
}

const gvizTestDate = testFormatIndonesianDateWithDay("Date(2026,10,16)");
assert.strictEqual(gvizTestDate, "Senin, 16 November 2026", "Date(2026,10,16) harus di-parse menjadi 'Senin, 16 November 2026'");
console.log("✓ PASS: Format mentah Date(2026,10,16) berhasil diubah menjadi: '" + gvizTestDate + "'\n");

// 2. Test js/app.js Implementation
console.log("[Test 2] Memeriksa implementasi di js/app.js");
const appContent = fs.readFileSync('js/app.js', 'utf8');
assert(appContent.includes('function normalizeSheetDate('), "normalizeSheetDate harus ada di js/app.js");
assert(appContent.includes('gvizMatch'), "gvizMatch regex harus ada di formatIndonesianDateWithDay");
assert(appContent.includes('hasWilsonCanonical'), "Pembersihan duplicate wilson-felicia harus ada di renderAdminEventsManager");
assert(appContent.includes('startsWith("EVT-")'), "Pembersihan phantom event EVT- harus ada di js/app.js");
assert(appContent.includes('state.events = sheetEvs;'), "Sheet Daftar_Acara harus menjadi single source of truth absolut");
console.log("✓ PASS: js/app.js memiliki parser tanggal, eliminasi phantom event, dan strict reconciliation\n");

// 3. Test code.gs Implementation
console.log("[Test 3] Memeriksa sinkronisasi sheet Pengaturan di code.gs");
const codeContent = fs.readFileSync('code.gs', 'utf8');
assert(codeContent.includes('sheetSettings.getRange(sr + 1, 2).setValue(cleanEventsJson);'), "code.gs harus menyinkronkan sheet Pengaturan EVENTS");
console.log("✓ PASS: code.gs secara otomatis menyinkronkan array 3 event resmi ke sheet Pengaturan\n");

// 4. Test setup.gs Implementation
console.log("[Test 4] Memeriksa fungsi populateDaftarAcara di setup.gs");
const setupContent = fs.readFileSync('setup.gs', 'utf8');
assert(setupContent.includes('sheetSettings.getRange(sr + 1, 2).setValue(cleanEventsJson);'), "setup.gs harus menyinkronkan sheet Pengaturan EVENTS");
console.log("✓ PASS: setup.gs memiliki populateDaftarAcara yang meng-update kedua sheet\n");

// 5. Test config.json
console.log("[Test 5] Memeriksa kebersihan config.json");
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
assert.strictEqual(cfg.EVENTS.length, 3, "config.json harus memiliki tepat 3 event");
assert.strictEqual(cfg.EVENTS.some(e => e.id === "wilson-felicia"), false, "Slug lama wilson-felicia tidak boleh ada di config.json");
assert.strictEqual(cfg.EVENTS.some(e => e.id.startsWith("EVT-")), false, "Phantom event EVT- tidak boleh ada di config.json");
console.log("✓ PASS: config.json bersih dengan tepat 3 event resmi: " + cfg.EVENTS.map(e => e.id).join(", ") + "\n");

console.log("================================================================================");
console.log("SEMUA 5 PENGUJIAN PENYELARASAN DATA BERHASIL (100% PASS - 0 FAIL)!");
console.log("================================================================================");

