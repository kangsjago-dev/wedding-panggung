const https = require('https');
const url = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getCategoryPhotos&api=true&url=" + encodeURIComponent("https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR") + "&category=Photobooth";

function req(u) {
  https.get(u, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      req(res.headers.location);
      return;
    }
    let d = "";
    res.on("data", c => d += c);
    res.on("end", () => {
      console.log(d);
    });
  }).on("error", console.error);
}
req(url);
