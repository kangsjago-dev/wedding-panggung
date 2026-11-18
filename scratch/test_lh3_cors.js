const https = require('https');

// Test fetch dari lh3 Google Drive
const testUrl = "https://lh3.googleusercontent.com/d/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW=w600-h600";

https.get(testUrl, (res) => {
  console.log("Status:", res.statusCode);
  console.log("Headers:", res.headers);
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    console.log("Total bytes:", buf.length);
    console.log("Magic bytes:", buf.slice(0, 4).toString('hex'));
  });
}).on('error', err => {
  console.error("Error:", err.message);
});

