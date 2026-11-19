const https = require('https');
const url = "https://gallery.runway.my.id/js/app.js?v=" + Date.now();

https.get(url, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log("Remote js/app.js length:", d.length);
    console.log("Has watchdogTimer:", d.includes("watchdogTimer"));
    console.log("Has dfController:", d.includes("dfController"));
    console.log("Has premature 404 in config.json:", d.includes("showEventNotFoundScreen(true, explicitUrl)"));
  });
}).on('error', console.error);

