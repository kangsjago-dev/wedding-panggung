const https = require('https');

const dlUrl = "https://x1.kingphotobooth.co/dl/10604";
const iUrl = "https://x1.kingphotobooth.co/i/96c23a53";

function checkUrl(name, url) {
  https.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  }, res => {
    console.log(`[${name}] Status:`, res.statusCode, "Location:", res.headers.location, "Type:", res.headers['content-type']);
  });
}

checkUrl("Download Endpoint", dlUrl);
checkUrl("Single Item View", iUrl);

