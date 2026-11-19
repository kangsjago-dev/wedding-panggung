const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const sIdx = app.indexOf('function fallbackDrive() {');
const eIdx = app.indexOf('// 1. Coba ambil lewat endpoint API backend', sIdx);
console.log('sIdx:', sIdx, 'eIdx:', eIdx);

