const https = require('https');

const chars = '0123456789abcdef';
const base = 'https://x1.kingphotobooth.co/e/f77cfa081d00281b3f834c1';

let tested = 0;
for (const c of chars) {
  const url = base + c;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    if (res.statusCode === 200) {
      console.log("MATCH FOUND!", url, "Status:", res.statusCode);
    }
  });
}

