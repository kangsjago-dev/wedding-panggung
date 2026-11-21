/* ==========================================================================
   WEDDING PANGGUNG - MAIN CONTROLLER & BOOTLOADER (js/app.js)
   High-Speed Parallel Bootstrap, GViz Realtime Sync & Live Auto-Refresh
   ========================================================================== */

// callBackend didefinisikan secara terpusat di js/core.js dan siap diakses secara global

function fetchGalleryData(forceRefresh, isSilent) {
  if (!getActiveEventIdFromUrl()) {
    state.isAutoRefreshing = false;
    showEventNotFoundScreen(true);
    return;
  }
  const photosGrid = document.getElementById("photosGrid");
  state.isAutoRefreshing = true;

  let watchdogTimer = null;
  if (!isSilent) {
    watchdogTimer = setTimeout(function() {
      state.isAutoRefreshing = false;
      const refreshIconWd = document.getElementById("refreshIconSvg");
      if (refreshIconWd) refreshIconWd.classList.remove("spin");
      const remainingSkeletons = photosGrid ? photosGrid.querySelectorAll(".skeleton-card") : [];
      if (remainingSkeletons.length > 0 && (!state.filteredPhotos || state.filteredPhotos.length === 0)) {
        renderPhotoGrid();
      }
    }, 3500);
  }

  function clearWatchdog() {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  }

  if (!isSilent && (forceRefresh || state.allPhotos.length === 0)) {
    if (photosGrid) {
      photosGrid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      `;
    }
  }

  const refreshIcon = document.getElementById("refreshIconSvg");
  if (forceRefresh && refreshIcon) refreshIcon.classList.add("spin");

  const activeFolder = state.activeConfig.DRIVE_FOLDER_ID ? (extractDriveFolderId(state.activeConfig.DRIVE_FOLDER_ID) || state.activeConfig.DRIVE_FOLDER_ID) : "";

  // Prioritas 1: Ambil foto langsung dari Google Drive Folder spesifik event ini via /api/drive-folder
  if (activeFolder) {
    const dfController = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    let dfTimeoutId = null;
    if (dfController) {
      dfTimeoutId = setTimeout(function() {
        try { dfController.abort(); } catch(e) {}
      }, 4000);
    }
    const dfOpts = dfController ? { signal: dfController.signal } : {};

    fetch("/api/drive-folder?folderId=" + encodeURIComponent(activeFolder) + "&category=" + encodeURIComponent(state.allPhotosLabel || "Semua Foto"), dfOpts)
      .then(function(res) {
        if (dfTimeoutId) clearTimeout(dfTimeoutId);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function(data) {
        if (dfTimeoutId) clearTimeout(dfTimeoutId);
        if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
          clearWatchdog();
          state.isAutoRefreshing = false;
          if (refreshIcon) refreshIcon.classList.remove("spin");
          handleGalleryResponse({
            success: true,
            isDemo: false,
            activeEventId: state.currentEventId,
            config: state.activeConfig,
            photos: data.photos,
            categories: [state.allPhotosLabel || "Semua Foto"]
          }, isSilent);
          if (forceRefresh && data.photos.length > 0) showToast("✓ Galeri foto berhasil diperbarui (" + data.photos.length + " foto)!");
        } else {
          throw new Error("Empty drive-folder response");
        }
      })
      .catch(function() {
        if (dfTimeoutId) clearTimeout(dfTimeoutId);
        callBackend("getGalleryData", { eventId: state.currentEventId, folderId: activeFolder }, function(response) {
          clearWatchdog();
          state.isAutoRefreshing = false;
          if (refreshIcon) refreshIcon.classList.remove("spin");
          handleGalleryResponse(response, isSilent);
          if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
        }, function(err) {
          clearWatchdog();
          state.isAutoRefreshing = false;
          if (refreshIcon) refreshIcon.classList.remove("spin");
          console.error("Gagal memuat galeri:", err);
          if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + (err.message || err));
        });
      });
  } else {
    callBackend("getGalleryData", { eventId: state.currentEventId }, function(response) {
      clearWatchdog();
      state.isAutoRefreshing = false;
      if (refreshIcon) refreshIcon.classList.remove("spin");
      handleGalleryResponse(response, isSilent);
      if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
    }, function(err) {
      clearWatchdog();
      state.isAutoRefreshing = false;
      if (refreshIcon) refreshIcon.classList.remove("spin");
      console.error("Gagal memuat galeri:", err);
      if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + (err.message || err));
    });
  }
}

function handleGalleryResponse(response, isSilent) {
  if (!response) return;

  const demoNotice = document.getElementById("demoNotice");
  if (demoNotice) demoNotice.style.display = "none";

  if (response.events && Array.isArray(response.events)) {
    const evMap = new Map();
    (state.events || []).forEach(function(e) { if (e && e.id) evMap.set(e.id, e); });
    response.events.forEach(function(e) {
      if (e && e.id) {
        const prev = evMap.get(e.id) || {};
        evMap.set(e.id, Object.assign({}, prev, e));
      }
    });
    state.events = Array.from(evMap.values());
  }

  if (response.config) {
    state.activeConfig = Object.assign({}, state.activeConfig, response.config);
  }

  if (Array.isArray(response.photos)) {
    const sortedPhotos = sortPhotosNewestFirst(response.photos);
    state.allPhotos = sortedPhotos;
    try {
      localStorage.setItem("WEDDING_EVENT_PHOTOS_" + state.currentEventId, JSON.stringify(sortedPhotos));
      localStorage.setItem("WEDDING_EVENT_PHOTOS_COUNT_" + state.currentEventId, String(sortedPhotos.length));
    } catch(e) {}
  }

  const mainLabel = state.allPhotosLabel || "Semua Foto";
  if (!state.activeCategory || state.activeCategory === "Semua Foto" || state.activeCategory === mainLabel) {
    state.filteredPhotos = state.allPhotos;
    renderPhotoGrid();
  }
}

function loadFallbackData(reason) {
  const demoNotice = document.getElementById("demoNotice");
  if (demoNotice) demoNotice.style.display = "none";
  const liveEventName = state.activeConfig.EVENT_NAME || GLOBAL_CONFIG.EVENT_NAME;
  const liveEventDate = state.activeConfig.EVENT_DATE || GLOBAL_CONFIG.EVENT_DATE;
  const liveEventVenue = state.activeConfig.EVENT_VENUE || GLOBAL_CONFIG.EVENT_VENUE;

  handleGalleryResponse({
    isDemo: false,
    config: {
      EVENT_NAME: liveEventName,
      COUPLE_NAME: liveEventName,
      EVENT_DATE: liveEventDate,
      EVENT_VENUE: liveEventVenue,
      SUBTITLE: state.activeConfig.SUBTITLE || GLOBAL_CONFIG.SUBTITLE || "",
      WELCOME_MESSAGE: state.activeConfig.WELCOME_MESSAGE || GLOBAL_CONFIG.WELCOME_MESSAGE || "",
      DRIVE_FOLDER_ID: state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "",
      SLIDESHOW_INTERVAL_SEC: parseInt(state.activeConfig.SLIDESHOW_INTERVAL_SEC, 10) || 4,
      FRAME_IMAGE_URL: state.activeConfig.FRAME_IMAGE_URL || GLOBAL_CONFIG.FRAME_IMAGE_URL || "",
      SPREADSHEET_ID: state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "",
      SPREADSHEET_URL: state.activeConfig.SPREADSHEET_URL || GLOBAL_CONFIG.SPREADSHEET_URL || ""
    },
    categories: [state.allPhotosLabel || "Semua Foto"],
    photos: []
  }, false);
}

function startLiveAutoRefresh() {
  if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);
  state.autoRefreshTimer = setInterval(function() {
    syncFromSpreadsheetGViz(function() {
      if (!state.isAutoRefreshing) {
        fetchGalleryData(false, true);
      }
    });
  }, state.autoRefreshIntervalMs);
}

// HIGH-SPEED PARALLEL GVIZ DATABASE ENGINE (REALTIME DATABASE DRIVEN)
function syncFromSpreadsheetGViz(callback) {
  const sid = state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  if (!sid) { if (callback) callback(); return; }

  const ts = Date.now();
  const urlDaftarAcara = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Daftar_Acara&t=" + ts;
  const urlPengaturan = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + ts;

  Promise.all([
    fetch(urlDaftarAcara).then(r => r.text()).catch(() => ""),
    fetch(urlPengaturan).then(r => r.text()).catch(() => "")
  ]).then(function([tAcara, tPengaturan]) {
    // 1. Parse Pengaturan (Global PIN & Admin Accounts)
    if (tPengaturan) {
      try {
        const rawP = tPengaturan.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
        const parsedP = JSON.parse(rawP);
        if (parsedP && parsedP.table && parsedP.table.rows) {
          const sheetMap = {};
          parsedP.table.rows.forEach(function(row) {
            const k = row.c && row.c[0] ? String(row.c[0].v || '').trim() : '';
            const v = row.c && row.c[1] ? String(row.c[1].v || '').trim() : '';
            if (k) sheetMap[k] = v;
          });
          if (sheetMap.ADMIN_USERNAME) {
            state.activeConfig.ADMIN_USERNAME = sheetMap.ADMIN_USERNAME;
            state.adminUsername = sheetMap.ADMIN_USERNAME;
          }
          if (sheetMap.ADMIN_PIN) {
            state.activeConfig.ADMIN_PIN = sheetMap.ADMIN_PIN;
            if (!state.isAdminLoggedIn && !state.adminPin) {
              state.adminPin = sheetMap.ADMIN_PIN;
            }
          }
          if (sheetMap.WELCOME_MESSAGE) {
            state.activeConfig.WELCOME_MESSAGE = sheetMap.WELCOME_MESSAGE;
          }
          if (sheetMap.SUBTITLE) {
            state.activeConfig.SUBTITLE = sheetMap.SUBTITLE;
          }
          if (sheetMap.FOOTER_MESSAGE) {
            state.activeConfig.FOOTER_MESSAGE = sheetMap.FOOTER_MESSAGE;
          }
          if (sheetMap.FRAME_IMAGE_URL) {
            state.activeConfig.FRAME_IMAGE_URL = sheetMap.FRAME_IMAGE_URL;
          }
          if (sheetMap.ALL_PHOTOS_LABEL) {
            state.activeConfig.ALL_PHOTOS_LABEL = sheetMap.ALL_PHOTOS_LABEL;
            state.allPhotosLabel = sheetMap.ALL_PHOTOS_LABEL;
          }

          // Simpan sheetMap untuk pengayaan multi-event di langkah berikutnya
          state._sheetSettingsMap = sheetMap;
        }
      } catch (eP) {}
    }

    // 2. Parse Daftar_Acara (Master ERP Database - 100% Realtime Single Source of Truth)
    if (tAcara) {
      try {
        const rawA = tAcara.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
        const parsedA = JSON.parse(rawA);
        if (parsedA && parsedA.table && parsedA.table.rows && parsedA.table.rows.length > 0) {
          const colHeaders = (parsedA.table.cols || []).map(c => c && c.label ? String(c.label).trim() : '');
          const firstRowCells = (parsedA.table.rows[0] && parsedA.table.rows[0].c) || [];
          const firstRowVals = firstRowCells.map(c => c && c.v !== undefined && c.v !== null ? String(c.v).trim() : '');
          const row0IsHeader = firstRowVals.includes("ID_Event") || firstRowVals.includes("Nama_Acara");
          const hRow = colHeaders.includes("ID_Event") ? colHeaders : (row0IsHeader ? firstRowVals : []);

          const idIdx = hRow.indexOf("ID_Event") >= 0 ? hRow.indexOf("ID_Event") : 0;
          const nameIdx = hRow.indexOf("Nama_Acara") >= 0 ? hRow.indexOf("Nama_Acara") : 1;
          const dateIdx = hRow.indexOf("Tanggal_Acara") >= 0 ? hRow.indexOf("Tanggal_Acara") : 2;
          const venueIdx = hRow.indexOf("Venue_Lokasi") >= 0 ? hRow.indexOf("Venue_Lokasi") : 3;
          const urlIdx = hRow.indexOf("Tautan_Home_Event") >= 0 ? hRow.indexOf("Tautan_Home_Event") : 4;
          const driveIdx = hRow.indexOf("Google_Drive_Folder_ID") >= 0 ? hRow.indexOf("Google_Drive_Folder_ID") : 5;
          const pbIdx = hRow.indexOf("Photobooth_Vendor_URL") >= 0 ? hRow.indexOf("Photobooth_Vendor_URL") : 6;
          const catIdx = hRow.indexOf("Kategori_JSON") >= 0 ? hRow.indexOf("Kategori_JSON") : 7;
          const frameIdx = hRow.indexOf("Bingkai_URL") >= 0 ? hRow.indexOf("Bingkai_URL") : 8;
          const logoIdx = hRow.indexOf("Logo_Acara") >= 0 ? hRow.indexOf("Logo_Acara") : 9;
          const statusIdx = hRow.indexOf("Status") >= 0 ? hRow.indexOf("Status") : 10;

          const sheetMap = state._sheetSettingsMap || {};
          let sheetEventsMap = {};
          if (sheetMap.EVENTS) {
            try {
              const parsedEvs = typeof sheetMap.EVENTS === "string" ? JSON.parse(sheetMap.EVENTS) : sheetMap.EVENTS;
              if (Array.isArray(parsedEvs)) {
                parsedEvs.forEach(ev => { if (ev && ev.id) sheetEventsMap[ev.id] = ev; });
              }
            } catch(eEv) {}
          }

          const sheetEvs = [];
          const startRow = row0IsHeader ? 1 : 0;
          for (let r = startRow; r < parsedA.table.rows.length; r++) {
            const rowCells = parsedA.table.rows[r].c || [];
            const evId = rowCells[idIdx] ? String(rowCells[idIdx].v || '').trim() : '';
            if (!evId || String(evId).startsWith("EVT-")) continue;

            const extraEv = sheetEventsMap[evId] || {};

            let parsedCats = [];
            if (rowCells[catIdx] && rowCells[catIdx].v) {
              try {
                parsedCats = typeof rowCells[catIdx].v === 'string' ? JSON.parse(rowCells[catIdx].v) : rowCells[catIdx].v;
              } catch(e) { parsedCats = []; }
            }
            if ((!parsedCats || parsedCats.length === 0) && Array.isArray(extraEv.customCategories) && extraEv.customCategories.length > 0) {
              parsedCats = extraEv.customCategories;
            }

            const cleanDate = rowCells[dateIdx] ? normalizeSheetDate(rowCells[dateIdx]) : (extraEv.date || '');
            const cleanLogo = rowCells[logoIdx] ? String(rowCells[logoIdx].v || '').trim() : (extraEv.logoUrl || extraEv.EVENT_LOGO_URL || '');
            const cleanFrame = rowCells[frameIdx] ? String(rowCells[frameIdx].v || '').trim() : (extraEv.frameImageUrl || sheetMap.FRAME_IMAGE_URL || '');

            sheetEvs.push({
              id: evId,
              name: rowCells[nameIdx] ? String(rowCells[nameIdx].v || '').trim() : (extraEv.name || evId),
              date: cleanDate,
              venue: rowCells[venueIdx] ? String(rowCells[venueIdx].v || '').trim() : (extraEv.venue || ''),
              homeUrl: rowCells[urlIdx] ? String(rowCells[urlIdx].v || '').trim() : (extraEv.homeUrl || ''),
              driveFolderId: rowCells[driveIdx] ? String(rowCells[driveIdx].v || '').trim() : (extraEv.driveFolderId || ''),
              photoboothUrl: rowCells[pbIdx] ? String(rowCells[pbIdx].v || '').trim() : (extraEv.photoboothUrl || ''),
              customCategories: Array.isArray(parsedCats) ? parsedCats : [],
              frameImageUrl: cleanFrame,
              logoUrl: cleanLogo,
              EVENT_LOGO_URL: cleanLogo,
              subtitle: extraEv.subtitle || sheetMap.SUBTITLE || "The Wedding Gallery & Precious Memories",
              welcomeMessage: extraEv.welcomeMessage || sheetMap.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
              footerMessage: extraEv.footerMessage || sheetMap.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
              allPhotosLabel: extraEv.allPhotosLabel || sheetMap.ALL_PHOTOS_LABEL || "Semua Foto",
              status: rowCells[statusIdx] ? String(rowCells[statusIdx].v || 'Aktif').trim() : (extraEv.status || 'Aktif')
            });
          }

          if (sheetEvs.length > 0) {
            state.events = sheetEvs;
            try {
              localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(sheetEvs));
              const validIds = new Set(sheetEvs.map(ev => ev.id));
              for (let lk = localStorage.length - 1; lk >= 0; lk--) {
                const keyName = localStorage.key(lk);
                if (keyName && keyName.startsWith("WEDDING_EVENT_CFG_")) {
                  const eId = keyName.replace("WEDDING_EVENT_CFG_", "");
                  if (!validIds.has(eId) || String(eId).startsWith("EVT-")) {
                    localStorage.removeItem(keyName);
                  }
                }
              }
            } catch(eStorage) {}
            if (typeof renderAdminEventsManager === "function") {
              renderAdminEventsManager();
            }
          }
        }
      } catch(eA) {}
    }

    // 3. Update data acara aktif murni dari Daftar_Acara (Multi-Device Synchronized)
    const curEventId = getActiveEventIdFromUrl() || state.currentEventId;
    if (curEventId) {
      const matchedEv = (state.events || []).find(e => e && e.id === curEventId);
      const sheetMap = state._sheetSettingsMap || {};
      if (matchedEv) {
        showEventNotFoundScreen(false);
        state.currentEventId = matchedEv.id;
        state.activeConfig.ACTIVE_EVENT_ID = matchedEv.id;
        state.activeConfig.EVENT_NAME = matchedEv.name || "";
        state.activeConfig.COUPLE_NAME = matchedEv.name || "";
        state.activeConfig.EVENT_DATE = matchedEv.date || "";
        state.activeConfig.EVENT_VENUE = matchedEv.venue || "";
        state.activeConfig.EVENT_LOGO_URL = matchedEv.logoUrl || "";
        state.activeConfig.logoUrl = matchedEv.logoUrl || "";
        state.activeConfig.DRIVE_FOLDER_ID = matchedEv.driveFolderId || "";
        state.activeConfig.PHOTOBOOTH_URL = matchedEv.photoboothUrl || "";
        state.activeConfig.FRAME_IMAGE_URL = matchedEv.frameImageUrl || sheetMap.FRAME_IMAGE_URL || "";
        state.activeConfig.HOME_URL = matchedEv.homeUrl || (window.location.origin + window.location.pathname + "?event=" + encodeURIComponent(matchedEv.id));

        state.activeConfig.SUBTITLE = matchedEv.subtitle || sheetMap.SUBTITLE || state.activeConfig.SUBTITLE || "The Wedding Gallery & Precious Memories";
        state.activeConfig.WELCOME_MESSAGE = matchedEv.welcomeMessage || sheetMap.WELCOME_MESSAGE || state.activeConfig.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.";
        state.activeConfig.FOOTER_MESSAGE = matchedEv.footerMessage || sheetMap.FOOTER_MESSAGE || state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";

        if (Array.isArray(matchedEv.customCategories) && matchedEv.customCategories.length > 0) {
          state.activeConfig.CUSTOM_CATEGORIES = matchedEv.customCategories;
          state.customCategories = matchedEv.customCategories;
        }

        const effectiveAllLabel = matchedEv.allPhotosLabel || sheetMap.ALL_PHOTOS_LABEL || state.allPhotosLabel || "Semua Foto";
        state.activeConfig.ALL_PHOTOS_LABEL = effectiveAllLabel;
        state.allPhotosLabel = effectiveAllLabel;

        populateConfigToUI(state.activeConfig);
        if (typeof renderCategoryTabs === "function") renderCategoryTabs();
        if (state.activeCategory && state.activeCategory.toLowerCase().indexOf("photobooth") !== -1) {
          if (typeof applyCategoryFilter === "function") {
            applyCategoryFilter(state.activeCategory, matchedEv.photoboothUrl, true);
          }
        }
      }
    }
  }).catch(function(err) {
    console.warn("GViz parallel sync error:", err);
  }).finally(function() {
    if (callback) callback();
  });
}

document.addEventListener("DOMContentLoaded", function() {
  setupTouchSwipe();

  // Bersihkan cache kategori non-isolated lama agar tidak bocor antar event (Anti-Stuck)
  try {
    localStorage.removeItem("WEDDING_CAT_COUNT_Photobooth");
  } catch(e) {}
  state.categoryPhotosMap = {};
  state.categoryPhotosUrlMap = {};
  state.driveSubfolders = [];
  setupKeyboardNav();

  // 1. Muat URL API backend yang tersimpan
  const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;
  if (savedApiUrl) {
    state.gasApiUrl = savedApiUrl;
    const apiUrlInput = document.getElementById("cfgGasApiUrl");
    if (apiUrlInput) apiUrlInput.value = savedApiUrl;
  }

  // 2. Deteksi Parameter URL Event
  let urlEventId = getActiveEventIdFromUrl();
  if (!urlEventId) {
    state.currentEventId = "";
    showEventNotFoundScreen(true);
    return;
  }

  state.currentEventId = urlEventId;
  showEventNotFoundScreen(false);

  // Rapikan URL di address bar browser
  try {
    const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const curPath = window.location.pathname || "/";
    const fullTargetUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
    window.history.replaceState({ eventId: state.currentEventId }, "", fullTargetUrl);
  } catch(e) {}

  // Muat konfigurasi cache khusus untuk event yang sedang aktif
  try {
    const cacheKey = "WEDDING_EVENT_CFG_" + state.currentEventId;
    let savedCfgStr = localStorage.getItem(cacheKey);
    if (savedCfgStr) {
      const savedCfg = JSON.parse(savedCfgStr);
      state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
      populateConfigToUI(state.activeConfig);
    }
  } catch (e) {}

  // Muat cache foto terisolasi untuk event ini
  try {
    const photoCacheKey = "WEDDING_EVENT_PHOTOS_" + state.currentEventId;
    const savedPhotosStr = localStorage.getItem(photoCacheKey);
    if (savedPhotosStr) {
      const savedPhotos = JSON.parse(savedPhotosStr);
      if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
        state.allPhotos = sortPhotosNewestFirst(savedPhotos);
        state.filteredPhotos = state.allPhotos;
        renderPhotoGrid();
      } else {
        state.allPhotos = [];
        state.filteredPhotos = [];
        renderPhotoGrid();
      }
    } else {
      state.allPhotos = [];
      state.filteredPhotos = [];
      renderPhotoGrid();
    }
  } catch(e) {}

  // 3. HIGH SPEED PARALLEL BOOTSTRAP (Zero Lag & Anti-Stuck)
  Promise.allSettled([
    fetch("config.json?v=" + Date.now()).then(r => r.json()).catch(() => null),
    new Promise(resolve => syncFromSpreadsheetGViz(resolve))
  ]).then(function([configRes]) {
    if (configRes && configRes.status === "fulfilled" && configRes.value) {
      const remoteCfg = configRes.value;
      if (remoteCfg.GAS_API_URL && !state.gasApiUrl) {
        state.gasApiUrl = remoteCfg.GAS_API_URL;
      }
      if (remoteCfg.ADMIN_ACCOUNTS) {
        state.adminAccounts = remoteCfg.ADMIN_ACCOUNTS;
      }
    }

    // 4. Ambil data galeri foto live
    fetchGalleryData(false, false);
    startLiveAutoRefresh();
    startBadgeExpiryChecker();
  });
});

// Explicit Global Window Bindings untuk Modul App Bootloader
if (typeof window !== "undefined") {
  window.fetchGalleryData = fetchGalleryData;
  window.syncFromSpreadsheetGViz = syncFromSpreadsheetGViz;
  window.startLiveAutoRefresh = startLiveAutoRefresh;
  window.showEventNotFoundScreen = showEventNotFoundScreen;
}
