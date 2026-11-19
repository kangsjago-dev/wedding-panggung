const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const idx = app.indexOf('function formatDateForInput');
console.log('index of formatDateForInput:', idx);
if (idx !== -1) {
  console.log(app.substring(idx, idx + 800));
} else {
  console.log('formatDateForInput NOT FOUND');
}

