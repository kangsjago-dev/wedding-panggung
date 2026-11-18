const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Line 14: remove fallback to WEDDING_SAVED_CONFIG
html = html.replace(
  'var s = localStorage.getItem("WEDDING_ACTIVE_EVENT_CFG") || localStorage.getItem("WEDDING_SAVED_CONFIG");',
  'var s = localStorage.getItem("WEDDING_ACTIVE_EVENT_CFG");'
);

// 2. Line 98: remove fallback to WEDDING_SAVED_CONFIG
html = html.replace(
  'var saved = localStorage.getItem(cacheKey) || localStorage.getItem("WEDDING_SAVED_CONFIG");',
  'var saved = localStorage.getItem(cacheKey);'
);

// 3. Line 306: shareEventDate hardcoded date
html = html.replace(
  '<div class="share-event-date" id="shareEventDate">Senin, 16 November 2026</div>',
  '<div class="share-event-date" id="shareEventDate"></div>'
);

// 4. Placeholders
html = html.replace(
  'placeholder="Contoh: Wilson & Felicia"',
  'placeholder="Contoh: Nama Pasangan / Acara"'
);
html = html.replace(
  'placeholder="Contoh: Upperhills Convention Centre, Makassar"',
  'placeholder="Contoh: Lokasi Gedung / Hotel"'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully without any hardcoded fallback!');

