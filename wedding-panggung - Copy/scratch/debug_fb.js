const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const sIdx = app.indexOf('function fallbackDrive() {');
console.log('sIdx:', sIdx);
console.log(app.substring(sIdx - 200, sIdx + 1200));

