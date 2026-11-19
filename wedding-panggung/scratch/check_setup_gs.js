const fs = require('fs');
const content = fs.readFileSync('setup.gs', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(130, 210).join('\n'));

