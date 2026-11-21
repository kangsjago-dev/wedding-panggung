const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const admin = fs.readFileSync('js/admin.js', 'utf8');
const regex = /(?:oninput|onclick|onchange)=["']([a-zA-Z0-9_]+)\(/g;
const handlers = new Set();
let m;
while ((m = regex.exec(html)) !== null) handlers.add(m[1]);
while ((m = regex.exec(admin)) !== null) handlers.add(m[1]);

const coreJs = fs.readFileSync('js/core.js', 'utf8');
const categoriesJs = fs.readFileSync('js/categories.js', 'utf8');
const galleryJs = fs.readFileSync('js/gallery.js', 'utf8');
const adminJs = fs.readFileSync('js/admin.js', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

const context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  document: {
    getElementById: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, textContent: '' }),
    querySelectorAll: () => [],
    querySelector: () => null,
    body: { style: {} },
    documentElement: { style: {} },
    addEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  location: { search: '?event=test' },
  history: { replaceState: () => {} },
  URLSearchParams: URLSearchParams,
  fetch: () => Promise.resolve({ text: () => Promise.resolve(""), json: () => Promise.resolve({}) })
};
context.window = context;

vm.createContext(context);
vm.runInContext(coreJs, context);
vm.runInContext(categoriesJs, context);
vm.runInContext(galleryJs, context);
vm.runInContext(adminJs, context);
vm.runInContext(appJs, context);

const missing = [];
for (const h of handlers) {
  if (typeof context[h] !== 'function') {
    missing.push(h);
  }
}

console.log("Missing on window:", missing);
