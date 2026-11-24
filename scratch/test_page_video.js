const https = require('https');

https.get("https://x1.kingphotobooth.co/i/8e381a55", { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/<video[^>]*src=["']([^"']+)["']/i);
    if (!m) {
      console.log("No video in page");
      return;
    }
    const origin = "https://x1.kingphotobooth.co";
    const vidSrc = origin + m[1].replace(/&amp;/g, '&');
    console.log("Found video src on page:", vidSrc);

    https.get(vidSrc, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://x1.kingphotobooth.co/i/8e381a55' } }, vRes => {
      console.log("Status with page sig & referer:", vRes.statusCode);
      console.log("Content-Type:", vRes.headers['content-type']);
      console.log("Content-Length:", vRes.headers['content-length']);
    });
  });
});

