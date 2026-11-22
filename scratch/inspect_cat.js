const fs = require('fs');
const c = fs.readFileSync('js/categories.js', 'utf8');
c.split('\n').forEach((l, i) => {
  if (l.includes('function fetch') || l.includes('/api/')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

