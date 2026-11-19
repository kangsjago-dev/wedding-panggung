const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// Set up mock window and document
const windowMock = {
  location: {
    origin: 'https://gallery.runway.my.id',
    protocol: 'https:',
    host: 'gallery.runway.my.id',
    pathname: '/',
    search: '?event=andre-fayola-281'
  },
  history: {
    replaceState: (state, title, url) => {
      // console.log('replaceState:', url);
    }
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  innerWidth: 1024,
  innerHeight: 768,
  scrollTo: () => {}
};

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.style = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c)
    };
    this.children = [];
    this._innerHTML = '';
    this.attributes = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = val; }
  get textContent() { return this._innerHTML; }
  set textContent(val) { this._innerHTML = val; }
  get innerText() { return this._innerHTML; }
  set innerText(val) { this._innerHTML = val; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(el) { this.children.push(el); }
  removeChild(el) { this.children = this.children.filter(c => c !== el); }
  querySelectorAll(sel) { return []; }
  querySelector(sel) { return null; }
  addEventListener() {}
  removeEventListener() {}
}

const elements = new Map();
function getEl(id) {
  if (!elements.has(id)) {
    elements.set(id, new MockElement('div', id));
  }
  return elements.get(id);
}

[
  "eventNotFoundScreen", "heroSection", "categoryTabsWrapper", "adminActiveFloatingBar",
  "coupleName", "subtitle", "heroLogoImg", "heroLogoContainer", "photosGrid",
  "adminSettingsModal", "refreshIconSvg", "adminEventSelect", "categoryTabs",
  "shareQrModal", "shareQrImg", "shareUrlInput", "lightbox", "galleryContainer",
  "filterBar", "footer", "lightboxCounter", "adminLogoPreviewImg", "adminLogoPreviewPlaceholder",
  "cfgMainGalleryLabel", "pbUrlInput", "eventNotFoundTitle", "eventNotFoundDesc",
  "slideshowCouple", "slideshowCategory", "slideshowImgA", "slideshowImgB", "activeEventUrlPreview",
  "activeEventUrlInput"
].forEach(id => getEl(id));

const documentMock = {
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    if (sel === ".gallery-container") return getEl("galleryContainer");
    if (sel === ".filter-bar") return getEl("filterBar");
    if (sel === ".footer") return getEl("footer");
    return null;
  },
  querySelectorAll: (sel) => [],
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body'),
  addEventListener: () => {}
};

const localStorageMock = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Now evaluate in sandboxed context
const vm = require('vm');
const context = {
  window: windowMock,
  document: documentMock,
  localStorage: localStorageMock,
  navigator: { userAgent: 'Node', clipboard: { writeText: async () => {} } },
  URLSearchParams: require('url').URLSearchParams,
  URL: require('url').URL,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: async (url) => {
    // console.log('Mock fetch called:', url);
    if (url.includes('config.json')) {
      const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
      return { ok: true, json: async () => cfg };
    }
    if (url.includes('gviz/tq')) {
      const res = await fetch(url);
      const text = await res.text();
      return { ok: true, text: async () => text };
    }
    if (url.includes('/api/drive-folder')) {
      return { ok: true, json: async () => ({ success: true, count: 0, photos: [] }) };
    }
    return { ok: true, json: async () => ({ success: true, photos: [] }), text: async () => '' };
  }
};

vm.createContext(context);
try {
  vm.runInContext(appJs, context);
  console.log('Script loaded successfully without throwing!');
  
  // Now simulate DOMContentLoaded
  console.log('Simulating DOMContentLoaded...');
  // The event listener was registered, let's call initApp or check state
} catch (e) {
  console.error('ERROR during evaluation:', e);
}

