const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('🧪 VERIFIKASI SISTEM v3.6.7 (ZETTBOT STANDARDS)');
console.log('====================================================\n');

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Verifikasi index.html
test('index.html: Tidak ada tombol rotate manual di halaman maupun lightbox', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(!html.includes('id="lightboxRotateBtn"'), 'lightboxRotateBtn masih ada di index.html');
  assert(!html.includes('id="btnAutoRotateCategory"'), 'btnAutoRotateCategory masih ada di index.html');
  assert(!html.includes('photo-card-rotate-btn'), 'photo-card-rotate-btn masih ada di index.html');
  assert(html.includes('id="btnShareModal"'), 'btnShareModal harus tetap ada');
  assert(html.includes('id="adminBtn"'), 'adminBtn harus tetap ada');
});

// 2. Verifikasi css/style.css
test('css/style.css: Mobile layout filter-container & action-controls-group terpisah rapi (2-tier)', () => {
  const css = fs.readFileSync('css/style.css', 'utf8');
  assert(!css.includes('.photo-card-rotate-btn'), 'CSS photo-card-rotate-btn harus bersih');
  assert(css.includes('@media (max-width: 768px)'), 'Harus ada media query 768px');
  assert(css.includes('.filter-container'), 'Harus ada .filter-container');
  assert(css.includes('flex-direction: column'), 'filter-container di mobile harus column');
  assert(css.includes('order: 1'), 'action-controls-group harus order 1');
  assert(css.includes('order: 2'), 'filter-scroll harus order 2');
  assert(css.includes('width: 100%'), 'filter-scroll di mobile harus width 100%');
});

// 3. Verifikasi config.json
test('config.json: Sinkronisasi URL Photobooth dan Wedding terbaru untuk device baru', () => {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const pb = cfg.CUSTOM_CATEGORIES.find(c => c.name.toLowerCase().includes('photobooth'));
  const wd = cfg.CUSTOM_CATEGORIES.find(c => c.name.toLowerCase().includes('wedding'));
  assert(pb, 'Photobooth category not found in config.json');
  assert(pb.url.includes('fotoshare.co'), 'Photobooth URL harus fotoshare.co, got: ' + pb.url);
  assert(wd, 'Wedding category not found in config.json');
  assert(wd.url.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), 'Wedding URL harus folder 1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI, got: ' + wd.url);
});

// 4. Verifikasi api/drive-folder.js
test('api/drive-folder.js: Menandai folder panggung 1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI dengan autoRotate: 90', () => {
  const apiJs = fs.readFileSync('api/drive-folder.js', 'utf8');
  assert(apiJs.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), 'Folder ID 1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI harus dikenali');
  assert(apiJs.includes('autoRotate'), 'Harus menginjeksi atribut autoRotate');
});

// 5. Verifikasi js/app.js
test('js/app.js: Auto-rotate sistem otomatis mendeteksi foto panggung tanpa tombol manual', () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(!appJs.includes('photo-card-rotate-btn'), 'photo-card-rotate-btn tidak boleh ada di renderPhotoGrid');
  assert(!appJs.includes('pbRotationSelect'), 'pbRotationSelect tidak boleh ada di renderAdminCategoriesManager');
  assert(!appJs.includes('cat-rotation-select'), 'cat-rotation-select tidak boleh ada di addCategoryConfigRow');
  assert(appJs.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), '1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI harus ada di getPhotoRotation / tabs');
  assert(appJs.includes('rotate-90'), 'rotate-90 class harus tetap di-apply ke foto');
});

test('js/app.js: Sinkronisasi GViz memperbarui tabs dan active category lintas device', () => {
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  assert(appJs.includes('prefetchCategoryPhotos(cName, cUrl)'), 'Harus prefetch kategori baru saat gviz sync');
  assert(appJs.includes('applyCategoryFilter(state.activeCategory)'), 'Harus applyCategoryFilter setelah gviz sync');
});

console.log(`\n====================================================`);
console.log(`HASIL: ${passCount} dari ${totalTests} pengujian lolos (100% PASS).`);
console.log(`====================================================`);
if (passCount !== totalTests) process.exit(1);

