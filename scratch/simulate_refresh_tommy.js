const fs = require('fs');
const https = require('https');

// Mock localStorage with what was saved when user created tommy-natasha-594
const storage = {
  "WEDDING_EVENTS_REGISTRY": JSON.stringify([
    {
      id: "andre-fayola-281",
      name: "Andre & Fayola",
      date: "22 November 2026",
      venue: "UPPERHILLS CONVENTION HALLS",
      homeUrl: "https://gallery.runway.my.id/?event=andre-fayola-281",
      driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
      allPhotosLabel: "Photostage",
      photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
      customCategories: [{ name: "Photobooth", url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", enabled: true, isPhotobooth: true }]
    },
    {
      id: "wilson-felicia-133",
      name: "Wilson & Felicia",
      date: "16 November 2026",
      venue: "UpperHills Convention Hall, Makassar",
      homeUrl: "https://gallery.runway.my.id/?event=wilson-felicia-133",
      driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
      allPhotosLabel: "Photostage",
      photoboothUrl: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
      customCategories: [{ name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true }]
    },
    {
      id: "tommy-natasha-594",
      name: "Tommy & Natasha",
      date: "Rabu, 25 November 2026",
      venue: "UpperHills Convention Hall, Makassar",
      homeUrl: "https://gallery.runway.my.id/?event=tommy-natasha-594",
      driveFolderId: "https://drive.google.com/drive/folders/1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
      allPhotosLabel: "Semua Foto",
      photoboothUrl: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
      customCategories: [{ id: "special_photobooth", isPhotobooth: true, name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true }]
    }
  ]),
  "WEDDING_ACTIVE_EVENT_ID": "tommy-natasha-594"
};

// Now test what happens in fetch("config.json"):
const remoteConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log("=== SIMULATING initApp() on ?event=tommy-natasha-594 ===");

let currentEventId = "tommy-natasha-594";
let stateEvents = JSON.parse(storage["WEDDING_EVENTS_REGISTRY"]);

console.log("Initial state.events count:", stateEvents.length);
console.log("Initial state.events IDs:", stateEvents.map(e => e.id));

// config.json fetch
if (Array.isArray(remoteConfig.EVENTS)) {
  const evMap = new Map();
  (stateEvents || []).forEach(e => { if (e && e.id) evMap.set(e.id, e); });
  remoteConfig.EVENTS.forEach(e => {
    if (e && e.id) {
      const prev = evMap.get(e.id) || {};
      evMap.set(e.id, Object.assign({}, prev, e));
    }
  });
  stateEvents = Array.from(evMap.values());
  console.log("After config.json merge, state.events count:", stateEvents.length);
  console.log("After config.json merge, IDs:", stateEvents.map(e => e.id));
}

let explicitUrl = "tommy-natasha-594";
let matchedEv = stateEvents.find(ev => {
  if (!ev || !ev.id) return false;
  const eId = String(ev.id).toLowerCase().trim();
  const curId = String(explicitUrl).toLowerCase().trim();
  return eId === curId || eId.startsWith(curId) || curId.startsWith(eId) || eId.replace(/-\d+$/, '') === curId.replace(/-\d+$/, ''); 
});

console.log("matchedEv in config.json:", matchedEv ? matchedEv.name : "NOT FOUND!");

