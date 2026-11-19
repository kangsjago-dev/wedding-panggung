const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const rct1 = app.indexOf('function renderCategoryTabs() {', 0);
const rct2 = app.indexOf('function renderCategoryTabs() {', 81113);
console.log('rct1:', rct1, 'rct2:', rct2);

if (rct1 !== -1) {
  console.log('RCT1 snippet:');
  console.log(app.substring(rct1, rct1 + 300));
}
if (rct2 !== -1) {
  console.log('RCT2 snippet:');
  console.log(app.substring(rct2, rct2 + 300));
}

