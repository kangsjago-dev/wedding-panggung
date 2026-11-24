const https = require('https');

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

const cleanEvents = [
  {
    id: "andre-fayola-281",
    name: "Andre & Fayola",
    date: "Minggu, 22 November 2026",
    venue: "UPPERHILLS CONVENTION HALLS",
    homeUrl: "https://gallery.runway.my.id/?event=andre-fayola-281",
    driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
    customCategories: [{ name: "Photobooth", url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    allPhotosLabel: "Photostage",
    status: "Aktif"
  },
  {
    id: "wilson-felicia-133",
    name: "Wilson & Felicia",
    date: "Senin, 16 November 2026",
    venue: "UpperHills Convention Hall, Makassar",
    homeUrl: "https://gallery.runway.my.id/?event=wilson-felicia-133",
    driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
    photoboothUrl: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
    customCategories: [{ name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    allPhotosLabel: "Semua Foto",
    status: "Aktif"
  },
  {
    id: "tommy-natasha-594",
    name: "Tommy & Natasha",
    date: "Rabu, 25 November 2026",
    venue: "UpperHills Convention Hall, Makassar",
    homeUrl: "https://gallery.runway.my.id/?event=tommy-natasha-594",
    driveFolderId: "",
    photoboothUrl: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
    customCategories: [{ id: "special_photobooth", name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    allPhotosLabel: "Semua Foto",
    status: "Aktif"
  }
];

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r => {
          let body = '';
          r.on('data', chunk => body += chunk);
          r.on('end', () => {
            try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
          });
        }).on('error', reject);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("Mengirim pembaruan EVENTS ke live Apps Script database...");
  const res = await postJson(gasUrl, {
    action: 'saveAdminSettings',
    pin: '111111',
    config: {
      EVENTS: JSON.stringify(cleanEvents)
    }
  });
  console.log("Respon GAS:", res);
}

main().catch(console.error);
