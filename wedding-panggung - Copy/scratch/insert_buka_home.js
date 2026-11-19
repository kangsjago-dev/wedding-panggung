const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `<button type="button" class="btn btn-outline" style="font-size: 0.7rem; padding: 2px 8px;" onclick="copyActiveEventUrl()">Salin Link</button>`;
const replacement = `<button type="button" class="btn btn-outline" style="font-size: 0.7rem; padding: 2px 8px;" onclick="openActiveEventHome()" title="Buka Halaman Utama Acara Ini">Buka Home</button>\n              ` + target;

html = html.replace(target, replacement);
fs.writeFileSync('index.html', html, 'utf8');
console.log('Inserted Buka Home button!');

