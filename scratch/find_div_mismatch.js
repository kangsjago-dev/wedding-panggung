const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
let depth = 0;
lines.forEach((line, idx) => {
  const opens = (line.match(/<div(\s|>|$)/gi) || []).length;
  const closes = (line.match(/<\/div>/gi) || []).length;
  const diff = opens - closes;
  depth += diff;
  if (diff !== 0) {
    // console.log(`Line ${idx + 1}: ${line.trim().slice(0, 50)} | diff: ${diff}, depth: ${depth}`);
  }
  if (depth < 0) {
    console.log(`NEGATIVE DEPTH at line ${idx + 1}: ${line.trim()}`);
  }
});
console.log('Final depth:', depth);

