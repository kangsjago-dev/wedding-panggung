const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

const oldBlock = `          config: {
            EVENTS: state.events,
            ACTIVE_EVENT_ID: newId
          }`;

const newBlock = `          config: {
            EVENTS: JSON.stringify(state.events),
            ACTIVE_EVENT_ID: newId,
            EVENT_NAME: name,
            COUPLE_NAME: name,
            EVENT_DATE: formattedDate,
            EVENT_VENUE: venue || "",
            DRIVE_FOLDER_ID: driveFolder,
            PHOTOBOOTH_URL: pbUrl,
            CUSTOM_CATEGORIES: JSON.stringify(initialCats)
          }`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('js/app.js', code, 'utf8');
  console.log('Successfully patched confirmAddNewEvent save config!');
} else {
  console.error('oldBlock not found in js/app.js');
}

