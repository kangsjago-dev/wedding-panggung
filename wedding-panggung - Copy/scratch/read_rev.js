const fs = require('fs');
const rev = fs.readFileSync('revisi.md', 'utf8');
console.log(rev.substring(0, 1500));

