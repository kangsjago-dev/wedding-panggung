const fs = require('fs');

console.log('=== TEST SUITE: PHOTOBOOTH UNLOCKED CUSTOM LINK ===');

const adminContent = fs.readFileSync('js/admin.js', 'utf8');
const appContent = fs.readFileSync('js/app.js', 'utf8');
const categoriesContent = fs.readFileSync('js/categories.js', 'utf8');
const codeContent = fs.readFileSync('code.gs', 'utf8');

let checks = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('[FAIL] ' + msg);
    process.exit(1);
  }
  checks++;
  console.log('[PASS] ' + msg);
}

// 1. Check admin.js no longer locks pbItem.url if it already has a value
assert(adminContent.includes('// Bebas custom link, tidak terkunci oleh URL lama'), 'admin.js has unlocked photobooth logic');
assert(!adminContent.includes('if (currentConfigPbUrl && !pbItem.url)'), 'admin.js removed restrictive !pbItem.url check');

// 2. Check onCategoryRowInput updates curEv.photoboothUrl and customCategories
assert(adminContent.includes('curEv.photoboothUrl = pb.url;'), 'onCategoryRowInput updates curEv.photoboothUrl');

// 3. Check app.js updates photobooth url inside parsedCats
assert(appContent.includes('if (cleanPb) c.url = cleanPb;'), 'app.js synchronizes cleanPb into parsedCats');

// 4. Check categories.js applyCategoryFilter prioritizes custom livePbUrl
assert(categoriesContent.includes('const livePbUrl = (targetUrl && String(targetUrl).trim())'), 'categories.js prioritizes livePbUrl for photobooth');

// 5. Check categories.js renderCategoryTabs prioritizes PHOTOBOOTH_URL for photobooth
assert(categoriesContent.includes('targetUrl = state.activeConfig.PHOTOBOOTH_URL || (matchCat && matchCat.url) || "";'), 'categories.js renderCategoryTabs uses PHOTOBOOTH_URL');

// 6. Check code.gs updates customCategories inside existingEvents when PHOTOBOOTH_URL is saved
assert(codeContent.includes('catItem.url = cleanPbUrl;'), 'code.gs updates customCategories with cleanPbUrl');

console.log(`All ${checks} verification checks passed!`);

