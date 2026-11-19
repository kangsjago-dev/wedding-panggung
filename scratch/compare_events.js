const https = require('https');
const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
const url = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now();

https.get(url, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const raw = d.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const p = JSON.parse(raw);
    const map = {};
    p.table.rows.forEach(r => {
      const k = r.c && r.c[0] ? r.c[0].v : '';
      const v = r.c && r.c[1] ? r.c[1].v : '';
      if (k) map[k] = v;
    });
    const evs = JSON.parse(map.EVENTS);
    console.log("=== COMPARE EVENTS IN SPREADSHEET ===");
    evs.forEach(e => {
      console.log(`\nID: ${e.id}`);
      console.log(`Name: ${e.name}`);
      console.log(`Drive Folder: ${e.driveFolderId}`);
      console.log(`Photobooth URL: ${e.photoboothUrl}`);
      console.log(`Custom Categories: ${JSON.stringify(e.customCategories)}`);
      console.log(`All Photos Label: ${e.allPhotosLabel}`);
      console.log(`Frame Image URL: ${e.frameImageUrl}`);
      console.log(`Logo URL: ${e.logoUrl}`);
    });
  });
});

