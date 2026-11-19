const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

const targetEvBlock = `          coverSettings: {
            enabled: false,
            style: "romantic-collage",
            heading: "The Wedding Celebration",
            subheading: "A Journey of Two Hearts Joined as One",
            quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
            photos: []
          }
        }`;

const replacementEvBlock = `          coverSettings: {
            enabled: false,
            style: "romantic-collage",
            heading: "The Wedding Celebration",
            subheading: "A Journey of Two Hearts Joined as One",
            quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
            photos: []
          }
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
        }`;

if (appJs.includes(targetEvBlock) && !appJs.includes('wilson-felicia-133')) {
  appJs = appJs.replace(targetEvBlock, replacementEvBlock);
  fs.writeFileSync('js/app.js', appJs, 'utf8');
  console.log('Added wilson-felicia-133 to GLOBAL_CONFIG.EVENTS in js/app.js');
}

