const https = require('https');

const cleanId = "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh";
const url = "https://drive.google.com/embeddedfolderview?id=" + cleanId + "#grid";

console.log("Fetching url:", url);
fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }
}).then(res => {
  console.log("Status:", res.status);
  return res.text();
}).then(html => {
  console.log("HTML length:", html.length);
  console.log("HTML preview:", html.substring(0, 300));
}).catch(err => console.error("Fetch error:", err));

