const https = require('https');

https.get("https://x1.kingphotobooth.co/i/96c23a53", {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    // Search for img or video or download links in the page
    const imgs = body.match(/<img[^>]+src=["']([^"']+)["']/g);
    console.log("Images found in single view:", imgs);
    const btns = body.match(/<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?download[\s\S]*?<\/a>/gi);
    console.log("Download buttons found:", btns);
    const allLinks = body.match(/href=["']([^"']+)["']/g);
    console.log("Some links:", (allLinks || []).slice(0, 10));
  });
});

