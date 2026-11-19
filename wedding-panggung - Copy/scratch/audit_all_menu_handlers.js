const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/app.js', 'utf8');

// Find all onclick and onchange handlers in index.html
const onclickMatches = [...html.matchAll(/onclick="([^"(]+)/g)].map(m => m[1].trim());
const onchangeMatches = [...html.matchAll(/onchange="([^"(]+)/g)].map(m => m[1].trim());

const handlers = new Set([...onclickMatches, ...onchangeMatches]);

console.log('Total event handlers in HTML:', handlers.size);
let missing = 0;
handlers.forEach(fn => {
  if (fn === 'try' || fn === 'event' || fn === 'this') return;
  // Check if defined in js/app.js or inline in index.html
  const inJs = js.includes('function ' + fn) || js.includes(fn + ' =') || js.includes(fn + '(');
  const inHtml = html.includes('function ' + fn);
  if (!inJs && !inHtml) {
    console.error('MISSING HANDLER:', fn);
    missing++;
  } else {
    console.log('✓ ' + fn + ' is defined');
  }
});

console.log('Handler check completed with ' + missing + ' missing handlers.');

