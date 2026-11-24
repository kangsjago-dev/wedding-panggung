const https = require('https');

const photoUrl = "https://x1.kingphotobooth.co/storage/photos/73/da5659842df866047bdaa1fa.jpg";

https.get(photoUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
}, res => {
  console.log("Photo path WITHOUT cookie Status:", res.statusCode);
  console.log("Content-Type:", res.headers['content-type']);
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const b = Buffer.concat(chunks);
    console.log("Bytes downloaded:", b.length);
  });
});

