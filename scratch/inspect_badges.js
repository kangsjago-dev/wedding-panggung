const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const badgeIdx = html.indexOf('hero-badges-wrapper');
console.log(html.substring(badgeIdx, badgeIdx + 1500));

