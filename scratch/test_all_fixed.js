const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('====================================================');
console.log('AUTOMATED VERIFICATION TEST: ALL 4 ISSUES FIXED');
console.log('====================================================');

let allPassed = true;
function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    allPassed = false;
  }
}

// 1. Test CSS Z-Indices
const css = fs.readFileSync('css/style.css', 'utf8');
const lbZIndexMatch = css.match(/\.lightbox-modal\s*\{[^}]*z-index:\s*(\d+)/);
assert(lbZIndexMatch && parseInt(lbZIndexMatch[1], 10) >= 10000, `Lightbox z-index is ${lbZIndexMatch ? lbZIndexMatch[1] : 'not found'} (>= 10000)`);

const toastZIndexMatch = css.match(/\.toast-container\s*\{[^}]*z-index:\s*(\d+)/);
assert(toastZIndexMatch && parseInt(toastZIndexMatch[1], 10) >= 20000, `Toast container z-index is ${toastZIndexMatch ? toastZIndexMatch[1] : 'not found'} (>= 20000)`);

// 2. Test DOM & Script Execution in VM
const html = fs.readFileSync('index.html', 'utf8');
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
      setProperty: function(k, v) { this[k] = v; },
      removeProperty: function(k) { delete this[k]; }
    },
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    setAttribute: function() {},
    removeAttribute: function() {},
    getAttribute: function() { return ''; },
    addEventListener: function() {},
    removeEventListener: function() {},
    focus: function() {},
    querySelector: function(sel) {
      if (sel.startsWith('#')) return elements[sel.slice(1)];
      return null;
    },
    querySelectorAll: function(sel) { return []; },
    appendChild: function(child) {},
    removeChild: function(child) {},
    remove: function() {},
    closest: function() { return null; }
  };
}

idMatches.forEach(id => { elements[id] = createMockElement(id); });

let backendCalls = [];
const dom = {
  window: {
    addEventListener: function() {},
    removeEventListener: function() {}
  },
  addEventListener: function() {},
  removeEventListener: function() {},
  document: {
    body: createMockElement('body'),
    documentElement: createMockElement('documentElement'),
    title: '',
    getElementById: function(id) {
      if (!elements[id]) elements[id] = createMockElement(id);
      return elements[id];
    },
    querySelector: function(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
      if (sel === '.footer-names') return elements['footerCoupleName'] || createMockElement('footerNames');
      return createMockElement('mock');
    },
    querySelectorAll: function(sel) { return []; },
    createElement: function(tag) {
      const el = createMockElement('created_' + tag);
      el.tagName = tag.toUpperCase();
      return el;
    },
    addEventListener: function() {}
  },
  location: {
    href: 'http://localhost:8080/?event=ev_andre_fayola',
    search: '?event=ev_andre_fayola',
    origin: 'http://localhost:8080',
    protocol: 'http:',
    host: 'localhost:8080',
    pathname: '/'
  },
  localStorage: {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
  },
  sessionStorage: {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
  },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: function(url, opts) {
    let payload = {};
    try { payload = JSON.parse(opts.body); } catch(e) {}
    backendCalls.push({ url, payload });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Saved successfully' })
    });
  },
  Image: class { constructor() { setTimeout(() => this.onload && this.onload(), 10); } }
};
dom.window = dom;

const ctx = vm.createContext(dom);

// Load all 5 scripts
vm.runInContext(fs.readFileSync('js/core.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/categories.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/gallery.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/admin.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/app.js', 'utf8'), ctx);

// Test 3: Check that window exports are globally accessible
assert(typeof ctx.openLightbox === 'function', 'window.openLightbox is a defined function');
assert(typeof ctx.closeLightbox === 'function', 'window.closeLightbox is a defined function');
assert(typeof ctx.handleSaveAllSettings === 'function', 'window.handleSaveAllSettings is a defined function');
assert(typeof ctx.callBackend === 'function', 'window.callBackend is a defined function');
assert(typeof ctx.applyCategoryFilter === 'function', 'window.applyCategoryFilter is a defined function');

// Test 4: Lightbox preview opens on photo click
ctx.state.filteredPhotos = [
  { id: 'p1', name: 'Andre & Fayola Photo 1', thumbnailUrl: 'http://thumb.jpg', previewUrl: 'http://prev.jpg', category: 'Semua Foto' }
];
ctx.openLightbox(0);
assert(elements['lightbox'].classList.contains('active'), 'Lightbox modal gains active class when photo preview opened');
assert(elements['lightboxTitle'].innerText === 'Andre & Fayola Photo 1', 'Lightbox title correctly set to photo name');

// Test 5: Empty category warning state
ctx.state.filteredPhotos = [];
ctx.renderPhotoGrid('', 'Photobooth');
const emptyGridHtml = elements['photosGrid'].innerHTML;
assert(emptyGridHtml.includes('Foto Belum Tersedia'), 'Empty category without link shows "Foto Belum Tersedia"');
assert(emptyGridHtml.includes('belum ditautkan oleh penyelenggara'), 'Empty category has elegant wording explaining link not set');
assert(emptyGridHtml.includes('empty-gallery-badge'), 'Empty category has elegant badge styling');

// Test 6: Empty category WITH link
ctx.renderPhotoGrid('https://photos.app.goo.gl/test', 'Photobooth');
const emptyWithLinkHtml = elements['photosGrid'].innerHTML;
assert(emptyWithLinkHtml.includes('Momen Sedang Dipersiapkan'), 'Category with link but 0 photos shows "Momen Sedang Dipersiapkan"');

// Test 7: Save All Settings in Admin
ctx.state.currentEventId = 'ev_andre_fayola';
dom.document.getElementById('pbUrlInput').value = 'https://photos.app.goo.gl/QkqewYw4dWfocxfK8';
dom.document.getElementById('cfgGasApiUrl').value = ''; // simulate user on different tab

const prevUrl = ctx.state.gasApiUrl;
ctx.handleSaveAllSettings();
assert(ctx.state.gasApiUrl && ctx.state.gasApiUrl.length > 0, `state.gasApiUrl is NOT wiped when input is empty (value: ${ctx.state.gasApiUrl})`);
assert(backendCalls.some(c => c.payload.action === 'saveAdminSettings'), 'saveAdminSettings was dispatched to backend');
assert(backendCalls.some(c => c.payload.action === 'addEvent'), 'addEvent was dispatched to backend');

console.log('====================================================');
if (allPassed) {
  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY (100%)');
} else {
  console.error('SOME CHECKS FAILED');
  process.exit(1);
}
console.log('====================================================');
