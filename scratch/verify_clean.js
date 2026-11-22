const fs = require('fs');

const content = fs.readFileSync('js/gallery.js', 'utf8');
if (content.includes('Buka Album Sumber')) {
  console.error('[FAIL] "Buka Album Sumber" still exists in js/gallery.js');
  process.exit(1);
} else {
  console.log('[PASS] "Buka Album Sumber" successfully removed from js/gallery.js');
}

try {
  new Function(content);
  console.log('[PASS] js/gallery.js syntax valid');
} catch (e) {
  console.error('[FAIL] Syntax error in js/gallery.js:', e);
  process.exit(1);
}

