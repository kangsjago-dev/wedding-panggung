const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const targets = [
  'WEDDING_INITIAL_CACHE',
  'KING_PHOTOBOOTH_INITIAL_CACHE',
  'GOOGLE_PHOTOS_INITIAL_CACHE',
  'countBadgeText = "274"',
  'countBadgeText = "115"',
  'countBadgeText = "637"',
  'countBadgeText = "116"',
  'return pin || "121212"'
];

console.log('--- AUDIT REPORT FOR JS/APP.JS ---');
targets.forEach(t => {
  const count = (app.match(new RegExp(t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
  console.log(t + ' => ' + count + ' occurrences');
});

