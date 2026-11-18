const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const idx = app.indexOf('function handleSelectEventChange(');
console.log(app.substring(idx - 100, idx + 2500));
