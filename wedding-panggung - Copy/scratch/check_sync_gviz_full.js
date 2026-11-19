const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(595, 740).join('\n'));

