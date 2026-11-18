const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('function renderAdminCategoriesManager'));
console.log('renderAdminCategoriesManager at line', idx + 1);
console.log(lines.slice(idx, idx + 60).join('\n'));

