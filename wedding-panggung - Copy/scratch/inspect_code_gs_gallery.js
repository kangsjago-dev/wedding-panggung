const fs = require('fs');
const content = fs.readFileSync('code.gs', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(940, 1020).join('\n'));

