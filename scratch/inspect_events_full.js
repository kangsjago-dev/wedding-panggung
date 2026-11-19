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

fetchGViz("Pengaturan", (err, json) => {
  if (err) return console.error(err);
  json.table.rows.forEach(r => {
    const k = r.c && r.c[0] ? r.c[0].v : '';
    const v = r.c && r.c[1] ? r.c[1].v : '';
    if (k === 'EVENTS') {
      try {
        const evs = JSON.parse(v);
        console.log("EVENTS count:", evs.length);
        evs.forEach((e, i) => console.log(`Event ${i + 1}: id=${e.id}, name=${e.name}, driveFolderId=${e.driveFolderId}`));
      } catch(e) {
        console.error("Parse error:", e);
      }
    }
  });
});

