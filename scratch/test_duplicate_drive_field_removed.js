const fs = require('fs');
const assert = require('assert');

console.log("=== VERIFIKASI PENGHAPUSAN DUPLIKASI MENU FOLDER DRIVE TAB 1 ===");

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

const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

check("index.html bebas dari elemen input duplikat cfgEventDriveFolderId di Tab 1", () => {
  assert(!html.includes("cfgEventDriveFolderId"), "index.html tidak boleh memiliki cfgEventDriveFolderId");
});

check("index.html bebas dari teks duplikat 'Folder Google Drive (Kategori \\'Semua Foto\\' Event Ini)' di Tab 1", () => {
  assert(!html.includes("Folder Google Drive (Kategori 'Semua Foto' Event Ini)"), "Teks duplikat di Tab 1 harus sudah dihapus");
});

check("Tab 1 index.html tetap mempertahankan info event esensial (nama, logo, tanggal, venue, pesan)", () => {
  assert(html.includes('id="cfgCoupleName"'), "Harus ada cfgCoupleName");
  assert(html.includes('id="cfgEventLogoUrl"'), "Harus ada cfgEventLogoUrl");
  assert(html.includes('id="cfgEventDate"'), "Harus ada cfgEventDate");
  assert(html.includes('id="cfgEventVenue"'), "Harus ada cfgEventVenue");
  assert(html.includes('id="cfgWelcomeMessage"'), "Harus ada cfgWelcomeMessage");
});

check("Tab 2 (Foto & Kategori) tetap menjadi pusat kendali folder Drive dengan id cfgDriveFolderId", () => {
  assert(appJs.includes('id="cfgDriveFolderId"'), "Tab 2 harus memiliki cfgDriveFolderId");
  assert(appJs.includes("handleEventDriveFolderInput(this.value)"), "cfgDriveFolderId harus terhubung ke handleEventDriveFolderInput");
});

check("js/app.js bersih dari variabel usang cfgEventDriveFolderId", () => {
  assert(!appJs.includes("cfgEventDriveFolderId"), "js/app.js tidak boleh lagi merujuk ke cfgEventDriveFolderId");
});

check("handleSaveAllSettings membaca folder Drive dari cfgDriveFolderId di Tab 2", () => {
  const saveFunc = appJs.slice(appJs.indexOf("function handleSaveAllSettings"), appJs.indexOf("function handleSaveAllSettings") + 1200);
  assert(saveFunc.includes('document.getElementById("cfgDriveFolderId")?.value'), "handleSaveAllSettings harus membaca cfgDriveFolderId");
});

console.log("\nHASIL AKHIR: " + passed + " PASS, " + (total - passed) + " FAIL");
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

