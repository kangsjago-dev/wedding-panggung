const fs = require('fs');
const path = require('path');

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// Extract formatIndonesianDateWithDay and formatDateForInput
const evalScope = {};
const fnCode = `
${appJsCode.substring(appJsCode.indexOf('const INDONESIAN_DAYS ='), appJsCode.indexOf('function populateConfigToUI'))}
`;

const vm = require('vm');
vm.runInNewContext(fnCode, evalScope);

console.log("=== VERIFY DATE FORMATTING WITH DAY ===");
const testDates = [
  "22 November 2026",
  "16 November 2026",
  "2026-11-22",
  "2026-11-16",
  "14 Februari 2026",
  "25 Desember 2026",
  "Minggu, 22 November 2026"
];

testDates.forEach(d => {
  const formatted = evalScope.formatIndonesianDateWithDay(d);
  const inputVal = evalScope.formatDateForInput(formatted);
  console.log(`Input: "${d}" => Display: "${formatted}" => Input Field: "${inputVal}"`);
});

// Check that every result starts with a day name
const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
let allPassed = true;
testDates.forEach(d => {
  const res = evalScope.formatIndonesianDateWithDay(d);
  const startsWithDay = days.some(day => res.startsWith(day));
  if (!startsWithDay) {
    console.error(`FAIL: ${d} -> ${res} does not start with an Indonesian day name!`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log("\nALL VERIFICATIONS PASSED 100%!");
} else {
  process.exit(1);
}

