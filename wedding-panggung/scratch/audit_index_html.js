const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check unclosed tags for critical elements
const tags = ['div', 'span', 'section', 'script', 'style', 'button', 'form', 'main', 'header', 'nav'];
tags.forEach(tag => {
  const openCount = (html.match(new RegExp('<' + tag + '(\\s|>|$)', 'gi')) || []).length;
  const closeCount = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length;
  if (openCount !== closeCount) {
    console.log('Mismatch for <' + tag + '>: open=' + openCount + ', close=' + closeCount);
  }
});

// Check all element IDs in index.html
const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const idSet = new Set();
const duplicates = [];
idMatches.forEach(id => {
  if (idSet.has(id)) duplicates.push(id);
  else idSet.add(id);
});
console.log('Duplicate IDs:', duplicates);
console.log('Total unique IDs:', idSet.size);

