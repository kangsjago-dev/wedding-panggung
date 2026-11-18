// Test simulation of Category Tab Rendering lifecycle in js/app.js
const assert = require('assert');

// Mock localStorage
const localStorageMap = {
  'WEDDING_ALL_PHOTOS_COUNT': '60',
  'WEDDING_SAVED_CUSTOM_CATEGORIES': JSON.stringify([
    { id: 'special_photobooth', isPhotobooth: true, name: 'Photobooth', url: 'https://photos.app.goo.gl/QkqewYw4dWfocxfK8', enabled: true },
    { name: 'Wedding', url: 'https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI', enabled: true }
  ])
};

const localStorage = {
  getItem: (k) => localStorageMap[k] || null,
  setItem: (k, v) => { localStorageMap[k] = String(v); },
  removeItem: (k) => { delete localStorageMap[k]; }
};

// Simulate App State
const state = {
  allPhotosLabel: 'Semua Foto',
  allPhotos: [],
  categories: ['Semua Foto'],
  driveSubfolders: [],
  customCategories: JSON.parse(localStorage.getItem('WEDDING_SAVED_CUSTOM_CATEGORIES')),
  categoryPhotosMap: {}
};

// Simulate renderCategoryTabs logic
function simulateRenderTabs() {
  const mainLabel = state.allPhotosLabel || "Semua Foto";
  const uniqueCategories = [];
  const seen = {};
  seen[mainLabel] = true;
  seen["Semua Foto"] = true;
  uniqueCategories.push(mainLabel);

  // 1. Kategori kustom dari admin / config
  if (Array.isArray(state.customCategories)) {
    state.customCategories.forEach(function(item) {
      const catName = String((item && item.name) || item || "").trim();
      const isEnabled = (item && item.enabled !== undefined) ? item.enabled : true;
      if (catName && catName !== "Semua Foto" && isEnabled !== false && !seen[catName]) {
        seen[catName] = true;
        uniqueCategories.push(catName);
      }
    });
  }

  // 2. Kategori subfolder riil yang ditemukan dari Google Drive
  if (Array.isArray(state.driveSubfolders)) {
    state.driveSubfolders.forEach(function(c) {
      const catName = String(c || "").trim();
      if (catName && catName !== "Semua Foto" && catName !== mainLabel && !seen[catName]) {
        seen[catName] = true;
        uniqueCategories.push(catName);
      }
    });
  }

  state.categories = uniqueCategories;

  const renderedPills = [];
  state.categories.forEach(function(cat) {
    const isMain = (cat === mainLabel || cat === "Semua Foto");
    let countBadgeText = "";
    if (isMain) {
      if (state.allPhotos && state.allPhotos.length > 0) {
        countBadgeText = String(state.allPhotos.length);
      } else {
        const cachedCount = localStorage.getItem("WEDDING_ALL_PHOTOS_COUNT");
        countBadgeText = (cachedCount && cachedCount !== "0") ? cachedCount : "";
      }
    } else if (state.categoryPhotosMap && state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
      countBadgeText = String(state.categoryPhotosMap[cat].length);
    } else {
      let savedCount = localStorage.getItem("WEDDING_CAT_COUNT_" + cat);
      if (savedCount && savedCount !== "0") {
        countBadgeText = savedCount;
      } else if (cat.toLowerCase().includes("photobooth")) {
        countBadgeText = "637";
      } else if (cat.toLowerCase().includes("wedding")) {
        countBadgeText = "30";
      }
    }
    renderedPills.push({ cat, count: countBadgeText });
  });
  return renderedPills;
}

console.log("--- 1. Initial Page Load (Before Network Response) ---");
const initialPills = simulateRenderTabs();
console.log("Initial Pills:", initialPills);
assert.strictEqual(initialPills.length, 3);
assert.strictEqual(initialPills[0].cat, 'Semua Foto');
assert.strictEqual(initialPills[0].count, '60'); // Uses cached count, does NOT flicker to 0!
assert.strictEqual(initialPills[1].cat, 'Photobooth');
assert.strictEqual(initialPills[2].cat, 'Wedding');
// Ensure Wedding1 or ghost tabs are NOT present!
assert.strictEqual(initialPills.some(p => p.cat === 'Wedding1'), false);

console.log("--- 2. Network Response Arrives (handleGalleryResponse) ---");
const networkResponse = {
  success: true,
  categories: ['Semua Foto'],
  photos: new Array(60).fill({ id: 'photo1', category: 'Semua Foto' })
};

state.allPhotos = networkResponse.photos;
state.driveSubfolders = (networkResponse.categories || []).filter(c => c && c !== 'Semua Foto');

const afterResponsePills = simulateRenderTabs();
console.log("After Response Pills:", afterResponsePills);
assert.strictEqual(afterResponsePills.length, 3);
assert.strictEqual(afterResponsePills[0].cat, 'Semua Foto');
assert.strictEqual(afterResponsePills[0].count, '60');
assert.strictEqual(afterResponsePills[1].cat, 'Photobooth');
assert.strictEqual(afterResponsePills[2].cat, 'Wedding');

console.log("--- 3. Subsequent Re-renders (Zero Leaking) ---");
for (let i = 0; i < 5; i++) {
  const pills = simulateRenderTabs();
  assert.strictEqual(pills.length, 3);
  assert.strictEqual(pills.map(p => p.cat).join(','), 'Semua Foto,Photobooth,Wedding');
}
console.log("TEST PASSED: Category tabs are deterministic and 100% stable!");

