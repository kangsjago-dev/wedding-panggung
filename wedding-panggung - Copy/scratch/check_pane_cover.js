const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('tabPane-cover present?', html.includes('tabPane-cover'));
if (html.includes('tabPane-cover')) {
  const start = html.indexOf('<div class="admin-tab-pane" id="tabPane-cover">');
  console.log('Snippet:');
  console.log(html.substring(start, start + 300));
}

