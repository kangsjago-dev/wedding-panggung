const https = require('https');

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

function callApi(params) {
  const q = new URLSearchParams(params).toString();
  const url = gasUrl + (gasUrl.includes('?') ? '&' : '?') + q;
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(callApiWithLocation(res.headers.location));
      }
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch(e) { resolve(buf); }
      });
    }).on('error', reject);
  });
}

function callApiWithLocation(loc) {
  return new Promise((resolve, reject) => {
    https.get(loc, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(callApiWithLocation(res.headers.location));
      }
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch(e) { resolve(buf); }
      });
    }).on('error', reject);
  });
}

callApi({ action: 'adminLogin', pin: '123456', api: 'true' })
  .then(res => console.log('Login result:', res))
  .catch(err => console.error('Login err:', err));

