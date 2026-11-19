const https = require('https');
https.get("https://gallery.runway.my.id/api/drive-folder?folderId=1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh&category=Photostage", res => {
  console.log("Status:", res.statusCode, res.headers['content-type']);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log("Body length:", d.length, d.slice(0, 200)));
}).on('error', console.error);

