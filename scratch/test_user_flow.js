const fs = require('fs');
const vm = require('vm');

// Read index.html to extract all element IDs
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
    focus: function() {},
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    appendChild: function(child) {},
    removeChild: function(child) {},
    closest: function() { return null; }
  };
}

idMatches.forEach(id => {
  elements[id] = createMockElement(id);
});

const dom = {
  addEventListener: function() {},
  removeEventListener: function() {},
  window: {
    addEventListener: function() {},
    removeEventListener: function() {}
  },
  document: {
    body: createMockElement('body'),
    documentElement: createMockElement('documentElement'),
    title: '',
    getElementById: function(id) {
      if (!elements[id]) {
        elements[id] = createMockElement(id);
      }
      return elements[id];
    },
    querySelector: function(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
      if (sel === '.footer-names') return elements['footerCoupleName'] || createMockElement('footerNames');
      return createMockElement('mock');
    },
    querySelectorAll: function(sel) {
      return [];
    },
    createElement: function(tag) {
      const el = createMockElement('created_' + tag);
      el.tagName = tag.toUpperCase();
      return el;
    },
    addEventListener: function(event, cb) {
      if (event === 'DOMContentLoaded') setTimeout(cb, 10);
    }
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
    console.log('fetch called with URL:', url, 'opts:', opts);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Saved successfully' })
    });
  }
};
dom.window = dom;

const ctx = vm.createContext(dom);
try {
  vm.runInContext(fs.readFileSync('js/core.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('js/categories.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('js/gallery.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('js/admin.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync('js/app.js', 'utf8'), ctx);
  console.log('All 5 scripts loaded successfully!');
} catch (e) {
  console.error('Script loading error:', e);
}

setTimeout(() => {
  console.log('\n--- Simulating Admin Login & Edit ---');
  try {
    ctx.state.currentEventId = 'ev_andre_fayola';
    ctx.state.gasApiUrl = ctx.GLOBAL_CONFIG.GAS_API_URL;
    ctx.openAdminSettingsModal();
    console.log('openAdminSettingsModal succeeded');
    ctx.switchAdminTab('category');
    console.log('switchAdminTab succeeded');
    
    // Simulate setting photobooth URL
    const pbUrlInput = dom.document.getElementById('pbUrlInput');
    pbUrlInput.value = 'https://photos.app.goo.gl/QkqewYw4dWfocxfK8';
    
    console.log('\n--- Simulating Clicking Simpan Perubahan ---');
    ctx.handleSaveAllSettings();
    console.log('handleSaveAllSettings finished without throwing!');
  } catch (err) {
    console.error('Error during user simulation:', err);
  }
}, 50);
