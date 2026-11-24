const https = require('https');

const cleanThumb = "https://x1.kingphotobooth.co/storage/thumbs/86/8c95ec649a735bf10f6e5b89.jpg";

https.get(cleanThumb, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  console.log("Status:", res.statusCode, "Type:", res.headers['content-type'], "Length:", res.headers['content-length']);
  let b = [];
  res.on('data', c => b.push(c));
  res.on('end', () => {
    console.log("SUCCESS! Downloaded", Buffer.concat(b).length, "bytes of JPEG!");
  });
});

