const fs = require('fs');
const js = fs.readFileSync('js/app.js', 'utf8');
const lines = js.split('\n');

console.log("Searching for openLightbox, lightbox, and download references...");
lines.forEach((l, i) => {
  if (l.includes('openLightbox') || l.includes('renderPhotoGrid') || l.includes('handleCurrentLightboxDownload')) {
    console.log((i+1) + ': ' + l.trim().substring(0, 100));
  }
});

