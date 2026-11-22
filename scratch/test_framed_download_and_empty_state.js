const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log("=== TEST SUITE: FRAMED DOWNLOAD FILENAME & ELEGANT EMPTY STATE ===");

// 1. Syntax check for all js files
const jsFiles = ['core.js', 'app.js', 'gallery.js', 'admin.js', 'categories.js'];
jsFiles.forEach(file => {
  const code = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8');
  assert.doesNotThrow(() => {
    new vm.Script(code);
  }, `Syntax error in js/${file}`);
  console.log(`[PASS] Syntax check: js/${file}`);
});

// 2. Test getExactPhotoFileName preserves exact original filename
const coreCode = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8');
const coreCtx = {
  window: {},
  document: { getElementById: () => null, addEventListener: () => null },
  localStorage: { getItem: () => null, setItem: () => null, removeItem: () => null },
  sessionStorage: { getItem: () => null, setItem: () => null },
  navigator: { userAgent: "Node" },
  URLSearchParams: class { get() { return null; } },
  console: console
};
vm.createContext(coreCtx);
vm.runInContext(coreCode, coreCtx);

const getExact = coreCtx.window.getExactPhotoFileName;
assert(typeof getExact === 'function', "getExactPhotoFileName must be exported to window");

// Check typical camera filenames
const testCases = [
  { input: { rawName: "DSC_0012.JPG" }, expected: "DSC_0012.JPG" },
  { input: { name: "IMG_20261121_191928.jpg" }, expected: "IMG_20261121_191928.jpg" },
  { input: { rawName: "Canon_5D_MarkIV_0099.JPEG" }, expected: "Canon_5D_MarkIV_0099.JPEG" },
  { input: { name: "Momen_Bahagia_01" }, expected: "Momen_Bahagia_01.jpg" },
  { input: { rawName: "Foto Pengantin & Keluarga.png" }, expected: "Foto Pengantin & Keluarga.png" }
];

testCases.forEach((tc, idx) => {
  const result = getExact(tc.input);
  assert.strictEqual(result, tc.expected, `Test case ${idx + 1} failed: expected "${tc.expected}", got "${result}"`);
  assert(!result.includes("berbingkai"), `Test case ${idx + 1} should NOT contain "berbingkai" suffix`);
  assert(!result.includes("-original"), `Test case ${idx + 1} should NOT contain "-original" suffix`);
  assert(!result.includes("-video"), `Test case ${idx + 1} should NOT contain "-video" suffix`);
  console.log(`[PASS] getExactPhotoFileName preserves exact name: ${result}`);
});

// 3. Test gallery.js does NOT use generateUniqueFileName for framed downloads
const galleryCode = fs.readFileSync(path.join(__dirname, '../js/gallery.js'), 'utf8');
assert(!galleryCode.includes('generateUniqueFileName(photo.rawName || photo.name, "berbingkai"'), 
  "gallery.js must not call generateUniqueFileName with 'berbingkai'");
console.log("[PASS] gallery.js no longer alters filename with 'berbingkai' suffix");

// 4. Test renderPhotoGrid empty state displays elegant text
const gridMock = { innerHTML: "" };
const docMock = {
  getElementById: (id) => {
    if (id === "photosGrid") return gridMock;
    return null;
  },
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
  addEventListener: () => null
};

const fullCtx = {
  window: {},
  document: docMock,
  localStorage: { getItem: () => null, setItem: () => null, removeItem: () => null },
  sessionStorage: { getItem: () => null, setItem: () => null },
  navigator: { userAgent: "Node" },
  URLSearchParams: class { get() { return null; } },
  Image: class { constructor() { this.naturalWidth = 1000; this.naturalHeight = 1000; } },
  HTMLCanvasElement: class {},
  console: console
};
fullCtx.window = fullCtx;
vm.createContext(fullCtx);

vm.runInContext(coreCode, fullCtx);
const galleryScript = fs.readFileSync(path.join(__dirname, '../js/gallery.js'), 'utf8');
vm.runInContext(galleryScript, fullCtx);

// Set state: empty photos in "Semua Foto" (with Drive folder configured)
fullCtx.state.filteredPhotos = [];
fullCtx.state.activeCategory = "Semua Foto";
fullCtx.state.allPhotosLabel = "Semua Foto";
fullCtx.state.activeConfig = { DRIVE_FOLDER_ID: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" };

fullCtx.renderPhotoGrid();
console.log("RENDERED HTML:", gridMock.innerHTML);

const emptyHtml = gridMock.innerHTML;
assert(emptyHtml.includes("✦ Momen Bahagia Segera Hadir ✦"), "Empty state must display elegant badge");
assert(emptyHtml.includes("Galeri Foto Masih Kosong"), "Empty state must display elegant title");
assert(emptyHtml.includes("Setiap senyuman, tatapan penuh cinta"), "Empty state must display poetic, romantic description");
console.log("[PASS] renderPhotoGrid produces elegant, romantic empty state without dummy photos");

// 5. Test app.js accepts photos: [] from drive-folder without error
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(!appCode.includes('throw new Error("Empty drive-folder response");'),
  "app.js must not throw error on empty drive-folder");
assert(appCode.includes('response.photos.filter(p =>'), 
  "app.js must sanitize and filter out legacy demo/dummy photos");
console.log("[PASS] app.js handles empty drive folder cleanly without falling back to dummy photos");

console.log("\nALL VERIFICATION CHECKS PASSED PERFECTLY (100%)!");
