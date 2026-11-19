const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

config.ACTIVE_EVENT_ID = "andre-fayola-281";
config.EVENT_NAME = "Andre & Fayola";
config.COUPLE_NAME = "Andre & Fayola";
config.EVENT_DATE = "22 November 2026";
config.EVENT_VENUE = "UPPERHILLS CONVENTION HALLS";
config.PHOTOBOOTH_URL = "https://photos.app.goo.gl/QkqewYw4dWfocxfK8";

const activeCats = [
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
];

config.CUSTOM_CATEGORIES = activeCats;

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
    "customCategories": activeCats,
    "status": "Aktif"
  }
];

fs.writeFileSync('config.json', JSON.stringify(config, null, 2), 'utf8');
console.log('config.json updated successfully with live database values!');

