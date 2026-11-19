const https = require('https');

function fetchWithRedirect(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchWithRedirect(res.headers.location);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log("Full response keys:", Object.keys(json));
        console.log("config:", JSON.stringify(json.config, null, 2));
        console.log("photos count:", (json.photos || []).length);
        console.log("categories:", json.categories);
        console.log("activeEventId:", json.activeEventId);
        console.log("events count:", (json.events || []).length);
      } catch(e) {
        console.error("JSON error:", e.message);
      }
    });
  }).on('error', err => console.error("Error:", err.message));
}

fetchWithRedirect("https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getGalleryData&api=true&eventId=tommy-natasha");

