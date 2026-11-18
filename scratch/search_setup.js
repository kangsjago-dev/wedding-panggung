const fs = require('fs');

function search(file) {
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (l.includes('setupTargetSpreadsheetDatabase')) {
      console.log(file, 'L' + (idx+1) + ':', l.trim());
    }
  });
}

search('code.gs');
search('setup.gs');

