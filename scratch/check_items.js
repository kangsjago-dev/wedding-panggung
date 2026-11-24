const https = require('https');

https.get("https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40", { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const match = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      console.log("No ITEMS found");
      return;
    }
    const raw = JSON.parse(match[1]);
    console.log("Total items:", raw.length);
    for (let i = 0; i < 10; i++) {
      console.log(`[${i}] id: ${raw[i].id}, is_video: ${raw[i].is_video}, token: ${raw[i].share_token}, thumb: ${raw[i].thumb}`);
    }
  });
});

