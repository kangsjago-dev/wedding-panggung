const https = require('https');

const url = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getGalleryData";

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

fetchUrl(url).then(d => {
  console.log("Status:", d.status);
  if (d.config) {
    console.log("config.EVENT_LOGO_URL:", d.config.EVENT_LOGO_URL);
    console.log("config.EVENT_NAME:", d.config.EVENT_NAME);
    console.log("config.ACTIVE_EVENT_ID:", d.config.ACTIVE_EVENT_ID);
    if (d.config.EVENTS) {
      const evs = typeof d.config.EVENTS === 'string' ? JSON.parse(d.config.EVENTS) : d.config.EVENTS;
      console.log("Parsed Events count:", evs.length);
      evs.forEach(e => {
        console.log(` - ID: ${e.id}, Name: ${e.name}, logoUrl: '${e.logoUrl || ''}', EVENT_LOGO_URL: '${e.EVENT_LOGO_URL || ''}'`);
      });
    }
  } else {
    console.log("Response:", typeof d === 'string' ? d.substring(0, 300) : d);
  }
}).catch(e => console.error(e));

