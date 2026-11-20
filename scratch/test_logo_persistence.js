const fs = require('fs');
const assert = require('assert');

console.log("=== [TEST 1] JavaScript Syntax Check (js/app.js) ===");
require('child_process').execSync('node --check js/app.js', { stdio: 'inherit' });
console.log("PASS: js/app.js valid syntax.");

console.log("\n=== [TEST 2] Logo Preservation in syncFromSpreadsheetGViz ===");
const appCode = fs.readFileSync('js/app.js', 'utf8');

assert(appCode.includes('let cleanLogo = rowCells[logoIdx] ? String(rowCells[logoIdx].v || \'\').trim() : \'\';'), 'Harus membaca cleanLogo dari rowCells');
assert(appCode.includes('if (!cleanLogo && sheetMap'), 'Harus fallback ke sheetMap jika cleanLogo kosong');
assert(appCode.includes('state.activeConfig.EVENT_LOGO_URL = matchedEv.logoUrl || matchedEv.EVENT_LOGO_URL || state.activeConfig.EVENT_LOGO_URL || (sheetMap && (sheetMap.EVENT_LOGO_URL || sheetMap.logoUrl))'), 'Anti-wipeout pada matchedEv harus ada');
console.log("PASS: Anti-wipeout pada syncFromSpreadsheetGViz terverifikasi.");

console.log("\n=== [TEST 3] Logo Form Population in populateConfigToUI ===");
assert(appCode.includes('const cfgLogoEl = document.getElementById("cfgEventLogoUrl");'), 'populateConfigToUI harus memiliki cfgLogoEl');
assert(appCode.includes('updateAdminLogoPreview(curLogo);'), 'populateConfigToUI harus memanggil updateAdminLogoPreview');
console.log("PASS: populateConfigToUI mengisi elemen cfgEventLogoUrl dan memperbarui preview.");

console.log("\n=== [TEST 4] Logo Preservation in openAdminSettingsModal & populateAdminInputsForActiveEvent ===");
assert(appCode.includes('state.activeConfig.EVENT_LOGO_URL = activeEv.logoUrl || activeEv.EVENT_LOGO_URL || state.activeConfig.EVENT_LOGO_URL || GLOBAL_CONFIG.EVENT_LOGO_URL'), 'openAdminSettingsModal harus mempertahankan logo');
assert(appCode.includes('const rawLogo = cfg.EVENT_LOGO_URL || cfg.LOGO_URL || cfg.logoUrl || (state.activeConfig && (state.activeConfig.EVENT_LOGO_URL || state.activeConfig.logoUrl))'), 'populateAdminInputsForActiveEvent harus mempertahankan logo');
console.log("PASS: openAdminSettingsModal dan populateAdminInputsForActiveEvent terverifikasi anti-wipeout.");

console.log("\n=== [TEST 5] Verification of config.json, code.gs, setup.gs ===");
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const wf = cfg.EVENTS.find(e => e.id === 'wilson-felicia-133');
assert(wf && wf.logoUrl && wf.logoUrl.includes('drive.google.com'), 'config.json harus memuat logoUrl untuk wilson-felicia-133');

const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(codeGs.includes('1tsZZc6y_0xiCVWunfPiEN_eQdAsjJP_B'), 'code.gs harus memuat logo Google Drive resmi');

const setupGs = fs.readFileSync('setup.gs', 'utf8');
assert(setupGs.includes('1tsZZc6y_0xiCVWunfPiEN_eQdAsjJP_B'), 'setup.gs harus memuat logo Google Drive resmi');

console.log("PASS: config.json, code.gs, dan setup.gs telah diverifikasi memuat logo resmi.");

console.log("\n========================================================");
console.log("SELURUH 5/5 PENGUJIAN LOGO PERSISTENCE LULUS (100% PASS)!");
console.log("========================================================");

