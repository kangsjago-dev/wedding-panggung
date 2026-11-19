const fs = require('fs');
const js = fs.readFileSync('js/app.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, i) => {
  if (l.includes('function handleGalleryResponse') || l.includes('handleGalleryResponse(')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

