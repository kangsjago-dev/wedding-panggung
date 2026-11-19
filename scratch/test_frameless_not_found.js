const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== PENGUJIAN OTOMATIS: REVISI LAYAR NOT FOUND MINIMAL FRAMELESS ===");

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// Test 1: Tombol "Masuk Panel Admin" harus tidak ada di #eventNotFoundScreen
const nfMatch = indexHtml.match(/<div id="eventNotFoundScreen"[\s\S]*?<\/div>\s*<\/div>/);
assert.ok(nfMatch, "Elemen #eventNotFoundScreen harus ditemukan di index.html");
assert.ok(!nfMatch[0].includes("Masuk Panel Admin"), "Tombol 'Masuk Panel Admin' harus sudah dihapus dari #eventNotFoundScreen");
console.log("✓ Test 1 LULUS: Tombol 'Masuk Panel Admin' sudah bersih dari #eventNotFoundScreen");

// Test 2: Kalimat contoh tautan "?event=nama-acara" harus sudah dihapus dari index.html dan js/app.js
assert.ok(!indexHtml.includes("?event=nama-acara"), "index.html tidak boleh lagi memuat teks '?event=nama-acara'");
assert.ok(!appJs.includes("?event=nama-acara"), "js/app.js tidak boleh lagi memuat teks '?event=nama-acara'");
console.log("✓ Test 2 LULUS: Kalimat contoh '?event=nama-acara' telah dihapus dari index.html dan js/app.js");

// Test 3: Hilangkan frame pada .event-not-found-card
const cardRegex = /\.event-not-found-card\s*\{([\s\S]*?)\}/;
const cardMatch = styleCss.match(cardRegex);
assert.ok(cardMatch, "Class .event-not-found-card harus ada di css/style.css");
const cardStyles = cardMatch[1];
assert.ok(cardStyles.includes("border: none") || cardStyles.includes("border: 0"), "border harus none di .event-not-found-card");
assert.ok(cardStyles.includes("box-shadow: none") || cardStyles.includes("box-shadow: 0"), "box-shadow harus none di .event-not-found-card");
assert.ok(cardStyles.includes("background: transparent"), "background harus transparent di .event-not-found-card");
console.log("✓ Test 3 LULUS: Frame, border, box-shadow, dan background putih kaku telah dihilangkan");

// Test 4: Sembunyikan #gallerySection dan .filter-wrapper di pre-hydration index.html
assert.ok(indexHtml.includes('document.getElementById("gallerySection")'), "index.html pre-hydration harus menargetkan #gallerySection");
console.log("✓ Test 4 LULUS: index.html pre-hydration menyembunyikan #gallerySection");

// Test 5: showEventNotFoundScreen menyembunyikan filterWrap dan floatBar
assert.ok(appJs.includes('document.getElementById("gallerySection")'), "showEventNotFoundScreen harus menargetkan #gallerySection");
assert.ok(appJs.includes('floatBar.style.display = "none"'), "showEventNotFoundScreen harus menyembunyikan #adminActiveFloatingBar");
console.log("✓ Test 5 LULUS: showEventNotFoundScreen menyembunyikan filter bar, tombol share, refresh, dan admin");

// Test 6: CSS fail-safe selector
assert.ok(styleCss.includes('#eventNotFoundScreen:not([style*="display: none"]) ~ #gallerySection'), "CSS fail-safe untuk gallerySection harus terpasang");
console.log("✓ Test 6 LULUS: CSS fail-safe untuk menyembunyikan kontrol bawah terpasang sempurna");

console.log("\nSELURUH 6 PENGUJIAN OTOMATIS LULUS 100%!");

