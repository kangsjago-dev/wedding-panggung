const fs = require('fs');
const vm = require('vm');

console.log("=== COMPREHENSIVE AUDIT: PREVIEW, DOWNLOAD & ZERO-FALLBACK REALTIME ===");

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

const appCode = fs.readFileSync('js/app.js', 'utf8');

// 1. Uji getSharpPreviewUrl
const getSharpMatch = appCode.match(/function getSharpPreviewUrl[\s\S]*?\n    \}/);
assert(getSharpMatch !== null, "getSharpPreviewUrl ditemukan di js/app.js");

const context = {
  console: console
};
vm.runInNewContext(getSharpMatch[0], context);
const getSharpPreviewUrl = context.getSharpPreviewUrl;

// Uji Fotoshare: TIDAK BOLEH menghasilkan lh3.googleusercontent.com
const fotosharePhoto = {
  id: "ZJGYCfWbttuEG8Q67ocZs",
  name: "Photobooth 1",
  previewUrl: "https://cdn-bz-op.fotoshare.co/abc/xyz.JPG?w=800",
  highResUrl: "https://cdn-bz-op.fotoshare.co/abc/xyz.JPG",
  downloadUrl: "https://cdn-bz-op.fotoshare.co/abc/xyz.JPG",
  isPhotobooth: true
};
const fsUrl = getSharpPreviewUrl(fotosharePhoto);
assert(!fsUrl.includes("lh3.googleusercontent.com"), "Fotoshare preview TIDAK corrupt menjadi lh3.googleusercontent.com");
assert(fsUrl === "https://cdn-bz-op.fotoshare.co/abc/xyz.JPG", "Fotoshare preview mengembalikan URL master cdn-bz-op asli");

// Uji Google Photos
const gPhotosPhoto = {
  id: "gp_1",
  name: "Google Photos 1",
  previewUrl: "https://lh3.googleusercontent.com/pw/AP1GczMabc=w1600-h1200",
  isPhotobooth: true
};
const gpUrl = getSharpPreviewUrl(gPhotosPhoto);
assert(gpUrl === "https://lh3.googleusercontent.com/pw/AP1GczMabc=w3200", "Google Photos preview menghasilkan w3200 resolusi penuh");

// Uji Google Drive
const drivePhoto = {
  id: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
  name: "Foto Drive",
  highResUrl: "https://drive.google.com/file/d/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5/view",
  category: "Semua Foto"
};
const drUrl = getSharpPreviewUrl(drivePhoto);
assert(drUrl === "https://lh3.googleusercontent.com/d/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5=w3200", "Google Drive preview menghasilkan lh3 w3200 resolusi penuh");

// 2. Periksa definisi openLightbox dan ketiadaan error ReferenceError photo
const openLbMatch = appCode.match(/function openLightbox\(index\)\s*\{([\s\S]*?)\n    \}/);
assert(openLbMatch !== null, "openLightbox ditemukan di js/app.js");
const openLbBody = openLbMatch ? openLbMatch[1] : "";
assert(openLbBody.includes('const photo = state.filteredPhotos[index];'), "openLightbox mendeklarasikan 'const photo = state.filteredPhotos[index]' sebelum digunakan");
assert(openLbBody.indexOf('updateLightboxContent()') < openLbBody.indexOf('precompositeLightboxPhoto(photo)'), "updateLightboxContent dipanggil sebelum precompositeLightboxPhoto untuk respon instan");

// 3. Periksa ketersediaan fallback frame pada tombol unduh
assert(appCode.includes('if (hasFrame) {') && appCode.includes('Simpan Kenangan Berbingkai'), "Tombol unduh mendeteksi ketersediaan frame secara akurat");
assert(appCode.includes('Unduh Foto Asli (Ukuran Penuh)'), "Tombol unduh mengizinkan unduh foto asli ukuran penuh jika tanpa frame");

// 4. Periksa audit 3x eliminasi fallback hardcode
assert(!appCode.includes('usr_superadmin'), "js/app.js bebas dari fallback usr_superadmin");
assert(!appCode.includes('"123456"'), "js/app.js bebas dari fallback PIN 123456");

const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(!codeGs.includes('inputPass === "123"'), "code.gs bebas dari bypass password 123");
assert(!codeGs.includes('matchedUser = {\n        id: "usr_superadmin"'), "code.gs bebas dari fallback akun mock usr_superadmin");

console.log(`\nHASIL VERIFIKASI: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);

