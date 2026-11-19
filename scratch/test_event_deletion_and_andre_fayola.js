const fs = require('fs');
const assert = require('assert');

console.log("=== SUITE: EVENT DELETION & ANDRE-FAYOLA EVENT ACCESS ===");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log("✅ PASS: " + name);
    passed++;
  } catch(e) {
    console.error("❌ FAIL: " + name + " -> " + e.message);
  }
}

const appJs = fs.readFileSync('js/app.js', 'utf8');
const codeGs = fs.readFileSync('code.gs', 'utf8');
const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const styleCss = fs.readFileSync('css/style.css', 'utf8');

// Test 1: code.gs contains deleteEvent backend API
test("code.gs mendefinisikan deleteEvent router dan fungsi", () => {
  assert(codeGs.includes('action === "deleteEvent"'), "code.gs harus memiliki routing action deleteEvent");
  assert(codeGs.includes('function deleteEvent(adminPin, targetEventId)'), "code.gs harus memiliki fungsi deleteEvent");
  assert(codeGs.includes('syncEventsToSheet(ss, remainingEvents)'), "deleteEvent harus menyinkronkan ke Daftar_Acara");
  assert(codeGs.includes('writeConfigToSheet(ss,'), "deleteEvent harus menyinkronkan ke Pengaturan");
});

// Test 2: js/app.js callBackend supports deleteEvent
test("js/app.js callBackend mendukung action deleteEvent", () => {
  assert(appJs.includes('action === "deleteEvent"'), "callBackend harus mendukung action deleteEvent");
});

// Test 3: handleDeleteCurrentEvent performs persistent deletion
test("handleDeleteCurrentEvent melakukan penghapusan persisten via backend & localStorage", () => {
  assert(appJs.includes('callBackend("deleteEvent"'), "handleDeleteCurrentEvent harus memanggil backend deleteEvent");
  assert(appJs.includes('callBackend("saveAdminSettings"'), "handleDeleteCurrentEvent harus memiliki fallback saveAdminSettings");
  assert(appJs.includes('localStorage.setItem("WEDDING_EVENTS_REGISTRY"'), "handleDeleteCurrentEvent harus memperbarui WEDDING_EVENTS_REGISTRY");
  assert(appJs.includes('localStorage.removeItem("WEDDING_EVENT_CFG_" + deleteId)'), "handleDeleteCurrentEvent harus membersihkan cache config event terhapus");
});

// Test 4: css/style.css hides empty pill count
test("css/style.css menyembunyikan pill-count yang kosong agar tidak muncul strip (-)", () => {
  assert(styleCss.includes('.filter-pill .pill-count:empty'), "style.css harus memiliki .filter-pill .pill-count:empty");
  assert(styleCss.includes('display: none'), "pill-count kosong harus disembunyikan");
});

// Test 5: initApp sets activeCategory = allPhotosLabel for andre-fayola-281
test("initApp mengatur activeCategory sesuai allPhotosLabel event aktif", () => {
  assert(appJs.includes('state.allPhotosLabel = matchedEv.allPhotosLabel || "Semua Foto"'), "initApp harus membaca allPhotosLabel dari matchedEv");
  assert(appJs.includes('state.activeCategory = state.allPhotosLabel'), "initApp harus menyinkronkan state.activeCategory dengan allPhotosLabel");
});

// Test 6: renderCategoryTabs gives .active class to Photostage for andre-fayola-281
test("renderCategoryTabs memberikan kelas active pada tab Photostage", () => {
  assert(appJs.includes('isTabActive'), "renderCategoryTabs harus mengevaluasi isTabActive");
  assert(appJs.includes('activeCatLower === "semua foto" || activeCatLower === mainLabel.toLowerCase()'), "renderCategoryTabs harus mengenali alias label utama");
});

// Test 7: applyCategoryFilter safely handles undefined category
test("applyCategoryFilter aman terhadap parameter category null/undefined", () => {
  assert(appJs.includes('const effectiveCat = String(category || state.activeCategory || state.allPhotosLabel || "Semua Foto").trim()'), "applyCategoryFilter harus mendefinisikan effectiveCat yang aman");
});

// Test 8: renderPhotoGrid tidak lagi menyediakan tombol pintas ke Photobooth sesuai revisi v4.22.0
test("renderPhotoGrid tidak lagi menyediakan tombol pintas Buka Foto Photobooth", () => {
  assert(!appJs.includes('Buka Foto'), "renderPhotoGrid tidak boleh lagi memuat tombol Buka Foto Photobooth");
});

// Test 9: config.json is clean with 2 distinct events
test("config.json memiliki 2 event unik (andre-fayola-281 dan wilson-felicia-133)", () => {
  assert.strictEqual(configJson.EVENTS.length, 2, "Harus ada 2 event di config.json");
  assert.strictEqual(configJson.EVENTS[0].id, "andre-fayola-281");
  assert.strictEqual(configJson.EVENTS[1].id, "wilson-felicia-133");
});

console.log(`\nHasil Pengujian: ${passed}/${total} lulus.`);
if (passed === total) {
  console.log("🎉 SEMUA TEST BERHASIL 100%!");
  process.exit(0);
} else {
  console.error("❌ ADA TEST GAGAL!");
  process.exit(1);
}

