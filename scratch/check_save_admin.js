const fs = require('fs');
const content = fs.readFileSync('code.gs', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('function saveAdminSettings'));
console.log('saveAdminSettings at line', idx + 1);
console.log(lines.slice(idx, idx + 60).join('\n'));

