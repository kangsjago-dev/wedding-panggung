const https = require('https');
https.get('https://gallery.runway.my.id/js/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Remote js/app.js length:', data.length);
    console.log('Has EVT- filter?', data.includes('String(e.id).startsWith("EVT-")'));
    console.log('Has for r = 1?', data.includes('for (let r = 1; r < aParsed.table.rows.length; r++)'));
    const idx = data.indexOf('renderAdminEventsManager()');
    if (idx !== -1) {
      console.log('Snippet of renderAdminEventsManager:');
      console.log(data.slice(idx, idx + 400));
    }
  });
});

