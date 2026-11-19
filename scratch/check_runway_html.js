const https = require('https');
https.get("https://gallery.runway.my.id/?event=tommy-natasha-594", res => {
  console.log("Status:", res.statusCode);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log("HTML length:", d.length));
}).on('error', console.error);

