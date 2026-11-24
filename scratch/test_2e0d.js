const https = require('https');

const url = "https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      const items = JSON.parse(m[1]);
      console.log("EXACT MATCH! Items count:", items.length);
      console.log("Sample items (first 10):");
      items.slice(0, 10).forEach((it, idx) => {
        console.log(`[${idx}] id: ${it.id}, is_video: ${it.is_video}, thumb: ${it.thumb}`);
      });
    }
  });
});

