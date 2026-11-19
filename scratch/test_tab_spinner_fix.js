const assert = require('assert');
const fs = require('fs');

console.log("=== UNIT TEST: PERBAIKAN INFINITE ONERROR LOOP & TAB SPINNER (v4.24.0) ===");

const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Test 1: Verify #heroLogoImg has no src="" in HTML
console.log("\n[Test 1] Memeriksa #heroLogoImg di index.html");
assert(!indexHtml.includes('<img id="heroLogoImg" src=""'), "index.html tidak boleh memiliki src='' pada heroLogoImg");
assert(indexHtml.includes('this.onerror=null; this.removeAttribute(\'src\');'), "heroLogoImg harus mencopot onerror dan menghapus atribut src saat error");
console.log("✓ PASS: heroLogoImg bersih dari src='' dan aman dari infinite loop");

// Test 2: Verify #adminLogoPreviewImg has no src="" in HTML
console.log("\n[Test 2] Memeriksa #adminLogoPreviewImg di index.html");
assert(!indexHtml.includes('<img id="adminLogoPreviewImg" src=""'), "index.html tidak boleh memiliki src='' pada adminLogoPreviewImg");
console.log("✓ PASS: adminLogoPreviewImg bersih dari src=''");

// Test 3: Verify inline micro-loader in index.html removes attribute src instead of setting src=""
console.log("\n[Test 3] Memeriksa inline micro-loader di index.html");
assert(indexHtml.includes('img.removeAttribute("src");'), "Inline micro-loader harus menggunakan removeAttribute('src')");
console.log("✓ PASS: Micro-loader menggunakan removeAttribute('src')");

// Test 4: Verify js/app.js uses removeAttribute("src") for empty logos
console.log("\n[Test 4] Memeriksa pembersihan atribut src pada js/app.js");
assert(appJs.includes('logoImg.removeAttribute("src");'), "populateConfigToUI & handleEventLogoInput harus menggunakan removeAttribute('src')");
assert(appJs.includes('pImg.removeAttribute("src");'), "updateAdminLogoPreview harus menggunakan removeAttribute('src')");
console.log("✓ PASS: Seluruh manipulasi logo di js/app.js menggunakan removeAttribute('src')");

// Test 5: Verify callBackend has AbortController timeout (8s)
console.log("\n[Test 5] Memeriksa timeout pengaman pada callBackend");
assert(appJs.includes('backendController = (typeof AbortController !== \'undefined\') ? new AbortController() : null'), "callBackend harus memiliki AbortController");
assert(appJs.includes('setTimeout(function() {\n          try { backendController.abort(); } catch(e) {}'), "callBackend harus memiliki timer pengaman");
assert(appJs.includes('}, 8000);'), "Timeout 8 detik harus aktif di callBackend");
console.log("✓ PASS: callBackend terlindungi AbortController 8 detik");

// Test 6: Verify tommy-natasha-594 in config.json
console.log("\n[Test 6] Memeriksa pendaftaran tommy-natasha-594 di config.json");
const tommyEv = configJson.EVENTS.find(e => e.id === "tommy-natasha-594");
assert(tommyEv, "tommy-natasha-594 harus ada di config.json");
assert.strictEqual(tommyEv.name, "Tommy & Natasha");
console.log("✓ PASS: tommy-natasha-594 terdaftar secara valid di config.json");

console.log("\n================================================================================");
console.log("SEMUA 6 PENGUJIAN PERBAIKAN TAB SPINNER BERHASIL (100% PASS - 0 FAIL)!");
console.log("================================================================================\n");

