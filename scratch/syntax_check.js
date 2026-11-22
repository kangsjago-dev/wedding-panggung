const fs = require('fs');
['js/core.js', 'js/app.js', 'js/gallery.js', 'js/admin.js', 'js/categories.js'].forEach(f => {
  try {
    new Function(fs.readFileSync(f, 'utf8'));
    console.log('[OK]', f);
  } catch(e) {
    console.error('[ERR]', f, e.message);
    process.exit(1);
  }
});

