const https = require('https');
const sid = '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20';
const url = 'https://docs.google.com/spreadsheets/d/' + sid + '/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=' + Date.now();

https.get(url, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const raw = data.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
      const parsed = JSON.parse(raw);
      console.log('Cols in Daftar_Acara:');
      parsed.table.cols.forEach((c, i) => console.log(i, c ? (c.label || c.id) : 'empty'));
      console.log('Total rows in Daftar_Acara:', parsed.table.rows.length);
      parsed.table.rows.slice(0, 5).forEach((r, idx) => {
        const rowVals = (r.c || []).map(cell => cell ? cell.v : '');
        console.log('Row ' + (idx + 1) + ':', rowVals);
      });
    } catch(e) {
      console.log('Error parsing:', e.message, data.slice(0, 300));
    }
  });
}).on('error', console.error);

