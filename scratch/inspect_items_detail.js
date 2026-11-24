const https = require('https');

const url = "https://x1.kingphotobooth.co/e/f77cfa081d00281b3f834c1d";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      const items = JSON.parse(m[1]);
      console.log("Total items:", items.length);
      console.log("Sample items (first 6):");
      items.slice(0, 6).forEach((it, idx) => {
        console.log(`[${idx}] id: ${it.id}, is_video: ${it.is_video} (${typeof it.is_video}), thumb: ${it.thumb}, share_token: ${it.share_token}`);
      });
    }
  });
});

