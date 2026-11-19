const https = require('https');

const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";
const sid = '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20';

function fetchSpreadsheetEvents() {
  return new Promise((resolve, reject) => {
    https.get(`https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:json&sheet=Pengaturan`, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const raw = buf.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
          const parsed = JSON.parse(raw);
          const map = {};
          parsed.table.rows.forEach(r => {
            const k = r.c && r.c[0] ? r.c[0].v : '';
            const v = r.c && r.c[1] ? r.c[1].v : '';
            if (k) map[k] = v;
          });
          resolve(map);
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function postSaveConfig(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const parsedUrl = new URL(gasUrl);
    
    // Use GET with query parameter for Google Apps Script redirects
    const q = new URLSearchParams({
      action: 'saveAdminSettings',
      pin: '111111',
      api: 'true',
      config: JSON.stringify(payload)
    }).toString();
    
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
    
    makeReq(gasUrl + '?' + q);
  });
}

async function run() {
  const map = await fetchSpreadsheetEvents();
  console.log('Current EVENT_LOGO_URL in sheet:', map.EVENT_LOGO_URL);
  let events = [];
  if (map.EVENTS) {
    try {
      events = JSON.parse(map.EVENTS);
    } catch(e) {}
  }
  
  console.log('Events before cleaning:');
  events.forEach(e => {
    console.log(` - ${e.id}: logoUrl='${e.logoUrl || ''}'`);
  });

  // Clean Andre & Fayola logoUrl so it does NOT have the leaked Runway logo
  events.forEach(e => {
    if (e.id === 'andre-fayola-281') {
      e.logoUrl = "";
      e.EVENT_LOGO_URL = "";
    }
  });

  const payload = {
    ACTIVE_EVENT_ID: 'andre-fayola-281',
    EVENT_LOGO_URL: "",
    logoUrl: "",
    EVENTS: JSON.stringify(events)
  };

  console.log('Sending clean payload to GAS API...');
  const res = await postSaveConfig(payload);
  console.log('GAS API response:', res);
}

run().catch(console.error);
