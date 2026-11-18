const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

console.log('App length:', app.length);
const lines = app.split('\n');
console.log('Total lines:', lines.length);
console.log('Lines 7015 to 7030:');
console.log(lines.slice(7015, 7030).join('\n'));

