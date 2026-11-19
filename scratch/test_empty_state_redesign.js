const fs = require('fs');
const assert = require('assert');

console.log("=== VERIFIKASI REDESAIN TAMPILAN ELEGAN KATEGORI KOSONG ===");

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log("✅ PASS: " + desc);
    passed++;
  } catch (err) {
    console.error("❌ FAIL: " + desc + " -> " + err.message);
  }
}

const css = fs.readFileSync('css/style.css', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

check("css/style.css memiliki styling lengkap untuk .empty-gallery-card", () => {
  assert(css.includes(".empty-gallery-card"), "Harus ada class .empty-gallery-card");
  assert(css.includes(".empty-gallery-icon-wrap"), "Harus ada class .empty-gallery-icon-wrap");
  assert(css.includes(".empty-gallery-badge"), "Harus ada class .empty-gallery-badge");
  assert(css.includes(".empty-gallery-title"), "Harus ada class .empty-gallery-title");
  assert(css.includes(".empty-gallery-desc"), "Harus ada class .empty-gallery-desc");
  assert(css.includes(".empty-gallery-btn-refresh"), "Harus ada class .empty-gallery-btn-refresh");
  assert(css.includes(".empty-gallery-btn-source"), "Harus ada class .empty-gallery-btn-source");
});

check("js/app.js menggunakan komponen .empty-gallery-card dan MENGHILANGKAN badge Kategori Photostage", () => {
  assert(appJs.includes('class="empty-gallery-card"'), "Harus merender .empty-gallery-card");
  assert(appJs.includes('class="empty-gallery-icon-wrap"'), "Harus merender .empty-gallery-icon-wrap");
  const emptySlice = appJs.slice(appJs.indexOf("class=\"empty-gallery-card\""), appJs.indexOf("class=\"empty-gallery-card\"") + 1500);
  assert(!emptySlice.includes("Kategori &bull;"), "Tulisan Kategori &bull; atau Kategori • Photostage harus dihilangkan dari notifikasi");
  assert(!emptySlice.includes("class=\"empty-gallery-badge\""), "Badge Kategori harus dihilangkan dari notifikasi kosong");
});

check("js/app.js BEBAS dari raw emoticon 🖼️ dan 🔄 pada tampilan kosong", () => {
  const emptySlice = appJs.slice(appJs.indexOf("class=\"empty-gallery-card\""), appJs.indexOf("class=\"empty-gallery-card\"") + 2500);
  assert(!emptySlice.includes("🖼️"), "Tidak boleh menggunakan raw emoji 🖼️");
  assert(!emptySlice.includes("🔄"), "Tidak boleh menggunakan raw emoji 🔄");
  assert(!emptySlice.includes("↗"), "Tidak boleh menggunakan raw emoji ↗");
});

check("js/app.js menggunakan ikon vektor SVG elegan untuk ikon galeri dan tombol", () => {
  const emptySlice = appJs.slice(appJs.indexOf("class=\"empty-gallery-card\""), appJs.indexOf("class=\"empty-gallery-card\"") + 2500);
  assert(emptySlice.includes("<svg width=\"34\" height=\"34\""), "Ikon utama harus berupa vektor SVG 34x34");
  assert(emptySlice.includes("<svg width=\"15\" height=\"15\""), "Tombol refresh harus memiliki ikon SVG 15x15");
});

check("js/app.js menyajikan teks yang hangat, romantis, dan elegan", () => {
  assert(appJs.includes("Momen Indah Sedang Disiapkan"), "Judul harus puitis & elegan: Momen Indah Sedang Disiapkan");
  assert(appJs.includes("belum tersedia saat ini. Momen hangat kebersamaan akan otomatis tampil di sini"), "Deskripsi harus puitis & ramah");
  assert(appJs.includes("Segarkan Kategori Ini"), "Tombol aksi berlabel Segarkan Kategori Ini");
});

check("loadFallbackData di js/app.js bebas dari teks hardcode statis", () => {
  const fallbackSlice = appJs.slice(appJs.indexOf("function loadFallbackData"), appJs.indexOf("function loadFallbackData") + 800);
  assert(!fallbackSlice.includes('"The Wedding Gallery & Precious Memories"'), "loadFallbackData tidak boleh memiliki hardcoded subtitle");
  assert(!fallbackSlice.includes('"Terima kasih atas kehadiran, doa restu'), "loadFallbackData tidak boleh memiliki hardcoded welcome message");
});

console.log("\nHASIL AKHIR: " + passed + " PASS, " + (total - passed) + " FAIL");
if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}

