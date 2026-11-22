const fs = require('fs');
['js/admin.js', 'js/categories.js', 'js/app.js', 'index.html', 'code.gs'].forEach(f => {
  if (!fs.existsSync(f)) return;
  const c = fs.readFileSync(f, 'utf8');
  c.split('\n').forEach((l, i) => {
    if (l.includes('Kategori Spesial: Photobooth') || l.includes('pbUrlInput') || l.includes('special_photobooth') || l.includes('disabled') || l.includes('readonly') || l.includes('dikunci') || l.includes('kunci')) {
      if (l.toLowerCase().includes('photobooth') || l.includes('pb') || l.includes('kunci')) {
        console.log(`${f}:${i+1}: ${l.trim()}`);
      }
    }
  });
});

