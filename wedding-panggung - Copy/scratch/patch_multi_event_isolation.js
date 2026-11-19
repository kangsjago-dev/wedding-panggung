const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');

// 1. Patch DOMContentLoaded startup
const targetStartup = `      // 2. Deteksi Parameter URL Event & Muat Cache Terisolasi (Anti-Flicker Lintas Event)
      const urlEventId = getActiveEventIdFromUrl();
      if (urlEventId) {
        state.currentEventId = urlEventId;
      }

      try {
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        let savedCfgStr = localStorage.getItem(cacheKey);
        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        }
      } catch (e) {}`;

const replaceStartup = `      // 2. Deteksi Parameter URL Event, Pulihkan Registry Multi-Event & Muat Cache Terisolasi (Anti-Flicker Lintas Event)
      try {
        const savedRegistryStr = localStorage.getItem("WEDDING_EVENTS_REGISTRY");
        if (savedRegistryStr) {
          const parsedRegistry = JSON.parse(savedRegistryStr);
          if (Array.isArray(parsedRegistry) && parsedRegistry.length > 0) {
            state.events = parsedRegistry;
          }
        }
      } catch(e) {}

      const urlEventId = getActiveEventIdFromUrl();
      const savedActiveEventId = localStorage.getItem("WEDDING_ACTIVE_EVENT_ID");
      state.currentEventId = urlEventId || savedActiveEventId || GLOBAL_CONFIG.ACTIVE_EVENT_ID || "andre-fayola-281";

      // Pastikan URL di address bar browser selalu mencantumkan link khusus event ini: ?event=...
      try {
        const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
        const curPath = window.location.pathname || "/";
        const fullTargetUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
        if (!urlEventId || urlEventId !== state.currentEventId) {
          window.history.replaceState({ eventId: state.currentEventId }, "", fullTargetUrl);
        }
      } catch(e) {}

      // Muat konfigurasi cache khusus untuk event yang sedang aktif
      try {
        const cacheKey = "WEDDING_EVENT_CFG_" + state.currentEventId;
        let savedCfgStr = localStorage.getItem(cacheKey) || localStorage.getItem("WEDDING_ACTIVE_EVENT_CFG");
        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        }
      } catch (e) {}

      // Muat cache foto terisolasi untuk event ini agar tampilan langsung muncul seketika tanpa flicker
      try {
        const photoCacheKey = "WEDDING_EVENT_PHOTOS_" + state.currentEventId;
        const savedPhotosStr = localStorage.getItem(photoCacheKey);
        if (savedPhotosStr) {
          const savedPhotos = JSON.parse(savedPhotosStr);
          if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
            state.allPhotos = savedPhotos;
            state.filteredPhotos = savedPhotos;
            renderPhotoGrid();
          }
        }
      } catch(e) {}`;

if (!content.includes(targetStartup)) {
  console.error("Target startup not found!");
  process.exit(1);
}
content = content.replace(targetStartup, replaceStartup);

// 2. Patch config.json merging in DOMContentLoaded
const targetConfigMerge = `            if (Array.isArray(remoteCfg.EVENTS)) {
              state.events = remoteCfg.EVENTS;
              const matchedEv = state.events.find(function(ev) { return ev.id === state.currentEventId; });
              if (matchedEv) {
                remoteCfg.EVENT_NAME = matchedEv.name;
                remoteCfg.COUPLE_NAME = matchedEv.name;
                remoteCfg.EVENT_DATE = matchedEv.date;
                remoteCfg.EVENT_VENUE = matchedEv.venue;
                remoteCfg.SUBTITLE = matchedEv.subtitle;
                remoteCfg.WELCOME_MESSAGE = matchedEv.welcomeMessage;
                remoteCfg.FOOTER_MESSAGE = matchedEv.footerMessage;
                remoteCfg.ALL_PHOTOS_LABEL = matchedEv.allPhotosLabel || "Semua Foto";
                remoteCfg.DRIVE_FOLDER_ID = matchedEv.driveFolderId;
                remoteCfg.FRAME_IMAGE_URL = matchedEv.frameImageUrl;

                // Sinkronisasi kategori: Jangan timpa jika remoteCfg.CUSTOM_CATEGORIES sudah memuat kategori aktif
                if (Array.isArray(remoteCfg.CUSTOM_CATEGORIES) && remoteCfg.CUSTOM_CATEGORIES.length > 0) {
                  matchedEv.customCategories = remoteCfg.CUSTOM_CATEGORIES;
                } else if (Array.isArray(matchedEv.customCategories) && matchedEv.customCategories.length > 0) {
                  remoteCfg.CUSTOM_CATEGORIES = matchedEv.customCategories;
                }
                remoteCfg.COVER_SETTINGS = matchedEv.coverSettings;
              }
            }`;

const replaceConfigMerge = `            if (Array.isArray(remoteCfg.EVENTS)) {
              const evMap = new Map();
              (state.events || []).forEach(function(e) { if (e && e.id) evMap.set(e.id, e); });
              remoteCfg.EVENTS.forEach(function(e) {
                if (e && e.id) {
                  const prev = evMap.get(e.id) || {};
                  evMap.set(e.id, Object.assign({}, prev, e));
                }
              });
              state.events = Array.from(evMap.values());
              try { localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events)); } catch(eReg) {}

              const matchedEv = state.events.find(function(ev) { return ev.id === state.currentEventId; }) || state.events[0];
              if (matchedEv) {
                remoteCfg.ACTIVE_EVENT_ID = matchedEv.id;
                remoteCfg.EVENT_NAME = matchedEv.name;
                remoteCfg.COUPLE_NAME = matchedEv.name;
                remoteCfg.EVENT_DATE = matchedEv.date;
                remoteCfg.EVENT_VENUE = matchedEv.venue;
                remoteCfg.SUBTITLE = matchedEv.subtitle || remoteCfg.SUBTITLE;
                remoteCfg.WELCOME_MESSAGE = matchedEv.welcomeMessage || remoteCfg.WELCOME_MESSAGE;
                remoteCfg.FOOTER_MESSAGE = matchedEv.footerMessage || remoteCfg.FOOTER_MESSAGE;
                remoteCfg.ALL_PHOTOS_LABEL = matchedEv.allPhotosLabel || "Semua Foto";
                remoteCfg.DRIVE_FOLDER_ID = matchedEv.driveFolderId;
                remoteCfg.FRAME_IMAGE_URL = matchedEv.frameImageUrl;
                remoteCfg.PHOTOBOOTH_URL = matchedEv.photoboothUrl;
                if (Array.isArray(matchedEv.customCategories) && matchedEv.customCategories.length > 0) {
                  remoteCfg.CUSTOM_CATEGORIES = matchedEv.customCategories;
                }
                remoteCfg.COVER_SETTINGS = matchedEv.coverSettings;
              }
            }`;

if (!content.includes(targetConfigMerge)) {
  console.error("Target config merge not found!");
  process.exit(1);
}
content = content.replace(targetConfigMerge, replaceConfigMerge);

// 3. Patch sheet resolution: jangan timpa DRIVE_FOLDER_ID jika matchedEv sudah punya
const targetSheetDrive = `            if (!isEditingLocally && !isModalOpen) {
              if (sheetMap.DRIVE_FOLDER_ID) state.activeConfig.DRIVE_FOLDER_ID = sheetMap.DRIVE_FOLDER_ID;
              if (sheetMap.ALL_PHOTOS_LABEL) state.allPhotosLabel = sheetMap.ALL_PHOTOS_LABEL;
            }`;

const replaceSheetDrive = `            if (!isEditingLocally && !isModalOpen) {
              if (sheetMap.DRIVE_FOLDER_ID && (!matchedEv || !matchedEv.driveFolderId)) state.activeConfig.DRIVE_FOLDER_ID = sheetMap.DRIVE_FOLDER_ID;
              if (sheetMap.ALL_PHOTOS_LABEL && (!matchedEv || !matchedEv.allPhotosLabel)) state.allPhotosLabel = sheetMap.ALL_PHOTOS_LABEL;
            }`;

if (!content.includes(targetSheetDrive)) {
  console.error("Target sheet drive not found!");
  process.exit(1);
}
content = content.replace(targetSheetDrive, replaceSheetDrive);

// 4. Patch handleGalleryResponse photo isolation
const targetGalleryPhotoCheck = `      // Filter ketat: Buang seluruh foto demo / sampel jika folder Google Drive kosong, serta foto yang tercatat rusak
      const incomingPhotos = (response.photos || []).filter(function(p) {
        if (!p || !p.id) return false;
        if (state.failedPhotoIds && state.failedPhotoIds.has(p.id)) return false;
        const sId = String(p.id).toLowerCase();
        if (sId.startsWith("demo-") || sId.startsWith("demo_") || /^d\\d+$/.test(sId)) return false;
        if (p.thumbnailUrl && p.thumbnailUrl.includes("images.unsplash.com")) return false;
        return true;
      });`;

const replaceGalleryPhotoCheck = `      // Pemeriksaan Isolasi Folder & Event: Cegah foto dari event lain tercampur ke event ini
      const activeDriveId = (state.activeConfig.DRIVE_FOLDER_ID && extractDriveFolderId(state.activeConfig.DRIVE_FOLDER_ID)) || state.activeConfig.DRIVE_FOLDER_ID || "";
      const respDriveId = response.config ? ((response.config.DRIVE_FOLDER_ID && extractDriveFolderId(response.config.DRIVE_FOLDER_ID)) || response.config.DRIVE_FOLDER_ID || "") : "";

      if (activeDriveId && respDriveId && activeDriveId !== respDriveId) {
        // Backend mengembalikan foto dari folder berbeda (misal cache server lama atau beda event)
        // Ambil foto yang benar langsung untuk folder event aktif ini
        fetchDriveCategoryPhotos("Semua Foto", activeDriveId, function(correctPhotos) {
          if (Array.isArray(correctPhotos) && correctPhotos.length > 0) {
            state.allPhotos = correctPhotos;
            state.filteredPhotos = correctPhotos;
            try {
              localStorage.setItem("WEDDING_EVENT_PHOTOS_" + state.currentEventId, JSON.stringify(correctPhotos));
              localStorage.setItem("WEDDING_EVENT_PHOTOS_COUNT_" + state.currentEventId, String(correctPhotos.length));
              localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String(correctPhotos.length));
            } catch(e) {}
            renderCategoryTabs();
            applyCategoryFilter(state.activeCategory || "Semua Foto");
          }
        });
        return;
      }

      // Filter ketat: Buang seluruh foto demo / sampel jika folder Google Drive kosong, serta foto yang tercatat rusak
      const incomingPhotos = (response.photos || []).filter(function(p) {
        if (!p || !p.id) return false;
        if (state.failedPhotoIds && state.failedPhotoIds.has(p.id)) return false;
        const sId = String(p.id).toLowerCase();
        if (sId.startsWith("demo-") || sId.startsWith("demo_") || /^d\\d+$/.test(sId)) return false;
        if (p.thumbnailUrl && p.thumbnailUrl.includes("images.unsplash.com")) return false;
        return true;
      });`;

if (!content.includes(targetGalleryPhotoCheck)) {
  console.error("Target gallery photo check not found!");
  process.exit(1);
}
content = content.replace(targetGalleryPhotoCheck, replaceGalleryPhotoCheck);

// 5. Patch incomingPhotos caching to be scoped per event
const targetSavePhotosCount = `      state.allPhotos = incomingPhotos;
      try {
        if (incomingPhotos.length > 0) {
          localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String(incomingPhotos.length));
        }
      } catch(e) {}`;

const replaceSavePhotosCount = `      state.allPhotos = incomingPhotos;
      try {
        if (incomingPhotos.length > 0) {
          localStorage.setItem("WEDDING_EVENT_PHOTOS_" + state.currentEventId, JSON.stringify(incomingPhotos));
          localStorage.setItem("WEDDING_EVENT_PHOTOS_COUNT_" + state.currentEventId, String(incomingPhotos.length));
          localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String(incomingPhotos.length));
        }
      } catch(e) {}`;

if (!content.includes(targetSavePhotosCount)) {
  console.error("Target save photos count not found!");
  process.exit(1);
}
content = content.replace(targetSavePhotosCount, replaceSavePhotosCount);

// 6. Patch Multi-Event Admin Management Functions
const targetAdminFuncs = `    function renderAdminEventsManager() {
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
        opt.innerText = (ev.name || ev.id) + " (" + (ev.date || "") + ")";
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
    }

    function handleSelectEventChange(selectedId) {
      if (!selectedId) return;
      state.currentEventId = selectedId;
      const select = document.getElementById("adminEventSelect");
      if (select) {
        select.value = selectedId;
      }

      const ev = (state.events || []).find(function(e) { return e && e.id === selectedId; });
      if (ev) {
        state.activeConfig = Object.assign({}, state.activeConfig, {
          ACTIVE_EVENT_ID: selectedId,
          EVENT_NAME: ev.name || "",
          COUPLE_NAME: ev.name || "",
          EVENT_DATE: ev.date || "",
          EVENT_VENUE: ev.venue || "",
          SUBTITLE: ev.subtitle || "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: ev.welcomeMessage || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          FOOTER_MESSAGE: ev.footerMessage || "Diabadikan dengan cinta\\nTerima kasih atas doa restunya.",
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
    }`;

const replaceAdminFuncs = `    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      // Pastikan registry memuat event dari localStorage jika ada
      try {
        const savedRegistry = localStorage.getItem("WEDDING_EVENTS_REGISTRY");
        if (savedRegistry) {
          const parsed = JSON.parse(savedRegistry);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const evMap = new Map();
            (state.events || []).forEach(function(e) { if (e && e.id) evMap.set(e.id, e); });
            parsed.forEach(function(e) { if (e && e.id && !evMap.has(e.id)) evMap.set(e.id, e); });
            state.events = Array.from(evMap.values());
          }
        }
      } catch(e) {}

      if (!Array.isArray(state.events) || state.events.length === 0) {
        state.events = [
          {
            id: state.currentEventId || "andre-fayola-281",
            name: state.activeConfig.EVENT_NAME || "Andre & Fayola",
            date: state.activeConfig.EVENT_DATE || "22 November 2026",
            venue: state.activeConfig.EVENT_VENUE || "UPPERHILLS CONVENTION HALLS",
            driveFolderId: state.activeConfig.DRIVE_FOLDER_ID || "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5"
          }
        ];
      }

      // Pastikan event aktif saat ini selalu ada dalam daftar options
      if (state.currentEventId && !state.events.some(function(e) { return e && e.id === state.currentEventId; })) {
        const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
        const curPath = window.location.pathname || "/";
        state.events.push({
          id: state.currentEventId,
          name: state.activeConfig.EVENT_NAME || state.currentEventId,
          date: state.activeConfig.EVENT_DATE || "",
          venue: state.activeConfig.EVENT_VENUE || "",
          homeUrl: curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId),
          driveFolderId: state.activeConfig.DRIVE_FOLDER_ID || "",
          photoboothUrl: state.activeConfig.PHOTOBOOTH_URL || "",
          customCategories: state.customCategories || []
        });
      }

      select.innerHTML = "";
      state.events.forEach(function(ev) {
        if (!ev || !ev.id) return;
        const opt = document.createElement("option");
        opt.value = ev.id;
        opt.innerText = (ev.name || ev.id) + (ev.date ? (" (" + ev.date + ")") : "");
        if (ev.id === state.currentEventId) opt.selected = true;
        select.appendChild(opt);
      });

      if (state.currentEventId) {
        select.value = state.currentEventId;
      }

      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const fullHomeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);

      const previewEl = document.getElementById("activeEventUrlPreview");
      if (previewEl) previewEl.innerText = fullHomeUrl;

      const inputEl = document.getElementById("activeEventUrlInput");
      if (inputEl) inputEl.value = fullHomeUrl;
    }

    function handleSelectEventChange(selectedId) {
      if (!selectedId) return;
      state.currentEventId = selectedId;
      const select = document.getElementById("adminEventSelect");
      if (select) select.value = selectedId;

      let ev = (state.events || []).find(function(e) { return e && e.id === selectedId; });
      if (!ev) {
        try {
          const cachedStr = localStorage.getItem("WEDDING_EVENT_CFG_" + selectedId);
          if (cachedStr) ev = JSON.parse(cachedStr);
        } catch(e) {}
      }

      if (ev) {
        const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
        const curPath = window.location.pathname || "/";
        const fullHomeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(selectedId);

        state.activeConfig = Object.assign({}, state.activeConfig, {
          ACTIVE_EVENT_ID: selectedId,
          EVENT_NAME: ev.name || "",
          COUPLE_NAME: ev.name || "",
          EVENT_DATE: ev.date || "",
          EVENT_VENUE: ev.venue || "",
          SUBTITLE: ev.subtitle || "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: ev.welcomeMessage || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          FOOTER_MESSAGE: ev.footerMessage || "Diabadikan dengan cinta\\nTerima kasih atas doa restunya.",
          ALL_PHOTOS_LABEL: ev.allPhotosLabel || "Semua Foto",
          DRIVE_FOLDER_ID: ev.driveFolderId || "",
          PHOTOBOOTH_URL: ev.photoboothUrl || "",
          FRAME_IMAGE_URL: ev.frameImageUrl || "",
          HOME_URL: fullHomeUrl,
          CUSTOM_CATEGORIES: Array.isArray(ev.customCategories) ? ev.customCategories : []
        });

        state.customCategories = Array.isArray(ev.customCategories) ? ev.customCategories : [];
        state.allPhotosLabel = ev.allPhotosLabel || "Semua Foto";

        // Bersihkan state foto dan segera muat cache khusus event ini (Anti-Bercampur)
        state.allPhotos = [];
        state.filteredPhotos = [];
        state.categoryPhotosMap = {};
        state.categoryPhotosUrlMap = {};

        try {
          const cachedPhotosStr = localStorage.getItem("WEDDING_EVENT_PHOTOS_" + selectedId);
          if (cachedPhotosStr) {
            const cachedPhotos = JSON.parse(cachedPhotosStr);
            if (Array.isArray(cachedPhotos) && cachedPhotos.length > 0) {
              state.allPhotos = cachedPhotos;
              state.filteredPhotos = cachedPhotos;
              renderPhotoGrid();
            }
          }
        } catch(ePh) {}

        // Perbarui input form admin seketika
        populateAdminInputsForActiveEvent(state.activeConfig);
        populateConfigToUI(state.activeConfig);
        renderCategoryTabs();
        renderAdminCategoriesManager();

        // Ganti parameter URL secara dinamis tanpa reload halaman: ?event=selectedId
        try {
          window.history.replaceState({ eventId: selectedId }, "", fullHomeUrl);
        } catch (e) {}

        const previewEl = document.getElementById("activeEventUrlPreview");
        if (previewEl) previewEl.innerText = fullHomeUrl;

        const inputEl = document.getElementById("activeEventUrlInput");
        if (inputEl) inputEl.value = fullHomeUrl;

        try {
          localStorage.setItem("WEDDING_ACTIVE_EVENT_ID", selectedId);
          localStorage.setItem("WEDDING_EVENT_CFG_" + selectedId, JSON.stringify(state.activeConfig));
          localStorage.setItem("WEDDING_ACTIVE_EVENT_CFG", JSON.stringify(state.activeConfig));
        } catch(e) {}

        // Ambil data foto murni untuk event yang dipilih
        fetchGalleryData(true, false);
        showToast("✓ Berpindah ke event: " + (ev.name || selectedId));
      }
    }`;

if (!content.includes(targetAdminFuncs)) {
  console.error("Target admin funcs not found!");
  process.exit(1);
}
content = content.replace(targetAdminFuncs, replaceAdminFuncs);

fs.writeFileSync('js/app.js', content, 'utf8');
console.log("Successfully patched js/app.js for multi-event isolation!");

