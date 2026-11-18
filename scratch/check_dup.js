const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

let idx = 0;
while ((idx = app.indexOf('function isGooglePhotosUrl', idx)) !== -1) {
  console.log('Found isGooglePhotosUrl at:', idx);
  idx += 20;
}

