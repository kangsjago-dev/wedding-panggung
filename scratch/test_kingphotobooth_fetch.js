const https = require('https');

const urls = [
  "https://x1.kingphotobooth.co/e/f77cfa081d00281b3f834c1",
  "https://x1.kingphotobooth.co/e/bb21285e57f8d687c287ae73"
];

function check(target) {
  https.get(target, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log("=== Target:", target);
      console.log("Status Code:", res.statusCode);
      const match = body.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
      if (match) {
        const items = JSON.parse(match[1]);
        console.log("Matched ITEMS count:", items.length);
        console.log("First item:", items[0]);
      } else {
        console.log("No ITEMS match. Snippet:", body.substring(0, 100));
      }
    });
  }).on('error', err => console.error("Error:", err));
}

urls.forEach(check);
