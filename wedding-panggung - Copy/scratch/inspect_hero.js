const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const heroIdx = html.indexOf('class="hero-title"');
console.log('heroIdx:', heroIdx);
console.log(html.substring(heroIdx - 500, heroIdx + 1500));

