const https = require('https');

const thumbUrl = "https://x1.kingphotobooth.co/storage/thumbs/73/da5659842df866047bdaa1fa.jpg?e=1795563103&s=1e2d3d2d5db0253dca261d91fa84b50b";

function testHeader(name, headers) {
  https.get(thumbUrl, { headers }, res => {
    let chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log(`[${name}] Status:`, res.statusCode, "Type:", res.headers['content-type'], "Bytes:", buf.length);
      if (res.statusCode !== 200) {
        console.log(`[${name}] Body:`, buf.toString('utf8').substring(0, 100));
      }
    });
  }).on('error', console.error);
}

// 1. With Kingphotobooth Referer
testHeader("Kingphotobooth Referer", {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://x1.kingphotobooth.co/e/bb21285e57f8d687c287ae73"
});

// 2. With No Referer
testHeader("No Referer", {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
});

// 3. With runway Referer
testHeader("Runway Referer", {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://gallery.runway.my.id/"
});

