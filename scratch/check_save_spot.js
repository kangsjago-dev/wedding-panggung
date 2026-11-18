const fs = require('fs');
const content = fs.readFileSync('code.gs', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(2200, 2225).join('\n'));

