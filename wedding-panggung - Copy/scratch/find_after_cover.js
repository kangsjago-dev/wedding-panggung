const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('<div class="admin-tab-pane" id="tabPane-cover">');
console.log(html.substring(sIdx + 3000, sIdx + 4500));

