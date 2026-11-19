const fs = require('fs');

const files = [
  'api/drive-folder.js',
  'api/fotoshare.js',
  'api/google-photos.js',
  'api/kingphotobooth.js',
  'api/download-proxy.js'
];

console.log("=== PASS 2 AUDIT: api/*.js ===");

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  console.log(`Checking ${f}...`);
  if (code.includes('1GGB77clCMYBIg17J0ECr2eVbD02ZeInW')) console.error(`  FAIL: hardcoded folder in ${f}`);
  if (code.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5')) console.error(`  FAIL: hardcoded folder in ${f}`);
  if (code.includes('ZJGYCfWbttuEG8Q67ocZs')) console.error(`  FAIL: hardcoded fotoshare in ${f}`);
  if (code.includes('23d0e80056ae8f2fbb5d116f')) console.error(`  FAIL: hardcoded king in ${f}`);
  if (code.includes('QkqewYw4dWfocxfK8')) console.error(`  FAIL: hardcoded gphotos in ${f}`);
  if (code.includes('AF1QipN')) console.error(`  FAIL: hardcoded gphotos album in ${f}`);
});

console.log("PASS 2 check complete.");

