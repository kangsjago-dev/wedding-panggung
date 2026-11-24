/* ==========================================================================
   WEDDING PANGGUNG - CORE MODULE (js/core.js)
   State Management, Utilities, Date Formatter, Drive Helper & UI Helpers
   ========================================================================== */

// Realtime Database Engine: Seluruh data diserap langsung dari Google Spreadsheet & Backend API
const GLOBAL_CONFIG = {
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec",
  EVENT_NAME: "",
  EVENT_DATE: "",
  EVENT_VENUE: "",
  SUBTITLE: "",
  WELCOME_MESSAGE: "",
  FOOTER_MESSAGE: "",
  ALL_PHOTOS_LABEL: "Semua Foto",
  ACTIVE_EVENT_ID: "",
  EVENTS: [],
  ADMIN_ACCOUNTS: [],
  CUSTOM_CATEGORIES: [],
  DRIVE_FOLDER_ID: "",
  FRAME_IMAGE_URL: "",
  EVENT_LOGO_URL: "",
  SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
  SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit",
  DEFAULT_ADMIN_PIN: "",
  NEW_BADGE_MINUTES: 10,
  COVER_SETTINGS: {
    enabled: false,
    style: "romantic-collage",
    heading: "The Wedding Celebration",
    subheading: "A Journey of Two Hearts Joined as One",
    quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
    photos: []
  }
};

const state = {
  allPhotos: [],
  filteredPhotos: [],
  categories: ["Semua Foto"],
  allPhotosLabel: "Semua Foto",
  currentEventId: "",
  events: [],
  coverSettings: {
    enabled: false,
    style: "romantic-collage",
    heading: "The Wedding Celebration",
    subheading: "A Journey of Two Hearts Joined as One",
    quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
    photos: []
  },
  customCategories: [],
  adminAccounts: [],
  failedPhotoIds: new Set(),
  activeCategory: "Semua Foto",
  categoryPhotosMap: {},
  categoryPhotosUrlMap: {},
  currentLightboxIndex: 0,
  currentSlideIndex: 0,
  slideshowTimer: null,
  slideshowProgressTimer: null,
  isSlideshowPlaying: true,
  activeSlideTarget: 'A',
  intervalMs: 4000,
  
  isAdminLoggedIn: false,
  adminPin: "",
  currentAdminUser: null,
  activeConfig: Object.assign({}, GLOBAL_CONFIG),
  gasApiUrl: GLOBAL_CONFIG.GAS_API_URL || "",
  newBadgeDurationMs: (GLOBAL_CONFIG.NEW_BADGE_MINUTES || 10) * 60 * 1000,
  autoRefreshTimer: null,
  autoRefreshIntervalMs: 20000,
  isAutoRefreshing: false,
  photoRotations: {},
  driveSubfolders: []
};

// Global Exposure untuk Akses Lintas-Modul
if (typeof window !== "undefined") {
  window.GLOBAL_CONFIG = GLOBAL_CONFIG;
  window.state = state;
}

// Event-Isolated Category Cache Key Helpers (Anti-Bocor Antar-Event)
function getCategoryCacheKey(cat) {
  return (state.currentEventId || "default") + "::" + String(cat || "").trim();
}

function getCategoryCountKey(cat) {
  return "WEDDING_CAT_COUNT_" + (state.currentEventId || "default") + "_" + encodeURIComponent(String(cat || "").trim());
}

function isGooglePhotosUrl(url) {
      if (!url) return false;
      const s = String(url).toLowerCase().trim();
      return s.includes("photos.google.com") || s.includes("photos.app.goo.gl");
    }

    /* ==========================================================================
       MULTI-DEVICE SYNC & CATEGORY SYNC UTILITIES (v3.3.0)
       ========================================================================== */
    function handleAllPhotosLabelChange(newVal) {
      const val = String(newVal || "").trim() || "Semua Foto";
      state.allPhotosLabel = val;
      state.activeConfig.ALL_PHOTOS_LABEL = val;
      state.lastLocalCategoryEditTime = Date.now();
      const inp = document.getElementById("cfgMainGalleryLabel");
      if (inp && inp.value !== newVal) inp.value = newVal;
      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.allPhotosLabel = val;
      }
      try {
        localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", val);
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        localStorage.setItem(cacheKey, JSON.stringify(state.activeConfig));
        if (Array.isArray(state.events)) {
          localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
        }
      } catch (e) {}
      // Prefetch & update badge foto untuk setiap kategori yang disinkronkan
      (state.customCategories || []).forEach(function(cat) {
        const catName = String((cat && cat.name) || cat || "").trim();
        const catUrl = String((cat && cat.url) || "").trim();
        if (catName && catUrl) {
          prefetchCategoryPhotos(catName, catUrl);
        }
      });

      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);
    }

    /* ==========================================================================
       AUTO-ROTATE & ORIENTATION SYSTEM
       Instruksi: Kategori Momen Lainnya = JANGAN DI ROTATE (rotasi 0 derajat normal)
       ========================================================================== */
    function getPhotoRotation(photoId, categoryName) {
      // 1. Kategori Momen Lainnya (seperti Wedding, Akad, Resepsi, dsb): JANGAN DI-ROTATE (rotasi normal 0 derajat)
      let cat = categoryName || state.activeCategory || "";
      if (!cat && photoId) {
        const found = (state.filteredPhotos || []).find(function(x) { return x && x.id === photoId; }) ||
                      (state.allPhotos || []).find(function(x) { return x && x.id === photoId; });
        if (found && found.category) cat = found.category;
      }

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const isMain = (cat === mainLabel || cat === "Semua Foto");
      const isPb = cat.toLowerCase().includes("photobooth");

      if (cat && !isMain && !isPb) {
        return 0;
      }

      // 2. Cek langsung objek foto jika memiliki autoRotate eksplisit
      if (photoId && state.allPhotos) {
        const p = state.allPhotos.find(function(x) { return x && x.id === photoId; });
        if (p && p.autoRotate !== undefined && p.autoRotate !== 0) return parseInt(p.autoRotate, 10);
      }
      if (photoId && state.filteredPhotos) {
        const p = state.filteredPhotos.find(function(x) { return x && x.id === photoId; });
        if (p && p.autoRotate !== undefined && p.autoRotate !== 0) return parseInt(p.autoRotate, 10);
      }
      return 0;
    }

    function setPhotoRotation(photoId, deg, categoryName) {
      const rot = ((deg % 360) + 360) % 360;
      if (!state.photoRotations) state.photoRotations = {};
      state.photoRotations[photoId] = rot;
      try {
        localStorage.setItem("WEDDING_PHOTO_ROT_" + photoId, String(rot));
      } catch (e) {}

      const card = document.querySelector(`.photo-card[data-photo-id="${photoId}"]`);
      if (card) {
        const img = card.querySelector(".photo-img");
        if (img) {
          img.classList.remove("rotate-90", "rotate-180", "rotate-270");
          if (rot === 90) img.classList.add("rotate-90");
          else if (rot === 180) img.classList.add("rotate-180");
          else if (rot === 270) img.classList.add("rotate-270");
        }
      }
      return rot;
    }

    function rotateSinglePhoto(photoId) {
      const current = getPhotoRotation(photoId);
      const next = (current + 90) % 360;
      setPhotoRotation(photoId, next);
    }

    function toggleActiveCategoryRotation() {
      // No-op: tombol manual telah dihapus, rotasi otomatis oleh sistem
    }

    function getPhotoTimestamp(photo) {
      if (!photo) return 0;
      if (typeof photo.timestamp === 'number' && !isNaN(photo.timestamp) && photo.timestamp > 0) {
        return photo.timestamp;
      }
      if (photo.timestamp) {
        const t = new Date(photo.timestamp).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (photo.dateCreated || photo.created_at || photo.lastUpdated || photo.date_added || photo.date) {
        const d = new Date(photo.dateCreated || photo.created_at || photo.lastUpdated || photo.date_added || photo.date).getTime();
        if (!isNaN(d) && d > 0) return d;
      }
      const str = String(photo.rawName || photo.name || photo.id || "");
      const tsMatch = str.match(/(?:17|18|19)\d{10,11}/);
      if (tsMatch) {
        const parsedTs = parseInt(tsMatch[0], 10);
        if (parsedTs > 1000000000000 && parsedTs < 3000000000000) return parsedTs;
      }
      const dtMatch = str.match(/(\d{4})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})/);
      if (dtMatch) {
        const parsedDt = new Date(dtMatch[1] + "-" + dtMatch[2] + "-" + dtMatch[3] + "T" + dtMatch[4] + ":" + dtMatch[5] + ":" + dtMatch[6]).getTime();
        if (!isNaN(parsedDt) && parsedDt > 0) return parsedDt;
      }
      const numMatch = str.match(/#\s*(\d+)/);
      if (numMatch) {
        return parseInt(numMatch[1], 10);
      }
      return 0;
    }

    function sortPhotosNewestFirst(photos) {
      if (!Array.isArray(photos)) return [];
      return photos.slice().sort(function(a, b) {
        const tA = getPhotoTimestamp(a);
        const tB = getPhotoTimestamp(b);
        if (tB !== tA) {
          return tB - tA; // Paling baru di atas (descending)
        }
        const nameA = String(a.rawName || a.name || a.id || "");
        const nameB = String(b.rawName || b.name || b.id || "");
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    function rotateLightboxCurrentPhoto() {
      // No-op: tombol manual telah dihapus, rotasi otomatis oleh sistem
    }

    function getActiveEventIdFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        const ev = params.get("event") || params.get("e") || "";
        return String(ev).trim();
      } catch (e) {
        return "";
      }
    }

    function isPhotoNew(photo) {
      if (!photo) return false;
      if (photo.isNewlyAdded === true) return true;
      if (photo.isNewlyAdded === false) return false;
      // Untuk foto photobooth, lencana BARU murni dikontrol oleh deteksi delta (isNewlyAdded)
      const isPb = Boolean(photo.isPhotobooth || (photo.category && photo.category.toLowerCase().includes("photobooth")));
      if (isPb) return false;
      const ts = photo.timestamp || photo.detectedAt;
      if (!ts) return false;
      return (Date.now() - ts) < state.newBadgeDurationMs;
    }

    function startBadgeExpiryChecker() {
      setInterval(function() {
        const now = Date.now();
        const badges = document.querySelectorAll(".photo-badge-new");
        badges.forEach(function(badge) {
          const ts = parseInt(badge.getAttribute("data-timestamp"), 10);
          if (ts && (now - ts > state.newBadgeDurationMs)) {
            badge.classList.add("fade-out");
            setTimeout(function() {
              badge.remove();
            }, 800);
          }
        });
      }, 20000);
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    /* ==========================================================================
       EVENT NOT FOUND & LOGO UTILITIES
       ========================================================================== */
    function showEventNotFoundScreen(show, invalidId) {
      const nfScreen = document.getElementById("eventNotFoundScreen");
      const hero = document.getElementById("heroSection");
      const filterWrap = document.getElementById("gallerySection") || document.querySelector(".filter-wrapper");
      const galMain = document.querySelector(".gallery-container");
      const footer = document.querySelector(".footer");
      const floatBar = document.getElementById("adminActiveFloatingBar");

      if (show) {
        if (nfScreen) nfScreen.style.display = "flex";
        if (hero) hero.style.display = "none";
        if (filterWrap) filterWrap.style.display = "none";
        if (galMain) galMain.style.display = "none";
        if (footer) footer.style.display = "none";
        if (floatBar) floatBar.style.display = "none";

        const titleEl = document.getElementById("eventNotFoundTitle");
        const descEl = document.getElementById("eventNotFoundDesc");
        if (invalidId) {
          if (titleEl) titleEl.innerText = "Acara Tidak Ditemukan";
          if (descEl) descEl.innerHTML = "Kode acara <code>" + escapeHtml(invalidId) + "</code> tidak terdaftar.<br>Silakan periksa kembali tautan undangan pernikahan Anda.";
        } else {
          if (titleEl) titleEl.innerText = "Halaman Tidak Ditemukan";
          if (descEl) descEl.innerHTML = "Tautan galeri tidak menyertakan kode acara yang valid.<br>Silakan periksa kembali tautan undangan Anda.";
        }
      } else {
        if (nfScreen) nfScreen.style.display = "none";
        if (hero) hero.style.display = "";
        if (filterWrap) filterWrap.style.display = "";
        if (galMain) galMain.style.display = "";
        if (footer) footer.style.display = "";
      }
    }

    function updateAdminLogoPreview(url) {
      const pImg = document.getElementById("adminLogoPreviewImg");
      const pIcon = document.getElementById("adminLogoPreviewPlaceholder");
      if (!pImg || !pIcon) return;
      if (url && String(url).trim()) {
        const norm = normalizeDriveImageUrl(String(url).trim());
        pImg.src = norm;
        pImg.style.display = "block";
        pIcon.style.display = "none";
      } else {
        pImg.style.display = "none";
        pImg.removeAttribute("src");
        pIcon.style.display = "block";
      }
    }

    function handleEventLogoInput(val) {
      const clean = (val || "").trim();
      state.activeConfig.EVENT_LOGO_URL = clean;
      state.activeConfig.logoUrl = clean;
      updateAdminLogoPreview(clean);

      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.logoUrl = clean;
        curEv.EVENT_LOGO_URL = clean;
      }

      const logoContainer = document.getElementById("heroLogoContainer");
      const logoImg = document.getElementById("heroLogoImg");
      if (logoContainer && logoImg) {
        if (clean) {
          logoImg.src = normalizeDriveImageUrl(clean);
          logoContainer.style.display = "flex";
        } else {
          logoContainer.style.display = "none";
          logoImg.removeAttribute("src");
        }
      }
    }


    /* ==========================================================================
       DATE FORMATTING UTILITIES (INDONESIAN & DATE PICKER)
       ========================================================================== */
    const INDONESIAN_DAYS = [
      "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
    ];
    const INDONESIAN_MONTHS = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const INDONESIAN_MONTH_MAP = {
      "januari": 0, "january": 0, "jan": 0,
      "februari": 1, "february": 1, "feb": 1,
      "maret": 2, "march": 2, "mar": 2,
      "april": 3, "apr": 3,
      "mei": 4, "may": 4,
      "juni": 5, "june": 5, "jun": 5,
      "juli": 6, "july": 6, "jul": 6,
      "agustus": 7, "august": 7, "agu": 7, "aug": 7,
      "september": 8, "sep": 8,
      "oktober": 9, "october": 9, "okt": 9, "oct": 9,
      "november": 10, "nov": 10,
      "desember": 11, "december": 11, "des": 11, "dec": 11
    };

    function formatIndonesianDateWithDay(dateStr) {
      if (!dateStr) return "";
      let s = String(dateStr).trim();

      // Format Google Visualization API Date: Date(YYYY,M,D) misal: Date(2026,10,16)
      const gvizMatch = s.match(/^Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+)?(?:,\s*\d+)?(?:,\s*\d+)?\)$/i);
      if (gvizMatch) {
        const y = parseInt(gvizMatch[1], 10);
        const m = parseInt(gvizMatch[2], 10); // 0-based in GViz (10 = November)
        const d = parseInt(gvizMatch[3], 10);
        const dateObj = new Date(y, m, d);
        const dayName = INDONESIAN_DAYS[dateObj.getDay()];
        const monthName = INDONESIAN_MONTHS[m] || "";
        return dayName + ", " + d + " " + monthName + " " + y;
      }

      // Jika sudah memiliki nama hari di depannya (misal: "Minggu, 22 November 2026"), lepaskan dulu untuk evaluasi konsisten
      for (let i = 0; i < INDONESIAN_DAYS.length; i++) {
        const dayName = INDONESIAN_DAYS[i];
        if (new RegExp("^" + dayName + "[,\\s]+", "i").test(s)) {
          s = s.replace(new RegExp("^" + dayName + "[,\\s]+", "i"), "").trim();
          break;
        }
      }

      // Format YYYY-MM-DD
      const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) {
        const y = parseInt(ymdMatch[1], 10);
        const m = parseInt(ymdMatch[2], 10) - 1;
        const d = parseInt(ymdMatch[3], 10);
        const dateObj = new Date(y, m, d);
        const dayName = INDONESIAN_DAYS[dateObj.getDay()];
        const monthName = INDONESIAN_MONTHS[m] || ymdMatch[2];
        return dayName + ", " + d + " " + monthName + " " + y;
      }

      // Format DD Bulan YYYY (misal: "22 November 2026")
      const dmyMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        const mStr = dmyMatch[2].toLowerCase();
        const m = INDONESIAN_MONTH_MAP[mStr] !== undefined ? INDONESIAN_MONTH_MAP[mStr] : -1;
        const y = parseInt(dmyMatch[3], 10);
        if (m >= 0) {
          const dateObj = new Date(y, m, d);
          const dayName = INDONESIAN_DAYS[dateObj.getDay()];
          return dayName + ", " + d + " " + INDONESIAN_MONTHS[m] + " " + y;
        }
      }

      // Fallback native Date parser
      const parsedDate = new Date(s);
      if (!isNaN(parsedDate.getTime())) {
        const dayName = INDONESIAN_DAYS[parsedDate.getDay()];
        const d = parsedDate.getDate();
        const m = INDONESIAN_MONTHS[parsedDate.getMonth()];
        const y = parsedDate.getFullYear();
        return dayName + ", " + d + " " + m + " " + y;
      }

      return s;
    }

    function formatIndonesianDate(dateStr) {
      return formatIndonesianDateWithDay(dateStr);
    }

    function normalizeSheetDate(cell) {
      if (!cell) return "";
      if (typeof cell === "object" && cell !== null) {
        if (cell.f) return formatIndonesianDateWithDay(cell.f);
        if (cell.v !== undefined && cell.v !== null) return formatIndonesianDateWithDay(cell.v);
      }
      return formatIndonesianDateWithDay(cell);
    }

    function formatDateForInput(dateStr) {
      if (!dateStr) return "";
      let str = String(dateStr).trim().replace(/^[a-zA-Z]+,?\s+/, "");
      const gvizMatch = str.match(/^Date\((\d+),\s*(\d+),\s*(\d+)/i);
      if (gvizMatch) {
        const yyyy = gvizMatch[1];
        const mm = String(parseInt(gvizMatch[2], 10) + 1).padStart(2, "0");
        const dd = String(gvizMatch[3]).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      const parts = str.split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const monthName = parts[1].toLowerCase();
        const year = parts[2];
        if (INDONESIAN_MONTH_MAP[monthName] !== undefined && /^\d{4}$/.test(year)) {
          const mm = String(INDONESIAN_MONTH_MAP[monthName] + 1).padStart(2, "0");
          return year + "-" + mm + "-" + day;
        }
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd;
      }
      return "2026-11-14";
    }

    function populateConfigToUI(cfg) {
      if (!cfg) return;
      const rawName = cfg.EVENT_NAME || cfg.COUPLE_NAME;
      const eventName = rawName ? String(rawName).trim() : "";
      const rawDate = cfg.EVENT_DATE ? String(cfg.EVENT_DATE).trim() : "";
      const displayDate = formatIndonesianDate(rawDate);
      const eventVenue = cfg.EVENT_VENUE ? String(cfg.EVENT_VENUE).trim() : "";

      // Mutasi DOM hanya jika teks benar-benar berubah (Cegah font re-rasterization & efek ghost / flicker)
      function setNodeTextIfChanged(idOrEl, newText) {
        const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
        if (!el || newText === undefined || newText === null) return;
        const str = String(newText);
        if (el.textContent !== str) {
          el.textContent = str;
        }
      }

      setNodeTextIfChanged("coupleName", eventName);
      setNodeTextIfChanged("slideshowCouple", eventName);
      const footerNamesEl = document.querySelector(".footer-names");
      if (footerNamesEl) setNodeTextIfChanged(footerNamesEl, eventName);
      const expectedTitle = eventName + " - Wedding Photo Gallery";
      if (document.title !== expectedTitle) {
        document.title = expectedTitle;
      }

      setNodeTextIfChanged("eventDate", displayDate);
      setNodeTextIfChanged("eventVenue", eventVenue);
      setNodeTextIfChanged("slideshowCategory", displayDate + " • " + eventVenue);

      // Render Logo Acara / Monogram (Google Drive / URL Gambar Langsung)
      const rawLogo = cfg.EVENT_LOGO_URL || cfg.LOGO_URL || cfg.logoUrl || "";
      const logoContainer = document.getElementById("heroLogoContainer");
      const logoImg = document.getElementById("heroLogoImg");
      if (logoContainer && logoImg) {
        if (rawLogo && String(rawLogo).trim()) {
          const normLogo = normalizeDriveImageUrl(String(rawLogo).trim());
          if (logoImg.src !== normLogo) {
            logoImg.src = normLogo;
          }
          logoContainer.style.display = "flex";
        } else {
          logoContainer.style.display = "none";
          logoImg.removeAttribute("src");
        }
      }

      const subtitleVal = cfg.SUBTITLE || "The Wedding Gallery & Precious Memories";
      setNodeTextIfChanged("subtitle", subtitleVal);

      const welcomeVal = cfg.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.";
      setNodeTextIfChanged("welcomeMessage", welcomeVal);

      const footerVal = cfg.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";
      setNodeTextIfChanged("footerBlessing", footerVal);
      // Input form admin & Kategori: HANYA perbarui jika modal admin SEDANG TIDAK DIBUKA (mencegah teks & kategori tertimpa saat admin mengetik/menambah)
      const adminModal = document.getElementById("adminSettingsModal");
      const isModalActive = adminModal && adminModal.classList.contains("active");
      const isEditingLocally = state.lastLocalCategoryEditTime && (Date.now() - state.lastLocalCategoryEditTime < 60000);

      // Prioritaskan Data Kategori Server / Config Sentral (Mencegah Ketidaksinkronan Antar-Device)
      if (!isModalActive && !isEditingLocally) {
        let loadedCats = null;
        if (cfg.CUSTOM_CATEGORIES) {
          if (typeof cfg.CUSTOM_CATEGORIES === "string") {
            if (!cfg.CUSTOM_CATEGORIES.includes("[object Object]")) {
              try { loadedCats = JSON.parse(cfg.CUSTOM_CATEGORIES); } catch(e) {}
            }
          } else if (Array.isArray(cfg.CUSTOM_CATEGORIES)) {
            loadedCats = cfg.CUSTOM_CATEGORIES;
          }
        }
        if (!Array.isArray(loadedCats) || loadedCats.length === 0) {
          try {
            const savedCatsStr = localStorage.getItem("WEDDING_SAVED_CUSTOM_CATEGORIES");
            if (savedCatsStr) loadedCats = JSON.parse(savedCatsStr);
          } catch(e) {}
          if (!Array.isArray(loadedCats) || loadedCats.length === 0) {
            loadedCats = GLOBAL_CONFIG.CUSTOM_CATEGORIES || [];
          }
        }
        if (Array.isArray(loadedCats)) {
          state.customCategories = loadedCats.filter(function(c) {
            const cName = String((c && c.name) || c || "").trim();
            return cName && cName.toLowerCase() !== "teapai";
          });
        }
        if (cfg.ALL_PHOTOS_LABEL) {
          state.allPhotosLabel = String(cfg.ALL_PHOTOS_LABEL).trim() || "Semua Foto";
        }
      }

      if (cfg.COVER_SETTINGS) {
        try {
          state.coverSettings = typeof cfg.COVER_SETTINGS === "string"
            ? JSON.parse(cfg.COVER_SETTINGS)
            : cfg.COVER_SETTINGS;
        } catch (eCov) {}
      }
      renderWeddingCoverShowcase();
      renderCategoryTabs();
      if (cfg.SLIDESHOW_INTERVAL_SEC) {
        state.intervalMs = cfg.SLIDESHOW_INTERVAL_SEC * 1000;
      }

      // Input form admin: HANYA perbarui jika modal admin SEDANG TIDAK DIBUKA (mencegah teks tertimpa saat admin mengetik)
      if (!isModalActive) {
        const cfgLogoEl = document.getElementById("cfgEventLogoUrl");
        const curLogo = cfg.EVENT_LOGO_URL || cfg.LOGO_URL || cfg.logoUrl || "";
        if (cfgLogoEl) cfgLogoEl.value = curLogo;
        updateAdminLogoPreview(curLogo);

        const cfgFrameEl = document.getElementById("cfgFrameImageUrl");
        if (cfgFrameEl) cfgFrameEl.value = cfg.FRAME_IMAGE_URL || "";
        const cfgCoupleEl = document.getElementById("cfgCoupleName");
        if (cfgCoupleEl) cfgCoupleEl.value = eventName;
        const cfgDateEl = document.getElementById("cfgEventDate");
        if (cfgDateEl) cfgDateEl.value = formatDateForInput(rawDate);
        const cfgVenueEl = document.getElementById("cfgEventVenue");
        if (cfgVenueEl) cfgVenueEl.value = eventVenue;
        const cfgDriveEl = document.getElementById("cfgDriveFolderId");
        if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";
        const cfgSubEl = document.getElementById("cfgSubtitle");
        if (cfgSubEl) cfgSubEl.value = cfg.SUBTITLE || "";
        const cfgWelcomeEl = document.getElementById("cfgWelcomeMessage");
        if (cfgWelcomeEl) cfgWelcomeEl.value = cfg.WELCOME_MESSAGE || "";
        const cfgFooterEl = document.getElementById("cfgFooterMessage");
        if (cfgFooterEl) cfgFooterEl.value = cfg.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";
        const cfgAllPhotosLabelEl = document.getElementById("cfgMainGalleryLabel") || document.getElementById("cfgAllPhotosLabel");
        if (cfgAllPhotosLabelEl) cfgAllPhotosLabelEl.value = state.allPhotosLabel || "Semua Foto";

        renderAdminCoverManager();
        renderAdminEventsManager();
      }

      updateFrameStatusBadge(cfg.FRAME_IMAGE_URL);
      if (cfg.FRAME_IMAGE_URL && typeof preloadFrameAssets === "function") {
        preloadFrameAssets(normalizeDriveImageUrl(cfg.FRAME_IMAGE_URL));
      }

      const apiBadge = document.getElementById("apiStatusBadge");
      if (apiBadge) {
        if (state.gasApiUrl) {
          apiBadge.innerText = "✓ Terhubung ke Apps Script";
          apiBadge.style.color = "#10B981";
        } else {
          apiBadge.innerText = "Mode Pratinjau Lokal";
          apiBadge.style.color = "#F59E0B";
        }
      }
    }

    function updateFrameStatusBadge(frameUrl) {
      const frameBadge = document.getElementById("frameStatusBadge");
      if (!frameBadge) return;
      if (frameUrl && String(frameUrl).trim()) {
        frameBadge.innerText = "✓ Bingkai Aktif";
        frameBadge.style.color = "#10B981";
      } else {
        frameBadge.innerText = "Tanpa Bingkai";
        frameBadge.style.color = "#64748B";
      }
    }

    function handleFrameUrlInput(val) {
      const cleanVal = (val || "").trim();
      state.activeConfig.FRAME_IMAGE_URL = cleanVal;
      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.frameImageUrl = cleanVal;
      }
      updateFrameStatusBadge(cleanVal);
      if (cleanVal && typeof preloadFrameAssets === "function") {
        preloadFrameAssets(normalizeDriveImageUrl(cleanVal));
      }
    }

    function extractDriveFolderId(url) {
      if (!url) return null;
      const s = String(url).trim();
      const m = s.match(/folders\/([a-zA-Z0-9_\-]+)/);
      if (m && m[1]) return m[1];
      if (!s.startsWith("http") && s.length >= 25 && /^[a-zA-Z0-9_\-]+$/.test(s)) return s;
      return null;
    }

    function isExternalWebLink(url) {
      if (!url) return false;
      const s = String(url).trim().toLowerCase();
      if (!s.startsWith("http")) return false;
      if (s.includes("drive.google.com/drive/folders/")) return false;
      if (s.includes("drive.google.com/open?id=")) return false;
      return true;
    }


    function normalizeDriveImageUrl(urlOrId) {
      if (!urlOrId) return "";
      const raw = String(urlOrId).trim();

      const match = raw.match(/\/d\/([a-zA-Z0-9_\-]+)/) || raw.match(/id=([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) {
        return "https://lh3.googleusercontent.com/d/" + match[1] + "=s0";
      }

      if (/^[a-zA-Z0-9_\-]{20,}$/.test(raw) && !raw.startsWith("http")) {
        return "https://lh3.googleusercontent.com/d/" + raw + "=s0";
      }

      return raw;
    }

    // ==========================================================================
    // BACKGROUND ASYNCHRONOUS DOWNLOAD QUEUE & HIGH-RES ENGINE
    // ==========================================================================
    const downloadQueue = {
      items: [],
      currentPhoto: null,
      isProcessing: false,
      hideTimer: null
    };


    function getExactPhotoFileName(photo, defaultExt) {
      let name = "";
      if (typeof photo === "string") {
        name = photo.trim();
      } else if (photo && typeof photo === "object") {
        name = String(photo.rawName || photo.name || "").trim();
      }
      if (!name) name = "Foto";
      
      // Bersihkan karakter terlarang filesystem OS tanpa mengubah struktur atau panjang nama
      name = name.replace(/[/\\:*?"<>|]/g, "_");

      // Pertahankan ekstensi asli jika ada, atau tambahkan ekstensi default jika tidak memiliki ekstensi
      const hasExt = /\.[a-zA-Z0-9]{3,4}$/.test(name);
      if (!hasExt) {
        name += (defaultExt || ".jpg");
      }
      return name;
    }

    function generateUniqueFileName(baseName, suffix, ext) {
      const clean = (baseName || "wedding-photo")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 35);
      const now = new Date();
      const timeHash = String(now.getHours()).padStart(2, '0') +
                       String(now.getMinutes()).padStart(2, '0') +
                       String(now.getSeconds()).padStart(2, '0') + "_" +
                       Math.floor(Math.random() * 900 + 100);
      const sfx = suffix ? ("-" + suffix) : "";
      const extension = ext || ".jpg";
      return clean + sfx + "_" + timeHash + extension;
    }


    function formatFileSize(bytes) {
      if (!bytes || bytes <= 0) return "";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }


    function showToast(message) {
      const container = document.getElementById("toastContainer");
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 14 14"></polyline>
        </svg>
        <span>${escapeHtml(message)}</span>
      `;
      container.appendChild(toast);

      setTimeout(function() { toast.classList.add("show"); }, 50);
      setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 300);
      }, 3500);
    }


    function getSharpPreviewUrl(photo) {
      if (!photo) return "";
      // 1. Jika video (kingphotobooth atau video lainnya)
      if (photo.isVideo && photo.videoUrl) return photo.videoUrl;
      
      // 2. Jika Kingphotobooth
      if ((photo.isKing || (photo.previewUrl && photo.previewUrl.includes("kingphotobooth.co"))) && photo.previewUrl) {
        return photo.previewUrl;
      }

      // 3. Jika Fotoshare: gunakan URL master resolusi tinggi asli (tanpa parameter resize)
      if (photo.previewUrl && photo.previewUrl.includes("fotoshare.co")) {
        return photo.previewUrl.replace(/\?.*$/, "");
      }
      if (photo.downloadUrl && photo.downloadUrl.includes("fotoshare.co")) {
        return photo.downloadUrl.replace(/\?.*$/, "");
      }

      // 4. Jika Google Photos: gunakan w3200 resolusi tajam
      if (photo.previewUrl && photo.previewUrl.includes("googleusercontent.com/pw/")) {
        const base = photo.previewUrl.replace(/=[^/]*$/, "");
        return base + "=w3200";
      }

      // 5. Jika Google Drive: gunakan lh3 w3200 resolusi penuh asli
      const raw = photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";
      const isDrive = raw.includes("drive.google.com") || raw.includes("docs.google.com") || raw.includes("googleusercontent.com/d/") || (!raw.startsWith("http") && photo.id && /^[a-zA-Z0-9_\-]{25,}$/.test(photo.id));
      if (isDrive) {
        const match = String(raw).match(/\/d\/([a-zA-Z0-9_\-]+)/) || 
                      String(raw).match(/id=([a-zA-Z0-9_\-]+)/) || 
                      (photo.id && /^[a-zA-Z0-9_\-]{25,}$/.test(photo.id) ? [null, photo.id] : null);
        if (match && match[1]) {
          return "https://lh3.googleusercontent.com/d/" + match[1] + "=w3200";
        }
      }

      return photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";
    }

    const lightboxZoom = {
      scale: 1,
      minScale: 1,
      maxScale: 4,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastTapTime: 0,
      eventsInitialized: false
    };


    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function callBackend(action, payload, onSuccess, onError) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        if (action === "getGalleryData") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getGalleryData();
        } else if (action === "adminLogin") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).adminLogin(payload.pin);
        } else if (action === "saveAdminSettings") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).saveAdminSettings(payload.pin, payload.config || payload);
        } else if (action === "setupDatabase" || action === "setupSpreadsheetDatabase") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).setupDatabaseSpreadsheet();
        } else if (action === "getAdminUsers") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getAdminUsers(payload.pin);
        } else if (action === "addAdminUser") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).addAdminUser(payload.pin, payload.newUser);
        } else if (action === "deleteAdminUser") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).deleteAdminUser(payload.pin, payload.targetUserId);
        } else if (action === "deleteEvent") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).deleteEvent(payload.pin, payload.targetEventId);
        } else if (action === "addEvent") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).addEvent(payload.pin, payload.event);
        } else if (action === "getImageBase64") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getImageBase64(payload.fileId);
        } else if (action === "changeAdminPin") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).changeAdminPin(payload.currentPin, payload.newPin);
        } else if (action === "getCategoryPhotos" || action === "getFolderPhotos") {
          const targetUrl = (payload && (payload.url || payload.folderId)) || "";
          const catName = (payload && payload.category) || "Kategori";
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getCategoryPhotos(targetUrl, catName);
        }
        return;
      }

      const apiUrl = (state.gasApiUrl || (typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.GAS_API_URL) || "").trim();
      if (!apiUrl) {
        const errMsg = "URL API Google Apps Script belum terhubung ke database. Harap hubungkan pada menu Pengaturan Cloud & API.";
        if (onError) onError(new Error(errMsg));
        return;
      }

      // HTTP POST Murni dengan Simple Request text/plain (CORS Preflight Free)
      const bodyPayload = Object.assign({ action: action }, payload || {});

      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      let timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          try { controller.abort(); } catch(e) {}
        }, 30000); // 30 detik timeout
      }

      const fetchOpts = {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(bodyPayload)
      };
      if (controller) fetchOpts.signal = controller.signal;

      fetch(apiUrl, fetchOpts)
        .then(function(res) {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) throw new Error("HTTP Status " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success === false) {
            console.warn("Backend API returned success=false:", data.message || data);
            if (onError) onError(data);
            return;
          }
          if (onSuccess) onSuccess(data);
        })
        .catch(function(err) {
          if (timeoutId) clearTimeout(timeoutId);
          console.error("Gagal menghubungi Google Apps Script API:", err);
          if (onError) onError(err);
        });
    }

    // Explicit Global Window Bindings untuk Modul Core
    if (typeof window !== "undefined") {
      window.GLOBAL_CONFIG = GLOBAL_CONFIG;
      window.state = state;
      window.callBackend = callBackend;
      window.lightboxZoom = lightboxZoom;
      window.INDONESIAN_MONTHS = INDONESIAN_MONTHS;
      window.INDONESIAN_DAYS = INDONESIAN_DAYS;
      window.showToast = showToast;
      window.populateConfigToUI = populateConfigToUI;
      window.formatIndonesianDate = formatIndonesianDate;
      window.formatDateForInput = formatDateForInput;
      window.getExactPhotoFileName = getExactPhotoFileName;
      window.normalizeDriveImageUrl = normalizeDriveImageUrl;
      window.normalizeSheetDate = normalizeSheetDate;
      window.sortPhotosNewestFirst = sortPhotosNewestFirst;
      window.getActiveEventIdFromUrl = getActiveEventIdFromUrl;
      window.escapeHtml = escapeHtml;
      window.updateFrameStatusBadge = updateFrameStatusBadge;
      window.handleFrameUrlInput = handleFrameUrlInput;
      window.handleAllPhotosLabelChange = handleAllPhotosLabelChange;
    }

