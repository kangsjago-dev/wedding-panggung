// scratch/test_v380.js
// Verification suite for v3.8.0 fixes

const fs = require('fs');

console.log("=== RUNNING V3.8.0 VERIFICATION SUITE ===");

// 1. Check syntax of app.js and code.gs
try {
  const appCode = fs.readFileSync('js/app.js', 'utf8');
  new Function(appCode);
  console.log("✓ js/app.js syntax is 100% valid.");
} catch (e) {
  console.error("FAIL: js/app.js syntax error:", e);
  process.exit(1);
}

try {
  const gsCode = fs.readFileSync('code.gs', 'utf8');
  new Function(gsCode);
  console.log("✓ code.gs syntax is 100% valid.");
} catch (e) {
  console.error("FAIL: code.gs syntax error:", e);
  process.exit(1);
}

// 2. Check CSS styling for modal header stability
const cssCode = fs.readFileSync('css/style.css', 'utf8');
if (cssCode.includes('#adminSettingsModal {') && 
    cssCode.includes('align-items: flex-start;') && 
    cssCode.includes('height: min(88vh, 800px);')) {
  console.log("✓ CSS modal header positioning verified (fixed height & flex-start pinning).");
} else {
  console.error("FAIL: CSS modal pinning rule missing!");
  process.exit(1);
}

// 3. Verify getEffectiveAdminPin implementation in js/app.js
const appCode = fs.readFileSync('js/app.js', 'utf8');
if (appCode.includes('function getEffectiveAdminPin()') &&
    appCode.includes('sessionStorage.getItem("WEDDING_ADMIN_PIN")') &&
    appCode.includes('localStorage.getItem("WEDDING_ADMIN_PIN")')) {
  console.log("✓ getEffectiveAdminPin is implemented with storage fallback.");
} else {
  console.error("FAIL: getEffectiveAdminPin implementation missing or incomplete!");
  process.exit(1);
}

// 4. Test live GAS endpoint with PIN 121212
async function testLiveGAS() {
  const apiUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";
  
  console.log("Testing live GAS testAndSyncDriveFolder...");
  const syncUrl = `${apiUrl}?action=testAndSyncDriveFolder&api=true&pin=121212&folderId=1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5&allPhotosLabel=Semua%20Foto`;
  const resSync = await fetch(syncUrl, { redirect: 'follow' });
  const dataSync = await resSync.json();
  if (dataSync.success && dataSync.totalPhotos >= 60) {
    console.log(`✓ Live testAndSyncDriveFolder SUCCESS: Read ${dataSync.totalPhotos} photos from folder '${dataSync.folderName}'`);
  } else {
    console.error("FAIL: Live testAndSyncDriveFolder failed:", dataSync);
    process.exit(1);
  }

  console.log("Testing live GAS saveAdminSettings...");
  const saveUrl = `${apiUrl}?action=saveAdminSettings&api=true&pin=121212&config=` + encodeURIComponent(JSON.stringify({
    ALL_PHOTOS_LABEL: "Semua Foto",
    DRIVE_FOLDER_ID: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
    PHOTOBOOTH_URL: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
    CUSTOM_CATEGORIES: [
      { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true },
      { name: "Wedding", url: "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI", enabled: true }
    ]
  }));
  const resSave = await fetch(saveUrl, { redirect: 'follow' });
  const dataSave = await resSave.json();
  if (dataSave.success) {
    console.log("✓ Live saveAdminSettings SUCCESS: Saved settings to Google Sheets 'Pengaturan' & Properties.");
  } else {
    console.error("FAIL: Live saveAdminSettings failed:", dataSave);
    process.exit(1);
  }

  console.log("=== ALL V3.8.0 TESTS PASSED SUCCESSFULLY! ===");
}

testLiveGAS().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});

