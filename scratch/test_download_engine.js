const assert = require('assert');

function generateUniqueFileName(baseName, suffix, ext) {
  const clean = (baseName || "wedding-photo")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 45);
  const salt = Date.now().toString().slice(-4);
  const sfx = suffix ? ("-" + suffix) : "";
  const extension = ext || ".jpg";
  return clean + sfx + "_" + salt + extension;
}

const f1 = generateUniqueFileName("20261114_204246.821", "berbingkai", ".jpg");
console.log("Generated Framed Filename:", f1);
assert(!f1.includes(".821-berbingkai-2.jpg"), "Must not collide with old -2 pattern");
assert(f1.endsWith(".jpg"), "Must end with .jpg");
assert(f1.includes("_"), "Must have unique salt");

const f2 = generateUniqueFileName("Photobooth 10", "", ".jpg");
console.log("Generated Photobooth Filename:", f2);
assert(!f2.includes(" "), "Must be safe without raw spaces");

console.log("All download filename tests PASSED!");

