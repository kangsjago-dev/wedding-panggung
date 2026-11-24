const https = require('https');

const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";

function fetchGViz(sheet, cb) {
  const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}&t=${Date.now()}`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const raw = data.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
        const json = JSON.parse(raw);
        cb(null, json);
      } catch(e) {
        cb(e);
      }
    });
  }).on('error', cb);
}

fetchGViz("Daftar_Acara", (err, json) => {
  if (err) return console.error("Error Daftar_Acara:", err.message);
  console.log("=== DAFTAR_ACARA ROWS ===");
  if (json.table && json.table.rows) {
    json.table.rows.forEach((r, idx) => {
      const vals = (r.c || []).map(c => c ? c.v : '');
      console.log(`Row ${idx + 1}:`, vals.slice(0, 5));
    });
  }
  
  fetchGViz("Pengaturan", (err2, json2) => {
    if (err2) return console.error("Error Pengaturan:", err2.message);
    console.log("=== PENGATURAN KEYS ===");
    if (json2.table && json2.table.rows) {
      json2.table.rows.forEach(r => {
        const k = r.c && r.c[0] ? r.c[0].v : '';
        const v = r.c && r.c[1] ? String(r.c[1].v).substring(0, 100) : '';
        if (k === 'EVENTS' || k === 'ACTIVE_EVENT_ID' || k === 'EVENT_NAME') {
          console.log(`Key: ${k} => ${v}`);
        }
      });
    }
  });
});

