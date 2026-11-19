const fs = require('fs');

let setupGs = fs.readFileSync('setup.gs', 'utf8');

const oldEvents = `    var initialEvents = [
      [
        "andre-fayola-281",
        "Andre & Fayola",
        "22 November 2026",
        "UPPERHILLS CONVENTION HALLS",
        "https://gallery.runway.my.id/?event=andre-fayola-281",
        "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
        "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        '[{"name":"Photobooth","url":"https://photos.app.goo.gl/QkqewYw4dWfocxfK8","enabled":true,"isPhotobooth":true},{"name":"Wedding","url":"https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI","enabled":true}]',
        "",
        "Aktif"
      ]
    ];`;

const newEvents = `    var initialEvents = [
      [
        "andre-fayola-281",
        "Andre & Fayola",
        "22 November 2026",
        "UPPERHILLS CONVENTION HALLS",
        "https://gallery.runway.my.id/?event=andre-fayola-281",
        "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
        "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        '[{"name":"Photobooth","url":"https://photos.app.goo.gl/QkqewYw4dWfocxfK8","enabled":true,"isPhotobooth":true},{"name":"Wedding","url":"https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI","enabled":true}]',
        "",
        "Aktif"
      ],
      [
        "wilson-felicia-133",
        "Wilson & Felicia",
        "16 November 2026",
        "UpperHills Convention Hall, Makassar",
        "https://gallery.runway.my.id/?event=wilson-felicia-133",
        "https://drive.google.com/drive/folders/1GGB77clCMYBIg17J0ECr2eVbD02ZeInW",
        "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        '[{"name":"Photobooth","url":"https://photos.app.goo.gl/QkqewYw4dWfocxfK8","enabled":true,"isPhotobooth":true}]',
        "",
        "Aktif"
      ]
    ];`;

if (setupGs.includes(oldEvents)) {
  setupGs = setupGs.replace(oldEvents, newEvents);
  fs.writeFileSync('setup.gs', setupGs, 'utf8');
  console.log('setup.gs updated with both events!');
} else {
  console.log('setup.gs oldEvents not found');
}

