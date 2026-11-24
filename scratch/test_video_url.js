const https = require('https');

const vidUrl = "https://x1.kingphotobooth.co/storage/photos/77/5580b5a8de3a41088dbc8f92.mp4";

https.get(vidUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}, res => {
  console.log("Video URL status:", res.statusCode, "Type:", res.headers['content-type']);
  let b = [];
  res.on('data', c => b.push(c));
  res.on('end', () => {
    console.log("Downloaded video bytes:", Buffer.concat(b).length);
  });
}).on('error', console.error);

