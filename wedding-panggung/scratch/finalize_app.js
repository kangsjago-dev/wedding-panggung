const fs = require('fs');
let app = fs.readFileSync('scratch/candidate_app.js', 'utf8');

const sIdx = app.indexOf('function fallbackDrive() {');
console.log('sIdx in candidate:', sIdx);
console.log(app.substring(sIdx, sIdx + 500));

// Let's replace the WEDDING_INITIAL_CACHE in fallbackDrive cleanly
const oldPart = `        // Jangan paksa fallback WEDDING_INITIAL_CACHE jika ada driveFolderId kustom dari admin
        if (!driveFolderId && cat.toLowerCase().includes("wedding") && typeof WEDDING_INITIAL_CACHE !== 'undefined' && Array.isArray(WEDDING_INITIAL_CACHE) && WEDDING_INITIAL_CACHE.length > 0) {
          state.categoryPhotosMap[cat] = WEDDING_INITIAL_CACHE;
          state.categoryPhotosUrlMap[cat] = driveKey;
          try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(WEDDING_INITIAL_CACHE.length)); } catch (e) {}
          if (callback) callback(WEDDING_INITIAL_CACHE);
          return;
        }`;

if (app.includes(oldPart)) {
  app = app.replace(oldPart, '');
  console.log('Removed WEDDING_INITIAL_CACHE from fallbackDrive!');
} else {
  console.log('oldPart not found');
}

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Saved to js/app.js!');

