const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log("=== RUNNING MULTI-DEVICE SYNC & FRAME VERIFICATION TEST ===");

const html = fs.readFileSync('index.html', 'utf8');
const coreJs = fs.readFileSync('js/core.js', 'utf8');
const categoriesJs = fs.readFileSync('js/categories.js', 'utf8');
const galleryJs = fs.readFileSync('js/gallery.js', 'utf8');
const adminJs = fs.readFileSync('js/admin.js', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Build element mock registry
const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const elements = {};

function createMockElement(id) {
  return {
    id: id,
    tagName: 'DIV',
    value: '',
    checked: true,
    innerText: '',
    textContent: '',
    innerHTML: '',
    src: '',
    dataset: {},
    style: {
      display: '',
      color: '',
      setProperty: function(k, v) { this[k] = v; },
      removeProperty: function(k) { delete this[k]; }
    },
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    getAttribute: function(attr) { return this[attr] || null; },
    setAttribute: function(attr, val) { this[attr] = val; },
    removeAttribute: function(attr) { delete this[attr]; },
    appendChild: function(c) { if (!this.children) this.children = []; this.children.push(c); },
    querySelectorAll: function(s) { return []; },
    querySelector: function(s) { return null; },
    closest: function() { return null; },
    remove: function() {}
  };
}

idMatches.forEach(id => {
  elements[id] = createMockElement(id);
});

// Seed default initial values from index.html
if (html.includes('Terima kasih atas kehadiran')) {
  elements['welcomeMessage'].textContent = "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.";
}
if (html.includes('The Wedding Gallery &amp; Precious Memories')) {
  elements['subtitle'].textContent = "The Wedding Gallery & Precious Memories";
}
if (html.includes('Diabadikan dengan cinta')) {
  elements['footerBlessing'].textContent = "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";
}

const mockDocument = {
  getElementById: function(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  querySelectorAll: function(sel) { return []; },
  querySelector: function(sel) { return null; },
  createElement: function(tag) { return createMockElement('dynamic_' + tag); },
  body: createMockElement('body'),
  documentElement: createMockElement('documentElement'),
  addEventListener: function() {}
};

const mockLocalStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

const context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  document: mockDocument,
  localStorage: mockLocalStorage,
  Image: function() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
    this.crossOrigin = '';
  },
  location: {
    origin: 'https://gallery.runway.my.id',
    pathname: '/',
    search: '?event=andre-fayola-281',
    protocol: 'https:',
    host: 'gallery.runway.my.id'
  },
  history: {
    replaceState: function() {}
  },
  URLSearchParams: URLSearchParams,
  fetch: function() {
    return Promise.resolve({
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({ success: false })
    });
  }
};
context.window = context;
context.window.document = mockDocument;

vm.createContext(context);
vm.runInContext(coreJs, context);
vm.runInContext(categoriesJs, context);
vm.runInContext(galleryJs, context);
vm.runInContext(adminJs, context);
vm.runInContext(appJs, context);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("[PASS] " + message);
    passed++;
  } else {
    console.error("[FAIL] " + message);
    failed++;
  }
}

// TEST 1: Default Welcome Message, Subtitle & Footer on fresh device (no localStorage)
const welcomeEl = mockDocument.getElementById("welcomeMessage");
const subtitleEl = mockDocument.getElementById("subtitle");
const footerEl = mockDocument.getElementById("footerBlessing");

assert(welcomeEl && welcomeEl.textContent.includes("Terima kasih atas kehadiran"), "Welcome message renders default text on fresh device");
assert(subtitleEl && subtitleEl.textContent.includes("The Wedding Gallery"), "Subtitle renders default text on fresh device");
assert(footerEl && footerEl.textContent.includes("Diabadikan dengan cinta"), "Footer blessing renders default text on fresh device");

// TEST 2: Live Frame URL input handler & badge update
const frameBadge = mockDocument.getElementById("frameStatusBadge");
context.handleFrameUrlInput("https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view");
assert(context.state.activeConfig.FRAME_IMAGE_URL === "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view", "handleFrameUrlInput updates state.activeConfig.FRAME_IMAGE_URL");
assert(frameBadge && frameBadge.innerText.includes("Bingkai Aktif"), "frameStatusBadge updates to '✓ Bingkai Aktif' on valid input");

context.handleFrameUrlInput("");
assert(context.state.activeConfig.FRAME_IMAGE_URL === "", "handleFrameUrlInput clears frame on empty input");
assert(frameBadge && frameBadge.innerText.includes("Tanpa Bingkai"), "frameStatusBadge updates to 'Tanpa Bingkai' on empty input");

// TEST 3: Category 'Semua Foto' (or customized label) empty states
context.state.allPhotos = [];
context.state.filteredPhotos = [];
context.state.allPhotosLabel = "Photostage";
context.state.activeCategory = "Photostage";
context.state.activeConfig.DRIVE_FOLDER_ID = "";

// When link is empty:
context.renderPhotoGrid("", "Photostage");
const gridEl = mockDocument.getElementById("photosGrid");
assert(gridEl.innerHTML.includes("Momen Utama • Photostage"), "Empty main gallery without link shows 'Momen Utama • Photostage' badge");
assert(gridEl.innerHTML.includes("Foto Belum Tersedia"), "Empty main gallery without link shows 'Foto Belum Tersedia' title");
assert(gridEl.innerHTML.includes("belum ditautkan"), "Empty main gallery without link explains folder is not yet linked");

// When link is configured but 0 photos:
context.state.activeConfig.DRIVE_FOLDER_ID = "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh";
context.renderPhotoGrid("https://drive.google.com/drive/folders/1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh", "Photostage");
assert(gridEl.innerHTML.includes("Momen Sedang Dipersiapkan"), "Empty main gallery with link shows 'Momen Sedang Dipersiapkan'");

// TEST 4: 'Semua Foto' / custom label is NOT treated as Photobooth
const dummyPhoto = { id: "p1", name: "Photo1.jpg", url: "https://drive.google.com/1" };
const isPb = context.isPhotoPhotobooth(dummyPhoto);
assert(isPb === false, "Photo in main category 'Photostage' is NOT treated as photobooth");

// TEST 5: Normalization of Google Drive Frame URL with 27-28 character ID
const testFrameUrl = "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view";
const normFrame = context.normalizeDriveImageUrl(testFrameUrl);
assert(normFrame === "https://lh3.googleusercontent.com/d/11u-XHGv13oljACPnwSfTIS65NE=w2500", "Google Drive frame URL properly converted to direct high-res image link: " + normFrame);

// TEST 6: Multi-Device GViz Sync Simulation
const samplePengaturan = '/*O_o*/\ngoogle.visualization.Query.setResponse({"version":"0.6","status":"ok","table":{"cols":[{"id":"A","label":"Parameter","type":"string"},{"id":"B","label":"Nilai","type":"string"}],"rows":[{"c":[{"v":"WELCOME_MESSAGE"},{"v":"Selamat datang di pernikahan Andre & Fayola!"}]},{"c":[{"v":"SUBTITLE"},{"v":"Momen Indah Bersama"}]},{"c":[{"v":"FOOTER_MESSAGE"},{"v":"Terima kasih dari Andre & Fayola."}]},{"c":[{"v":"FRAME_IMAGE_URL"},{"v":"https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view"}]},{"c":[{"v":"ALL_PHOTOS_LABEL"},{"v":"Photostage"}]}]}});';

const sampleAcara = '/*O_o*/\ngoogle.visualization.Query.setResponse({"version":"0.6","status":"ok","table":{"cols":[{"label":"ID_Event"},{"label":"Nama_Acara"},{"label":"Tanggal_Acara"},{"label":"Venue_Lokasi"},{"label":"Tautan_Home_Event"},{"label":"Google_Drive_Folder_ID"},{"label":"Photobooth_Vendor_URL"},{"label":"Kategori_JSON"},{"label":"Bingkai_URL"},{"label":"Logo_Acara"},{"label":"Status"}],"rows":[{"c":[{"v":"andre-fayola-281"},{"v":"Andre & Fayola"},{"v":"28 November 2026"},{"v":"Grand Ballroom"},{"v":"https://gallery.runway.my.id/?event=andre-fayola-281"},{"v":"1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh"},{"v":"https://x1.kingphotobooth.co/e/test"},{"v":"[]"},{"v":"https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view"},{"v":""},{"v":"Aktif"}]}]}});';

// Simulate GViz fetch resolution
context.fetch = function(url) {
  if (url.includes("sheet=Pengaturan")) {
    return Promise.resolve({ text: () => Promise.resolve(samplePengaturan) });
  } else if (url.includes("sheet=Daftar_Acara")) {
    return Promise.resolve({ text: () => Promise.resolve(sampleAcara) });
  }
  return Promise.resolve({ text: () => Promise.resolve("") });
};

context.syncFromSpreadsheetGViz(function() {
  console.log("DEBUG: welcomeEl.textContent is:", welcomeEl ? welcomeEl.textContent : "null");
  assert(context.state.activeConfig.WELCOME_MESSAGE === "Selamat datang di pernikahan Andre & Fayola!", "GViz sync updates activeConfig.WELCOME_MESSAGE from Pengaturan sheet");
  assert(welcomeEl.textContent === "Selamat datang di pernikahan Andre & Fayola!", "UI #welcomeMessage updates live from GViz sync");
  assert(context.state.activeConfig.SUBTITLE === "Momen Indah Bersama", "GViz sync updates activeConfig.SUBTITLE");
  assert(context.state.activeConfig.FRAME_IMAGE_URL === "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view", "GViz sync updates activeConfig.FRAME_IMAGE_URL");
  assert(context.state.allPhotosLabel === "Photostage", "GViz sync updates state.allPhotosLabel to 'Photostage'");

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
});
