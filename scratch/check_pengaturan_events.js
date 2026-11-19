const https = require('https');
const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
const url = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now();

https.get(url, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const raw = d.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    try {
      const p = JSON.parse(raw);
      const map = {};
      p.table.rows.forEach(r => {
        const k = r.c && r.c[0] ? r.c[0].v : '';
        const v = r.c && r.c[1] ? r.c[1].v : '';
        if (k) map[k] = v;
      });
      console.log("Keys:", Object.keys(map));
      console.log("ACTIVE_EVENT_ID:", map.ACTIVE_EVENT_ID);
      console.log("EVENTS count:", map.EVENTS ? JSON.parse(map.EVENTS).length : 'no events');
      if (map.EVENTS) {
        console.log("EVENTS IDs:", JSON.parse(map.EVENTS).map(e => e.id));
      }
    } catch(e) {
      console.error(e.message);
    }
  });
});

