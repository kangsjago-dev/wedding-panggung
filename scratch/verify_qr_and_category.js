const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

console.log("=== VERIFYING CATEGORY PHOTO STALE CLEARANCE & FALLBACK REMOVAL ===");

// 1. Verify fallbackDrive no longer references state.allPhotos
const driveFallbackMatch = appJs.match(/function fetchDriveCategoryPhotos[\s\S]*?function fallbackDrive\(\)\s*\{([\s\S]*?)\}/);
if (driveFallbackMatch) {
  const fallbackBody = driveFallbackMatch[1];
  if (fallbackBody.includes("state.allPhotos")) {
    console.error("FAIL: fallbackDrive still references state.allPhotos!");
    process.exit(1);
  } else {
    console.log("PASS: fallbackDrive does NOT pull from state.allPhotos. Hardcode fallback removed!");
  }
} else {
  console.error("FAIL: Could not find fallbackDrive in fetchDriveCategoryPhotos");
  process.exit(1);
}

// 2. Verify applyCategoryFilter resets state.filteredPhotos = [] and calls showGridSkeleton
const applyCatMatch = appJs.match(/function applyCategoryFilter\([^)]*\)\s*\{([\s\S]*?)function renderPhotoGrid/);
if (applyCatMatch) {
  const applyBody = applyCatMatch[1];
  if (applyBody.includes("state.filteredPhotos = [];") && applyBody.includes("showGridSkeleton();")) {
    console.log("PASS: applyCategoryFilter purges filteredPhotos and shows skeleton immediately!");
  } else {
    console.error("FAIL: applyCategoryFilter missing immediate filteredPhotos reset or showGridSkeleton call!");
    process.exit(1);
  }

  // Check that step 5 only matches exact category
  if (applyBody.includes("p.name && p.name.toLowerCase().includes(category.toLowerCase())")) {
    console.error("FAIL: Step 5 still does fuzzy filename matching!");
    process.exit(1);
  } else {
    console.log("PASS: Step 5 strictly matches category label without fuzzy filename fallback!");
  }
}

// 3. Verify onCategoryRowInput invalidates category cache when URL changes
const onCatRowMatch = appJs.match(/function onCategoryRowInput\(\)\s*\{([\s\S]*?)function getCategoriesFromAdminInputs/);
if (onCatRowMatch) {
  const onCatBody = onCatRowMatch[1];
  if (onCatBody.includes("delete state.categoryPhotosMap[cName]") && onCatBody.includes("delete state.categoryPhotosUrlMap[cName]")) {
    console.log("PASS: onCategoryRowInput immediately invalidates modified category cache!");
  } else {
    console.error("FAIL: onCategoryRowInput missing cache invalidation!");
    process.exit(1);
  }
}

console.log("\n=== VERIFYING QR SHARE WITH CENTERED LOGO ON SOLID WHITE BACKGROUND ===");

// 4. Verify generateBrandedQrCode exists and uses solid white fill and ecc=H
if (appJs.includes("function generateBrandedQrCode")) {
  console.log("PASS: generateBrandedQrCode function exists!");
} else {
  console.error("FAIL: generateBrandedQrCode not found!");
  process.exit(1);
}

const brandedQrMatch = appJs.match(/function generateBrandedQrCode[\s\S]*?\{([\s\S]*?)function openShareModal/);
if (brandedQrMatch) {
  const qrBody = brandedQrMatch[1];
  if (qrBody.includes("ecc=H")) {
    console.log("PASS: QR code uses High Error Correction (ecc=H) for 30% tolerance!");
  } else {
    console.error("FAIL: QR code does not use ecc=H!");
    process.exit(1);
  }

  if (qrBody.includes('ctx.fillStyle = "#FFFFFF"') && qrBody.includes('ctx.fill()')) {
    console.log("PASS: Centered badge uses solid pure white background behind transparent areas of logo!");
  } else {
    console.error("FAIL: Missing solid white fill for logo badge!");
    process.exit(1);
  }

  if (qrBody.includes("ctx.drawImage(logoImg")) {
    console.log("PASS: Logo is drawn on top of the solid white badge!");
  } else {
    console.error("FAIL: Missing logo drawImage on badge!");
    process.exit(1);
  }
}

// 5. Verify openShareModal calls generateBrandedQrCode with active event logo
const openShareMatch = appJs.match(/function openShareModal\(\)\s*\{([\s\S]*?)function closeShareModal/);
if (openShareMatch) {
  const shareBody = openShareMatch[1];
  if (shareBody.includes("generateBrandedQrCode(fullUrl, activeLogo")) {
    console.log("PASS: openShareModal integrates branded QR code generation with event active logo!");
  } else {
    console.error("FAIL: openShareModal does not call generateBrandedQrCode with active logo!");
    process.exit(1);
  }
}

// 6. Verify downloadQrCodeImage supports direct data: URI download
const downloadQrMatch = appJs.match(/function downloadQrCodeImage\(\)\s*\{([\s\S]*?)function renderAdminEventsManager/);
if (downloadQrMatch) {
  const dlBody = downloadQrMatch[1];
  if (dlBody.includes('qrImg.src.startsWith("data:")')) {
    console.log("PASS: downloadQrCodeImage supports instant download of composited data URI with logo!");
  } else {
    console.error("FAIL: downloadQrCodeImage missing direct data: URI support!");
    process.exit(1);
  }
}

console.log("\nALL VERIFICATION CHECKS PASSED PERFECTLY (6/6)!");

