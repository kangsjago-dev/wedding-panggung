const https = require('https');
const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
const url = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Daftar_Foto";

https.get(url, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const raw = d.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    try {
      const p = JSON.parse(raw);
      console.log("Rows count:", p.table.rows.length);
      console.log("Sample row 0:", JSON.stringify(p.table.rows[0]));
    } catch(e) {
      console.error(e.message);
    }
  });
});

