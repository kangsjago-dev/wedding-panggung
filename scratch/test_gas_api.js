const https = require('https');

function fetchWithRedirect(url) {
  https.get(url, (res) => {
    console.log("Status:", res.statusCode);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log("Following redirect to:", res.headers.location.substring(0, 100));
      fetchWithRedirect(res.headers.location);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log("Response length:", data.length);
      console.log("Parsed JSON preview:", data.substring(0, 400));
    });
  }).on('error', err => console.error("Error:", err.message));
}

fetchWithRedirect("https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getGalleryData&api=true&eventId=test-new-event");
