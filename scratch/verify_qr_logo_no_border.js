const fs = require('fs');

console.log("=== VERIFIKASI QR SHARE LOGO TANPA BORDER & BIDANG PAS MENGIKUTI OBJEK ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("✅ PASS: " + message);
    passed++;
  } else {
    console.error("❌ FAIL: " + message);
    failed++;
  }
}

const appCode = fs.readFileSync('js/app.js', 'utf8');

// 1. Pastikan ctx.stroke() tidak ada di dalam generateBrandedQrCode
const qrFnMatch = appCode.match(/function generateBrandedQrCode[\s\S]*?function openShareModal/);
assert(qrFnMatch !== null, "Fungsi generateBrandedQrCode ditemukan");

const qrFnCode = qrFnMatch ? qrFnMatch[0] : "";
assert(!qrFnCode.includes('ctx.stroke()'), "generateBrandedQrCode TIDAK memanggil ctx.stroke() (bebas border)");
assert(!qrFnCode.includes('ctx.strokeStyle'), "generateBrandedQrCode TIDAK menyetel ctx.strokeStyle");
assert(!qrFnCode.includes('ctx.lineWidth'), "generateBrandedQrCode TIDAK menyetel ctx.lineWidth");

// 2. Pastikan bidang putih solid tidak lagi fixed square tetapi proporsional mengikuti objek (dw & dh)
assert(qrFnCode.includes('const bw = dw + (padX * 2);'), "Lebar bidang putih (bw) mengikuti lebar objek logo (dw)");
assert(qrFnCode.includes('const bh = dh + (padY * 2);'), "Tinggi bidang putih (bh) mengikuti tinggi objek logo (dh)");
assert(qrFnCode.includes('roundRect(bx, by, bw, bh'), "roundRect digambar dengan dimensi dinamis (bw, bh) bukan fixed square");

// 3. Pastikan ada pemotongan padding transparan (trimming bounds) untuk objek logo
assert(qrFnCode.includes('testCanvas.getContext("2d")'), "Terdapat canvas pengujian untuk ekstraksi piksel aktual");
assert(qrFnCode.includes('getImageData'), "getImageData digunakan untuk mengukur piksel non-transparan logo");

// 4. Audit eliminasi login bypass di code.gs
const codeGs = fs.readFileSync('code.gs', 'utf8');
assert(!codeGs.includes('inputPass === "123" && u.role === "Super Admin"'), "code.gs bebas dari bypass password 123");
assert(!codeGs.includes('matchedUser = {\n        id: "usr_superadmin"'), "code.gs bebas dari fallback akun hardcode usr_superadmin");

console.log(`\nHASIL AKHIR: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);

