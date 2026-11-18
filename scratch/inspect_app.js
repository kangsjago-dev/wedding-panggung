const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const idx = app.indexOf('function fallbackDrive()');
console.log('index of fallbackDrive:', idx);
console.log(app.substring(idx, idx + 1000));
