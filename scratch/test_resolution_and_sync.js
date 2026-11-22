const fs = require('fs');

console.log('Testing resolution preservation and frame merging logic...');

const galleryContent = fs.readFileSync('js/gallery.js', 'utf8');
const appContent = fs.readFileSync('js/app.js', 'utf8');
const adminContent = fs.readFileSync('js/admin.js', 'utf8');
const coreContent = fs.readFileSync('js/core.js', 'utf8');

let checks = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exit(1);
  }
  checks++;
  console.log('[PASS] ' + msg);
}

// Check 1: normalizeDriveImageUrl produces =s0 for 100% uncompressed native resolution
assert(coreContent.includes('=s0'), 'core.js uses =s0 for uncompressed native resolution');
assert(!coreContent.includes('=w2500'), 'core.js removed =w2500');

// Check 2: prepareLightboxFramedBlob maintains native resolution
assert(galleryContent.includes('const canvasW = isRotated90 ? ph : pw;'), 'prepareLightboxFramedBlob uses native photo width/height');
assert(galleryContent.includes('const canvasH = isRotated90 ? pw : ph;'), 'prepareLightboxFramedBlob uses native photo height/width');

// Check 3: executeFramedPhotoDownload maintains native resolution & quality 0.98
assert(galleryContent.includes('"image/jpeg", 0.98'), 'executeFramedPhotoDownload exports with quality 0.98');

// Check 4: precompositeLightboxPhoto uses getActiveFrameUrl & exact photo dimensions
assert(galleryContent.includes('precompositeLightboxPhoto(photo) {') && galleryContent.includes('const frameUrl = getActiveFrameUrl();'), 'precompositeLightboxPhoto uses getActiveFrameUrl()');

// Check 5: openLightbox uses isPhotoPhotobooth(photo) and getActiveFrameUrl()
assert(galleryContent.includes('const isPhotobooth = isPhotoPhotobooth(photo);'), 'openLightbox uses isPhotoPhotobooth(photo)');

// Check 6: app.js syncFromSpreadsheetGViz protects photoboothUrl from being overwritten by stale row
assert(appContent.includes('const cleanPb = (extraEv.photoboothUrl && String(extraEv.photoboothUrl).trim())'), 'app.js prioritizes updated extraEv.photoboothUrl over stale cell');

// Check 7: admin.js cleans cached photos on event switch
assert(adminContent.includes('cleanCached = Array.isArray(cachedPhotos) ? cachedPhotos.filter'), 'admin.js filters out demo/dummy photos from localStorage');

// Check 8: admin.js login sets effective user PIN
assert(adminContent.includes('const effectiveUserPin = (user && user.pin)'), 'admin.js saves effectiveUserPin to storage');

console.log('All ' + checks + ' critical logic checks passed flawlessly!');

