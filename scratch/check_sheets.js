const https = require('https');
const sid = '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20';
https.get('https://docs.google.com/spreadsheets/d/' + sid + '/edit', res => {
  let buf = '';
  res.on('data', c => buf += c);
  res.on('end', () => {
    const reg = /"name":"([^"]+)"/g;
    const names = [];
    let m;
    while ((m = reg.exec(buf)) !== null) {
      names.push(m[1]);
    }
    console.log('Names regex 1:', [...new Set(names)]);
    const reg2 = /gid=(\d+)/g;
    const gids = [];
    while ((m = reg2.exec(buf)) !== null) {
      gids.push(m[1]);
    }
    console.log('GIDs:', [...new Set(gids)]);
  });
});

