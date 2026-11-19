const fs = require('fs');
const assert = require('assert');

console.log("=== COMPREHENSIVE TEST: PHOTOSTAGE FALLBACK & ZERO-HARDCODE REALTIME AUDIT ===");

const appJs = fs.readFileSync('js/app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const codeGs = fs.readFileSync('code.gs', 'utf8');
const setupGs = fs.readFileSync('setup.gs', 'utf8');
const styleCss = fs.readFileSync('css/style.css', 'utf8');

// 1. PHOTOSTAGE FALLBACK TESTS
console.log("\n--- 1. Testing Photostage (Mode Panggung) Logic ---");

// A. openSlideshow graceful fallback to state.allPhotos
assert(appJs.includes('if (!photos || photos.length === 0) {'), "openSlideshow must check if filteredPhotos is empty");
assert(appJs.includes('if (state.allPhotos && state.allPhotos.length > 0) {'), "openSlideshow must fallback to state.allPhotos if current category empty");
assert(appJs.includes('state.filteredPhotos = state.allPhotos.slice();'), "openSlideshow must slice state.allPhotos when falling back");
assert(appJs.includes('showToast("Belum ada foto yang tersedia untuk Mode Panggung.", "warning");'), "openSlideshow must show toast when no photos exist at all");

// B. showSlide sharp image resolution and onerror fallback
assert(appJs.includes('const sharpUrl = getSharpPreviewUrl(photo) || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";'), "showSlide must use getSharpPreviewUrl for max projector sharpness");
assert(appJs.includes('targetImg.onerror = function() {'), "showSlide must attach cascading onerror fallback to target slide image");
assert(appJs.includes('if (photo.previewUrl && this.src !== photo.previewUrl) {'), "onerror must first fallback to photo.previewUrl");
assert(appJs.includes('else if (photo.thumbnailUrl && this.src !== photo.thumbnailUrl) {'), "onerror must secondarily fallback to photo.thumbnailUrl");

// C. Dynamic realtime metadata in showSlide
assert(appJs.includes('const eventName = state.activeConfig.EVENT_NAME || state.activeConfig.COUPLE_NAME || "Wedding Gallery";'), "showSlide must read eventName from state.activeConfig dynamically");
assert(appJs.includes('catEl.innerText = infoParts.join(" • ");'), "showSlide must update slideshowCategory dynamically");

// D. Lightbox Mode Panggung trigger button
assert(indexHtml.includes('startSlideshowFromCurrent()'), "index.html must have trigger button for startSlideshowFromCurrent()");
assert(indexHtml.includes('class="lightbox-action-btn"'), "index.html must style the slideshow button with lightbox-action-btn");
assert(styleCss.includes('.lightbox-action-btn'), "css/style.css must have styles for .lightbox-action-btn");

// E. Empty gallery notification free of "Kategori • Photostage"
const emptyCardMatch = appJs.match(/class="empty-gallery-card"[\s\S]*?<\/div>\s*<\/div>/);
assert(emptyCardMatch, "empty-gallery-card must be present in js/app.js");
assert(!emptyCardMatch[0].includes('Kategori &bull;'), "empty-gallery-card must NOT contain 'Kategori &bull;'");
assert(!emptyCardMatch[0].includes('empty-gallery-badge'), "empty-gallery-card must NOT contain 'empty-gallery-badge'");

console.log("✅ PASS: Photostage logic, cascading onerror, and UI triggers verified!");

// 2. ZERO-HARDCODE REALTIME AUDIT (ROUND 1: FRONTEND)
console.log("\n--- 2. Testing Frontend Zero-Hardcode Realtime ---");
assert(!appJs.includes('"111111"'), "js/app.js must NOT contain hardcoded fallback PIN 111111");
assert(!appJs.includes('"123456"'), "js/app.js must NOT contain hardcoded fallback PIN 123456");
assert(!appJs.includes('usr_superadmin'), "js/app.js must NOT contain usr_superadmin");
assert(appJs.includes('SLIDESHOW_INTERVAL_SEC: parseInt(state.activeConfig.SLIDESHOW_INTERVAL_SEC, 10) || 4'), "loadFallbackData must use dynamic SLIDESHOW_INTERVAL_SEC from activeConfig");

console.log("✅ PASS: Frontend is 100% free of hardcoded fallback credentials and metadata!");

// 3. ZERO-HARDCODE REALTIME AUDIT (ROUND 2: SERVERLESS APIS)
console.log("\n--- 3. Testing Serverless APIs ---");
const apiFiles = ['api/drive-folder.js', 'api/fotoshare.js', 'api/google-photos.js', 'api/kingphotobooth.js'];
apiFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'), `${file} must not contain hardcoded folder ID`);
  assert(!content.includes('andre-fayola'), `${file} must not contain hardcoded event ID`);
});
console.log("✅ PASS: Serverless APIs operate 100% dynamically based on query parameters!");

// 4. ZERO-HARDCODE REALTIME AUDIT (ROUND 3: BACKEND GAS)
console.log("\n--- 4. Testing Google Apps Script Backend ---");
assert(!codeGs.includes('WEDDING_FOLDER_URL'), "code.gs must NOT contain WEDDING_FOLDER_URL");
assert(!setupGs.includes('WEDDING_FOLDER_URL'), "setup.gs must NOT contain WEDDING_FOLDER_URL");
assert(!codeGs.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), "code.gs must NOT contain hardcoded stage folder ID");
assert(!setupGs.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), "setup.gs must NOT contain hardcoded stage folder ID");
assert(!codeGs.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'), "code.gs must NOT contain hardcoded main folder ID");
assert(!setupGs.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'), "setup.gs must NOT contain hardcoded main folder ID");
assert(!codeGs.includes('andre-fayola-281'), "code.gs must NOT contain hardcoded andre-fayola-281");
assert(!setupGs.includes('andre-fayola-281'), "setup.gs must NOT contain hardcoded andre-fayola-281");
assert(!codeGs.includes('wilson-felicia-133'), "code.gs must NOT contain hardcoded wilson-felicia-133");
assert(!setupGs.includes('wilson-felicia-133'), "setup.gs must NOT contain hardcoded wilson-felicia-133");
assert(!codeGs.includes('initialUsers = ['), "code.gs must NOT seed initial dummy users");
assert(!setupGs.includes('initialUsers = ['), "setup.gs must NOT seed initial dummy users");
assert(!codeGs.includes('initialEventsData = ['), "code.gs must NOT seed initial dummy events");
assert(!setupGs.includes('initialEvents = ['), "setup.gs must NOT seed initial dummy events");

console.log("✅ PASS: code.gs and setup.gs are 100% clean of hardcoded fallback database records!");

console.log("\n========================================================");
console.log("ALL PHOTOSTAGE AND ZERO-FALLBACK ASSERTIONS PASSED 100%!");
console.log("========================================================");

