const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const lines = app.split('\n');
console.log('Lines 3520 to 3538:');
for (let i = 3519; i < Math.min(lines.length, 3538); i++) {
  console.log((i + 1) + ': ' + lines[i]);
}

