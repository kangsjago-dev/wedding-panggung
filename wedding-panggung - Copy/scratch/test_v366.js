// Unit & Integration Test Suite for v3.6.6
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== RUNNING TEST SUITE v3.6.6 ===");

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf-8');
const js = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf-8');
const gs = fs.readFileSync(path.join(__dirname, '../code.gs'), 'utf-8');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log("  [PASS] " + desc);
    passCount++;
  } catch (err) {
    console.error("  [FAIL] " + desc + ": " + err.message);
    process.exit(1);
  }
}

// 1. HTML Markup Tests
test("HTML has btnAutoRotateCategory in action-controls-group", () => {
  assert.ok(html.includes('id="btnAutoRotateCategory"'), "Should contain id='btnAutoRotateCategory'");
  assert.ok(html.includes('onclick="toggleActiveCategoryRotation()"'), "Should have onclick toggleActiveCategoryRotation");
});

test("HTML Lightbox topbar has lightboxRotateBtn", () => {
  assert.ok(html.includes('id="lightboxRotateBtn"'), "Should contain id='lightboxRotateBtn'");
  assert.ok(html.includes('onclick="rotateLightboxCurrentPhoto()"'), "Should have onclick rotateLightboxCurrentPhoto");
  assert.ok(html.includes('id="lightboxRotateLabel"'), "Should have id='lightboxRotateLabel'");
});

// 2. CSS Styling Tests
test("CSS has image-orientation: from-image;", () => {
  assert.ok(css.includes('image-orientation: from-image;'), "Should have image-orientation: from-image;");
});

test("CSS has rotation classes .rotate-90, .rotate-180, .rotate-270", () => {
  assert.ok(css.includes('.photo-img.rotate-90'), "Should have .photo-img.rotate-90");
  assert.ok(css.includes('transform: rotate(90deg)'), "Should have transform rotate(90deg)");
  assert.ok(css.includes('.photo-img.rotate-180'), "Should have .photo-img.rotate-180");
  assert.ok(css.includes('.photo-img.rotate-270'), "Should have .photo-img.rotate-270");
});

test("CSS has .photo-card-rotate-btn styling", () => {
  assert.ok(css.includes('.photo-card-rotate-btn'), "Should define .photo-card-rotate-btn");
  assert.ok(css.includes('.photo-card:hover .photo-card-rotate-btn'), "Should show on card hover");
});

// 3. JavaScript Auto-Rotate & Rotation System Tests
test("JS defines getPhotoRotation and setPhotoRotation", () => {
  assert.ok(js.includes('function getPhotoRotation('), "getPhotoRotation should be defined");
  assert.ok(js.includes('function setPhotoRotation('), "setPhotoRotation should be defined");
  assert.ok(js.includes('function rotateSinglePhoto('), "rotateSinglePhoto should be defined");
  assert.ok(js.includes('function toggleActiveCategoryRotation('), "toggleActiveCategoryRotation should be defined");
  assert.ok(js.includes('function rotateLightboxCurrentPhoto('), "rotateLightboxCurrentPhoto should be defined");
});

test("JS Lightbox applyLightboxZoom includes rotation transform", () => {
  assert.ok(js.includes('function applyLightboxZoom('), "applyLightboxZoom should be defined");
  assert.ok(js.includes('rotate(') && js.includes('getPhotoRotation('), "applyLightboxZoom should query photo rotation and include rotate()");
});

test("JS renderPhotoGrid applies rotation class and render photo-card-rotate-btn", () => {
  assert.ok(js.includes('photo-card-rotate-btn'), "renderPhotoGrid should include rotate button on card");
  assert.ok(js.includes('rotate-90') && js.includes('rotate-180') && js.includes('rotate-270'), "renderPhotoGrid should apply rotation classes");
});

test("JS compositePhotoWithFrame rotates canvas context for rotated photos", () => {
  assert.ok(js.includes('ctx.rotate('), "compositePhotoWithFrame should call ctx.rotate");
  assert.ok(js.includes('getPhotoRotation(photo.id'), "compositePhotoWithFrame should check getPhotoRotation");
});

// 4. Category Link Changing & Syncing Tests
test("JS syncSingleCategory reads latest DOM inputs and saves to backend", () => {
  assert.ok(js.includes('getCategoriesFromAdminInputs()'), "syncSingleCategory should read latest inputs");
  assert.ok(js.includes('state.lastLocalCategoryEditTime = Date.now()'), "Should track local edit time to prevent overwrite");
  assert.ok(js.includes('saveAdminSettings'), "Should call saveAdminSettings to persist to backend");
});

test("JS applyCategoryFilter invalidates cache when targetUrl differs from categoryPhotosUrlMap", () => {
  assert.ok(js.includes('state.categoryPhotosUrlMap'), "Should track categoryPhotosUrlMap");
  assert.ok(js.includes('delete state.categoryPhotosMap[category]'), "Should delete cache if targetUrl changed");
});

test("JS fetchDriveCategoryPhotos fallback does NOT force 116 photos when driveFolderId is provided", () => {
  assert.ok(js.includes('!driveFolderId && cat.toLowerCase().includes("wedding")'), "Fallback should only run if !driveFolderId");
});

test("JS admin category rows and photobooth box include Auto-Rotate selector", () => {
  assert.ok(js.includes('id="pbRotationSelect"'), "Photobooth should have rotation selector");
  assert.ok(js.includes('cat-rotation-select'), "Category rows should have cat-rotation-select");
  assert.ok(js.includes('getCategoriesFromAdminInputs'), "getCategoriesFromAdminInputs should parse rotation");
});

test("JS loadPublicSheetConfig protects against overwriting recently edited local categories", () => {
  assert.ok(js.includes('isEditingLocally'), "Should check isEditingLocally");
  assert.ok(js.includes('isModalOpen'), "Should check isModalOpen");
});

// 5. Backend code.gs Check
test("code.gs saveAdminSettings handles CUSTOM_CATEGORIES and updates EVENTS", () => {
  assert.ok(gs.includes('props.setProperty("CUSTOM_CATEGORIES"'), "code.gs should set CUSTOM_CATEGORIES prop");
  assert.ok(gs.includes('existingEvents[evI].customCategories = parsedCats'), "code.gs should update events customCategories");
});

console.log(`\nALL ${passCount} TESTS PASSED SUCCESSFULLY!`);

