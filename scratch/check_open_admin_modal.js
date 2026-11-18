const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(2465, 2515).join('\n'));

