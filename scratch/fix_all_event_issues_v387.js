const fs = require('fs');

// =========================================================================
// 1. UPDATE JS/APP.JS
// =========================================================================
let appJs = fs.readFileSync('js/app.js', 'utf8');

// Fix state.adminPin from "123" to ""
appJs = appJs.replace('adminPin: "123",', 'adminPin: "",');

// Fix getEffectiveAdminPin
const oldGetPin = `    function getEffectiveAdminPin() {
      let pin = state.adminPin;
      if (!pin) {
        try {
          pin = sessionStorage.getItem("WEDDING_ADMIN_PIN") || localStorage.getItem("WEDDING_ADMIN_PIN") || "";
        } catch(e) {}
      }
      return pin || "111111";
    }`;

const newGetPin = `    function getEffectiveAdminPin() {
      let pin = state.adminPin;
      if (!pin || pin === "123") {
        try {
          pin = sessionStorage.getItem("WEDDING_ADMIN_PIN") || localStorage.getItem("WEDDING_ADMIN_PIN") || "";
        } catch(e) {}
      }
      if (!pin || pin === "123") {
        pin = state.activeConfig.ADMIN_PIN || "111111";
      }
      return pin;
    }`;

if (appJs.includes(oldGetPin)) {
  appJs = appJs.replace(oldGetPin, newGetPin);
  console.log('Updated getEffectiveAdminPin');
}

// Fix callBackend to check for { success: false }
const oldCbResolve = `      .then(function(data) {
        onSuccess(data);
      })`;

const newCbResolve = `      .then(function(data) {
        if (data && data.success === false) {
          console.warn("Backend API error:", data.message || data);
          if (onError) onError(data);
          return;
        }
        if (onSuccess) onSuccess(data);
      })`;

if (appJs.includes(oldCbResolve)) {
  appJs = appJs.replace(oldCbResolve, newCbResolve);
  console.log('Updated callBackend error handling');
}

// Fix renderAdminEventsManager to ensure select.value is set to state.currentEventId
const oldRenderMgr = `    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      select.innerHTML = "";
      if (!Array.isArray(state.events) || state.events.length === 0) {
        state.events = [
          {
            id: state.currentEventId || "event-utama",
            name: state.activeConfig.EVENT_NAME || "Acara",
            date: state.activeConfig.EVENT_DATE || "",
            venue: state.activeConfig.EVENT_VENUE || ""
          }
        ];
      }

      state.events.forEach(function(ev) {
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.innerText = (ev.name || ev.id) + (ev.date ? " (" + ev.date + ")" : "");
        if (ev.id === state.currentEventId) opt.selected = true;
        select.appendChild(opt);
      });

      const previewEl = document.getElementById("activeEventUrlPreview");
      if (previewEl) {
        previewEl.innerText = "?event=" + state.currentEventId;
      }
    }`;

const newRenderMgr = `    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      select.innerHTML = "";
      if (!Array.isArray(state.events) || state.events.length === 0) {
        state.events = [
          {
            id: state.currentEventId || "event-utama",
            name: state.activeConfig.EVENT_NAME || "Acara",
            date: state.activeConfig.EVENT_DATE || "",
            venue: state.activeConfig.EVENT_VENUE || ""
          }
        ];
      }

      state.events.forEach(function(ev) {
        if (!ev || !ev.id) return;
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.innerText = (ev.name || ev.id) + (ev.date ? " (" + ev.date + ")" : "");
        if (ev.id === state.currentEventId) opt.selected = true;
        select.appendChild(opt);
      });

      if (state.currentEventId) {
        select.value = state.currentEventId;
      }

      const previewEl = document.getElementById("activeEventUrlPreview");
      if (previewEl) {
        previewEl.innerText = "?event=" + state.currentEventId;
      }
    }`;

if (appJs.includes(oldRenderMgr)) {
  appJs = appJs.replace(oldRenderMgr, newRenderMgr);
  console.log('Updated renderAdminEventsManager');
}

// Fix handleSelectEventChange to update select.value
const oldHandleSelect = `    function handleSelectEventChange(selectedId) {
      if (!selectedId || selectedId === state.currentEventId) return;
      state.currentEventId = selectedId;`;

const newHandleSelect = `    function handleSelectEventChange(selectedId) {
      if (!selectedId) return;
      state.currentEventId = selectedId;
      const select = document.getElementById("adminEventSelect");
      if (select && select.value !== selectedId) {
        select.value = selectedId;
      }`;

if (appJs.includes(oldHandleSelect)) {
  appJs = appJs.replace(oldHandleSelect, newHandleSelect);
  console.log('Updated handleSelectEventChange');
}

// Fix confirmAddNewEvent: set state.currentEventId BEFORE renderAdminEventsManager, and save registry to localStorage
const oldConfirmAdd = `      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);

      closeNewEventModal();
      renderAdminEventsManager();
      handleSelectEventChange(newId);`;

const newConfirmAdd = `      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);
      state.currentEventId = newId;

      try {
        localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
        localStorage.setItem("WEDDING_EVENT_CFG_" + newId, JSON.stringify(newEventObj));
        localStorage.setItem("WEDDING_ACTIVE_EVENT_CFG", JSON.stringify(newEventObj));
      } catch(e) {}

      closeNewEventModal();
      renderAdminEventsManager();
      handleSelectEventChange(newId);`;

if (appJs.includes(oldConfirmAdd)) {
  appJs = appJs.replace(oldConfirmAdd, newConfirmAdd);
  console.log('Updated confirmAddNewEvent');
}

// Fix openAdminSettingsModal to call renderAdminEventsManager()
const oldOpenAdmin = `    function openAdminSettingsModal() {
      const saveAlertBox = document.getElementById("saveAlertBox");
      if (saveAlertBox) saveAlertBox.style.display = "none";
      const changePinAlertBox = document.getElementById("changePinAlertBox");
      if (changePinAlertBox) changePinAlertBox.style.display = "none";
      const addUserAlertBox = document.getElementById("addUserAlertBox");
      if (addUserAlertBox) addUserAlertBox.style.display = "none";

      switchAdminTab("event");`;

const newOpenAdmin = `    function openAdminSettingsModal() {
      const saveAlertBox = document.getElementById("saveAlertBox");
      if (saveAlertBox) saveAlertBox.style.display = "none";
      const changePinAlertBox = document.getElementById("changePinAlertBox");
      if (changePinAlertBox) changePinAlertBox.style.display = "none";
      const addUserAlertBox = document.getElementById("addUserAlertBox");
      if (addUserAlertBox) addUserAlertBox.style.display = "none";

      switchAdminTab("event");
      renderAdminEventsManager();`;

if (appJs.includes(oldOpenAdmin)) {
  appJs = appJs.replace(oldOpenAdmin, newOpenAdmin);
  console.log('Updated openAdminSettingsModal to render events manager');
}

// Fix syncFromSpreadsheetGViz to merge events properly and not wipe newly added events
const oldMergeBlock = `        if (eventsFromSheet.length === 0 && sheetMap.EVENTS && !sheetMap.EVENTS.includes("[object Object]")) {
          try {
            const parsedEvs = JSON.parse(sheetMap.EVENTS);
            if (Array.isArray(parsedEvs)) eventsFromSheet = parsedEvs;
          } catch(e) {}
        }

        if (eventsFromSheet.length > 0) {
          state.events = eventsFromSheet;
        }`;

const newMergeBlock = `        if (eventsFromSheet.length === 0 && sheetMap.EVENTS && !sheetMap.EVENTS.includes("[object Object]")) {
          try {
            const parsedEvs = JSON.parse(sheetMap.EVENTS);
            if (Array.isArray(parsedEvs)) eventsFromSheet = parsedEvs;
          } catch(e) {}
        }

        const mergedMap = new Map();
        eventsFromSheet.forEach(function(ev) {
          if (ev && ev.id) mergedMap.set(ev.id, ev);
        });
        (state.events || []).forEach(function(ev) {
          if (ev && ev.id && !mergedMap.has(ev.id)) mergedMap.set(ev.id, ev);
        });
        try {
          const regStr = localStorage.getItem("WEDDING_EVENTS_REGISTRY");
          if (regStr) {
            const regEvs = JSON.parse(regStr);
            if (Array.isArray(regEvs)) {
              regEvs.forEach(function(ev) {
                if (ev && ev.id && !mergedMap.has(ev.id)) mergedMap.set(ev.id, ev);
              });
            }
          }
        } catch(eReg) {}

        if (mergedMap.size > 0) {
          state.events = Array.from(mergedMap.values());
        }`;

if (appJs.includes(oldMergeBlock)) {
  appJs = appJs.replace(oldMergeBlock, newMergeBlock);
  console.log('Updated syncFromSpreadsheetGViz event merging');
}

fs.writeFileSync('js/app.js', appJs, 'utf8');
console.log('Saved js/app.js successfully!');

// =========================================================================
// 2. UPDATE CODE.GS
// =========================================================================
let codeGs = fs.readFileSync('code.gs', 'utf8');

// Ensure Daftar_Acara is created in setupTargetSpreadsheetDatabase in code.gs
const oldSetupCodeTarget = `  // 3. Sheet: Daftar_Foto
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");`;

const newSetupCodeTarget = `  // 2b. Sheet: Daftar_Acara (Registry Multi-Event Sistem)
  var sheetEvents = ss.getSheetByName("Daftar_Acara");
  if (!sheetEvents) {
    sheetEvents = ss.insertSheet("Daftar_Acara", 2);
  }
  var eventHeaders = [["ID_Event", "Nama_Acara", "Tanggal_Acara", "Venue_Lokasi", "Tautan_Home_Event", "Google_Drive_Folder_ID", "Photobooth_Vendor_URL", "Kategori_JSON", "Bingkai_URL", "Status"]];
  sheetEvents.clear();
  sheetEvents.getRange(1, 1, 1, 10).setValues(eventHeaders)
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetEvents.setFrozenRows(1);

  var initialEventsData = [
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
  ];
  sheetEvents.getRange(2, 1, initialEventsData.length, 10).setValues(initialEventsData);
  sheetEvents.setColumnWidth(1, 180);
  sheetEvents.setColumnWidth(2, 220);
  sheetEvents.setColumnWidth(3, 160);
  sheetEvents.setColumnWidth(4, 250);
  sheetEvents.setColumnWidth(5, 320);
  sheetEvents.setColumnWidth(6, 260);
  sheetEvents.setColumnWidth(7, 300);
  sheetEvents.setColumnWidth(8, 300);
  sheetEvents.setColumnWidth(9, 260);
  sheetEvents.setColumnWidth(10, 100);

  // 3. Sheet: Daftar_Foto
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");`;

if (codeGs.includes(oldSetupCodeTarget) && !codeGs.includes('// 2b. Sheet: Daftar_Acara')) {
  codeGs = codeGs.replace(oldSetupCodeTarget, newSetupCodeTarget);
  console.log('Added Daftar_Acara setup into code.gs setupTargetSpreadsheetDatabase');
}

fs.writeFileSync('code.gs', codeGs, 'utf8');
console.log('Saved code.gs successfully!');

