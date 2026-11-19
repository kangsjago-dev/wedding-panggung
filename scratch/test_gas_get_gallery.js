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
      console.log("Status:", res.statusCode);
      console.log("Response:", data.substring(0, 500));
    });
  }).on('error', err => console.error("Error:", err.message));
}

fetchWithRedirect("https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getGalleryData&api=true&eventId=tommy-natasha-594&folderId=1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh");

