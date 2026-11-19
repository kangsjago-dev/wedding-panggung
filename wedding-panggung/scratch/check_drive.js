const https = require('https');
const url = 'https://drive.google.com/embeddedfolderview?id=1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI#grid';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const entryRegex = /class="flip-entry"\s+id="entry-([a-zA-Z0-9_\-]+)"[\s\S]*?<div\s+class="flip-entry-title">([^<]+)<\/div>/g;
    let m;
    let count = 0;
    while ((m = entryRegex.exec(html)) !== null && count < 5) {
      count++;
      console.log('FILE ' + count + ':', m[1], m[2]);
    }
    console.log('TOTAL MATCHES FOUND:', count);
  });
});

