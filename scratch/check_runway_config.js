const https = require('https');
https.get("https://gallery.runway.my.id/config.json", res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      console.log("Remote config.json keys:", Object.keys(j));
      console.log("Remote config.json EVENTS:", (j.EVENTS || []).map(e => e.id));
    } catch(e) {
      console.error(e.message);
    }
  });
}).on('error', console.error);

