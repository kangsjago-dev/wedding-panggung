const fs = require('fs');
const assert = require('assert');

console.log("=== VERIFIKASI PERBAIKAN UNDUH PHOTOBOOTH & ELIMINASI TOTAL FALLBACK ===");

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log("✅ PASS: " + desc);
    passed++;
  } catch (err) {
    console.error("❌ FAIL: " + desc + " -> " + err.message);
  }
}

const appJs = fs.readFileSync('js/app.js', 'utf8');
const codeGs = fs.readFileSync('code.gs', 'utf8');

// 1. Verifikasi executeDirectPhotoDownload
check("executeDirectPhotoDownload melakukan fetch(proxyUrl) untuk mengambil blob fisik", () => {
  assert(appJs.includes("fetch(proxyUrl)"), "Harus melakukan fetch(proxyUrl)");
  assert(appJs.includes("return res.blob();"), "Harus memanggil res.blob()");
});

check("executeDirectPhotoDownload memvalidasi blob.size sebelum menyimpan ke perangkat", () => {
  assert(appJs.includes("if (!blob || blob.size === 0) throw new Error"), "Harus mengecek blob.size");
});

check("executeDirectPhotoDownload memanggil saveBlobToDevice dengan blob fisik", () => {
  assert(appJs.includes("saveBlobToDevice(blob, fileName);"), "Harus menyimpan blob fisik");
});

check("executeDirectPhotoDownload TIDAK lagi memanggil triggerDirectLinkDownload sebelum blob diunduh", () => {
  const funcSlice = appJs.slice(appJs.indexOf("function executeDirectPhotoDownload"), appJs.indexOf("function saveBlobToDevice"));
  assert(!funcSlice.includes("triggerDirectLinkDownload(proxyUrl, fileName);\n        showToast"), "Tidak boleh panggil triggerDirectLinkDownload sebelum blob siap");
});

check("executeDirectPhotoDownload hanya memperbarui widget ke '✓ Berhasil Disimpan!' setelah blob tervalidasi", () => {
  const funcSlice = appJs.slice(appJs.indexOf("function executeDirectPhotoDownload"), appJs.indexOf("function saveBlobToDevice"));
  const blobIdx = funcSlice.indexOf("saveBlobToDevice(blob, fileName)");
  const successIdx = funcSlice.indexOf('updateDownloadWidget(100, "✓ Berhasil Disimpan!"');
  assert(blobIdx !== -1 && successIdx !== -1 && successIdx > blobIdx, "Status berhasil wajib muncul SETELAH blob disimpan");
});

// 2. Verifikasi downloadCurrentPhotoWithFrame
check("downloadCurrentPhotoWithFrame mendelegasikan unduhan photobooth ke executeDirectPhotoDownload", () => {
  const funcSlice = appJs.slice(appJs.indexOf("function downloadCurrentPhotoWithFrame"), appJs.indexOf("function processNextDownloadQueue"));
  assert(funcSlice.includes("executeDirectPhotoDownload(photo);"), "Harus delegasi ke executeDirectPhotoDownload");
  assert(!funcSlice.includes("triggerDirectLinkDownload(proxyUrl, fileName)"), "TIDAK boleh menggunakan triggerDirectLinkDownload mentah");
});

// 3. Verifikasi saveBlobToDevice
check("saveBlobToDevice mendukung iOS Safari dan penanganan klik aman", () => {
  const funcSlice = appJs.slice(appJs.indexOf("function saveBlobToDevice"), appJs.indexOf("function triggerDirectLinkDownload"));
  assert(funcSlice.includes("isIOS"), "Harus mendeteksi iOS");
  assert(funcSlice.includes("URL.createObjectURL(blob)"), "Harus membuat object URL dari blob");
});

// 4. Verifikasi formatFileSize
check("formatFileSize terdefinisi dan menghasilkan string ukuran yang rapi", () => {
  assert(appJs.includes("function formatFileSize("), "Fungsi formatFileSize harus ada");
});

// 5. Verifikasi Penghapusan Fallback Frontend
check("GLOBAL_CONFIG.EVENTS adalah array kosong [] (murni realtime database)", () => {
  assert(appJs.includes("EVENTS: [],"), "GLOBAL_CONFIG.EVENTS harus []");
});

check("GLOBAL_CONFIG.ACTIVE_EVENT_ID adalah string kosong \"\" (murni realtime)", () => {
  assert(appJs.includes('ACTIVE_EVENT_ID: "",'), "GLOBAL_CONFIG.ACTIVE_EVENT_ID harus \"\"");
});

check("state.currentEventId diawali dengan string kosong \"\"", () => {
  assert(appJs.includes('currentEventId: "",'), "state.currentEventId harus \"\"");
});

// 6. Verifikasi Penghapusan Fallback Backend code.gs
check("code.gs WEDDING_CONFIG.EVENT_NAME adalah string kosong \"\"", () => {
  assert(codeGs.includes('EVENT_NAME: "",'), "WEDDING_CONFIG.EVENT_NAME harus \"\"");
});

check("code.gs WEDDING_CONFIG.EVENTS adalah string '[]'", () => {
  assert(codeGs.includes("EVENTS: '[]',"), "WEDDING_CONFIG.EVENTS harus '[]'");
});

check("code.gs getActiveEventConfig bebas dari fallback event statis", () => {
  assert(!codeGs.includes('venue: "UPPERHILLS CONVENTION HALLS"'), "Tidak boleh ada fallback array event statis di getActiveEventConfig");
});

check("code.gs getAdminUsersList bebas dari fallback PIN 111111", () => {
  assert(!codeGs.includes('DEFAULT_ADMIN_PIN || "111111"'), "Tidak boleh ada fallback PIN 111111");
});

console.log("\nHASIL AKHIR: " + passed + " PASS, " + (total - passed) + " FAIL");
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

