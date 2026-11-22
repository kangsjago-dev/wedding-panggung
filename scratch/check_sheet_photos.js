const https = require('https');

function check() {
  const url = 'https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/gviz/tq?tqx=out:json&sheet=Daftar_Foto';
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTTP status:', res.statusCode);
      const raw = data.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
      try {
        const json = JSON.parse(raw);
        console.log('Rows count:', json.table.rows.length);
        if (json.table.rows.length > 0) {
          console.log('First row:', JSON.stringify(json.table.rows[0]));
          console.log('Total rows:', json.table.rows.length);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });
}
check();

