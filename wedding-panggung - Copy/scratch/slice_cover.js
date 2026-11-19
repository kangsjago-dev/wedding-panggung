const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('<div class="admin-tab-pane" id="tabPane-cover">');
const eIdx = html.indexOf('<!-- Tab 3: Foto & Kategori', sIdx);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);
console.log('Last 200 chars before eIdx:');
console.log(html.substring(eIdx - 200, eIdx));

