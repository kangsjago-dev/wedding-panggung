const fs = require('fs');
const path = require('path');

console.log("=== COMPREHENSIVE VERIFICATION OF NEW FEATURES ===");

// 1. Verify HTML elements
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const requiredHtmlElements = [
  'id="eventNotFoundScreen"',
  'id="heroLogoContainer"',
  'id="heroLogoImg"',
  'id="cfgEventLogoUrl"',
  'id="adminLogoPreviewBox"',
  'id="adminLogoPreviewImg"',
  'id="adminLogoPreviewPlaceholder"',
  'id="neLogoUrl"'
];

let allHtmlPassed = true;
requiredHtmlElements.forEach(el => {
  if (html.includes(el)) {
    console.log(`✓ HTML Element: ${el} FOUND`);
  } else {
    console.error(`✗ HTML Element: ${el} MISSING!`);
    allHtmlPassed = false;
  }
});

// 2. Verify CSS classes
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const requiredCssClasses = [
  '.hero-logo-container',
  '.hero-logo-img',
  '.event-not-found-wrapper',
  '.event-not-found-card',
  '.event-not-found-icon-box',
  '.event-not-found-title',
  '.event-not-found-desc'
];

let allCssPassed = true;
requiredCssClasses.forEach(cls => {
  if (css.includes(cls)) {
    console.log(`✓ CSS Rule: ${cls} FOUND`);
  } else {
    console.error(`✗ CSS Rule: ${cls} MISSING!`);
    allCssPassed = false;
  }
});

// 3. Verify JavaScript logic for Google Drive logo normalization
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const vm = require('vm');
const scope = {};
vm.runInNewContext(appJs.substring(appJs.indexOf('function normalizeDriveImageUrl'), appJs.indexOf('const downloadQueue')), scope);

const testDriveLinks = [
  { in: "https://drive.google.com/file/d/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5/view?usp=sharing", expectedId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5" },
  { in: "https://drive.google.com/open?id=1GGB77clCMYBIg17J0ECr2eVbD02ZeInW", expectedId: "1GGB77clCMYBIg17J0ECr2eVbD02ZeInW" },
  { in: "11u-XHGv13oljACPnwSfTIS65NEIeRNa-", expectedId: "11u-XHGv13oljACPnwSfTIS65NEIeRNa-" }
];

let allDrivePassed = true;
testDriveLinks.forEach(tc => {
  const normalized = scope.normalizeDriveImageUrl(tc.in);
  if (normalized.includes(tc.expectedId) && normalized.startsWith("https://lh3.googleusercontent.com/d/")) {
    console.log(`✓ Normalize Drive Link: ${tc.in.substring(0, 30)}... => OK`);
  } else {
    console.error(`✗ Normalize Drive Link Failed for: ${tc.in}`);
    allDrivePassed = false;
  }
});

// 4. Verify Syntax
const nodeProc = require('child_process');
try {
  nodeProc.execSync('node -c js/app.js');
  console.log("✓ js/app.js syntax check passed");
} catch(e) {
  console.error("✗ js/app.js syntax error:", e);
  process.exit(1);
}

if (allHtmlPassed && allCssPassed && allDrivePassed) {
  console.log("\nALL VERIFICATIONS PASSED 100% SUCCESFULLY!");
} else {
  process.exit(1);
}

