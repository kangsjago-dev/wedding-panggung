const https = require('https');

https.get('https://drive.google.com/embeddedfolderview?id=1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh#grid', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const entryRegex = /class="flip-entry"\s+id="entry-([a-zA-Z0-9_\-]+)"/g;
    let count = 0;
    while (entryRegex.exec(b) !== null) count++;
    console.log('Total entries found in HTML:', count);

    // Check if there are other files in HTML
    const idRegex = /([a-zA-Z0-9_-]{28,})/g;
    const ids = new Set();
    let m;
    while ((m = idRegex.exec(b)) !== null) {
      if (m[1].length > 25 && m[1].length < 45) ids.add(m[1]);
    }
    console.log('Total unique long IDs in HTML:', ids.size);
  });
});

