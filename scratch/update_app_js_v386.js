const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

// 1. Clean GLOBAL_CONFIG fallback strings
code = code.replace(
  `      name: "Wilson & Felicia",
          date: "14 November 2026",
          venue: "Upperhills Convention Centre, Makassar",`,
  `      name: "Andre & Fayola",
          date: "22 November 2026",
          venue: "UPPERHILLS CONVENTION HALLS",`
);

code = code.replace(
  `ACTIVE_EVENT_ID: "wilson-felicia",`,
  `ACTIVE_EVENT_ID: "andre-fayola-281",`
);

code = code.replace(
  `id: "wilson-felicia",`,
  `id: "andre-fayola-281",`
);

code = code.replace(
  `currentEventId: "wilson-felicia",`,
  `currentEventId: "andre-fayola-281",`
);

// 2. Remove fallback to WEDDING_SAVED_CONFIG in DOMContentLoaded
code = code.replace(
  `        if (!savedCfgStr && !urlEventId) {
          savedCfgStr = localStorage.getItem("WEDDING_SAVED_CONFIG");
        }
        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        } else {
          populateConfigToUI(GLOBAL_CONFIG);
        }`,
  `        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        }`
);

// 3. Update syncFromSpreadsheetGViz to query both Pengaturan and Daftar_Acara
const oldGvizStart = `    function syncFromSpreadsheetGViz(callback) {`;
const oldGvizEnd = `            if (hasConfigChanged) {
              populateConfigToUI(state.activeConfig);
              renderCategoryTabs();
              // Hanya re-filter jika kategori aktif saat ini tautannya berubah
              if (state.activeCategory && state.activeCategory !== "Semua Foto") {
                const currentCat = Array.isArray(state.customCategories) ? state.customCategories.find(function(c) {
                  return String((c && c.name) || "").trim().toLowerCase() === state.activeCategory.toLowerCase();
                }) : null;
                if (currentCat) {
                  applyCategoryFilter(currentCat.name, currentCat.url);
                }
              }
            }
          }
        })
        .catch(function(err) {
          console.warn("Info sinkronisasi sheet GViz:", err);
        })
        .finally(function() {
          if (callback) callback();
        });
    }`;

const newGvizFunction = `    function syncFromSpreadsheetGViz(callback) {
      const sid = state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
      if (!sid) { if (callback) callback(); return; }

      const urlPengaturan = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now();
      const urlDaftarAcara = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=" + Date.now();

      function parseGvizText(t) {
        try {
          const raw = t.replace(/^\\/\\*.*?\\*\\/\\s*google\\.visualization\\.Query\\.setResponse\\(/, '').replace(/\\);?\\s*$/, '');
          return JSON.parse(raw);
        } catch(e) { return null; }
      }

      Promise.all([
        fetch(urlPengaturan).then(function(r) { return r.text(); }).then(parseGvizText).catch(function() { return null; }),
        fetch(urlDaftarAcara).then(function(r) { return r.text(); }).then(parseGvizText).catch(function() { return null; })
      ]).then(function(results) {
        const parsedPengaturan = results[0];
        const parsedDaftarAcara = results[1];

        const sheetMap = {};
        if (parsedPengaturan && parsedPengaturan.table && parsedPengaturan.table.rows) {
          parsedPengaturan.table.rows.forEach(function(row) {
            const k = row.c && row.c[0] ? String(row.c[0].v || '').trim() : '';
            const v = row.c && row.c[1] ? String(row.c[1].v || '').trim() : '';
            if (k) sheetMap[k] = v;
          });
        }

        let eventsFromSheet = [];
        if (parsedDaftarAcara && parsedDaftarAcara.table && parsedDaftarAcara.table.rows) {
          const cols = parsedDaftarAcara.table.cols || [];
          const colLabels = cols.map(function(c) { return c && c.label ? String(c.label).trim() : ''; });
          const idCol = colLabels.indexOf("ID_Event");
          const nameCol = colLabels.indexOf("Nama_Acara");
          const dateCol = colLabels.indexOf("Tanggal_Acara");
          const venueCol = colLabels.indexOf("Venue_Lokasi");
          const linkCol = colLabels.indexOf("Tautan_Home_Event");
          const driveCol = colLabels.indexOf("Google_Drive_Folder_ID");
          const pbCol = colLabels.indexOf("Photobooth_Vendor_URL");
          const catCol = colLabels.indexOf("Kategori_JSON");
          const frameCol = colLabels.indexOf("Bingkai_URL");
          const statusCol = colLabels.indexOf("Status");

          if (idCol !== -1 || nameCol !== -1) {
            parsedDaftarAcara.table.rows.forEach(function(row) {
              const getVal = function(idx) { return (row.c && row.c[idx] && row.c[idx].v !== null && row.c[idx].v !== undefined) ? String(row.c[idx].v).trim() : ''; };
              const evId = idCol >= 0 ? getVal(idCol) : getVal(0);
              if (evId && evId !== 'ID_Event' && !evId.startsWith('Parameter ')) {
                let parsedCats = [];
                if (catCol >= 0 && getVal(catCol)) {
                  try { parsedCats = JSON.parse(getVal(catCol)); } catch(e) { parsedCats = []; }
                }
                const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
                const curPath = window.location.pathname || "/";
                const homeLink = (linkCol >= 0 && getVal(linkCol)) ? getVal(linkCol) : (curOrigin + curPath + "?event=" + encodeURIComponent(evId));

                eventsFromSheet.push({
                  id: evId,
                  name: nameCol >= 0 ? getVal(nameCol) : evId,
                  date: dateCol >= 0 ? getVal(dateCol) : '',
                  venue: venueCol >= 0 ? getVal(venueCol) : '',
                  homeUrl: homeLink,
                  driveFolderId: driveCol >= 0 ? getVal(driveCol) : '',
                  photoboothUrl: pbCol >= 0 ? getVal(pbCol) : '',
                  customCategories: Array.isArray(parsedCats) ? parsedCats : [],
                  frameImageUrl: frameCol >= 0 ? getVal(frameCol) : '',
                  status: statusCol >= 0 ? getVal(statusCol) : 'Aktif'
                });
              }
            });
          }
        }

        if (eventsFromSheet.length === 0 && sheetMap.EVENTS && !sheetMap.EVENTS.includes("[object Object]")) {
          try {
            const parsedEvs = JSON.parse(sheetMap.EVENTS);
            if (Array.isArray(parsedEvs)) eventsFromSheet = parsedEvs;
          } catch(e) {}
        }

        if (eventsFromSheet.length > 0) {
          state.events = eventsFromSheet;
        }

        const urlEventId = getActiveEventIdFromUrl();
        const targetEventId = urlEventId || state.currentEventId || sheetMap.ACTIVE_EVENT_ID || (state.events[0] && state.events[0].id) || "";
        let activeEv = (state.events || []).find(function(e) { return e && e.id === targetEventId; });
        if (!activeEv && state.events.length > 0) {
          activeEv = state.events[0];
        }

        if (activeEv) {
          state.currentEventId = activeEv.id;
          state.activeConfig.ACTIVE_EVENT_ID = activeEv.id;
          state.activeConfig.EVENT_NAME = activeEv.name || "";
          state.activeConfig.COUPLE_NAME = activeEv.name || "";
          state.activeConfig.EVENT_DATE = activeEv.date || "";
          state.activeConfig.EVENT_VENUE = activeEv.venue || "";
          state.activeConfig.DRIVE_FOLDER_ID = activeEv.driveFolderId || "";
          state.activeConfig.PHOTOBOOTH_URL = activeEv.photoboothUrl || "";
          state.activeConfig.FRAME_IMAGE_URL = activeEv.frameImageUrl || "";
          state.activeConfig.HOME_URL = activeEv.homeUrl || (window.location.origin + window.location.pathname + "?event=" + encodeURIComponent(activeEv.id));

          if (Array.isArray(activeEv.customCategories) && activeEv.customCategories.length > 0) {
            state.activeConfig.CUSTOM_CATEGORIES = activeEv.customCategories;
            state.customCategories = activeEv.customCategories;
          }
        } else {
          if (sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME) {
            state.activeConfig.EVENT_NAME = sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME;
            state.activeConfig.COUPLE_NAME = state.activeConfig.EVENT_NAME;
          }
          if (sheetMap.EVENT_DATE) state.activeConfig.EVENT_DATE = sheetMap.EVENT_DATE;
          if (sheetMap.EVENT_VENUE) state.activeConfig.EVENT_VENUE = sheetMap.EVENT_VENUE;
          if (sheetMap.DRIVE_FOLDER_ID) state.activeConfig.DRIVE_FOLDER_ID = sheetMap.DRIVE_FOLDER_ID;
          if (sheetMap.PHOTOBOOTH_URL) state.activeConfig.PHOTOBOOTH_URL = sheetMap.PHOTOBOOTH_URL;
          if (sheetMap.CUSTOM_CATEGORIES && !sheetMap.CUSTOM_CATEGORIES.includes("[object Object]")) {
            try {
              const pCats = JSON.parse(sheetMap.CUSTOM_CATEGORIES);
              if (Array.isArray(pCats)) {
                state.activeConfig.CUSTOM_CATEGORIES = pCats;
                state.customCategories = pCats;
              }
            } catch(eCats) {}
          }
        }

        if (sheetMap.ADMIN_PIN) {
          state.activeConfig.ADMIN_PIN = sheetMap.ADMIN_PIN;
          if (!state.isAdminLoggedIn && !state.adminPin) {
            state.adminPin = sheetMap.ADMIN_PIN;
          }
        }
        if (sheetMap.GAS_API_URL && sheetMap.GAS_API_URL.startsWith('http')) {
          state.gasApiUrl = sheetMap.GAS_API_URL;
        }

        populateConfigToUI(state.activeConfig);
        renderCategoryTabs();
        renderAdminEventsManager();
      }).catch(function(err) {
        console.warn("Info sinkronisasi sheet GViz:", err);
      }).finally(function() {
        if (callback) callback();
      });
    }`;

const gvizIdxStart = code.indexOf(oldGvizStart);
const gvizIdxEnd = code.indexOf(oldGvizEnd);
if (gvizIdxStart !== -1 && gvizIdxEnd !== -1) {
  code = code.substring(0, gvizIdxStart) + newGvizFunction + code.substring(gvizIdxEnd + oldGvizEnd.length);
  console.log('Replaced syncFromSpreadsheetGViz cleanly!');
} else {
  console.warn('Could not locate exact boundary of syncFromSpreadsheetGViz');
}

// 4. Clean formatDayDateIndonesian fallback
code = code.replace(
  `if (!val) return "Senin, 16 November 2026";`,
  `if (!val) return "";`
);

// 5. Clean openShareModal fallbacks
code = code.replace(
  `titleEl.innerText = state.activeConfig.EVENT_NAME || "Wilson & Felicia";`,
  `titleEl.innerText = state.activeConfig.EVENT_NAME || "";`
);
code = code.replace(
  `const formattedDate = formatDayDateIndonesian(state.activeConfig.EVENT_DATE || "16 November 2026");`,
  `const formattedDate = formatDayDateIndonesian(state.activeConfig.EVENT_DATE || "");`
);
code = code.replace(
  `const venue = (state.activeConfig.EVENT_VENUE || "UpperHills Convention Hall, Makassar").trim();`,
  `const venue = (state.activeConfig.EVENT_VENUE || "").trim();`
);

// 6. Clean renderAdminEventsManager fallback
code = code.replace(
  `          {
            id: state.currentEventId || "wilson-felicia",
            name: state.activeConfig.EVENT_NAME || "Wilson & Felicia",
            date: state.activeConfig.EVENT_DATE || "14 November 2026",
            venue: state.activeConfig.EVENT_VENUE || "Makassar"
          }`,
  `          {
            id: state.currentEventId || "event-utama",
            name: state.activeConfig.EVENT_NAME || "Acara",
            date: state.activeConfig.EVENT_DATE || "",
            venue: state.activeConfig.EVENT_VENUE || ""
          }`
);

// 7. Clean confirmAddNewEvent and ensure dedicated homeUrl and Google Sheets sync
code = code.replace(
  `      const newEventObj = {
        id: newId,
        name: name,
        date: formattedDate,
        venue: venue || "",
        subtitle: "The Wedding Gallery & Precious Memories",
        welcomeMessage: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        footerMessage: "Diabadikan dengan cinta\\nTerima kasih atas doa restunya.",
        allPhotosLabel: "Semua Foto",
        driveFolderId: driveFolder,
        photoboothUrl: pbUrl,
        frameImageUrl: "",
        customCategories: initialCats
      };`,
  `      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const homeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(newId);

      const newEventObj = {
        id: newId,
        name: name,
        date: formattedDate,
        venue: venue || "",
        homeUrl: homeUrl,
        subtitle: "The Wedding Gallery & Precious Memories",
        welcomeMessage: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        footerMessage: "Diabadikan dengan cinta\\nTerima kasih atas doa restunya.",
        allPhotosLabel: "Semua Foto",
        driveFolderId: driveFolder,
        photoboothUrl: pbUrl,
        frameImageUrl: "",
        customCategories: initialCats,
        status: "Aktif"
      };`
);

// 8. Clean saveAdminTechnicalSettings fallbacks
code = code.replace(
  `const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "14 November 2026");
      const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "Wilson & Felicia";`,
  `const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "");
      const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "";`
);

code = code.replace(
  `EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar",`,
  `EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "",`
);

// 9. Clean showSlide slideshowCategory fallbacks
code = code.replace(
  `      const eventDate = state.activeConfig.EVENT_DATE || "14 November 2026";
      const eventVenue = state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar";
      document.getElementById("slideshowCategory").innerText = eventDate + " • " + eventVenue + " • " + photo.category;`,
  `      const eventDate = state.activeConfig.EVENT_DATE || "";
      const eventVenue = state.activeConfig.EVENT_VENUE || "";
      const infoParts = [eventDate, eventVenue, photo.category].filter(Boolean);
      document.getElementById("slideshowCategory").innerText = infoParts.join(" • ");`
);

fs.writeFileSync('js/app.js', code, 'utf8');
console.log('Successfully updated js/app.js with zero fallback and full multi-event support!');

