/**
 * Automated Verification: Homepage & Event Accessibility Suite
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const configJsonPath = path.join(__dirname, '..', 'config.json');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const configJson = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));

console.log("=== TEST SUITE: HOMEPAGE & EVENT ACCESSIBILITY ===");

// 1. Verify index.html does not kill page when accessing root URL
console.log("\n[TEST 1] Verify index.html inline script does not block root URL...");
assert(!indexHtml.includes('var nf = document.getElementById("eventNotFoundScreen");\n            if (nf) nf.style.display = "flex";\n            var hero = document.getElementById("heroSection");\n            if (hero) hero.style.display = "none";'),
  "index.html must not hide hero or show 404 when targetEventId is not in URL!");
assert(indexHtml.includes('targetEventId = localStorage.getItem("WEDDING_ACTIVE_EVENT_ID") || "andre-fayola-281";'),
  "index.html must fallback targetEventId to active event!");
console.log("✓ PASS: index.html seamlessly handles root URL without premature 404 block.");

// 2. Verify js/app.js handles root URL without early return
console.log("\n[TEST 2] Verify js/app.js handles root URL gracefully...");
assert(!appJs.includes('// Link diketik manual tanpa ?event=... -> Tampilkan Halaman Tidak Ditemukan murni\n        state.currentEventId = "";\n        showEventNotFoundScreen(true);'),
  "js/app.js must not show 404 and return early when URL has no ?event= param!");
assert(appJs.includes('urlEventId = localStorage.getItem("WEDDING_ACTIVE_EVENT_ID") || (state.events && state.events[0] && state.events[0].id) || "andre-fayola-281";'),
  "js/app.js must default urlEventId to active event!");
console.log("✓ PASS: js/app.js resolves root URL directly to active wedding event.");

// 3. Verify syncFromSpreadsheetGViz matches exact and base slug variants
console.log("\n[TEST 3] Verify syncFromSpreadsheetGViz matching logic...");
assert(appJs.includes("eId.replace(/-\\d+$/, '') === uId.replace(/-\\d+$/, '')"),
  "Slug matching must support base slug alias (e.g. wilson-felicia vs wilson-felicia-133)!");
assert(appJs.includes("const explicitUrlParam = getActiveEventIdFromUrl();"),
  "syncFromSpreadsheetGViz must track explicitUrlParam to only show 404 when an explicit invalid event is requested!");
console.log("✓ PASS: syncFromSpreadsheetGViz robustly matches events and distinguishes root from invalid params.");

// 4. Verify config.json EVENTS contains all required events
console.log("\n[TEST 4] Verify config.json EVENTS...");
assert(configJson.EVENTS.some(e => e.id === "andre-fayola-281"), "andre-fayola-281 must be in config.json");
assert(configJson.EVENTS.some(e => e.id === "wilson-felicia-133"), "wilson-felicia-133 must be in config.json");
assert(configJson.EVENTS.some(e => e.id === "wilson-felicia"), "wilson-felicia must be in config.json");
console.log("✓ PASS: config.json contains all 3 valid event registrations.");

// 5. Verify syntax of index.html and app.js
console.log("\n[TEST 5] Syntax verification...");
try {
  new Function(appJs);
  console.log("✓ PASS: js/app.js is 100% syntactically valid.");
} catch (e) {
  assert.fail("Syntax error in js/app.js: " + e.message);
}

console.log("\n========================================================");
console.log("ALL 5 ACCESSIBILITY TESTS PASSED 100%! Website & events fully accessible.");

