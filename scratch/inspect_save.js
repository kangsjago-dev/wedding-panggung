const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const idx = app.indexOf('function handleSaveAllSettings()');
console.log(app.substring(idx + 500, idx + 2500));

