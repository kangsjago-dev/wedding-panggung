const fs = require('fs');

function printContext(file, term) {
  const content = fs.readFileSync(file, 'utf8');
  let idx = 0;
  while ((idx = content.indexOf(term, idx)) !== -1) {
    const start = Math.max(0, idx - 80);
    const end = Math.min(content.length, idx + term.length + 80);
    console.log(`=== [${file}] MATCH '${term}' at ${idx} ===`);
    console.log(content.substring(start, end).replace(/\n/g, ' '));
    idx += term.length;
  }
}

console.log('--- CODE.GS ---');
['Hans', 'Wilson', '14 November'].forEach(t => printContext('code.gs', t));

