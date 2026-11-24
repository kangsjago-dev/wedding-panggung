const https = require('https');

const target = "https://x1.kingphotobooth.co/e/bb21285e57f8d687c287ae73";

https.get(target, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
}, res => {
  let cookies = res.headers['set-cookie'] || [];
  let cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  console.log("Cookie header received from page:", cookieHeader);

  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const match = body.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      const items = JSON.parse(match[1]);
      const first = items[0];
      console.log("First item fresh from page:", first);

      const freshThumbUrl = "https://x1.kingphotobooth.co" + first.thumb;
      console.log("Testing fresh thumb URL with cookie:", freshThumbUrl);

      // Now fetch this freshThumbUrl WITH the cookie that the page just gave us!
      https.get(freshThumbUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": target,
          "Cookie": cookieHeader
        }
      }, rThumb => {
        console.log("Thumb response with cookie: Status", rThumb.statusCode, "Type", rThumb.headers['content-type']);
        let chunks = [];
        rThumb.on('data', c => chunks.push(c));
        rThumb.on('end', () => {
          const b = Buffer.concat(chunks);
          console.log("Thumb bytes downloaded:", b.length);
          if (rThumb.statusCode !== 200) {
            console.log("Error body:", b.toString('utf8').substring(0, 150));
          }
        });
      });

      // Also test WITHOUT cookie but fresh thumb
      https.get(freshThumbUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": target
        }
      }, rThumb2 => {
        console.log("Thumb response WITHOUT cookie: Status", rThumb2.statusCode, "Type", rThumb2.headers['content-type']);
      });

      // Also test without query params (raw path)
      const cleanPath = freshThumbUrl.split('?')[0];
      https.get(cleanPath, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": target,
          "Cookie": cookieHeader
        }
      }, rThumb3 => {
        console.log("Clean path thumb: Status", rThumb3.statusCode);
      });
    }
  });
});

