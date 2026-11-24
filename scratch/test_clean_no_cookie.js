const https = require('https');

const cleanUrl = "https://x1.kingphotobooth.co/storage/thumbs/73/da5659842df866047bdaa1fa.jpg";

https.get(cleanUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
}, res => {
  console.log("Clean path WITHOUT cookie Status:", res.statusCode);
  console.log("Content-Type:", res.headers['content-type']);
});

