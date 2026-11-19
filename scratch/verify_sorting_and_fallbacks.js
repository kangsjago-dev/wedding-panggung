const fs = require('fs');

console.log("=== VERIFIKASI SORTING WAKTU TERBARU & AUDIT ELIMINASI FALLBACK ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("✅ PASS: " + message);
    passed++;
  } else {
    console.error("❌ FAIL: " + message);
    failed++;
  }
}

// 1. Audit Fallback / Hardcode Strings in js/app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');
assert(!appCode.includes('usr_superadmin'), "js/app.js tidak memiliki hardcoded usr_superadmin");
assert(!appCode.includes('"123456"'), "js/app.js tidak memiliki hardcoded PIN 123456");
assert(!appCode.includes('ZJGYCfWbttuEG8Q67ocZs'), "js/app.js tidak memiliki hardcoded album Fotoshare ZJGYCfWbttuEG8Q67ocZs");

// 2. Audit API Endpoints
const apiDrive = fs.readFileSync('api/drive-folder.js', 'utf8');
const apiFoto = fs.readFileSync('api/fotoshare.js', 'utf8');
const apiGp = fs.readFileSync('api/google-photos.js', 'utf8');
const apiKp = fs.readFileSync('api/kingphotobooth.js', 'utf8');

assert(!apiDrive.includes('1GGB77clCMYBIg17J0ECr2eVbD02ZeInW'), "api/drive-folder.js bebas dari hardcoded folder ID");
assert(!apiFoto.includes('ZJGYCfWbttuEG8Q67ocZs'), "api/fotoshare.js bebas dari hardcoded album Fotoshare");
assert(!apiGp.includes('AF1QipN'), "api/google-photos.js bebas dari hardcoded album Google Photos");
assert(!apiKp.includes('23d0e80056ae8f2fbb5d116f'), "api/kingphotobooth.js bebas dari hardcoded event Kingphotobooth");

// Check sorting in API files
assert(apiDrive.includes('b.timestamp - a.timestamp') || apiDrive.includes('tB - tA') || apiDrive.includes('localeCompare'), "api/drive-folder.js menerapkan descending sort");
assert(apiFoto.includes('tB - tA') || apiFoto.includes('b.timestamp - a.timestamp'), "api/fotoshare.js menerapkan descending sort");
assert(apiGp.includes('tB - tA') || apiGp.includes('b.timestamp - a.timestamp'), "api/google-photos.js menerapkan descending sort");
assert(apiKp.includes('tB - tA') || apiKp.includes('b.timestamp - a.timestamp'), "api/kingphotobooth.js menerapkan descending sort");

// 3. Audit code.gs
const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(codeGs.includes('tB - tA') || codeGs.includes('b.timestamp - a.timestamp'), "code.gs memiliki sorting descending timestamp");

// 4. Audit all call locations in js/app.js
assert(appCode.includes('sortPhotosNewestFirst(dbPhotos)'), "dbPhotos dari sheet Daftar_Foto disort terbaru paling atas");
assert(appCode.includes('sortPhotosNewestFirst(savedPhotos)'), "Instant hydration disort terbaru paling atas");
assert(appCode.includes('sortPhotosNewestFirst(cachedPhotos)'), "Event switch cached photos disort terbaru paling atas");
assert(appCode.includes('state.filteredPhotos = sortPhotosNewestFirst(state.filteredPhotos)'), "renderPhotoGrid memastikan foto terfilter selalu disort terbaru paling atas");

// 5. Ekstrak dan jalankan getPhotoTimestamp & sortPhotosNewestFirst langsung dari js/app.js
const vm = require('vm');
const context = {};
const extractCode = appCode.substring(
  appCode.indexOf('function getPhotoTimestamp'),
  appCode.indexOf('function rotateLightboxCurrentPhoto')
);
vm.runInNewContext(extractCode, context);

const getPhotoTimestamp = context.getPhotoTimestamp;
const sortPhotosNewestFirst = context.sortPhotosNewestFirst;

assert(typeof getPhotoTimestamp === 'function', "getPhotoTimestamp terekstrak dari js/app.js");
assert(typeof sortPhotosNewestFirst === 'function', "sortPhotosNewestFirst terekstrak dari js/app.js");

// Test photo sorting with timestamps
const testPhotos = [
  { id: 'p1', name: 'IMG_0001.JPG', timestamp: '2026-11-19T08:00:00Z' },
  { id: 'p2', name: 'IMG_0003.JPG', timestamp: '2026-11-19T10:00:00Z' }, // newest
  { id: 'p3', name: 'IMG_0002.JPG', timestamp: '2026-11-19T09:00:00Z' },
];

const sorted = sortPhotosNewestFirst(testPhotos);
assert(sorted[0].id === 'p2', "Foto terbaru (p2 - 10:00) berada di urutan teratas (index 0)");
assert(sorted[1].id === 'p3', "Foto kedua terbaru (p3 - 09:00) berada di urutan kedua (index 1)");
assert(sorted[2].id === 'p1', "Foto paling lama (p1 - 08:00) berada di urutan terbawah (index 2)");

// Sequential test without timestamps
const testSeq = [
  { id: 's1', name: 'DSC_0001.JPG' },
  { id: 's2', name: 'DSC_0099.JPG' },
  { id: 's3', name: 'DSC_0050.JPG' }
];
const sortedSeq = sortPhotosNewestFirst(testSeq);
assert(sortedSeq[0].id === 's2', "Foto urutan sequence tertinggi (DSC_0099.JPG) berada di urutan teratas");
assert(sortedSeq[1].id === 's3', "Foto urutan sequence menengah (DSC_0050.JPG) berada di urutan kedua");
assert(sortedSeq[2].id === 's1', "Foto urutan sequence terendah (DSC_0001.JPG) berada di urutan terbawah");

console.log(`\nHASIL AKHIR: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
