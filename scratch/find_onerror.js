const fs = require('fs');

['index.html', 'js/app.js'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/onerror/i.test(line)) {
      console.log(`${file}:${i+1}: ${line.trim()}`);
    }
  });
});

