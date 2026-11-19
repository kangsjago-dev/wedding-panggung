const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

const targetStr = `            if (sheetMap.EVENT_DATE) state.activeConfig.EVENT_DATE = sheetMap.EVENT_DATE;
            if (sheetMap.EVENT_VENUE) state.activeConfig.EVENT_VENUE = sheetMap.EVENT_VENUE;
            if (sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME) {
              state.activeConfig.EVENT_NAME = sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME;
              state.activeConfig.COUPLE_NAME = state.activeConfig.EVENT_NAME;
            }`;

const replacementStr = `            // Resolusi Multi-Event dari Sheet Pengaturan & Daftar_Acara
            if (sheetMap.EVENTS && !sheetMap.EVENTS.includes("[object Object]")) {
              try {
                const parsedEvs = JSON.parse(sheetMap.EVENTS);
                if (Array.isArray(parsedEvs) && parsedEvs.length > 0) {
                  state.events = parsedEvs;
                  const urlEvId = getActiveEventIdFromUrl();
                  const targetId = urlEvId || state.currentEventId || sheetMap.ACTIVE_EVENT_ID || parsedEvs[0].id;
                  const matchedEv = parsedEvs.find(function(e) { return e && e.id === targetId; }) || parsedEvs[0];
                  if (matchedEv) {
                    state.currentEventId = matchedEv.id;
                    state.activeConfig.ACTIVE_EVENT_ID = matchedEv.id;
                    state.activeConfig.EVENT_NAME = matchedEv.name || "";
                    state.activeConfig.COUPLE_NAME = matchedEv.name || "";
                    state.activeConfig.EVENT_DATE = matchedEv.date || "";
                    state.activeConfig.EVENT_VENUE = matchedEv.venue || "";
                    state.activeConfig.DRIVE_FOLDER_ID = matchedEv.driveFolderId || "";
                    state.activeConfig.PHOTOBOOTH_URL = matchedEv.photoboothUrl || "";
                    state.activeConfig.FRAME_IMAGE_URL = matchedEv.frameImageUrl || "";
                    const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
                    const curPath = window.location.pathname || "/";
                    state.activeConfig.HOME_URL = matchedEv.homeUrl || (curOrigin + curPath + "?event=" + encodeURIComponent(matchedEv.id));

                    if (Array.isArray(matchedEv.customCategories) && matchedEv.customCategories.length > 0) {
                      state.activeConfig.CUSTOM_CATEGORIES = matchedEv.customCategories;
                      state.customCategories = matchedEv.customCategories;
                    }
                  }
                }
              } catch(eEvs) {}
            }

            if (!state.currentEventId || !state.activeConfig.EVENT_NAME) {
              if (sheetMap.EVENT_DATE) state.activeConfig.EVENT_DATE = sheetMap.EVENT_DATE;
              if (sheetMap.EVENT_VENUE) state.activeConfig.EVENT_VENUE = sheetMap.EVENT_VENUE;
              if (sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME) {
                state.activeConfig.EVENT_NAME = sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME;
                state.activeConfig.COUPLE_NAME = state.activeConfig.EVENT_NAME;
              }
            }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync('js/app.js', code, 'utf8');
  console.log('Successfully patched syncFromSpreadsheetGViz in js/app.js!');
} else {
  console.error('Target string not found in js/app.js');
}

