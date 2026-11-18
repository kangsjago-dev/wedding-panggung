const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

// The duplicate starts at 81113. Let's see what is after 81113:
// The first copy had sIdx at 80566.
// What was in the second copy? Let's check where fetchDriveCategoryPhotos is in the second copy!
const idx2 = app.indexOf('function fetchDriveCategoryPhotos', 81113);
console.log('Second fetchDriveCategoryPhotos at:', idx2);
if (idx2 !== -1) {
  console.log(app.substring(idx2, idx2 + 1500));
}

