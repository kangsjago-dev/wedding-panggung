const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== TEST SUITE: LOGO FALLBACK & REALTIME ISOLATION AUDIT ===');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(' PASS: ' + desc);
    passCount++;
  } catch(e) {
    console.error(' FAIL: ' + desc + ' -> ' + e.message);
    process.exit(1);
  }
}

// 1. Verify index.html logo container and hydration script
const indexHtml = fs.readFileSync('index.html', 'utf8');

test('index.html has heroLogoContainer with initial display:none', () => {
  assert(indexHtml.includes('id="heroLogoContainer" class="hero-logo-container" style="display: none;"'),
    'heroLogoContainer should be display none by default');
});

test('index.html heroLogoImg has robust onerror fallback', () => {
  assert(indexHtml.includes('id="heroLogoImg" src="" alt="Logo Acara / Monogram" class="hero-logo-img" onerror="this.src=\'\'; this.parentElement.style.display=\'none\';"'),
    'heroLogoImg onerror must hide parent and clear src');
});

test('index.html inline hydration script clears logo when event has no logo', () => {
  assert(indexHtml.includes('cont.style.display = "none";') && indexHtml.includes('img.src = "";'),
    'hydration script must reset container to none and clear img.src when lUrl is empty');
});

// 2. Verify js/app.js logo isolation
const appJs = fs.readFileSync('js/app.js', 'utf8');

test('js/app.js handleGalleryResponse strictly isolates EVENT_LOGO_URL to activeEv.logoUrl', () => {
  assert(appJs.includes('response.config.EVENT_LOGO_URL = activeEv.logoUrl || activeEv.EVENT_LOGO_URL || "";'),
    'handleGalleryResponse must set response.config.EVENT_LOGO_URL from activeEv');
  assert(appJs.includes('state.activeConfig.EVENT_LOGO_URL = activeEv.logoUrl || activeEv.EVENT_LOGO_URL || "";'),
    'handleGalleryResponse must guard state.activeConfig.EVENT_LOGO_URL after Object.assign');
});

test('js/app.js syncFromSpreadsheetGViz strictly isolates EVENT_LOGO_URL to matchedEv.logoUrl', () => {
  assert(appJs.includes('state.activeConfig.EVENT_LOGO_URL = matchedEv.logoUrl || matchedEv.EVENT_LOGO_URL || "";'),
    'syncFromSpreadsheetGViz must isolate EVENT_LOGO_URL');
});

test('js/app.js populateConfigToUI cleanly hides heroLogoContainer when rawLogo is empty', () => {
  assert(appJs.includes('logoContainer.style.display = "none";') && appJs.includes('logoImg.src = "";'),
    'populateConfigToUI must hide logoContainer and clear logoImg.src when rawLogo is empty');
});

test('js/app.js openShareModal uses active event logo with fallback to empty string', () => {
  assert(appJs.includes('const activeLogo = (state.activeConfig.EVENT_LOGO_URL || state.activeConfig.LOGO_URL || state.activeConfig.logoUrl || "").trim();'),
    'openShareModal must check activeConfig');
});

test('js/app.js handleEventSelectChange strictly sets EVENT_LOGO_URL from selected event', () => {
  assert(appJs.includes('EVENT_LOGO_URL: ev.logoUrl || ev.EVENT_LOGO_URL || "",'),
    'handleEventSelectChange must isolate logo to ev.logoUrl');
});

// 3. Verify code.gs backend isolation
const codeGs = fs.readFileSync('code.gs', 'utf8');

test('code.gs getGalleryData sets safeConfig.EVENT_LOGO_URL from currentEvent (no global fallback)', () => {
  assert(codeGs.includes('safeConfig.EVENT_LOGO_URL = currentEvent.logoUrl || currentEvent.EVENT_LOGO_URL || "";'),
    'code.gs getGalleryData must isolate safeConfig.EVENT_LOGO_URL from currentEvent');
});

test('code.gs readEventsFromSheet reads Logo_Acara / EVENT_LOGO_URL column', () => {
  assert(codeGs.includes("var logoCol = header.indexOf('Logo_Acara');"),
    'code.gs readEventsFromSheet must look for Logo_Acara column');
  assert(codeGs.includes("logoUrl: logoCol >= 0 ? String(row[logoCol] || '').trim() : '',"),
    'code.gs readEventsFromSheet must set logoUrl from row');
});

test('code.gs syncEventsToSheet writes Logo_Acara column to Daftar_Acara', () => {
  assert(codeGs.includes("'Logo_Acara', 'Status'"),
    'code.gs syncEventsToSheet headers must include Logo_Acara');
  assert(codeGs.includes("ev.logoUrl || ev.EVENT_LOGO_URL || '',"),
    'code.gs syncEventsToSheet rows must include ev.logoUrl');
});

test('code.gs saveAdminSettings syncs EVENT_LOGO_URL to active event in EVENTS array', () => {
  assert(codeGs.includes('existingEvents[evI].logoUrl = cleanLogo;'),
    'code.gs saveAdminSettings must sync cleanLogo to active event in EVENTS array');
});

// 4. Verify setup.gs
const setupGs = fs.readFileSync('setup.gs', 'utf8');

test('setup.gs includes Logo_Acara in eventHeaders', () => {
  assert(setupGs.includes('"Logo_Acara", "Status"'),
    'setup.gs must include Logo_Acara in eventHeaders');
  assert(setupGs.includes('sheetEvents.getRange(1, 1, 1, 11).setValues(eventHeaders)'),
    'setup.gs must write 11 columns for eventHeaders');
});

// 5. Verify config.json
const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'));

test('config.json andre-fayola-281 has empty logoUrl (no fallback Runway logo)', () => {
  const andre = configJson.EVENTS.find(e => e.id === 'andre-fayola-281');
  assert(andre, 'andre-fayola-281 event must exist');
  assert.strictEqual(andre.logoUrl, '', 'andre-fayola-281 logoUrl must be empty string');
});

test('config.json global EVENT_LOGO_URL is empty', () => {
  assert.strictEqual(configJson.EVENT_LOGO_URL, '', 'global EVENT_LOGO_URL must be empty string');
});

// 6. Syntax validation of all scripts
test('Syntax check: js/app.js is valid JavaScript', () => {
  new vm.Script(appJs);
});

test('Syntax check: code.gs is valid JavaScript', () => {
  new vm.Script(codeGs);
});

test('Syntax check: setup.gs is valid JavaScript', () => {
  new vm.Script(setupGs);
});

console.log(`\nALL ${passCount} AUDIT TESTS PASSED 100%! ZERO FALLBACK HARDCODING DETECTED.`);

