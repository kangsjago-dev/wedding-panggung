const fs = require('fs');
const content = fs.readFileSync('code.gs', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('function writeConfigToSheet'));
console.log('writeConfigToSheet at line', idx + 1);
console.log(lines.slice(idx, idx + 50).join('\n'));

