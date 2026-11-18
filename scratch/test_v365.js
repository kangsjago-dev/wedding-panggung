/**
 * ================================================================================
 * VERIFIKASI SISTEM v3.6.5 (ZettBOT v4.1 by Zettbos)
 * Menguji 5 Poin Pembaruan Utama:
 * 1. Desain Modal Share & QR Code PC Lebih Menarik & Presisi (Sesuai Gambar)
 * 2. Fleksibilitas Tautan Kategori Spesial Photobooth (Google Photos, King, Fotoshare, Drive)
 * 3. Sinkronisasi Multi-Device & Pencegahan Reset Pengaturan Kategori
 * 4. Tutup Preview Foto (Backdrop Click Lightbox)
 * 5. Ikon View/Toggle Password Admin Simpel (Inline SVG, Anti-Emoji)
 * ================================================================================
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
  }
}

console.log("================================================================================");
console.log("MEMULAI PENGUJIAN OTOMATIS v3.6.5 (ZettBOT Engine v4.1)");
console.log("================================================================================\n");

// Baca berkas-berkas utama
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const codeGs = fs.readFileSync(path.join(__dirname, '../code.gs'), 'utf8');
const configJson = fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8');

// ==============================================================================
// PENGUJIAN 1: MODAL SHARE & QR CODE DESKTOP PRESISI (SESUAI GAMBAR)
// ==============================================================================
console.log("1. Pengujian Desain Modal Share & QR Code:");
assert(indexHtml.includes('id="shareQrModal"'), "Modal #shareQrModal terdaftar di index.html");
assert(indexHtml.includes('class="admin-card share-qr-card"'), "Card .share-qr-card terdaftar");
assert(indexHtml.includes('class="share-modal-title"'), "Judul modal .share-modal-title terdaftar");
assert(indexHtml.includes('share-close-btn'), "Tombol close .share-close-btn terdaftar");
assert(indexHtml.includes('id="shareEventTitle"') && indexHtml.includes('id="shareEventDate"') && indexHtml.includes('id="shareEventVenue"'), "Header meta terpisah rapi (EventTitle, EventDate, EventVenue)");
assert(indexHtml.includes('class="share-actions-row"'), "Row aksi share 3 tombol terpusat");
assert(indexHtml.includes('class="ctrl-icon-btn share-action-btn share-download-btn"'), "Tombol download PNG latar emas terdaftar");
assert(indexHtml.includes('type="hidden" id="shareUrlInput"'), "Input teks URL disembunyikan (type=hidden)");

assert(styleCss.includes('.admin-card.share-qr-card'), "CSS .admin-card.share-qr-card terdefinisi");
assert(styleCss.includes('max-width: 460px;'), "CSS card share dibatasi max-width: 460px untuk PC");
assert(styleCss.includes('.share-event-date') && styleCss.includes('#B4863A'), "CSS tanggal acara berwarna emas/amber #B4863A");
assert(styleCss.includes('.share-action-btn.share-download-btn') && styleCss.includes('#C5A880'), "CSS tombol unduh PNG berlatar gold #C5A880");

// ==============================================================================
// PENGUJIAN 2: FLEKSIBILITAS TAUTAN PHOTOBOOTH
// ==============================================================================
console.log("\n2. Pengujian Fleksibilitas Tautan Photobooth:");
assert(appJs.includes('targetUrl.includes("photos.google.com")'), "Mendukung tautan Google Photos pada Photobooth/Kategori");
assert(appJs.includes('targetUrl.includes("kingphotobooth.co")') || appJs.includes('targetUrl.includes("kingphoto")'), "Mendukung tautan Kingphotobooth");
assert(appJs.includes('targetUrl.includes("fotoshare.co")'), "Mendukung tautan Fotoshare");
assert(appJs.includes('fetchDriveCategoryPhotos(categoryName, driveFolderId'), "Mendukung tautan Google Drive folder pada Photobooth/Kategori");
assert(appJs.includes('pbUrlInput') && appJs.includes('Tautan Display / Vendor (Dapat Dicustom)'), "Label tautan Photobooth dapat dicustom bebas");

// ==============================================================================
// PENGUJIAN 3: MULTI-DEVICE SYNC & PENCEGAHAN RESET KATEGORI
// ==============================================================================
console.log("\n3. Pengujian Multi-Device Sync & Anti-Reset Kategori:");
assert(codeGs.includes('props.setProperty("CUSTOM_CATEGORIES", catVal);'), "code.gs menyimpan CUSTOM_CATEGORIES ke ScriptProperties");
assert(codeGs.includes('existingEvents[evI].customCategories = parsedCats;'), "code.gs menyinkronkan CUSTOM_CATEGORIES ke EVENTS aktif");
assert(codeGs.includes('currentEvent.customCategories = effectiveCats;'), "code.gs getGalleryData menjaga sinkronisasi 2 arah");
assert(appJs.includes('curEv.customCategories = customCategoriesList;'), "app.js syncCategoriesAndDisplayLinks menyinkronkan ke state.events");
assert(appJs.includes('EVENTS: state.events'), "app.js mengirimkan payload EVENTS saat sinkronisasi kategori");
assert(appJs.includes('matchedEv.customCategories = remoteCfg.CUSTOM_CATEGORIES;'), "app.js mencegah penimpaan konfigurasi usang saat remote refresh");

// ==============================================================================
// PENGUJIAN 4: BACKDROP CLICK LIGHTBOX (TUTUP SAAT KLIK LUAR FRAME)
// ==============================================================================
console.log("\n4. Pengujian Backdrop Click Lightbox:");
assert(appJs.includes('function setupLightboxBackdropClick'), "Fungsi setupLightboxBackdropClick terdefinisi");
assert(appJs.includes('setupLightboxBackdropClick();') && appJs.includes('openLightbox'), "setupLightboxBackdropClick dipanggil saat openLightbox");
assert(appJs.includes('e.target.closest("#lightboxImg")'), "Pengecekan proteksi agar klik foto tidak menutup modal");
assert(indexHtml.includes('class="lightbox-close"'), "Tombol close silang (✕) tetap ada");
assert(styleCss.includes('.lightbox-body {') && styleCss.includes('cursor: pointer;'), "CSS .lightbox-body memiliki cursor pointer untuk backdrop click");

// ==============================================================================
// PENGUJIAN 5: IKON VIEW PASSWORD SIMPEL (ANTI-EMOJI)
// ==============================================================================
console.log("\n5. Pengujian Ikon View Password Simpel:");
const passToggleMatch = indexHtml.match(/<button[^>]*id="toggleAdminPassVisibility"[^>]*>([\s\S]*?)<\/button>/);
assert(passToggleMatch && !passToggleMatch[1].includes('👁') && !passToggleMatch[1].includes('ð') && passToggleMatch[1].includes('pass-eye-icon'), "Tombol toggle password bebas dari emoji/karakter aneh dan menggunakan SVG pass-eye-icon");
assert(appJs.includes('class="pass-eye-icon"'), "togglePasswordVisibility di app.js menggunakan inline SVG");
assert(!appJs.includes('"🙈"') && !appJs.includes('"👁️"'), "Eliminasi total emoji monyet/mata di fungsi togglePasswordVisibility");

// ==============================================================================
// PENGUJIAN 6: REGRESI FITUR v3.6.4 & v3.6.3
// ==============================================================================
console.log("\n6. Pengujian Regresi Fitur:");
assert(!indexHtml.includes('id="lightboxZoomToolbar"'), "Regresi PASS: Tombol zoom +/- tetap bersih");
assert(appJs.includes('downloadPhotoboothOriginal'), "Regresi PASS: Downloader asli photobooth tetap aktif");
assert(appJs.includes('initialPinchDist'), "Regresi PASS: Pinch-to-zoom 2 jari tetap aktif");
assert(indexHtml.includes('src="js/cache-data.js"'), "Regresi PASS: Modular cache split tetap terpasang");

console.log("\n================================================================================");
console.log(`HASIL VERIFIKASI: ${passedTests} DARI ${totalTests} PENGUJIAN LULUS (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log("================================================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
