const https = require('https');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
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
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testActions() {
  const gasUrl = 'https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec';
  const actions = [
    'setupDemo',
    'setupSpreadsheetDatabase',
    'setupDatabase',
    'populateAllDatabase',
    'syncAllDatabaseToSheet',
    'syncDaftarFoto',
    'getSpreadsheetInfo',
    'testAndSyncDriveFolder',
    'addAdminUser'
  ];

  for (const act of actions) {
    try {
      const res = await postJson(gasUrl, { action: act, pin: '111111' });
      console.log('Action', act, '=>', typeof res === 'object' ? JSON.stringify(res).slice(0, 100) : String(res).slice(0, 100));
    } catch(e) {
      console.log('Action', act, '=> ERROR', e.message);
    }
  }
}

testActions();

