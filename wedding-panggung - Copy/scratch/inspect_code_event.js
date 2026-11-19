const fs = require('fs');
const code = fs.readFileSync('code.gs', 'utf8');

const idx = code.indexOf('function getGalleryData');
console.log(code.substring(idx + 1800, idx + 4500));

