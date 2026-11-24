const https = require('https');

https.get("https://x1.kingphotobooth.co/i/8e381a55", { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  console.log("Set-Cookie headers:", res.headers['set-cookie']);
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/<video[^>]*src=["']([^"']+)["']/i);
    const origin = "https://x1.kingphotobooth.co";
    const vidSrc = origin + m[1].replace(/&amp;/g, '&');
    const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    console.log("Cookies to pass:", cookies);

    https.get(vidSrc, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 
        'Referer': 'https://x1.kingphotobooth.co/i/8e381a55',
        'Cookie': cookies
      } 
    }, vRes => {
      console.log("Status with cookie:", vRes.statusCode);
      console.log("Content-Type:", vRes.headers['content-type']);
      console.log("Content-Length:", vRes.headers['content-length']);
    });
  });
});

