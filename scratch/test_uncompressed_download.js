const fs = require('fs');

console.log("=== VERIFIKASI DOWNLOAD UKURAN ASLI TANPA KOMPRESI ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("✅ PASS: " + message);
    passed++;
  } else {
    console.error("❌ FAIL: " + message);
    failed++;
  }
}

// 1. Audit api/download-proxy.js
const proxyCode = fs.readFileSync('api/download-proxy.js', 'utf8');
assert(proxyCode.includes('drive.usercontent.google.com/download?id='), "api/download-proxy.js mengunduh berkas Google Drive langsung tanpa kompresi");
assert(!proxyCode.includes('lh3.googleusercontent.com/d/${fileId}=w3200'), "api/download-proxy.js TIDAK mengompresi berkas Drive ke w3200 thumbnail");

// 2. Audit api/drive-folder.js
const driveFolderCode = fs.readFileSync('api/drive-folder.js', 'utf8');
assert(driveFolderCode.includes('drive.usercontent.google.com/download?id='), "api/drive-folder.js menyetel downloadUrl ke endpoint master asli");

// 3. Audit code.gs
const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(codeGs.includes('drive.usercontent.google.com/download?id='), "code.gs menyetel downloadUrl ke endpoint master asli");

// 4. Audit js/app.js executeDirectPhotoDownload
const appCode = fs.readFileSync('js/app.js', 'utf8');
assert(appCode.includes('drive.usercontent.google.com/download?id='), "js/app.js executeDirectPhotoDownload menggunakan endpoint master asli Drive");
assert(!appCode.includes('photoList = [\n          "https://images.unsplash.com'), "js/app.js bebas dari fallback gambar cover unsplash");

console.log(`\nHASIL AKHIR: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);

