const https = require('https');
const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
const url = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=" + Date.now();

https.get(url, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const raw = d.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    try {
      const p = JSON.parse(raw);
      console.log("Rows count in Daftar_Acara:", p.table.rows.length);
      p.table.rows.forEach(r => {
        const id = r.c && r.c[0] ? r.c[0].v : '';
        const name = r.c && r.c[1] ? r.c[1].v : '';
        console.log(`- ID: ${id}, Name: ${name}`);
      });
    } catch(e) {
      console.error(e.message);
    }
  });
});
