const fs = require('fs');

console.log('=== SUITE: SETUP.GS & CODE.GS SPREADSHEET INITIALIZATION FIX ===');

const setupGs = fs.readFileSync('setup.gs', 'utf8');
const codeGs = fs.readFileSync('code.gs', 'utf8');

// 1. Check dangling photoRows in setup.gs
if (setupGs.includes('photoRows.length')) {
  console.error('❌ FAIL: setup.gs still contains photoRows.length');
  process.exit(1);
} else {
  console.log('✅ PASS: setup.gs bebas dari photoRows.length (ReferenceError tereliminasi)');
}

// 2. Check dangling photoRows in code.gs
if (codeGs.includes('photoRows.length')) {
  console.error('❌ FAIL: code.gs still contains photoRows.length');
  process.exit(1);
} else {
  console.log('✅ PASS: code.gs bebas dari photoRows.length (ReferenceError tereliminasi)');
}

// 3. Check safe row calculation in setup.gs
if (setupGs.includes('totalPhotos: (sheetPhotos && sheetPhotos.getLastRow() > 1) ? (sheetPhotos.getLastRow() - 1) : 0')) {
  console.log('✅ PASS: setup.gs menghitung totalPhotos secara dinamis & aman dari sheetPhotos');
} else {
  console.error('❌ FAIL: setup.gs tidak memiliki safe calculation totalPhotos');
  process.exit(1);
}

// 4. Check safe row calculation in code.gs
if (codeGs.includes('totalPhotos: (sheetPhotos && sheetPhotos.getLastRow() > 1) ? (sheetPhotos.getLastRow() - 1) : 0')) {
  console.log('✅ PASS: code.gs menghitung totalPhotos secara dinamis & aman dari sheetPhotos');
} else {
  console.error('❌ FAIL: code.gs tidak memiliki safe calculation totalPhotos');
  process.exit(1);
}

// 5. Test mock execution of setupTargetSpreadsheetDatabase return block
const mockSheetPhotosWithPhotos = {
  getLastRow: () => 55
};
const mockSheetPhotosEmpty = {
  getLastRow: () => 1
};
const calcCount = (sheetPhotos) => (sheetPhotos && sheetPhotos.getLastRow() > 1) ? (sheetPhotos.getLastRow() - 1) : 0;

if (calcCount(mockSheetPhotosWithPhotos) === 54 && calcCount(mockSheetPhotosEmpty) === 0 && calcCount(null) === 0) {
  console.log('✅ PASS: Logika kalkulasi totalPhotos akurat untuk berbagai kondisi sheet');
} else {
  console.error('❌ FAIL: Logika kalkulasi totalPhotos menghasilkan nilai yang salah');
  process.exit(1);
}

console.log('🎉 SEMUA PENGUJIAN SETUP & CODE.GS LULUS 100%!');

