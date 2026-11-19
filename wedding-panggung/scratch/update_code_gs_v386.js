const fs = require('fs');

let code = fs.readFileSync('code.gs', 'utf8');

const syncEventsCode = `
/**
 * 4b. Membaca Daftar Acara (Multi-Event) dari Sheet 'Daftar_Acara'
 */
function readEventsFromSheet(ss) {
  if (!ss) return [];
  try {
    var sheet = ss.getSheetByName('Daftar_Acara');
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) return [];

    var header = data[0].map(function(h) { return String(h || '').trim(); });
    var idCol = header.indexOf('ID_Event');
    var nameCol = header.indexOf('Nama_Acara');
    if (idCol === -1 && nameCol === -1) {
      return [];
    }

    var dateCol = header.indexOf('Tanggal_Acara');
    var venueCol = header.indexOf('Venue_Lokasi');
    var urlCol = header.indexOf('Tautan_Home_Event');
    var driveCol = header.indexOf('Google_Drive_Folder_ID');
    var pbCol = header.indexOf('Photobooth_Vendor_URL');
    var catCol = header.indexOf('Kategori_JSON');
    var frameCol = header.indexOf('Bingkai_URL');
    var statusCol = header.indexOf('Status');

    var events = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var evId = idCol >= 0 ? String(row[idCol] || '').trim() : String(row[0] || '').trim();
      if (!evId) continue;

      var cats = [];
      if (catCol >= 0 && row[catCol]) {
        try {
          cats = typeof row[catCol] === 'string' ? JSON.parse(row[catCol]) : row[catCol];
        } catch(e) { cats = []; }
      }

      var homeUrl = urlCol >= 0 ? String(row[urlCol] || '').trim() : '';
      if (!homeUrl) homeUrl = 'https://gallery.runway.my.id/?event=' + encodeURIComponent(evId);

      events.push({
        id: evId,
        name: nameCol >= 0 ? String(row[nameCol] || '').trim() : evId,
        date: dateCol >= 0 ? String(row[dateCol] || '').trim() : '',
        venue: venueCol >= 0 ? String(row[venueCol] || '').trim() : '',
        homeUrl: homeUrl,
        driveFolderId: driveCol >= 0 ? String(row[driveCol] || '').trim() : '',
        photoboothUrl: pbCol >= 0 ? String(row[pbCol] || '').trim() : '',
        customCategories: Array.isArray(cats) ? cats : [],
        frameImageUrl: frameCol >= 0 ? String(row[frameCol] || '').trim() : '',
        status: statusCol >= 0 ? String(row[statusCol] || 'Aktif').trim() : 'Aktif',
        subtitle: 'The Wedding Gallery & Precious Memories',
        welcomeMessage: 'Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.',
        footerMessage: 'Diabadikan dengan cinta\\nTerima kasih atas doa restunya.',
        allPhotosLabel: 'Semua Foto'
      });
    }
    return events;
  } catch (e) {
    Logger.log('Gagal membaca Daftar_Acara: ' + e.toString());
    return [];
  }
}

/**
 * 4c. Menyimpan / Sinkronisasi Daftar Acara ke Sheet 'Daftar_Acara'
 */
function syncEventsToSheet(ss, eventsList) {
  if (!ss || !Array.isArray(eventsList) || eventsList.length === 0) return;
  try {
    var sheet = ss.getSheetByName('Daftar_Acara');
    if (!sheet) {
      sheet = ss.insertSheet('Daftar_Acara', 1);
    }

    var headers = [
      ['ID_Event', 'Nama_Acara', 'Tanggal_Acara', 'Venue_Lokasi', 'Tautan_Home_Event', 'Google_Drive_Folder_ID', 'Photobooth_Vendor_URL', 'Kategori_JSON', 'Bingkai_URL', 'Status']
    ];

    sheet.clear();
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
      .setBackground('#C5A880')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    var rows = [];
    for (var i = 0; i < eventsList.length; i++) {
      var ev = eventsList[i];
      if (!ev || !ev.id) continue;
      var homeLink = ev.homeUrl || ('https://gallery.runway.my.id/?event=' + encodeURIComponent(ev.id));
      var catStr = '';
      if (ev.customCategories) {
        catStr = typeof ev.customCategories === 'string' ? ev.customCategories : JSON.stringify(ev.customCategories);
      }
      rows.push([
        ev.id,
        ev.name || '',
        ev.date || '',
        ev.venue || '',
        homeLink,
        ev.driveFolderId || '',
        ev.photoboothUrl || '',
        catStr,
        ev.frameImageUrl || '',
        ev.status || 'Aktif'
      ]);
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers[0].length).setValues(rows);
    }

    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 160);
    sheet.setColumnWidth(4, 250);
    sheet.setColumnWidth(5, 320);
    sheet.setColumnWidth(6, 260);
    sheet.setColumnWidth(7, 300);
    sheet.setColumnWidth(8, 300);
    sheet.setColumnWidth(9, 260);
    sheet.setColumnWidth(10, 100);

    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log('Gagal sinkronisasi Daftar_Acara: ' + e.toString());
  }
}
`;

if (!code.includes('readEventsFromSheet')) {
  code = code.replace('function logActivityToSheet', syncEventsCode + '\n/**\n * 5. Mencatat Log Aktivitas ke Sheet Log_Aktivitas\n */\nfunction logActivityToSheet');
}

// 2. Update getEffectiveConfig to read from readEventsFromSheet
code = code.replace(
  `    EVENTS: (sheetConfig.EVENTS && sheetConfig.EVENTS !== "[object Object]") ? sheetConfig.EVENTS : (props.EVENTS || WEDDING_CONFIG.EVENTS),`,
  `    EVENTS: (function() {
      var evs = readEventsFromSheet(ss);
      if (evs && evs.length > 0) return JSON.stringify(evs);
      return (sheetConfig.EVENTS && sheetConfig.EVENTS !== "[object Object]") ? sheetConfig.EVENTS : (props.EVENTS || WEDDING_CONFIG.EVENTS);
    })(),`
);

// 3. Update getGalleryData to prioritize readEventsFromSheet
code = code.replace(
  `    var eventsList = [];
    try {
      eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
    } catch (eEv) {
      eventsList = [];
    }`,
  `    var ss = getDatabaseSpreadsheet();
    var eventsList = [];
    if (ss) {
      eventsList = readEventsFromSheet(ss);
    }
    if (!Array.isArray(eventsList) || eventsList.length === 0) {
      try {
        eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
      } catch (eEv) {
        eventsList = [];
      }
    }`
);

// 4. Update getEvents
code = code.replace(
  `function getEvents() {
    try {
      var config = getEffectiveConfig();
      var eventsList = [];
      try {
        eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
      } catch (e) {
        eventsList = [];
      }
      return {
        success: true,
        activeEventId: config.ACTIVE_EVENT_ID || "wilson-felicia",
        events: eventsList
      };`,
  `function getEvents() {
    try {
      var ss = getDatabaseSpreadsheet();
      var eventsList = [];
      if (ss) {
        eventsList = readEventsFromSheet(ss);
      }
      var config = getEffectiveConfig();
      if (!Array.isArray(eventsList) || eventsList.length === 0) {
        try {
          eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
        } catch (e) {
          eventsList = [];
        }
      }
      return {
        success: true,
        activeEventId: config.ACTIVE_EVENT_ID || (eventsList[0] && eventsList[0].id) || "",
        events: eventsList
      };`
);

// 5. In saveAdminSettings: sync to Daftar_Acara
const oldSaveEvBlock = `      if (updatedConfig.EVENTS !== undefined) {
        var evVal = typeof updatedConfig.EVENTS === "string" ? updatedConfig.EVENTS : JSON.stringify(updatedConfig.EVENTS);
        props.setProperty("EVENTS", evVal);
      }`;

const newSaveEvBlock = `      if (updatedConfig.EVENTS !== undefined) {
        var evList = [];
        try {
          evList = typeof updatedConfig.EVENTS === "string" ? JSON.parse(updatedConfig.EVENTS) : updatedConfig.EVENTS;
        } catch(e) { evList = []; }
        if (Array.isArray(evList) && evList.length > 0) {
          var evVal = JSON.stringify(evList);
          props.setProperty("EVENTS", evVal);
          updatedConfig.EVENTS = evVal;
          if (dbSpreadsheet) {
            syncEventsToSheet(dbSpreadsheet, evList);
          }
        }
      }

      // Sinkronkan pembaruan parameter event aktif ke baris Daftar_Acara
      try {
        if (dbSpreadsheet) {
          var currentEvList = readEventsFromSheet(dbSpreadsheet);
          if (!currentEvList || currentEvList.length === 0) {
            var strEv = props.getProperty("EVENTS") || WEDDING_CONFIG.EVENTS;
            currentEvList = typeof strEv === "string" ? JSON.parse(strEv) : strEv;
          }
          if (Array.isArray(currentEvList) && currentEvList.length > 0) {
            var activeId = updatedConfig.ACTIVE_EVENT_ID || props.getProperty("ACTIVE_EVENT_ID") || "";
            var curEv = currentEvList.find(function(e) { return e && e.id === activeId; }) || currentEvList[0];
            if (curEv) {
              if (updatedConfig.EVENT_NAME !== undefined) curEv.name = String(updatedConfig.EVENT_NAME).trim();
              if (updatedConfig.COUPLE_NAME !== undefined) curEv.name = String(updatedConfig.COUPLE_NAME).trim();
              if (updatedConfig.EVENT_DATE !== undefined) curEv.date = String(updatedConfig.EVENT_DATE).trim();
              if (updatedConfig.EVENT_VENUE !== undefined) curEv.venue = String(updatedConfig.EVENT_VENUE).trim();
              if (updatedConfig.DRIVE_FOLDER_ID !== undefined) curEv.driveFolderId = String(updatedConfig.DRIVE_FOLDER_ID).trim();
              if (updatedConfig.PHOTOBOOTH_URL !== undefined) curEv.photoboothUrl = String(updatedConfig.PHOTOBOOTH_URL).trim();
              if (updatedConfig.FRAME_IMAGE_URL !== undefined) curEv.frameImageUrl = String(updatedConfig.FRAME_IMAGE_URL).trim();
              if (updatedConfig.CUSTOM_CATEGORIES !== undefined) {
                try {
                  curEv.customCategories = typeof updatedConfig.CUSTOM_CATEGORIES === "string" ? JSON.parse(updatedConfig.CUSTOM_CATEGORIES) : updatedConfig.CUSTOM_CATEGORIES;
                } catch(e) {}
              }
              curEv.homeUrl = "https://gallery.runway.my.id/?event=" + encodeURIComponent(curEv.id);
              syncEventsToSheet(dbSpreadsheet, currentEvList);
              props.setProperty("EVENTS", JSON.stringify(currentEvList));
              updatedConfig.EVENTS = JSON.stringify(currentEvList);
            }
          }
        }
      } catch (errEvUpdate) {
        Logger.log("Info update event di sheet: " + errEvUpdate.toString());
      }`;

if (code.includes(oldSaveEvBlock)) {
  code = code.replace(oldSaveEvBlock, newSaveEvBlock);
}

fs.writeFileSync('code.gs', code, 'utf8');
console.log('Successfully updated code.gs with Daftar_Acara synchronization!');

