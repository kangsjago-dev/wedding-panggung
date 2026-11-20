const https = require('https');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
}

async function run() {
  const sid = '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20';
  const dRaw = await get('https://docs.google.com/spreadsheets/d/' + sid + '/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=' + Date.now());
  const aRaw = dRaw.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
  const parsed = JSON.parse(aRaw);
  console.log('Daftar_Acara cols length:', parsed.table.cols.length);
  console.log('Daftar_Acara rows count:', parsed.table.rows.length);
  for (let i = 0; i < parsed.table.rows.length; i++) {
    const row = parsed.table.rows[i].c;
    const id = row[0] ? row[0].v : '';
    const name = row[1] ? row[1].v : '';
    const date = row[2] ? (row[2].f || row[2].v) : 'NULL';
    console.log('Row ' + i + ': ID=' + id + ', Name=' + name + ', Date=' + date);
  }

  const pRaw = await get('https://docs.google.com/spreadsheets/d/' + sid + '/gviz/tq?tqx=out:json&sheet=Pengaturan&t=' + Date.now());
  const pJson = JSON.parse(pRaw.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, ''));
  for (let r of pJson.table.rows) {
    if (r.c[0] && r.c[0].v === 'EVENTS') {
      console.log('Pengaturan EVENTS:', r.c[1].v);
    }
  }
}

run();

