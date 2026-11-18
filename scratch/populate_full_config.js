const https = require('https');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request(u, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => {
            try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
          });
        }).on('error', reject);
        return;
      }
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function populateFullConfig() {
  const gasUrl = 'https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec';
  
  const events = [
    {
      id: "andre-fayola-281",
      name: "Andre & Fayola",
      date: "22 November 2026",
      venue: "UPPERHILLS CONVENTION HALLS",
      homeUrl: "https://gallery.runway.my.id/?event=andre-fayola-281",
      driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
      photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
      frameImageUrl: "",
      customCategories: [
        {
          name: "Photobooth",
          url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
          enabled: true,
          isPhotobooth: true
        },
        {
          name: "Wedding",
          url: "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI",
          enabled: true
        }
      ],
      status: "Aktif"
    },
    {
      id: "wilson-felicia-133",
      name: "Wilson & Felicia",
      date: "16 November 2026",
      venue: "UpperHills Convention Hall, Makassar",
      homeUrl: "https://gallery.runway.my.id/?event=wilson-felicia-133",
      driveFolderId: "https://drive.google.com/drive/folders/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW",
      photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
      frameImageUrl: "",
      customCategories: [
        {
          name: "Photobooth",
          url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
          enabled: true,
          isPhotobooth: true
        }
      ],
      status: "Aktif"
    }
  ];

  const payload = {
    action: 'saveAdminSettings',
    pin: '111111',
    config: {
      EVENT_NAME: "Andre & Fayola",
      COUPLE_NAME: "Andre & Fayola",
      EVENT_DATE: "22 November 2026",
      EVENT_VENUE: "UPPERHILLS CONVENTION HALLS",
      SUBTITLE: "The Wedding Gallery & Precious Memories",
      WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
      FOOTER_MESSAGE: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
      ALL_PHOTOS_LABEL: "Semua Foto",
      ACTIVE_EVENT_ID: "andre-fayola-281",
      ADMIN_USERNAME: "admin",
      ADMIN_PIN: "111111",
      SLIDESHOW_INTERVAL_SEC: 4,
      AUTO_REFRESH_INTERVAL_SEC: 25,
      NEW_BADGE_MINUTES: 10,
      SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
      DRIVE_FOLDER_ID: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
      PHOTOBOOTH_URL: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
      EVENTS: JSON.stringify(events),
      CUSTOM_CATEGORIES: JSON.stringify(events[0].customCategories)
    }
  };

  const res = await postJson(gasUrl, payload);
  console.log('Result success:', res && res.success, res && res.message);
}

populateFullConfig();

