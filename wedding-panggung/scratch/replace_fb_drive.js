const fs = require('fs');
let app = fs.readFileSync('js/app.js', 'utf8');

const sIdx = app.indexOf('function fallbackDrive() {');
const eIdx = app.indexOf('// 1. Coba ambil lewat endpoint API backend', sIdx);

const newFallbackDrive = `function fallbackDrive() {
        let matched = (state.allPhotos || []).filter(function(p) {
          if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
          if (driveFolderId && p.customFolderId === driveFolderId) return true;
          if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
          return false;
        });
        state.categoryPhotosMap[cat] = matched;
        state.categoryPhotosUrlMap[cat] = driveKey;
        if (callback) callback(matched);
      }

      `;

app = app.substring(0, sIdx) + newFallbackDrive + app.substring(eIdx);
fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Replaced fallbackDrive cleanly!');

