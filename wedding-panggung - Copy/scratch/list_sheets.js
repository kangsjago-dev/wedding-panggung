const https = require('https');
const sid = '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20';

const sheets = ['Pengaturan', 'Daftar_Acara', 'Pengguna_Admin', 'Daftar_Foto', 'Log_Aktivitas', 'Sheet1'];

sheets.forEach(sh => {
  const url = 'https://docs.google.com/spreadsheets/d/' + sid + '/gviz/tq?tqx=out:json&sheet=' + encodeURIComponent(sh) + '&t=' + Date.now();
  https.get(url, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const raw = d.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
        const p = JSON.parse(raw);
        console.log(sh, 'status:', p.status, 'rows:', p.table ? p.table.rows.length : 0, 'cols:', p.table ? p.table.cols.map(c => c ? c.label : '').filter(Boolean) : []);
      } catch(e) {
        console.log(sh, 'error:', e.message);
      }
    });
  }).on('error', console.error);
});

