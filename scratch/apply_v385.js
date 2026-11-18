const fs = require('fs');

// --- 1. UPDATE JS/APP.JS ---
let app = fs.readFileSync('js/app.js', 'utf8');
console.log('Original js/app.js length:', app.length);

// 1.1. Fix formatIndonesianDate: return "" if empty
app = app.replace(
  'function formatIndonesianDate(dateStr) {\n      if (!dateStr) return "14 November 2026";',
  'function formatIndonesianDate(dateStr) {\n      if (!dateStr) return "";'
);
app = app.replace(
  'if (!dateStr) return "14 November 2026";',
  'if (!dateStr) return "";'
);

// 1.2. Fix formatDateForInput: return "" if empty
app = app.replace(
  'function formatDateForInput(dateStr) {\n      if (!dateStr) return "2026-11-14";',
  'function formatDateForInput(dateStr) {\n      if (!dateStr) return "";'
);
app = app.replace(
  'if (!dateStr) return "2026-11-14";',
  'if (!dateStr) return "";'
);

// 1.3. In handleSelectEventChange: isolate event links & clear cache
const selEventStart = app.indexOf('function handleSelectEventChange(selectedId) {');
const selEventEnd = app.indexOf('function populateAdminInputsForActiveEvent(cfg) {', selEventStart);

if (selEventStart !== -1 && selEventEnd !== -1) {
  const newSelEvent = `function handleSelectEventChange(selectedId) {
      if (!selectedId || selectedId === state.currentEventId) return;
      state.currentEventId = selectedId;

      const ev = (state.events || []).find(function(e) { return e && e.id === selectedId; });
      if (ev) {
        state.activeConfig = Object.assign({}, state.activeConfig, {
          ACTIVE_EVENT_ID: selectedId,
          EVENT_NAME: ev.name || "",
          COUPLE_NAME: ev.name || "",
          EVENT_DATE: ev.date || "",
          EVENT_VENUE: ev.venue || "",
          SUBTITLE: ev.subtitle || "",
          WELCOME_MESSAGE: ev.welcomeMessage || "",
          FOOTER_MESSAGE: ev.footerMessage || "",
          ALL_PHOTOS_LABEL: ev.allPhotosLabel || "Semua Foto",
          DRIVE_FOLDER_ID: ev.driveFolderId || "",
          PHOTOBOOTH_URL: ev.photoboothUrl || "",
          FRAME_IMAGE_URL: ev.frameImageUrl || "",
          CUSTOM_CATEGORIES: Array.isArray(ev.customCategories) ? ev.customCategories : []
        });

        state.customCategories = Array.isArray(ev.customCategories) ? ev.customCategories : [];
        state.allPhotosLabel = ev.allPhotosLabel || "Semua Foto";

        // Bersihkan cache foto agar foto event sebelumnya tidak tercampur ke event baru
        state.allPhotos = [];
        state.filteredPhotos = [];
        state.categoryPhotosMap = {};
        state.categoryPhotosUrlMap = {};

        // Perbarui input form admin seketika
        populateAdminInputsForActiveEvent(state.activeConfig);
        populateConfigToUI(state.activeConfig);
        renderCategoryTabs();
        renderAdminCategoriesManager();

        // Ganti parameter URL secara dinamis tanpa reload halaman
        try {
          const newUrl = window.location.pathname + "?event=" + encodeURIComponent(selectedId);
          window.history.replaceState({ eventId: selectedId }, "", newUrl);
        } catch (e) {}

        const previewEl = document.getElementById("activeEventUrlPreview");
        if (previewEl) previewEl.innerText = "?event=" + selectedId;

        // Ambil data foto murni untuk event yang dipilih
        fetchGalleryData(true, false);
        showToast("✓ Berpindah ke event: " + (ev.name || selectedId));
      }
    }

    `;
  app = app.substring(0, selEventStart) + newSelEvent + app.substring(selEventEnd);
  console.log('Replaced handleSelectEventChange successfully!');
}

// 1.4. Replace promptAddNewEvent with new modal logic
const promptAddStart = app.indexOf('function promptAddNewEvent() {');
const promptAddEnd = app.indexOf('function handleDeleteCurrentEvent()', promptAddStart);

if (promptAddStart !== -1 && promptAddEnd !== -1) {
  const newEventFuncs = `function openNewEventModal() {
      const modal = document.getElementById("modalNewEvent");
      if (!modal) return;
      document.getElementById("neEventName").value = "";
      document.getElementById("neEventDate").value = "";
      document.getElementById("neEventVenue").value = "";
      document.getElementById("neDriveFolderId").value = "";
      document.getElementById("nePhotoboothUrl").value = "";
      const alertBox = document.getElementById("neAlertBox");
      if (alertBox) { alertBox.style.display = "none"; alertBox.innerText = ""; }
      modal.classList.add("active");
      setTimeout(function() {
        const inp = document.getElementById("neEventName");
        if (inp) inp.focus();
      }, 100);
    }

    function closeNewEventModal() {
      const modal = document.getElementById("modalNewEvent");
      if (modal) modal.classList.remove("active");
    }

    function confirmAddNewEvent() {
      const name = (document.getElementById("neEventName")?.value || "").trim();
      const dateVal = (document.getElementById("neEventDate")?.value || "").trim();
      const venue = (document.getElementById("neEventVenue")?.value || "").trim();
      const driveFolder = (document.getElementById("neDriveFolderId")?.value || "").trim();
      const pbUrl = (document.getElementById("nePhotoboothUrl")?.value || "").trim();
      const alertBox = document.getElementById("neAlertBox");

      if (!name) {
        if (alertBox) {
          alertBox.innerText = "Nama Event / Pasangan wajib diisi.";
          alertBox.style.display = "block";
        }
        return;
      }
      if (!dateVal) {
        if (alertBox) {
          alertBox.innerText = "Tanggal Acara wajib dipilih dari kalender.";
          alertBox.style.display = "block";
        }
        return;
      }

      const formattedDate = formatIndonesianDate(dateVal);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newId = slug ? (slug + "-" + Math.floor(100 + Math.random() * 900)) : ("event-" + Date.now());

      const initialCats = [];
      if (pbUrl) {
        initialCats.push({
          name: "Photobooth",
          url: pbUrl,
          enabled: true,
          isPhotobooth: true
        });
      }
      if (driveFolder) {
        initialCats.push({
          name: "Wedding",
          url: driveFolder.startsWith("http") ? driveFolder : ("https://drive.google.com/drive/folders/" + driveFolder),
          enabled: true
        });
      }

      const newEventObj = {
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
      };

      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);

      closeNewEventModal();
      renderAdminEventsManager();
      handleSelectEventChange(newId);

      // Otomatis sinkronkan event baru ke database Google Sheets
      if (state.gasApiUrl) {
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            EVENTS: state.events,
            ACTIVE_EVENT_ID: newId
          }
        }, function() {
          showToast("✓ Event baru '" + name + "' berhasil dibuat dan disimpan ke database!");
        }, function(err) {
          showToast("✓ Event baru '" + name + "' aktif di browser.");
        });
      } else {
        showToast("✓ Event baru '" + name + "' berhasil dibuat!");
      }
    }

    function openActiveEventHome() {
      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const fullUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
      window.open(fullUrl, "_blank");
    }

    `;
  app = app.substring(0, promptAddStart) + newEventFuncs + app.substring(promptAddEnd);
  console.log('Replaced promptAddNewEvent with openNewEventModal successfully!');
}

// 1.5. Remove cover section functions & references in js/app.js
app = app.replace(
  /function renderWeddingCoverShowcase\(\)[\s\S]*?function renderCategoryTabs/,
  'function renderWeddingCoverShowcase() {}\n\n    function renderCategoryTabs'
);

app = app.replace(
  /function renderAdminCoverManager\(\)[\s\S]*?function renderAdminCategoriesManager/,
  'function renderAdminCoverManager() {}\n\n    function renderAdminCategoriesManager'
);

app = app.replace(
  /function toggleCoverSectionPreview\([^)]*\)\s*\{[\s\S]*?\}/,
  'function toggleCoverSectionPreview() {}'
);

// 1.6. Update switchAdminTab: remove cover
app = app.replace(
  'const tabs = ["event", "cover", "media", "users", "cloud"];',
  'const tabs = ["event", "media", "users", "cloud"];'
);

// 1.7. Ensure state.events isolation in handleSaveAllSettings
const hsaStart = app.indexOf('// Perbarui data event aktif di daftar events');
if (hsaStart !== -1) {
  const hsaEnd = app.indexOf('const pbItem = customCategoriesList.find', hsaStart);
  if (hsaEnd !== -1) {
    const newHsaBlock = `// Perbarui data event aktif di daftar events secara terisolasi
      if (Array.isArray(state.events)) {
        const evIdx = state.events.findIndex(function(e) { return e.id === state.currentEventId; });
        if (evIdx >= 0) {
          const curPbItem = customCategoriesList.find(function(c) {
            return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
          });
          const curPbUrl = curPbItem ? String(curPbItem.url || "").trim() : "";

          state.events[evIdx] = Object.assign({}, state.events[evIdx], {
            name: finalEventName,
            date: formattedDate,
            venue: eventVenueInput || "",
            subtitle: subtitleInput || "",
            welcomeMessage: welcomeInput || "",
            footerMessage: footerInput || "",
            allPhotosLabel: allPhotosLabelInput,
            driveFolderId: driveFolderInput,
            photoboothUrl: curPbUrl,
            frameImageUrl: frameUrlInput,
            customCategories: customCategoriesList
          });
        }
      }

      `;
    app = app.substring(0, hsaStart) + newHsaBlock + app.substring(hsaEnd);
    console.log('Updated state.events isolation in handleSaveAllSettings!');
  }
}

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Saved updated js/app.js, new length:', app.length);

// --- 2. UPDATE CODE.GS ---
let code = fs.readFileSync('code.gs', 'utf8');
console.log('Original code.gs length:', code.length);

// 2.1. In getGalleryData: ensure event isolation (do NOT overwrite currentEvent.customCategories with global categories)
const codeGdOld = `      // SINKRONISASI KATEGORI 2-ARAH: Prioritaskan konfigurasi kategori terbaru agar tidak ter-reset oleh cache objek event lama
      var effectiveCats = config.CUSTOM_CATEGORIES;
      if (typeof effectiveCats === "string") {
        try { effectiveCats = JSON.parse(effectiveCats); } catch(e) {}
      }
      if (Array.isArray(effectiveCats) && effectiveCats.length > 0) {
        currentEvent.customCategories = effectiveCats;
        safeConfig.CUSTOM_CATEGORIES = effectiveCats;
      } else if (Array.isArray(currentEvent.customCategories) && currentEvent.customCategories.length > 0) {
        safeConfig.CUSTOM_CATEGORIES = currentEvent.customCategories;
      }`;

const codeGdNew = `      // Isolasi Kategori Tiap Event: Gunakan kategori milik event aktif
      if (Array.isArray(currentEvent.customCategories) && currentEvent.customCategories.length > 0) {
        safeConfig.CUSTOM_CATEGORIES = currentEvent.customCategories;
      } else {
        safeConfig.CUSTOM_CATEGORIES = [];
      }`;

if (code.includes(codeGdOld)) {
  code = code.replace(codeGdOld, codeGdNew);
  console.log('Updated getGalleryData in code.gs for event category isolation!');
} else {
  console.log('codeGdOld pattern not found in code.gs');
}

// 2.2. In code.gs: ensure safeConfig uses currentEvent properties
code = code.replace(
  'safeConfig.DRIVE_FOLDER_ID = currentEvent.driveFolderId || safeConfig.DRIVE_FOLDER_ID;',
  'safeConfig.DRIVE_FOLDER_ID = currentEvent.driveFolderId || "";\n      safeConfig.PHOTOBOOTH_URL = currentEvent.photoboothUrl || "";'
);

fs.writeFileSync('code.gs', code, 'utf8');
console.log('Saved updated code.gs, new length:', code.length);

