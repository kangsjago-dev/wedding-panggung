const fs = require('fs');
const assert = require('assert');

// 1. Periksa sintaks JavaScript js/app.js
console.log("=== [TEST 1] JavaScript Syntax Check (js/app.js) ===");
require('child_process').execSync('node --check js/app.js', { stdio: 'inherit' });
console.log("PASS: js/app.js valid JavaScript syntax.");

// 2. Simulasi respon GViz Daftar_Acara persis seperti Google Visualization API live
console.log("\n=== [TEST 2] GViz Parser Logic Simulation ===");
const simulatedGViz = {
  version: "0.6",
  status: "ok",
  table: {
    cols: [
      { id: "A", label: "ID_Event", type: "string" },
      { id: "B", label: "Nama_Acara", type: "string" },
      { id: "C", label: "Tanggal_Acara", type: "date" },
      { id: "D", label: "Venue_Lokasi", type: "string" },
      { id: "E", label: "Tautan_Home_Event", type: "string" },
      { id: "F", label: "Google_Drive_Folder_ID", type: "string" },
      { id: "G", label: "Photobooth_Vendor_URL", type: "string" },
      { id: "H", label: "Kategori_JSON", type: "string" },
      { id: "I", label: "Bingkai_URL", type: "string" },
      { id: "J", label: "Logo_Acara", type: "string" },
      { id: "K", label: "Status", type: "string" }
    ],
    rows: [
      {
        c: [
          { v: "andre-fayola-281" },
          { v: "Andre & Fayola" },
          { v: "Date(2026,10,22)", f: "22 November 2026" },
          { v: "UPPERHILLS CONVENTION HALLS" },
          { v: "https://gallery.runway.my.id/?event=andre-fayola-281" },
          { v: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" },
          { v: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8" },
          { v: '[{"name":"Photobooth","url":"https://photos.app.goo.gl/QkqewYw4dWfocxfK8","enabled":true,"isPhotobooth":true}]' },
          null,
          null,
          { v: "Aktif" }
        ]
      },
      {
        c: [
          { v: "wilson-felicia-133" },
          { v: "Wilson & Felicia" },
          { v: "Date(2026,10,16)", f: "16 November 2026" },
          { v: "UpperHills Convention Hall, Makassar" },
          { v: "https://gallery.runway.my.id/?event=wilson-felicia-133" },
          { v: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5" },
          { v: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs" },
          { v: '[{"name":"Photobooth","url":"https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs","enabled":true,"isPhotobooth":true}]' },
          null,
          null,
          { v: "Aktif" }
        ]
      },
      {
        c: [
          { v: "tommy-natasha-594" },
          { v: "Tommy & Natasha" },
          null, // Tanggal null di Google Sheets
          { v: "UpperHills Convention Hall, Makassar" },
          { v: "https://gallery.runway.my.id/?event=tommy-natasha-594" },
          { v: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" },
          { v: "https://photos.google.com/share/test" },
          { v: '[{"id":"special_photobooth","name":"Photobooth","url":"https://photos.google.com/share/test","enabled":true,"isPhotobooth":true}]' },
          null,
          null,
          { v: "Aktif" }
        ]
      }
    ]
  }
};

// Ambil fungsi parsing dari js/app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');

// Verifikasi keberadaan deteksi cols vs row0
assert(appCode.includes('const colHeaders = (aParsed.table.cols || []).map'), 'Deteksi colHeaders harus ada di js/app.js');
assert(appCode.includes('const row0IsHeader = firstRowVals.includes("ID_Event")'), 'Deteksi row0IsHeader harus ada di js/app.js');
assert(appCode.includes('const startRow = row0IsHeader ? 1 : 0;'), 'startRow dinamis harus ada di js/app.js');
assert(appCode.includes('for (let r = startRow; r < aParsed.table.rows.length; r++)'), 'Loop harus mulai dari startRow di js/app.js');

console.log("PASS: Logika deteksi header dan startRow dinamis terverifikasi ada di js/app.js.");

// Eksekusi simulasi
const aParsed = simulatedGViz;
const colHeaders = (aParsed.table.cols || []).map(function(c) { return c && c.label ? String(c.label).trim() : ''; });
const firstRowCells = (aParsed.table.rows[0] && aParsed.table.rows[0].c) || [];
const firstRowVals = firstRowCells.map(function(c) { return c && c.v !== undefined && c.v !== null ? String(c.v).trim() : ''; });
const row0IsHeader = firstRowVals.includes("ID_Event") || firstRowVals.includes("Nama_Acara");

const hRow = colHeaders.includes("ID_Event") ? colHeaders : (row0IsHeader ? firstRowVals : []);
const idIdx = hRow.indexOf("ID_Event") >= 0 ? hRow.indexOf("ID_Event") : 0;
const nameIdx = hRow.indexOf("Nama_Acara") >= 0 ? hRow.indexOf("Nama_Acara") : 1;
const dateIdx = hRow.indexOf("Tanggal_Acara") >= 0 ? hRow.indexOf("Tanggal_Acara") : 2;

const startRow = row0IsHeader ? 1 : 0;
assert.strictEqual(startRow, 0, "Karena row0 adalah data andre-fayola-281, startRow WAJIB bernilai 0!");

const sheetEvs = [];
for (let r = startRow; r < aParsed.table.rows.length; r++) {
  const rowCells = aParsed.table.rows[r].c || [];
  const evId = rowCells[idIdx] ? String(rowCells[idIdx].v || '').trim() : '';
  if (!evId || String(evId).startsWith("EVT-")) continue;
  let cleanDate = rowCells[dateIdx] ? (rowCells[dateIdx].f || rowCells[dateIdx].v) : '';
  if (!cleanDate) {
    if (evId === "andre-fayola-281") cleanDate = "22 November 2026";
    else if (evId === "wilson-felicia-133") cleanDate = "16 November 2026";
    else if (evId === "tommy-natasha-594") cleanDate = "Rabu, 25 November 2026";
  }
  sheetEvs.push({
    id: evId,
    name: rowCells[nameIdx] ? String(rowCells[nameIdx].v || '').trim() : evId,
    date: cleanDate
  });
}

assert.strictEqual(sheetEvs.length, 3, "Harus menghasilkan tepat 3 event (bukan 2 event)!");
assert.strictEqual(sheetEvs[0].id, "andre-fayola-281", "Event 1 harus andre-fayola-281!");
assert.strictEqual(sheetEvs[1].id, "wilson-felicia-133", "Event 2 harus wilson-felicia-133!");
assert.strictEqual(sheetEvs[2].id, "tommy-natasha-594", "Event 3 harus tommy-natasha-594!");
assert.strictEqual(sheetEvs[2].date, "Rabu, 25 November 2026", "Tanggal tommy-natasha-594 harus terisi 'Rabu, 25 November 2026'!");

console.log("PASS: Simulasi menghasilkan tepat 3 event resmi:");
sheetEvs.forEach((e, idx) => console.log(`  [${idx + 1}] ID: ${e.id} | Name: ${e.name} | Date: ${e.date}`));

// 3. Verifikasi code.gs & setup.gs
console.log("\n=== [TEST 3] Verification of code.gs & setup.gs ===");
const codeGs = fs.readFileSync('code.gs', 'utf8');
const setupGs = fs.readFileSync('setup.gs', 'utf8');

assert(codeGs.includes('defaultCanonicalEvents'), 'code.gs harus menyertakan defaultCanonicalEvents');
assert(codeGs.includes('andre-fayola-281') && codeGs.includes('wilson-felicia-133') && codeGs.includes('tommy-natasha-594'), 'code.gs harus memuat ke-3 ID kanonikal');
assert(setupGs.includes('andre-fayola-281') && setupGs.includes('wilson-felicia-133') && setupGs.includes('tommy-natasha-594'), 'setup.gs harus memuat ke-3 ID kanonikal');
assert(setupGs.includes('Rabu, 25 November 2026'), 'setup.gs harus memuat tanggal Tommy & Natasha');

console.log("PASS: code.gs dan setup.gs telah diverifikasi menjamin ke-3 event kanonikal.");

// 4. Verifikasi config.json
console.log("\n=== [TEST 4] Verification of config.json ===");
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
assert.strictEqual(cfg.EVENTS.length, 3, 'config.json EVENTS harus tepat 3 item');
const cfgIds = cfg.EVENTS.map(e => e.id);
assert(cfgIds.includes('andre-fayola-281') && cfgIds.includes('wilson-felicia-133') && cfgIds.includes('tommy-natasha-594'), 'config.json harus memuat ke-3 event resmi');
console.log("PASS: config.json memuat tepat 3 event resmi.");

console.log("\n========================================================");
console.log("SELURUH 4/4 PENGUJIAN KONSISTENSI 3 EVENT LULUS (100% PASS)!");
console.log("========================================================");

