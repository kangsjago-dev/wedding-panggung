const https = require('https');

// Fetch the event page to get fresh signed ITEMS
https.get("https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40", { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const match = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    const rawItems = JSON.parse(match[1]);
    const origin = "https://x1.kingphotobooth.co";

    // Item 0 is video
    const it = rawItems[0];
    console.log("Raw thumb:", it.thumb);
    const videoWithThumbSig = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg\?/i, ".mp4?");
    console.log("Video with thumb sig:", videoWithThumbSig);

    https.get(videoWithThumbSig, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, vRes => {
      console.log("Status with thumb sig:", vRes.statusCode);
      console.log("Headers:", vRes.headers['content-type'], vRes.headers['content-length']);
    });
  });
});

