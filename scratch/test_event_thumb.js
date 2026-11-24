const https = require('https');

https.get('https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log("Cookies from event page:", cookies);
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const match = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    const items = JSON.parse(match[1]);
    const it0 = items[0];
    console.log("Raw thumb 0:", it0.thumb);

    // Test 1: with event page cookies and referer
    const thumbUrl = "https://x1.kingphotobooth.co" + it0.thumb;
    https.get(thumbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40',
        'Cookie': cookies
      }
    }, tRes => {
      console.log("Thumb with event cookie & referer status:", tRes.statusCode);
      console.log("Content-Type:", tRes.headers['content-type']);
      console.log("Content-Length:", tRes.headers['content-length']);
    });
  });
});

