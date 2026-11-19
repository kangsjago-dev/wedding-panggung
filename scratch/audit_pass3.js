const fs = require('fs');

const files = ['code.gs', 'setup.gs'];

console.log("=== PASS 3 AUDIT: code.gs & setup.gs ===");

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  console.log(`Checking ${f}...`);
  if (code.includes('inputPass === "123"')) console.error(`  FAIL: hardcoded pass in ${f}`);
  if (code.includes('usr_superadmin') && !code.includes('// usr_superadmin')) {
    // Check if usr_superadmin is used in code
    const lines = code.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('usr_superadmin') && !l.trim().startsWith('//')) {
        console.log(`  NOTE: ${f}:${idx+1}: ${l.trim()}`);
      }
    });
  }
});

