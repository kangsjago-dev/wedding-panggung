const https = require('https');

const url = "https://gallery.runway.my.id/api/drive-folder?folderId=1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh&category=Photostage";

console.log("Testing:", url);
const start = Date.now();

https.get(url, (res) => {
  console.log("Status:", res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Time:", Date.now() - start, "ms");
    console.log("Response:", data);
  });
}).on('error', err => console.error("Error:", err));

