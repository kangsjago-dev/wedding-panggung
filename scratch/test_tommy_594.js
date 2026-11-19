const https = require('https');
const url = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getGalleryData&api=true&eventId=tommy-natasha-594";

function req(u) {
  https.get(u, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log("Redirecting to:", res.headers.location.slice(0, 60));
      req(res.headers.location);
      return;
    }
    let d = "";
    res.on("data", c => d += c);
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      try {
        const j = JSON.parse(d);
        console.log("JSON keys:", Object.keys(j));
        console.log("success:", j.success);
        console.log("activeEventId:", j.activeEventId);
        console.log("config:", j.config ? { EVENT_NAME: j.config.EVENT_NAME, DRIVE_FOLDER_ID: j.config.DRIVE_FOLDER_ID } : null);
        console.log("photos count:", (j.photos || []).length);
        console.log("events count:", (j.events || []).length);
      } catch(e) {
        console.log("Not JSON, length:", d.length, d.slice(0, 200));
      }
    });
  }).on("error", console.error);
}
req(url);

