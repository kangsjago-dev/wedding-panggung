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

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

async function run() {
  const pinsToTry = ["111111", "123456", "121212", "888888"];
  for (let pin of pinsToTry) {
    console.log(`Trying pin: ${pin}...`);
    try {
      const res = await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "saveAdminSettings",
          pin: pin,
          settings: {
            EVENTS: JSON.stringify(cleanEvents)
          }
        })
      });
      const text = await res.text();
      console.log(`Result with ${pin}:`, text.slice(0, 300));
      if (text.includes('"success":true')) break;
    } catch(e) {
      console.error("Error:", e);
    }
  }
}

run();
