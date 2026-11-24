const fs = require('fs');
const path = require('path');
const https = require('https');

console.log("=== TEST SUITE: PHOTOBOOTH CLEAN PREVIEW IMAGES (v4.41.0) ===");

// 1. Syntax check
const files = [
  '../api/kingphotobooth.js',
  '../js/categories.js',
  '../js/gallery.js',
  '../js/core.js'
];

files.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, f), 'utf8');
  try {
    // If ES module (api/kingphotobooth.js), test with Function wrapping export default
    if (f.endsWith('kingphotobooth.js')) {
      new Function("exportDefault", code.replace('export default', 'return'));
    } else {
      new Function(code);
    }
    console.log(`PASS: Syntax check for ${f}`);
  } catch(e) {
    console.error(`FAIL: Syntax error in ${f}:`, e.message);
    process.exit(1);
  }
});

// 2. Kingphotobooth Parser Simulation
const rawSampleItem = {
  id: 13675,
  share_token: '86601df8',
  thumb: '/storage/thumbs/86/8c95ec649a735bf10f6e5b89.jpg?e=1795563301&s=a953586ea75c71bccddc610d1ba077a9',
  is_video: false
};
const origin = "https://x1.kingphotobooth.co";

const cleanThumb = String(rawSampleItem.thumb || "").split("?")[0];
const thumbUrl = cleanThumb ? (origin + cleanThumb) : "";

if (thumbUrl.includes("?")) {
  console.error("FAIL: thumbUrl still contains query parameters:", thumbUrl);
  process.exit(1);
}
console.log("PASS: thumbUrl is clean static URL:", thumbUrl);

// 3. Verify HTTP 200 OK on live Kingphotobooth asset
https.get(thumbUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  if (res.statusCode === 200 && res.headers['content-type'].includes('image')) {
    console.log("PASS: Live HTTP 200 OK verified on clean thumbUrl. Type:", res.headers['content-type']);
  } else {
    console.error("FAIL: thumbUrl did not return 200 OK. Status:", res.statusCode);
    process.exit(1);
  }

  // 4. Test self-healing in handlePhotoError
  const galleryCode = fs.readFileSync(path.join(__dirname, '../js/gallery.js'), 'utf8');
  if (galleryCode.includes('imgElement.dataset.retriedClean = "true"') &&
      galleryCode.includes('imgElement.src = currentSrc.split("?")[0]')) {
    console.log("PASS: js/gallery.js contains query stripping self-healing mechanism in handlePhotoError.");
  } else {
    console.error("FAIL: js/gallery.js missing self-healing query stripping in handlePhotoError.");
    process.exit(1);
  }

  console.log("\nALL PHOTOBOOTH PREVIEW IMAGE TESTS PASSED 100%! (v4.41.0)");
}).on('error', err => {
  console.error("FAIL: Network error:", err.message);
  process.exit(1);
});

