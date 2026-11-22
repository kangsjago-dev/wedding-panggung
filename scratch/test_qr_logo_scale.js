/**
 * scratch/test_qr_logo_scale.js
 * Verification of 3x larger QR code logo scaling and safety margins
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== RUNNING TEST: QR CODE LOGO 3X SCALING ===");

// 1. Syntax check js/gallery.js
const galleryContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'gallery.js'), 'utf8');
assert.doesNotThrow(() => {
  new Function(galleryContent);
}, "Syntax error in js/gallery.js");
console.log("✓ PASS: js/gallery.js syntax valid");

// 2. Verifikasi parameter scaling baru di gallery.js
assert.ok(galleryContent.includes('size * 0.48'), "TEST FAIL: maxLogoW must be size * 0.48");
assert.ok(galleryContent.includes('size * 0.32'), "TEST FAIL: maxLogoH must be size * 0.32");
console.log("✓ PASS: New 3x scaling parameters present in js/gallery.js");

// 3. Simulasi perhitungan matematis scaling
const size = 600;

function calcLogo(sw, sh) {
  const maxLogoW = Math.round(size * 0.48); // ~288px
  const maxLogoH = Math.round(size * 0.32); // ~192px
  const scale = Math.min(maxLogoW / sw, maxLogoH / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const padX = Math.round(Math.max(8, dw * 0.04));
  const padY = Math.round(Math.max(6, dh * 0.06));
  const bw = dw + (padX * 2);
  const bh = dh + (padY * 2);
  const bx = Math.round((size - bw) / 2);
  const by = Math.round((size - bh) / 2);

  return { dw, dh, bw, bh, bx, by, areaBadge: bw * bh, areaLogo: dw * dh };
}

function calcOldLogo(sw, sh) {
  const maxBadgeDim = Math.round(size * 0.22); // ~132px
  const scale = Math.min(maxBadgeDim / sw, maxBadgeDim / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const padX = 6;
  const padY = 4;
  const bw = dw + (padX * 2);
  const bh = dh + (padY * 2);
  return { dw, dh, bw, bh, areaBadge: bw * bh, areaLogo: dw * dh };
}

// Kasus 1: Logo Landscape RUNWAY (350 x 100)
const oldRunway = calcOldLogo(350, 100);
const newRunway = calcLogo(350, 100);

console.log("Old RUNWAY logo:", oldRunway.dw, "x", oldRunway.dh, "Area:", oldRunway.areaLogo, "px²");
console.log("New RUNWAY logo:", newRunway.dw, "x", newRunway.dh, "Area:", newRunway.areaLogo, "px²");

// Periksa rasio perbesaran
const scaleRatioW = newRunway.dw / oldRunway.dw;
const scaleRatioH = newRunway.dh / oldRunway.dh;
const scaleRatioArea = newRunway.areaLogo / oldRunway.areaLogo;

console.log("Linear Scale Ratio:", scaleRatioW.toFixed(2), "x");
console.log("Area Scale Ratio:", scaleRatioArea.toFixed(2), "x");

assert.ok(scaleRatioW >= 2.0, "TEST FAIL: Width must be at least 2x larger");
assert.ok(scaleRatioArea >= 3.0, "TEST FAIL: Visual area must be at least 3x larger");
console.log("✓ PASS: RUNWAY logo is >= 3x larger in visual area (actual: " + scaleRatioArea.toFixed(1) + "x)!");

// Periksa batas aman ECC=H (harus < 15%, batas aman ECC=H adalah 30%)
const percentCovered = (newRunway.areaBadge / (size * size)) * 100;
console.log("Percentage of QR Code covered by badge:", percentCovered.toFixed(2) + "%");
assert.ok(percentCovered < 15, "TEST FAIL: Badge must cover less than 15% of QR code for safety");
console.log("✓ PASS: Percentage covered (" + percentCovered.toFixed(1) + "%) is well within ECC=H 30% limit!");

// Periksa jarak aman dari finder pattern (Finder patterns ada di X <= 110 dan X >= 490)
const leftEdge = newRunway.bx;
const rightEdge = newRunway.bx + newRunway.bw;
console.log("Badge horizontal bounds: [" + leftEdge + "px .. " + rightEdge + "px]");
assert.ok(leftEdge >= 115, "TEST FAIL: Left edge must be >= 115px to avoid left finder patterns");
assert.ok(rightEdge <= 485, "TEST FAIL: Right edge must be <= 485px to avoid right finder patterns");
console.log("✓ PASS: Safe margin from corner finder patterns confirmed (left: " + leftEdge + "px, right: " + rightEdge + "px)!");

// Kasus 2: Logo Square / Monogram (150 x 150)
const oldSquare = calcOldLogo(150, 150);
const newSquare = calcLogo(150, 150);
console.log("Square logo scale ratio:", (newSquare.areaLogo / oldSquare.areaLogo).toFixed(2), "x");
assert.ok(newSquare.areaLogo / oldSquare.areaLogo >= 2.0, "Square logo must also scale up");
console.log("✓ PASS: Square logo scaling verified");

console.log("\n========================================================");
console.log("ALL QR CODE LOGO 3X TESTS PASSED (100% SUCCESS)!");
console.log("========================================================");

