const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const t7 = 'const salt = Date.now().toString().slice(-4);';
console.log('Target 7 exists?', app.includes(t7));

const t8 = 'function downloadCurrentPhotoWithFrame() {';
console.log('Target 8 exists?', app.includes(t8));

const t9 = 'function updateLightboxContent() {';
console.log('Target 9 exists?', app.includes(t9));

const t10 = 'function executeDirectPhotoDownload(photo, onDone) {';
console.log('Target 10 exists?', app.includes(t10));
