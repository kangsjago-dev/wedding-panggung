const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => {
            try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
          });
        }).on('error', reject);
        return;
      }
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
      });
    }).on('error', reject);
  });
}

async function test() {
  const url = 'https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec?action=getEvents';
  const res = await getJson(url);
  console.log('getEvents res:', res);
}

test();

