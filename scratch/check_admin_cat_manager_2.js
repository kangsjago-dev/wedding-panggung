const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(2570, 2650).join('\n'));

