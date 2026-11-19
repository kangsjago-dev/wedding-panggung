const fs = require('fs');

['js/app.js', 'index.html'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\.src\s*=\s*["']\s*["']/.test(line)) {
      console.log(`${file}:${i+1}: ${line.trim()}`);
    }
  });
});

