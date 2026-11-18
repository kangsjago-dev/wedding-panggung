const fs = require('fs');

function searchFile(file, terms) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  terms.forEach(term => {
    let idx = 0;
    let count = 0;
    while ((idx = content.indexOf(term, idx)) !== -1) {
      count++;
      idx += term.length;
    }
    if (count > 0) {
      console.log(`[${file}] '${term}': ${count} occurrences`);
    }
  });
}

const terms = ['Wilson', 'Felicia', 'Hans', 'Yurike', '14 November', 'UpperHills', 'Upperhills'];
['index.html', 'js/app.js', 'config.json', 'code.gs'].forEach(f => searchFile(f, terms));

