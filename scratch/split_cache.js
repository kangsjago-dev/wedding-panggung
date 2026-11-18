const fs = require('fs');

const content = fs.readFileSync('js/app.js', 'utf8');

const startIdx = content.indexOf('const GOOGLE_PHOTOS_INITIAL_CACHE = [');
const endIdx = content.indexOf('const GLOBAL_CONFIG = {');

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const cacheDataCode = content.substring(startIdx, endIdx);
console.log('Cache data length:', cacheDataCode.length);

// Write to js/cache-data.js
fs.writeFileSync('js/cache-data.js', '// ==========================================================================\n// STATIC CACHE DATA FOR PRE-SEEDING CATEGORIES (MODULAR SPLIT)\n// ==========================================================================\n\n' + cacheDataCode, 'utf8');
console.log('Successfully wrote js/cache-data.js');

// Replace in js/app.js
const stub = `// Pre-seeded cache data moved to js/cache-data.js for performance optimization
if (typeof window !== "undefined") {
  if (typeof GOOGLE_PHOTOS_INITIAL_CACHE === "undefined") window.GOOGLE_PHOTOS_INITIAL_CACHE = [];
  if (typeof KING_PHOTOBOOTH_INITIAL_CACHE === "undefined") window.KING_PHOTOBOOTH_INITIAL_CACHE = [];
  if (typeof WEDDING_INITIAL_CACHE === "undefined") window.WEDDING_INITIAL_CACHE = [];
}

`;

const newContent = content.substring(0, startIdx) + stub + content.substring(endIdx);
fs.writeFileSync('js/app.js', newContent, 'utf8');
console.log('Successfully updated js/app.js. New size:', newContent.length);

