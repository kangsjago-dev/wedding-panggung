const fs = require('fs');
const path = require('path');

// Simulate DOM and Browser environment
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
  querySelectorAll() { return []; }
  querySelector() { return null; }
}

const elements = new Map();
function getEl(id) {
  if (!elements.has(id)) {
    elements.set(id, new MockElement('div', id));
  }
  return elements.get(id);
}

// Ensure key elements exist
[
  "eventNotFoundScreen", "heroSection", "categoryTabsWrapper", "adminActiveFloatingBar",
  "coupleName", "subtitle", "heroLogoImg", "heroLogoContainer", "photosGrid",
  "adminSettingsModal", "refreshIconSvg", "adminEventSelect", "categoryTabs",
  "shareQrModal", "shareQrImg", "shareUrlInput", "lightbox"
].forEach(id => getEl(id));

const documentMock = {
  getElementById: (id) => getEl(id),
  querySelector: (sel) => {
    if (sel === ".gallery-container") return getEl("galleryContainer");
    if (sel === ".filter-bar") return getEl("filterBar");
    if (sel === ".footer") return getEl("footer");
    return null;
  },
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  body: new MockElement('body')
};

const localStorageStore = new Map();
const localStorageMock = {
  getItem: (k) => localStorageStore.get(k) || null,
  setItem: (k, v) => localStorageStore.set(k, String(v)),
  removeItem: (k) => localStorageStore.delete(k)
};

console.log("Mock environment ready.");

