const https = require('https');

https.get("https://x1.kingphotobooth.co/i/8e381a55", { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
  const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  https.get("https://x1.kingphotobooth.co/dl/12063.mp4", {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'https://x1.kingphotobooth.co/i/8e381a55',
      'Cookie': cookies
    }
  }, dlRes => {
    console.log("DL status with cookie:", dlRes.statusCode);
    console.log("DL Content-Type:", dlRes.headers['content-type']);
    console.log("DL Content-Length:", dlRes.headers['content-length']);
    console.log("DL Content-Disposition:", dlRes.headers['content-disposition']);
  });
});

