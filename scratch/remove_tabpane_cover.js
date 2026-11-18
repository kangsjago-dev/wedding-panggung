const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('<div class="admin-tab-pane" id="tabPane-cover">');
const eIdx = html.indexOf('<!-- Tab 2: Foto & Bingkai -->', sIdx);

if (sIdx !== -1 && eIdx !== -1) {
  html = html.substring(0, sIdx) + html.substring(eIdx);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully removed tabPane-cover!');
} else {
  console.error('Could not find boundaries for tabPane-cover');
}

