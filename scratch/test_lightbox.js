const fs = require('fs');
const vm = require('vm');

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
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    appendChild: function(child) {},
    removeChild: function(child) {},
    closest: function() { return null; }
  };
}

idMatches.forEach(id => { elements[id] = createMockElement(id); });

const dom = {
  window: { addEventListener: () => {}, removeEventListener: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
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
  location: { href: 'http://localhost/?event=ev_andre_fayola', search: '?event=ev_andre_fayola', origin: 'http://localhost', pathname: '/' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Image: class { constructor() { setTimeout(() => this.onload && this.onload(), 10); } }
};
dom.window = dom;

const ctx = vm.createContext(dom);
vm.runInContext(fs.readFileSync('js/core.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/categories.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/gallery.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/admin.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/app.js', 'utf8'), ctx);

ctx.state.filteredPhotos = [
  { id: 'p1', name: 'Photo 1', thumbnailUrl: 'http://thumb.jpg', previewUrl: 'http://prev.jpg', category: 'Semua Foto' },
  { id: 'pb1', name: 'Photobooth 1', thumbnailUrl: 'http://thumb2.jpg', previewUrl: 'http://prev2.jpg', category: 'Photobooth', isPhotobooth: true }
];

console.log('--- Testing openLightbox(0) [Drive/Semua Foto] ---');
try {
  ctx.openLightbox(0);
  console.log('openLightbox(0) success! Lightbox active classes:', Array.from(elements['lightbox'].classList.classes));
} catch(e) {
  console.error('openLightbox(0) error:', e);
}

console.log('\n--- Testing openLightbox(1) [Photobooth] ---');
try {
  ctx.openLightbox(1);
  console.log('openLightbox(1) success! Lightbox active classes:', Array.from(elements['lightbox'].classList.classes));
} catch(e) {
  console.error('openLightbox(1) error:', e);
}

