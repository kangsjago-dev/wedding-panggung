const https = require('https');

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

function callApi(params) {
  const q = new URLSearchParams(params).toString();
  const url = gasUrl + (gasUrl.includes('?') ? '&' : '?') + q;
  return new Promise((resolve, reject) => {
    function makeReq(u) {
      https.get(u, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return makeReq(res.headers.location);
        }
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => {
          try { resolve(JSON.parse(buf)); }
          catch(e) { resolve(buf); }
        });
      }).on('error', reject);
    }
    makeReq(url);
  });
}

async function testEvents() {
  const eventsToTest = ['andre-fayola-281', 'wilson-felicia-133', 'wilson-felicia'];
  for (const evId of eventsToTest) {
    console.log(`\nTesting getGalleryData for event: ${evId}`);
    try {
      const data = await callApi({ action: 'getGalleryData', eventId: evId, api: 'true' });
      console.log('Success:', data.success);
      if (data.config) {
        console.log(' - Config Event Name:', data.config.EVENT_NAME);
        console.log(' - Config Drive Folder:', data.config.DRIVE_FOLDER_ID);
        console.log(' - Active Event ID in config:', data.config.ACTIVE_EVENT_ID);
      }
      console.log(' - Photos count:', data.photos ? data.photos.length : 0);
      console.log(' - Total Photos:', data.totalPhotos);
    } catch(err) {
      console.error(' - Error:', err.message);
    }
  }
}

testEvents();

