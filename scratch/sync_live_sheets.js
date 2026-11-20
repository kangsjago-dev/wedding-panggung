const https = require('https');

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

const cleanEvents = [
  {
    id: "andre-fayola-281",
    name: "Andre & Fayola",
    date: "22 November 2026",
    venue: "UPPERHILLS CONVENTION HALLS",
    homeUrl: "https://gallery.runway.my.id/?event=andre-fayola-281",
    driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
    customCategories: [{ name: "Photobooth", url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    status: "Aktif"
  },
  {
    id: "wilson-felicia-133",
    name: "Wilson & Felicia",
    date: "16 November 2026",
    venue: "UpperHills Convention Hall, Makassar",
    homeUrl: "https://gallery.runway.my.id/?event=wilson-felicia-133",
    driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
    photoboothUrl: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
    customCategories: [{ name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    status: "Aktif"
  },
  {
    id: "tommy-natasha-594",
    name: "Tommy & Natasha",
    date: "Rabu, 25 November 2026",
    venue: "UpperHills Convention Hall, Makassar",
    homeUrl: "https://gallery.runway.my.id/?event=tommy-natasha-594",
    driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    photoboothUrl: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
    customCategories: [{ id: "special_photobooth", name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true, isPhotobooth: true }],
    frameImageUrl: "",
    logoUrl: "",
    status: "Aktif"
  }
];

function post(url, payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(post(res.headers.location, payload));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("Mengirim syncAllEvents ke GAS Backend...");
  try {
    const res = await post(gasUrl, {
      action: "saveAdminSettings",
      pin: "123456",
      settings: {
        EVENTS: JSON.stringify(cleanEvents)
      }
    });
    console.log("Response saveAdminSettings:", res);
  } catch(e) {
    console.error("Error saveAdminSettings:", e);
  }

  // Coba juga syncDaftarAcara
  try {
    const res2 = await post(gasUrl, {
      action: "syncDaftarAcara",
      pin: "123456",
      events: cleanEvents
    });
    console.log("Response syncDaftarAcara:", res2);
  } catch(e) {
    console.error("Error syncDaftarAcara:", e);
  }
}

main();

