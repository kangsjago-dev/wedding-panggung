const https = require('https');

const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
const url = `https://docs.google.com/spreadsheets/d/${sid}/gviz/tq?tqx=out:json&sheet=Pengaturan&t=${Date.now()}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const raw = data.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const json = JSON.parse(raw);
    json.table.rows.forEach(r => {
      const k = r.c && r.c[0] ? r.c[0].v : '';
      const v = r.c && r.c[1] ? r.c[1].v : '';
      if (k === 'EVENTS') {
        const evs = JSON.parse(v);
        const tn = evs.find(e => e.id === 'tommy-natasha-594');
        console.log("Tommy & Natasha object:", JSON.stringify(tn, null, 2));
      }
    });
  });
});

