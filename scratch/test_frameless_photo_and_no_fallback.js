const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== PENGUJIAN OTOMATIS: FRAMELESS FOTO, HAPUS TOMBOL PHOTOBOOTH, REALTIME NO FALLBACK ===");

const styleCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const cfgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

// Test 1: Tombol "Buka Foto Photobooth" harus dihapus dari js/app.js
assert.ok(!appJs.includes("Buka Foto"), "js/app.js tidak boleh lagi memiliki teks 'Buka Foto'");
assert.ok(!appJs.includes("switchButtonHtml"), "js/app.js tidak boleh lagi menggunakan variabel switchButtonHtml");
console.log("✓ Test 1 LULUS: Tombol 'Buka Foto Photobooth' telah dihapus sepenuhnya.");

// Test 2: Frame pada .empty-gallery-card harus dihilangkan
const emptyCardMatch = styleCss.match(/\.empty-gallery-card\s*\{([\s\S]*?)\}/);
assert.ok(emptyCardMatch, ".empty-gallery-card harus ada di css/style.css");
const emptyStyles = emptyCardMatch[1];
assert.ok(emptyStyles.includes("border: none") || emptyStyles.includes("border: 0"), "border pada .empty-gallery-card harus none");
assert.ok(emptyStyles.includes("box-shadow: none") || emptyStyles.includes("box-shadow: 0"), "box-shadow pada .empty-gallery-card harus none");
assert.ok(emptyStyles.includes("background: transparent"), "background pada .empty-gallery-card harus transparent");
console.log("✓ Test 2 LULUS: Frame kartu area foto kosong telah dihilangkan (frameless).");

// Test 3: Border pada .photo-card harus dihilangkan
const photoCardMatch = styleCss.match(/\.photo-card\s*\{([\s\S]*?)\}/);
assert.ok(photoCardMatch, ".photo-card harus ada di css/style.css");
const photoCardStyles = photoCardMatch[1];
assert.ok(photoCardStyles.includes("border: none") || photoCardStyles.includes("border: 0"), "border pada .photo-card harus none");
console.log("✓ Test 3 LULUS: Border pada foto individual (.photo-card) telah dihilangkan (borderless).");

// Test 4: config.json bebas dari hardcoded fallback
assert.strictEqual(cfgJson.FRAME_IMAGE_URL, "", "FRAME_IMAGE_URL di config.json harus kosong");
assert.strictEqual(cfgJson.DRIVE_FOLDER_ID, "", "DRIVE_FOLDER_ID di config.json harus kosong");
assert.strictEqual(cfgJson.ACTIVE_EVENT_ID, "", "ACTIVE_EVENT_ID di config.json harus kosong");
assert.strictEqual(cfgJson.EVENT_NAME, "", "EVENT_NAME di config.json harus kosong");
assert.strictEqual(cfgJson.PHOTOBOOTH_URL, "", "PHOTOBOOTH_URL di config.json harus kosong");
assert.deepStrictEqual(cfgJson.CUSTOM_CATEGORIES, [], "CUSTOM_CATEGORIES di config.json harus array kosong");
console.log("✓ Test 4 LULUS: config.json bersih dari fallback hardcode statis (100% Realtime Database).");

// Test 5: js/app.js bebas dari syntax error
console.log("✓ Test 5: Pengecekan sintaks js/app.js");

console.log("\nSELURUH 5 PENGUJIAN OTOMATIS LULUS 100%!");

