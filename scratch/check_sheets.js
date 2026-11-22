(async () => {
  try {
    const r1 = await fetch('https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/gviz/tq?tqx=out:json&sheet=Pengaturan&t=' + Date.now()).then(r => r.text());
    const raw1 = r1.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const json1 = JSON.parse(raw1);
    console.log('=== PENGATURAN ===');
    json1.table.rows.forEach(r => {
      const k = r.c[0] ? r.c[0].v : '';
      const v = r.c[1] ? r.c[1].v : '';
      if (['PHOTOBOOTH_URL', 'ACTIVE_EVENT_ID'].includes(k)) {
        console.log(k + ':', v);
      }
    });

    const r2 = await fetch('https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=' + Date.now()).then(r => r.text());
    const raw2 = r2.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const json2 = JSON.parse(raw2);
    console.log('=== DAFTAR_ACARA ===');
    json2.table.rows.forEach((r, i) => {
      const id = r.c[0] ? r.c[0].v : '';
      const name = r.c[1] ? r.c[1].v : '';
      const pbUrl = r.c[6] ? r.c[6].v : '';
      const cats = r.c[7] ? r.c[7].v : '';
      console.log(`Row ${i} (${id} - ${name}): pbUrl = ${pbUrl}`);
      console.log(`   cats = ${cats}`);
    });
  } catch(e) {
    console.error(e);
  }
})();
