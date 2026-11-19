const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const rct1 = app.indexOf('function renderCategoryTabs() {', 0);
const rct2 = app.indexOf('function renderCategoryTabs() {', 81113);

console.log('RCT1 has 274?', app.substring(rct1, rct1 + 3500).includes('274'));
console.log('RCT2 has 274?', app.substring(rct2, rct2 + 3500).includes('274'));

