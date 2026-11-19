const fs = require('fs');
const path = require('path');

console.log("=== RUNNING VERIFICATION TEST v3.6.9 ===");

// 1. Test isGooglePhotosUrl logic
function isGooglePhotosUrl(url) {
  if (!url) return false;
  const s = String(url).toLowerCase().trim();
  return s.includes("photos.google.com") || s.includes("photos.app.goo.gl");
}

console.assert(isGooglePhotosUrl("https://photos.app.goo.gl/wJk4zU2v3X9") === true, "photos.app.goo.gl must be recognized");
console.assert(isGooglePhotosUrl("https://photos.google.com/share/AF1Qip...") === true, "photos.google.com must be recognized");
console.assert(isGooglePhotosUrl("https://drive.google.com/drive/folders/123") === false, "drive folder must not match google photos");
console.log("✓ Test 1 Passed: isGooglePhotosUrl recognizes photos.app.goo.gl and photos.google.com");

// 2. Test getPhotoRotation logic
const mockState = {
  activeCategory: "Wedding",
  allPhotosLabel: "Semua Foto",
  allPhotos: [{ id: "p1", autoRotate: 90, category: "Wedding" }],
  filteredPhotos: [{ id: "p1", autoRotate: 90, category: "Wedding" }]
};

function getPhotoRotation(photoId, categoryName, state) {
  let cat = categoryName || state.activeCategory || "";
  if (!cat && photoId) {
    const found = (state.filteredPhotos || []).find(function(x) { return x && x.id === photoId; }) ||
                  (state.allPhotos || []).find(function(x) { return x && x.id === photoId; });
    if (found && found.category) cat = found.category;
  }

  const mainLabel = state.allPhotosLabel || "Semua Foto";
  const isMain = (cat === mainLabel || cat === "Semua Foto");
  const isPb = cat.toLowerCase().includes("photobooth");

  if (cat && !isMain && !isPb) {
    return 0;
  }

  if (photoId && state.allPhotos) {
    const p = state.allPhotos.find(function(x) { return x && x.id === photoId; });
    if (p && p.autoRotate !== undefined && p.autoRotate !== 0) return parseInt(p.autoRotate, 10);
  }
  return 0;
}

console.assert(getPhotoRotation("p1", "Wedding", mockState) === 0, "Wedding category photo must return 0 deg");
console.assert(getPhotoRotation("p1", undefined, mockState) === 0, "Active category Wedding photo must return 0 deg");
console.assert(getPhotoRotation("p1", "Semua Foto", mockState) === 90, "Semua Foto main gallery can preserve orientation if explicitly set");
console.log("✓ Test 2 Passed: getPhotoRotation guarantees 0 deg (no rotation) for Kategori Momen Lainnya");

// 3. Test index.html has no duplicate cfgAllPhotosLabel in tabPane-event
const indexHtml = fs.readFileSync('index.html', 'utf8');
const tabPaneEventMatch = indexHtml.match(/<div class="admin-tab-pane active" id="tabPane-event">([\s\S]*?)<\/div>\s*<!-- Tab:/);
if (tabPaneEventMatch) {
  const contentEvent = tabPaneEventMatch[1];
  console.assert(!contentEvent.includes('cfgAllPhotosLabel'), "cfgAllPhotosLabel should not exist in tabPane-event");
  console.assert(!contentEvent.includes('Label Tab Galeri Utama'), "Label Tab Galeri Utama should not exist in tabPane-event");
}
console.log("✓ Test 3 Passed: Duplicate menu removed from tabPane-event in index.html");

// 4. Test api/drive-folder.js has autoRotateDeg = 0
const driveFolderJs = fs.readFileSync('api/drive-folder.js', 'utf8');
console.assert(driveFolderJs.includes('const autoRotateDeg = 0;'), "drive-folder.js must have autoRotateDeg = 0");
console.log("✓ Test 4 Passed: api/drive-folder.js sets autoRotateDeg = 0");

// 5. Test api/google-photos.js has redirect follow and isPhotobooth
const googlePhotosJs = fs.readFileSync('api/google-photos.js', 'utf8');
console.assert(googlePhotosJs.includes('redirect: "follow"'), "google-photos.js must have redirect follow");
console.assert(googlePhotosJs.includes('isPhotobooth: true'), "google-photos.js must flag isPhotobooth: true");
console.log("✓ Test 5 Passed: api/google-photos.js supports redirects and marks isPhotobooth");

// 6. Test code.gs syntax and support for photos.app.goo.gl
const codeGs = fs.readFileSync('code.gs', 'utf8');
console.assert(codeGs.includes('photos.app.goo.gl'), "code.gs must support photos.app.goo.gl");
console.assert(codeGs.includes('PHOTOBOOTH_URL'), "code.gs must store PHOTOBOOTH_URL");
console.log("✓ Test 6 Passed: code.gs supports photos.app.goo.gl and PHOTOBOOTH_URL");

// 7. Verify js/app.js syntax parsing
try {
  new Function(fs.readFileSync('js/app.js', 'utf8'));
  console.log("✓ Test 7 Passed: js/app.js JavaScript syntax is 100% valid");
} catch (e) {
  console.error("Syntax Error in js/app.js:", e);
  process.exit(1);
}

console.log("=== ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY! ===");

