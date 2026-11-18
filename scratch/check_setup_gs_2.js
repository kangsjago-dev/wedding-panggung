const fs = require('fs');
const content = fs.readFileSync('setup.gs', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(210, 300).join('\n'));

