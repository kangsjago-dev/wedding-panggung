const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

config.EVENTS = [
  {
    "id": "andre-fayola-281",
    "name": "Andre & Fayola",
    "date": "22 November 2026",
    "venue": "UPPERHILLS CONVENTION HALLS",
    "homeUrl": "https://gallery.runway.my.id/?event=andre-fayola-281",
    "driveFolderId": "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
    "photoboothUrl": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
    "frameImageUrl": "",
    "customCategories": [
      {
        "name": "Photobooth",
        "url": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        "enabled": true,
        "isPhotobooth": true
      },
      {
        "name": "Wedding",
        "url": "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI",
        "enabled": true
      }
    ],
    "status": "Aktif"
  },
  {
    "id": "wilson-felicia-133",
    "name": "Wilson & Felicia",
    "date": "16 November 2026",
    "venue": "UpperHills Convention Hall, Makassar",
    "homeUrl": "https://gallery.runway.my.id/?event=wilson-felicia-133",
    "driveFolderId": "https://drive.google.com/drive/folders/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW",
    "photoboothUrl": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
    "frameImageUrl": "",
    "customCategories": [
      {
        "name": "Photobooth",
        "url": "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        "enabled": true,
        "isPhotobooth": true
      }
    ],
    "status": "Aktif"
  }
];

fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
console.log('config.json updated with both events!');

