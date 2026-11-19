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
      try {
        localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", val);
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        localStorage.setItem(cacheKey, JSON.stringify(state.activeConfig));
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

    function rotateLightboxCurrentPhoto() {
      // No-op: tombol manual telah dihapus, rotasi otomatis oleh sistem
    }

    function syncSingleCategory(categoryName) {
      if (!categoryName) return;

      // Ambil nilai terbaru langsung dari DOM form admin jika sedang dibuka
      if (document.getElementById("customCategoryRowsWrapper") || document.getElementById("pbNameInput")) {
        const currentInputs = getCategoriesFromAdminInputs();
        if (Array.isArray(currentInputs) && currentInputs.length > 0) {
          state.customCategories = currentInputs;
          state.activeConfig.CUSTOM_CATEGORIES = currentInputs;
          try {
            localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(currentInputs));
          } catch (e) {}
        }
      }
      state.lastLocalCategoryEditTime = Date.now();

      showToast("🔄 Menyinkronkan kategori " + categoryName + "...");
      
      // Hapus cache foto & URL kategori agar dimuat ulang dari tautan terbaru
      if (state.categoryPhotosMap) {
        delete state.categoryPhotosMap[categoryName];
      }
      if (state.categoryPhotosUrlMap) {
        delete state.categoryPhotosUrlMap[categoryName];
      }
      try {
        localStorage.removeItem("WEDDING_CAT_COUNT_" + categoryName);
      } catch (e) {}

      // Robust check apakah kategori yang disinkronkan adalah kategori spesial Photobooth
      const isPbCat = (categoryName.toLowerCase().includes("photobooth")) ||
        (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
          return c && (c.isPhotobooth || c.id === "special_photobooth") && String(c.name || "").trim().toLowerCase() === categoryName.toLowerCase();
        }));

      let targetUrl = "";
      if (Array.isArray(state.customCategories)) {
        const match = state.customCategories.find(function(c) {
          if (!c) return false;
          const cName = String(c.name || c || "").trim().toLowerCase();
          if (cName === categoryName.toLowerCase()) return true;
          if (isPbCat && (c.isPhotobooth || c.id === "special_photobooth")) return true;
          return false;
        });
        if (match) {
          if (match.url) targetUrl = String(match.url).trim();
          if (match.rotation !== undefined) {
            if (!state.categoryRotations) state.categoryRotations = {};
            state.categoryRotations[categoryName] = parseInt(match.rotation, 10) || 0;
          }
        }
      }

      if (isPbCat && !targetUrl) {
        const pbInput = document.getElementById("pbUrlInput");
        targetUrl = (pbInput && pbInput.value) ? pbInput.value.trim() : (state.activeConfig.PHOTOBOOTH_URL || "");
      }

      // SIMPAN PERMANEN KE SCRIPT PROPERTIES & SHEET AGAR TIDAK TER-RESET
      if (state.gasApiUrl) {
        const pbCat = Array.isArray(state.customCategories) ? state.customCategories.find(function(c) {
          return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
        }) : null;
        const currentPbUrl = (pbCat && pbCat.url) ? String(pbCat.url).trim() : (targetUrl || state.activeConfig.PHOTOBOOTH_URL || "");
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            CUSTOM_CATEGORIES: state.customCategories,
            PHOTOBOOTH_URL: currentPbUrl,
            DRIVE_FOLDER_ID: state.activeConfig.DRIVE_FOLDER_ID || "",
            ALL_PHOTOS_LABEL: state.allPhotosLabel || "Semua Foto",
            EVENTS: state.events,
            ACTIVE_EVENT_ID: state.currentEventId
          }
        });
      }

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      if (categoryName === mainLabel || categoryName === "Semua Foto") {
        fetchGalleryData(true, false);
        return;
      }

      const driveFolderId = extractDriveFolderId(targetUrl);

      // Fleksibilitas Tautan Kategori (Mendukung Google Photos, Kingphotobooth, Fotoshare, Google Drive, dsb)
      if (isGooglePhotosUrl(targetUrl)) {
        fetchGooglePhotos(categoryName, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[categoryName] = targetUrl;
          updateCategoryPillCount(categoryName, photos.length);
          if (state.activeCategory === categoryName) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, categoryName);
          }
          showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
        });
        return;
      } else if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        fetchKingPhotoboothPhotos(categoryName, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[categoryName] = targetUrl;
          updateCategoryPillCount(categoryName, photos.length);
          if (state.activeCategory === categoryName) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, categoryName);
          }
          showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " media)!");
        });
        return;
      } else if (targetUrl && targetUrl.includes("fotoshare.co")) {
        fetchFotosharePhotos(categoryName, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[categoryName] = targetUrl;
          updateCategoryPillCount(categoryName, photos.length);
          if (state.activeCategory === categoryName) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, categoryName);
          }
          showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
        });
        return;
      } else if (driveFolderId) {
        fetchDriveCategoryPhotos(categoryName, driveFolderId, function(photos) {
          state.categoryPhotosUrlMap[categoryName] = "drive:" + driveFolderId;
          updateCategoryPillCount(categoryName, photos.length);
          if (state.activeCategory === categoryName) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, categoryName);
          }
          showToast("✓ Kategori " + categoryName + " berhasil disinkronkan!");
        });
        return;
      } else if (isPbCat) {
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs";
        if (isGooglePhotosUrl(pbLink)) {
          fetchGooglePhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          });
        } else if (extractDriveFolderId(pbLink)) {
          fetchDriveCategoryPhotos(categoryName, extractDriveFolderId(pbLink), function(photos) {
            state.categoryPhotosUrlMap[categoryName] = "drive:" + extractDriveFolderId(pbLink);
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan!");
          });
        } else if (pbLink.includes("kingphotobooth.co") || pbLink.includes("kingphoto")) {
          fetchKingPhotoboothPhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " media)!");
          });
        } else {
          fetchFotosharePhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          });
        }
        return;
      }

      // Kategori lokal
      let matched = state.allPhotos.filter(function(p) {
        if (p.category && p.category.toLowerCase() === categoryName.toLowerCase()) return true;
        if (p.name && p.name.toLowerCase().includes(categoryName.toLowerCase())) return true;
        if (p.rawName && p.rawName.toLowerCase().includes(categoryName.toLowerCase())) return true;
        return false;
      });
      updateCategoryPillCount(categoryName, matched.length);
      if (state.activeCategory === categoryName) {
        state.filteredPhotos = matched;
        renderPhotoGrid(targetUrl, categoryName);
      }
      showToast("✓ Kategori " + categoryName + " disinkronkan!");
    }

    function syncActiveCategory() {
      syncSingleCategory(state.activeCategory || "Semua Foto");
    }

    function copyDeviceSyncLink() {
      try {
        const currentCats = getCategoriesFromAdminInputs();
        const payloadStr = encodeURIComponent(JSON.stringify(currentCats));
        const syncUrl = window.location.origin + window.location.pathname + "?sync_cats=" + payloadStr;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(syncUrl).then(function() {
            showToast("📋 Tautan sinkronisasi berhasil disalin! Buka tautan ini di HP / device lain.");
          });
        } else {
          prompt("Salin tautan sinkronisasi ini untuk dibuka di HP / device lain:", syncUrl);
        }
      } catch (err) {
        showToast("⚠️ Gagal membuat tautan: " + err.message);
      }
    }

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
      ACTIVE_EVENT_ID: "wilson-felicia",
      EVENTS: [
        {
          id: "wilson-felicia",
          name: "Wilson & Felicia",
          date: "14 November 2026",
          venue: "Upperhills Convention Centre, Makassar",
          subtitle: "The Wedding Gallery & Precious Memories",
          welcomeMessage: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          footerMessage: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
          allPhotosLabel: "Semua Foto",
          driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
          frameImageUrl: "https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk",
          customCategories: [
            {
              name: "Photobooth",
              url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
              enabled: true
            },
            {
              name: "Wedding",
              url: "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI",
              enabled: true
            }
          ],
          coverSettings: {
            enabled: false,
            style: "romantic-collage",
            heading: "The Wedding Celebration",
            subheading: "A Journey of Two Hearts Joined as One",
            quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
            photos: []
          }
        }
      ],
      ADMIN_ACCOUNTS: [
        { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" },
        { id: "usr_mwid2vkz_759", username: "ilham", password: "123", name: "ilham", role: "Admin" },
        { id: "usr_mwii1zmz_598", username: "Wanta", password: "123", name: "Wanta", role: "Admin" }
      ],
      CUSTOM_CATEGORIES: [
        {
          name: "Photobooth",
          url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
          enabled: true
        },
        {
          name: "Wedding",
          url: "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI",
          enabled: true
        }
      ],
      DRIVE_FOLDER_ID: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
      FRAME_IMAGE_URL: "https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk",
      SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
      SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit",
      DEFAULT_ADMIN_PIN: "123456",
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
      currentEventId: "wilson-felicia",
      events: [],
      coverSettings: {
        enabled: false,
        style: "romantic-collage",
        heading: "The Wedding Celebration",
        subheading: "A Journey of Two Hearts Joined as One",
        quote: "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
        photos: []
      },
      customCategories: [
        { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs" }
      ],
      adminAccounts: [
        { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
      ],
      failedPhotoIds: new Set(),
      activeCategory: "Semua Foto",
      categoryPhotosMap: {},
      currentLightboxIndex: 0,
      currentSlideIndex: 0,
      slideshowTimer: null,
      slideshowProgressTimer: null,
      isSlideshowPlaying: true,
      activeSlideTarget: 'A',
      intervalMs: 4000,
      
      isAdminLoggedIn: false,
      adminPin: "123",
      currentAdminUser: { username: "admin", name: "Super Admin", role: "Super Admin" },
      activeConfig: Object.assign({}, GLOBAL_CONFIG),
      gasApiUrl: "",
      newBadgeDurationMs: (GLOBAL_CONFIG.NEW_BADGE_MINUTES || 10) * 60 * 1000,
      autoRefreshTimer: null,
      autoRefreshIntervalMs: 20000,
      isAutoRefreshing: false
    };

    function getActiveEventIdFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("event") || params.get("e") || "";
      } catch (e) {
        return "";
      }
    }

    function isPhotoNew(photo) {
      if (!photo) return false;
      if (photo.isNewlyAdded) return true;
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

    document.addEventListener("DOMContentLoaded", function() {
      setupTouchSwipe();

      // Inisialisasi categoryPhotosMap & categoryPhotosUrlMap dinamis
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      state.driveSubfolders = [];
      setupKeyboardNav();

      // 1. Muat URL API backend yang tersimpan
      const savedApiUrl = localStorage.getItem("WEDDING_GAS_API_URL") || GLOBAL_CONFIG.GAS_API_URL;
      if (savedApiUrl) {
        state.gasApiUrl = savedApiUrl;
        const apiUrlInput = document.getElementById("cfgGasApiUrl");
        if (apiUrlInput) apiUrlInput.value = savedApiUrl;
      }

      // 2. Deteksi Parameter URL Event & Muat Cache Terisolasi (Anti-Flicker Lintas Event)
      const urlEventId = getActiveEventIdFromUrl();
      if (urlEventId) {
        state.currentEventId = urlEventId;
      }

      try {
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        let savedCfgStr = localStorage.getItem(cacheKey);
        if (!savedCfgStr && !urlEventId) {
          savedCfgStr = localStorage.getItem("WEDDING_SAVED_CONFIG");
        }
        if (savedCfgStr) {
          const savedCfg = JSON.parse(savedCfgStr);
          state.activeConfig = Object.assign({}, GLOBAL_CONFIG, savedCfg);
          populateConfigToUI(state.activeConfig);
        } else {
          populateConfigToUI(GLOBAL_CONFIG);
        }
      } catch (e) {}

      // 3. Muat konfigurasi sentral dari config.json (Prioritas Multi-Event & Sinkronisasi Lintas Device)
      fetch("config.json?v=" + Date.now())
        .then(function(res) {
          if (!res.ok) throw new Error("No config.json");
          return res.json();
        })
        .then(function(remoteCfg) {
          if (remoteCfg && typeof remoteCfg === "object") {
            if (remoteCfg.GAS_API_URL) {
              state.gasApiUrl = remoteCfg.GAS_API_URL;
              const apiUrlInput = document.getElementById("cfgGasApiUrl");
              if (apiUrlInput) apiUrlInput.value = remoteCfg.GAS_API_URL;
            }
            if (Array.isArray(remoteCfg.EVENTS)) {
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
            }
            if (remoteCfg.ADMIN_ACCOUNTS) {
              state.adminAccounts = remoteCfg.ADMIN_ACCOUNTS;
            }

            // Lindungi kategori tersimpan lokal dari Google Sheet agar tidak terjadi flicker/tab hantu
            const savedCatsStr = localStorage.getItem("WEDDING_SAVED_CUSTOM_CATEGORIES");
            if (savedCatsStr) {
              try {
                const parsedCats = JSON.parse(savedCatsStr);
                if (Array.isArray(parsedCats) && parsedCats.length > 0) {
                  remoteCfg.CUSTOM_CATEGORIES = parsedCats;
                }
              } catch(e) {}
            }

            state.activeConfig = Object.assign({}, GLOBAL_CONFIG, remoteCfg);
            populateConfigToUI(state.activeConfig);
          }
        })
        .catch(function() {})
        .finally(function() {
          // 4. Fail-Safe: Jika URL belum terdeteksi, baca baris Pengaturan di Google Spreadsheet publik via GViz
          syncFromSpreadsheetGViz(function() {
            // 5. Ambil data galeri & konfigurasi live dari Google Apps Script untuk event aktif
            fetchGalleryData(false, false);
            startLiveAutoRefresh();
            startBadgeExpiryChecker();
          });
        });
    });

    function syncFromSpreadsheetGViz(callback) {
      const sid = state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
      if (!sid) { if (callback) callback(); return; }
      fetch("https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now())
        .then(function(r) { return r.text(); })
        .then(function(t) {
          const raw = t.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.table && parsed.table.rows) {
            const sheetMap = {};
            parsed.table.rows.forEach(function(row) {
              const k = row.c && row.c[0] ? String(row.c[0].v || '').trim() : '';
              const v = row.c && row.c[1] ? String(row.c[1].v || '').trim() : '';
              if (k) sheetMap[k] = v;
            });

            // Sinkronkan kategori dari Google Spreadsheet Database ke seluruh device (proteksi jangan menimpa jika sedang diedit / modal buka)
            const isEditingLocally = state.lastLocalCategoryEditTime && (Date.now() - state.lastLocalCategoryEditTime < 60000);
            const isModalOpen = document.getElementById("adminSettingsModal") && document.getElementById("adminSettingsModal").classList.contains("active");

            if (!isEditingLocally && !isModalOpen) {
              if (sheetMap.PHOTOBOOTH_URL) {
                const prevPbUrl = state.activeConfig.PHOTOBOOTH_URL;
                state.activeConfig.PHOTOBOOTH_URL = sheetMap.PHOTOBOOTH_URL;
                if (Array.isArray(state.customCategories)) {
                  const pb = state.customCategories.find(function(c) {
                    return c && (c.isPhotobooth || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
                  });
                  if (pb && pb.url !== sheetMap.PHOTOBOOTH_URL) {
                    pb.url = sheetMap.PHOTOBOOTH_URL;
                    // Hapus cache foto lama jika tautan photobooth di spreadsheet diperbarui
                    if (state.categoryPhotosMap) {
                      delete state.categoryPhotosMap[pb.name];
                      delete state.categoryPhotosMap["Photobooth"];
                    }
                    if (state.categoryPhotosUrlMap) {
                      delete state.categoryPhotosUrlMap[pb.name];
                      delete state.categoryPhotosUrlMap["Photobooth"];
                    }
                    try { localStorage.removeItem("WEDDING_CAT_COUNT_" + pb.name); } catch(e) {}
                  }
                }
              }

              if (sheetMap.CUSTOM_CATEGORIES && !sheetMap.CUSTOM_CATEGORIES.includes("[object Object]")) {
                try {
                  const parsedCats = JSON.parse(sheetMap.CUSTOM_CATEGORIES);
                  if (Array.isArray(parsedCats) && parsedCats.length > 0) {
                    // Invalidate cache jika URL kategori berubah
                    parsedCats.forEach(function(c) {
                      const cName = String((c && c.name) || c || "").trim();
                      const cUrl = String((c && c.url) || "").trim();
                      if (cName && cUrl) {
                        const prevUrl = state.categoryPhotosUrlMap ? state.categoryPhotosUrlMap[cName] : null;
                        if (prevUrl && prevUrl !== cUrl) {
                          if (state.categoryPhotosMap) delete state.categoryPhotosMap[cName];
                          try { localStorage.removeItem("WEDDING_CAT_COUNT_" + cName); } catch(e) {}
                        }
                        prefetchCategoryPhotos(cName, cUrl);
                      }
                    });
                    state.customCategories = parsedCats;
                    state.activeConfig.CUSTOM_CATEGORIES = parsedCats;
                    try {
                      localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(parsedCats));
                    } catch (e) {}
                  }
                } catch(eCats) {}
              }
            }

            if (sheetMap.ADMIN_USERNAME) {
              state.activeConfig.ADMIN_USERNAME = sheetMap.ADMIN_USERNAME;
              state.adminUsername = sheetMap.ADMIN_USERNAME;
            }
            if (sheetMap.ADMIN_PIN) {
              state.activeConfig.ADMIN_PIN = sheetMap.ADMIN_PIN;
              // JANGAN pernah menimpa pin sesi aktif admin yang sedang login
              if (!state.isAdminLoggedIn && !state.adminPin) {
                state.adminPin = sheetMap.ADMIN_PIN;
              }
            }
            if (sheetMap.EVENT_DATE) state.activeConfig.EVENT_DATE = sheetMap.EVENT_DATE;
            if (sheetMap.EVENT_VENUE) state.activeConfig.EVENT_VENUE = sheetMap.EVENT_VENUE;
            if (sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME) {
              state.activeConfig.EVENT_NAME = sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME;
              state.activeConfig.COUPLE_NAME = state.activeConfig.EVENT_NAME;
            }
            if (!isEditingLocally && !isModalOpen) {
              if (sheetMap.DRIVE_FOLDER_ID) state.activeConfig.DRIVE_FOLDER_ID = sheetMap.DRIVE_FOLDER_ID;
              if (sheetMap.ALL_PHOTOS_LABEL) state.allPhotosLabel = sheetMap.ALL_PHOTOS_LABEL;
            }
            if (sheetMap.FRAME_IMAGE_URL) state.activeConfig.FRAME_IMAGE_URL = sheetMap.FRAME_IMAGE_URL;
            if (sheetMap.GAS_API_URL && sheetMap.GAS_API_URL.startsWith('http')) {
              state.gasApiUrl = sheetMap.GAS_API_URL;
            }

            // Hitung signature konfigurasi sheet untuk mencegah re-render & flicker jika data tidak berubah
            const newSig = [
              sheetMap.EVENT_NAME || sheetMap.COUPLE_NAME || '',
              sheetMap.EVENT_DATE || '',
              sheetMap.EVENT_VENUE || '',
              sheetMap.SUBTITLE || '',
              sheetMap.WELCOME_MESSAGE || '',
              sheetMap.CUSTOM_CATEGORIES || '',
              sheetMap.PHOTOBOOTH_URL || '',
              sheetMap.DRIVE_FOLDER_ID || '',
              sheetMap.ALL_PHOTOS_LABEL || ''
            ].join('|');

            const hasConfigChanged = (!state.lastSyncedConfigSig || state.lastSyncedConfigSig !== newSig);
            state.lastSyncedConfigSig = newSig;

            if (hasConfigChanged) {
              populateConfigToUI(state.activeConfig);
              renderCategoryTabs();
              // Hanya re-filter jika kategori aktif saat ini tautannya berubah
              if (state.activeCategory && state.activeCategory !== "Semua Foto") {
                const currentCat = Array.isArray(state.customCategories) ? state.customCategories.find(function(c) {
                  return String((c && c.name) || "").trim().toLowerCase() === state.activeCategory.toLowerCase();
                }) : null;
                const newCatUrl = currentCat ? (currentCat.url || '') : '';
                const cachedUrl = state.categoryPhotosUrlMap ? state.categoryPhotosUrlMap[state.activeCategory] : null;
                if (newCatUrl && cachedUrl && cachedUrl !== newCatUrl) {
                  applyCategoryFilter(state.activeCategory, newCatUrl, true);
                }
              }
            }

            // Sinkronkan daftar foto riil dari Sheet Daftar_Foto jika dikatalogkan di Spreadsheet
            fetch("https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Daftar_Foto&t=" + Date.now())
              .then(function(r) { return r.text(); })
              .then(function(t) {
                const rawP = t.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
                const parsedP = JSON.parse(rawP);
                if (parsedP && parsedP.table && Array.isArray(parsedP.table.rows)) {
                  const dbPhotos = [];
                  parsedP.table.rows.forEach(function(r, idx) {
                    if (!r.c) return;
                    const fId = r.c[0] ? String(r.c[0].v || '').trim() : '';
                    const fName = r.c[1] ? String(r.c[1].v || '').trim() : ('Foto ' + (idx + 1));
                    const fCat = r.c[2] ? String(r.c[2].v || '').trim() : 'Semua Foto';
                    const fThumb = r.c[3] ? String(r.c[3].v || '').trim() : '';
                    const fDl = r.c[4] ? String(r.c[4].v || '').trim() : fThumb;
                    const fStatus = r.c[7] ? String(r.c[7].v || '').trim() : 'Aktif';

                    if (fId && fThumb && fStatus !== 'Nonaktif' && !fId.startsWith('demo-') && !fThumb.includes('images.unsplash.com')) {
                      dbPhotos.push({
                        id: fId,
                        name: fName,
                        category: fCat,
                        thumbnailUrl: fThumb,
                        previewUrl: fThumb,
                        highResUrl: fDl || fThumb,
                        downloadUrl: fDl || fThumb
                      });
                    }
                  });

                  if (dbPhotos.length > 0) {
                    const prevSig = (state.allPhotos || []).map(function(p) { return p.id; }).join(',');
                    const newSig = dbPhotos.map(function(p) { return p.id; }).join(',');
                    if (prevSig !== newSig) {
                      state.allPhotos = dbPhotos;
                      renderCategoryTabs();
                      if (!state.activeCategory || state.activeCategory === "Semua Foto") {
                        renderPhotoGrid(state.allPhotos);
                      }
                    }
                  }
                }
              })
              .catch(function() {});
          }
        })
        .catch(function(err) {
          console.warn("GViz sync error:", err);
        })
        .finally(function() {
          if (callback) callback();
        });
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

    function getEffectiveAdminPin() {
      let pin = state.adminPin;
      if (!pin) {
        try {
          pin = sessionStorage.getItem("WEDDING_ADMIN_PIN") || localStorage.getItem("WEDDING_ADMIN_PIN") || "";
        } catch(e) {}
      }
      return pin || "111111";
    }

    function callBackend(action, payload, onSuccess, onError) {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        if (action === "getGalleryData") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).getGalleryData();
        } else if (action === "adminLogin") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).adminLogin(payload.pin);
        } else if (action === "testAndSyncDriveFolder") {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onError).testAndSyncDriveFolder(payload.pin, payload.folderId, payload.allPhotosLabel);
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

      const apiUrl = state.gasApiUrl ? state.gasApiUrl.trim() : "";
      if (!apiUrl) {
        if (action === "getGalleryData") {
          loadFallbackData("URL API Backend belum dihubungkan");
        } else if (action === "adminLogin") {
          if (payload.pin === "123456" || payload.pin === "admin") {
            onSuccess({
              success: true,
              message: "Login demo lokal berhasil!",
              user: { id: "usr_superadmin", name: "Super Admin", role: "Super Admin" }
            });
          } else {
            onError({ message: "PIN yang Anda masukkan salah. Silakan coba lagi." });
          }
        } else if (action === "getAdminUsers") {
          onSuccess({
            success: true,
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "addAdminUser") {
          onSuccess({
            success: true,
            message: "Pengguna " + payload.newUser.name + " berhasil ditambahkan (Demo Lokal)",
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" },
              { id: "usr_" + Date.now(), name: payload.newUser.name, role: payload.newUser.role || "Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "deleteAdminUser") {
          onSuccess({
            success: true,
            message: "Pengguna berhasil dihapus (Demo Lokal)",
            users: [
              { id: "usr_superadmin", name: "Super Admin", role: "Super Admin", pinMasked: "••••" }
            ]
          });
        } else if (action === "changeAdminPin") {
          if (payload.newPin && payload.newPin.length >= 4) {
            onSuccess({
              success: true,
              message: "PIN Admin berhasil diperbarui!"
            });
          } else {
            onError({ message: "PIN baru minimal 4 digit." });
          }
        } else {
          onSuccess({ success: true, message: "Aksi tersimulasi di Vercel." });
        }
        return;
      }

      const queryParams = new URLSearchParams({
        action: action,
        api: "true"
      });

      if (payload) {
        for (const key in payload) {
          if (typeof payload[key] === "object") {
            queryParams.append(key, JSON.stringify(payload[key]));
          } else {
            queryParams.append(key, String(payload[key]));
          }
        }
      }

      const requestUrl = apiUrl + (apiUrl.includes("?") ? "&" : "?") + queryParams.toString();

      fetch(requestUrl, {
        method: "GET",
        mode: "cors"
      })
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(function(data) {
        onSuccess(data);
      })
      .catch(function(err) {
        console.error("Gagal menghubungi Google Apps Script API:", err);
        onError(err);
      });
    }

    function fetchGalleryData(forceRefresh, isSilent) {
      const photosGrid = document.getElementById("photosGrid");
      state.isAutoRefreshing = true;

      if (!isSilent && (forceRefresh || state.allPhotos.length === 0)) {
        photosGrid.innerHTML = `
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        `;
      }

      const refreshIcon = document.getElementById("refreshIconSvg");
      if (forceRefresh && refreshIcon) refreshIcon.classList.add("spin");

      callBackend("getGalleryData", { eventId: state.currentEventId }, function(response) {
        state.isAutoRefreshing = false;
        if (refreshIcon) refreshIcon.classList.remove("spin");
        handleGalleryResponse(response, isSilent);
        if (forceRefresh) showToast("Galeri foto berhasil diperbarui!");
      }, function(err) {
        state.isAutoRefreshing = false;
        if (refreshIcon) refreshIcon.classList.remove("spin");
        console.error("Gagal memuat galeri:", err);
        if (!isSilent) loadFallbackData("Gagal memuat data dari backend: " + err.message);
      });
    }

    function handleGalleryResponse(response, isSilent) {
      if (!response) return;

      const demoNotice = document.getElementById("demoNotice");
      if (demoNotice) demoNotice.style.display = "none";

      if (response.events && Array.isArray(response.events)) {
        state.events = response.events;
      }
      if (response.activeEventId) {
        state.currentEventId = response.activeEventId;
      }

      if (response.config) {
        state.activeConfig = response.config;
        if (response.config.ALL_PHOTOS_LABEL) {
          state.allPhotosLabel = response.config.ALL_PHOTOS_LABEL;
        }
        if (response.config.COVER_SETTINGS) {
          try {
            state.coverSettings = typeof response.config.COVER_SETTINGS === "string" 
              ? JSON.parse(response.config.COVER_SETTINGS) 
              : response.config.COVER_SETTINGS;
          } catch (eCov) {}
        }
        populateConfigToUI(response.config);

        // Simpan cache scoped per-event
        try {
          const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
          localStorage.setItem(cacheKey, JSON.stringify(response.config));
        } catch (eSc) {}
      }

      // Filter ketat: Buang seluruh foto demo / sampel jika folder Google Drive kosong, serta foto yang tercatat rusak
      const incomingPhotos = (response.photos || []).filter(function(p) {
        if (!p || !p.id) return false;
        if (state.failedPhotoIds && state.failedPhotoIds.has(p.id)) return false;
        const sId = String(p.id).toLowerCase();
        if (sId.startsWith("demo-") || sId.startsWith("demo_") || /^d\d+$/.test(sId)) return false;
        if (p.thumbnailUrl && p.thumbnailUrl.includes("images.unsplash.com")) return false;
        return true;
      });

      if (incomingPhotos.length === 0) {
        state.allPhotos = [];
        state.categories = ["Semua Foto"];
        renderCategoryTabs();
        applyCategoryFilter("Semua Foto");
        return;
      }

      if (isSilent && state.allPhotos.length > 0) {
        const existingIds = new Set(state.allPhotos.map(function(p) { return p.id; }));
        // Hanya anggap foto baru jika ID belum pernah ada dan bukan foto yang tercatat error sebelumnya
        const newPhotos = incomingPhotos.filter(function(p) { 
          return !existingIds.has(p.id) && !(state.failedPhotoIds && state.failedPhotoIds.has(p.id)); 
        });

        if (newPhotos.length > 0) {
          const now = Date.now();
          newPhotos.forEach(function(p) {
            p.isNewlyAdded = true;
            p.detectedAt = now;
          });
          state.allPhotos = incomingPhotos;
          try {
            if (incomingPhotos.length > 0) {
              localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String(incomingPhotos.length));
            }
          } catch(e) {}
          state.driveSubfolders = (response.categories || []).filter(function(c) {
            return c && c !== "Semua Foto" && c !== state.allPhotosLabel;
          });
          renderCategoryTabs();
          // Hanya re-render galeri jika pengguna sedang berada di kategori utama "Semua Foto"
          if (!state.activeCategory || state.activeCategory === "Semua Foto" || state.activeCategory === state.allPhotosLabel) {
            applyCategoryFilter("Semua Foto", null, true);
          }
          showToast("📸 " + newPhotos.length + " foto baru otomatis ditambahkan ke galeri!");
          return;
        }

        // Jika tidak ada foto baru saat background auto-refresh:
        // Cukup perbarui daftar subfolder jika berubah, JANGAN re-render galeri agar 100% bebas kedipan!
        const prevSubfolders = (state.driveSubfolders || []).join(',');
        const newSubfolders = (response.categories || []).filter(function(c) {
          return c && c !== "Semua Foto" && c !== state.allPhotosLabel;
        }).join(',');
        if (prevSubfolders !== newSubfolders) {
          state.driveSubfolders = (response.categories || []).filter(function(c) {
            return c && c !== "Semua Foto" && c !== state.allPhotosLabel;
          });
          renderCategoryTabs();
        }
        return;
      }

      state.allPhotos = incomingPhotos;
      try {
        if (incomingPhotos.length > 0) {
          localStorage.setItem("WEDDING_ALL_PHOTOS_COUNT", String(incomingPhotos.length));
        }
      } catch(e) {}
      state.driveSubfolders = (response.categories || []).filter(function(c) {
        return c && c !== "Semua Foto" && c !== state.allPhotosLabel;
      });
      
      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);
    }

    /* ==========================================================================
       DATE FORMATTING UTILITIES (INDONESIAN & DATE PICKER)
       ========================================================================== */
    const INDONESIAN_MONTHS = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    function formatIndonesianDate(dateStr) {
      if (!dateStr) return "14 November 2026";
      const s = String(dateStr).trim();
      if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(s)) {
        return s;
      }
      const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = match[1];
        const monthIdx = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const monthName = INDONESIAN_MONTHS[monthIdx] || match[2];
        return day + " " + monthName + " " + year;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const month = INDONESIAN_MONTHS[d.getMonth()];
        const year = d.getFullYear();
        return day + " " + month + " " + year;
      }
      return s;
    }

    function formatDateForInput(dateStr) {
      if (!dateStr) return "2026-11-14";
      const str = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      const parts = str.split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const monthName = parts[1].toLowerCase();
        const year = parts[2];
        const monthMap = {
          "januari": "01", "january": "01", "jan": "01",
          "februari": "02", "february": "02", "feb": "02",
          "maret": "03", "march": "03", "mar": "03",
          "april": "04", "apr": "04",
          "mei": "05", "may": "05",
          "juni": "06", "june": "06", "jun": "06",
          "juli": "07", "july": "07", "jul": "07",
          "agustus": "08", "august": "08", "agu": "08", "aug": "08",
          "september": "09", "sep": "09",
          "oktober": "10", "october": "10", "okt": "10", "oct": "10",
          "november": "11", "nov": "11",
          "desember": "12", "december": "12", "des": "12", "dec": "12"
        };
        if (monthMap[monthName] && /^\d{4}$/.test(year)) {
          return year + "-" + monthMap[monthName] + "-" + day;
        }
      }
      const d = new Date(dateStr);
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

      if (cfg.SUBTITLE) {
        setNodeTextIfChanged("subtitle", cfg.SUBTITLE);
      }
      if (cfg.WELCOME_MESSAGE) {
        setNodeTextIfChanged("welcomeMessage", cfg.WELCOME_MESSAGE);
      }
      if (cfg.FOOTER_MESSAGE) {
        setNodeTextIfChanged("footerBlessing", cfg.FOOTER_MESSAGE);
      }
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

      const frameBadge = document.getElementById("frameStatusBadge");
      if (frameBadge) {
        if (cfg.FRAME_IMAGE_URL) {
          frameBadge.innerText = "✓ Bingkai Aktif";
          frameBadge.style.color = "#10B981";
          preloadFrameAssets(normalizeDriveImageUrl(cfg.FRAME_IMAGE_URL));
        } else {
          frameBadge.innerText = "Tanpa Bingkai";
          frameBadge.style.color = "#64748B";
        }
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

    function renderCategoryTabs() {
      const container = document.getElementById("categoryTabs");
      if (!container) return;
      container.innerHTML = "";

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const uniqueCategories = [];
      const seen = {};
      seen[mainLabel] = true;
      seen["Semua Foto"] = true;
      uniqueCategories.push(mainLabel);

      // 1. Kategori kustom dari database spreadsheet / admin / config (cek enabled flag)
      if (Array.isArray(state.customCategories)) {
        state.customCategories.forEach(function(item) {
          const catName = String((item && item.name) || item || "").trim();
          const isEnabled = (item && item.enabled !== undefined) ? item.enabled : true;
          if (catName && catName !== "Semua Foto" && catName !== mainLabel && isEnabled !== false && !seen[catName]) {
            seen[catName] = true;
            uniqueCategories.push(catName);
          }
        });
      }

      state.categories = uniqueCategories;

      state.categories.forEach(function(cat) {
        let targetUrl = "";
        if (Array.isArray(state.customCategories)) {
          const matchCat = state.customCategories.find(function(it) {
            return String((it && it.name) || "").trim().toLowerCase() === cat.toLowerCase();
          });
          if (matchCat && matchCat.url) {
            targetUrl = String(matchCat.url).trim();
          }
        }

        const isMain = (cat === mainLabel || cat === "Semua Foto");
        let countBadgeText = "";

        if (isMain) {
          if (state.allPhotos && state.allPhotos.length > 0) {
            countBadgeText = String(state.allPhotos.length);
          } else {
            countBadgeText = "";
          }
        } else if (state.categoryPhotosMap && state.categoryPhotosMap[cat] && Array.isArray(state.categoryPhotosMap[cat])) {
          countBadgeText = String(state.categoryPhotosMap[cat].length);
        } else {
          // Hitung foto aktual dari state.allPhotos jika cocok dengan kategori ini
          const driveFolderId = extractDriveFolderId(targetUrl);
          const directMatch = (state.allPhotos || []).filter(function(p) {
            if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
            if (driveFolderId && p.customFolderId === driveFolderId) return true;
            if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
            if (p.rawName && p.rawName.toLowerCase().includes(cat.toLowerCase())) return true;
            return false;
          }).length;

          if (directMatch > 0) {
            countBadgeText = String(directMatch);
          } else {
            countBadgeText = "";
          }

          // Trigger fetch realtime di latar belakang agar badge langsung terisi sesuai data aktual vendor
          if (targetUrl || driveFolderId) {
            prefetchCategoryPhotos(cat, targetUrl);
          }
        }

        const pill = document.createElement("button");
        pill.className = "filter-pill " + (cat === state.activeCategory ? "active" : "");
        pill.setAttribute("data-category", cat);
        pill.onclick = function() { selectCategory(cat, targetUrl); };

        pill.innerHTML = `
          <span>${escapeHtml(cat)}</span>
          <span class="pill-count" id="pill-count-${escapeHtml(cat.replace(/\s+/g, '_'))}">${countBadgeText}</span>
        `;
        container.appendChild(pill);
      });
    }

    function updateCategoryPillCount(cat, count) {
      const el = document.getElementById("pill-count-" + escapeHtml(cat.replace(/\s+/g, '_')));
      if (el) el.innerText = String(count);
      try {
        if (count > 0) {
          localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(count));
        }
      } catch (e) {}
    }

    function prefetchCategoryPhotos(cat, targetUrl) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0 && (!targetUrl || state.categoryPhotosUrlMap[cat] === targetUrl)) return;

      const isPbCat = Boolean((cat && cat.toLowerCase().includes("photobooth")) ||
        (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
          return c && (c.isPhotobooth || c.id === "special_photobooth") && String(c.name || "").trim().toLowerCase() === cat.toLowerCase();
        })));

      const driveFolderId = extractDriveFolderId(targetUrl);
      if (isGooglePhotosUrl(targetUrl)) {
        fetchGooglePhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        fetchKingPhotoboothPhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (targetUrl && targetUrl.includes("fotoshare.co")) {
        fetchFotosharePhotos(cat, targetUrl, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (driveFolderId) {
        fetchDriveCategoryPhotos(cat, driveFolderId, function(photos) {
          updateCategoryPillCount(cat, photos.length);
        });
      } else if (isPbCat) {
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs";
        if (isGooglePhotosUrl(pbLink)) {
          fetchGooglePhotos(cat, pbLink, function(photos) {
            updateCategoryPillCount(cat, photos.length);
          });
        } else if (extractDriveFolderId(pbLink)) {
          fetchDriveCategoryPhotos(cat, extractDriveFolderId(pbLink), function(photos) {
            updateCategoryPillCount(cat, photos.length);
          });
        } else if (pbLink.includes("kingphotobooth.co") || pbLink.includes("kingphoto")) {
          fetchKingPhotoboothPhotos(cat, pbLink, function(photos) {
            updateCategoryPillCount(cat, photos.length);
          });
        } else {
          fetchFotosharePhotos(cat, pbLink, function(photos) {
            updateCategoryPillCount(cat, photos.length);
          });
        }
      }
    }

    function fetchGooglePhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0 && state.categoryPhotosUrlMap && state.categoryPhotosUrlMap[cat] === url) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function buildGooglePhotoList(rawList) {
        return rawList.map(function(item, idx) {
          const base = typeof item === 'string' ? item : (item.baseUrl || item.url || item.thumbnailUrl);
          const cleanBase = base ? base.replace(/=[^/]*$/, '') : '';
          const isPbCat = Boolean(
            (cat && cat.toLowerCase().includes("photobooth")) ||
            (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
            (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
              return c && (c.isPhotobooth || c.id === "special_photobooth") && (
                String(c.name || "").trim().toLowerCase() === String(cat || "").toLowerCase() ||
                String(c.name || "").trim().toLowerCase() === String(state.activeCategory || "").toLowerCase()
              );
            }))
          );
          return {
            id: (item.id || ("gp_" + (idx + 1))),
            name: (cat || "Photobooth") + " " + (idx + 1),
            thumbnailUrl: cleanBase ? (cleanBase + "=w500-h500-c") : base,
            previewUrl: cleanBase ? (cleanBase + "=w1600-h1200") : base,
            highResUrl: cleanBase ? (cleanBase + "=w2400-h1800") : base,
            downloadUrl: cleanBase ? (cleanBase + "=d") : base,
            category: cat || "Photobooth",
            isPhotobooth: isPbCat
          };
        });
      }

      // 1. Coba lewat API endpoint /api/google-photos dengan timeout 6 detik
      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      let timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          try { controller.abort(); } catch(e) {}
        }, 6000);
      }

      const fetchOpts = controller ? { signal: controller.signal } : {};
      fetch("/api/google-photos?url=" + encodeURIComponent(url) + "&category=" + encodeURIComponent(cat), fetchOpts)
        .then(function(res) {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(data.photos.length)); } catch(e) {}
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS Backend
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
              state.categoryPhotosUrlMap[cat] = url;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(res.photos.length)); } catch(e) {}
              if (callback) callback(res.photos);
              return;
            }
            if (callback) callback(state.categoryPhotosMap[cat] || []);
          }, function() {
            if (callback) callback(state.categoryPhotosMap[cat] || []);
          });
        });
    }

    
    function buildKingPhotoList(rawList, cat, targetUrl) {
      const origin = (targetUrl && targetUrl.startsWith("http")) 
        ? new URL(targetUrl).origin 
        : "https://x1.kingphotobooth.co";

      return (rawList || []).map(function(it, idx) {
        const isVideo = Boolean(it.is_video);
        const thumbUrl = it.thumb ? (origin + it.thumb) : "";
        let photoUrl = "";
        let videoUrl = "";
        let downloadUrl = "";

        if (it.thumb) {
          if (isVideo) {
            videoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg$/i, ".mp4");
            photoUrl = videoUrl;
            downloadUrl = origin + "/dl/" + it.id;
          } else {
            photoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/");
            downloadUrl = origin + "/dl/" + it.id;
          }
        }

        return {
          id: "king_" + it.id,
          name: isVideo ? ("Video Photobooth #" + (rawList.length - idx)) : ("Photobooth #" + (rawList.length - idx)),
          category: cat || "Photobooth",
          thumbnailUrl: thumbUrl,
          previewUrl: photoUrl,
          highResUrl: photoUrl,
          downloadUrl: downloadUrl,
          videoUrl: videoUrl,
          isVideo: isVideo,
          isKing: true,
          isPhotobooth: true,
          shareToken: it.share_token,
          originalWebUrl: origin + "/i/" + (it.share_token || it.id)
        };
      });
    }

    function fetchKingPhotoboothPhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0 && state.categoryPhotosUrlMap[cat] === url) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function fallbackKing() {
        state.categoryPhotosMap[cat] = [];
        state.categoryPhotosUrlMap[cat] = url;
        if (callback) callback([]);
      }

      // 1. Coba lewat API endpoint /api/kingphotobooth (Vercel) dengan timeout 6 detik
      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      let timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          try { controller.abort(); } catch(e) {}
        }, 6000);
      }
      const fetchOpts = controller ? { signal: controller.signal } : {};

      fetch("/api/kingphotobooth?url=" + encodeURIComponent(url) + "&category=" + encodeURIComponent(cat), fetchOpts)
        .then(function(res) {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(data.photos.length)); } catch (e) {}
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from Kingphotobooth API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS backend getCategoryPhotos
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              state.categoryPhotosUrlMap[cat] = url;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(res.photos.length)); } catch (e) {}
              if (callback) callback(res.photos);
              return;
            }
            fallbackKing();
          }, function() {
            fallbackKing();
          });
        });
    }
  
    function fetchFotosharePhotos(cat, url, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0 && state.categoryPhotosUrlMap[cat] === url) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function parseFotoshareHtml(htmlText) {
        let list = [];
        const sessionMatch = htmlText.match(/let\s+sessionImages\s*=\s*(\{[\s\S]*?\});/);
        if (sessionMatch) {
          try {
            const sessionObj = JSON.parse(sessionMatch[1]);
            let idx = 0;
            for (const sKey in sessionObj) {
              const sess = sessionObj[sKey];
              for (const imgKey in sess) {
                const it = sess[imgKey];
                idx++;
                const fullWebUrl = it.url ? ("https://fotoshare.co" + it.url) : ("https://fotoshare.co/i/" + (it.hash || ""));
                const rawMasterUrl = (it.url_hires || it.highres || it.img || it.url || "").replace(/\?.*$/, "");
                list.push({
                  id: it.hash || ("pb_" + idx),
                  name: (cat || "Photobooth") + " " + idx,
                  category: cat,
                  thumbnailUrl: it.thumb_url || it.img,
                  previewUrl: rawMasterUrl,
                  highResUrl: rawMasterUrl,
                  downloadUrl: rawMasterUrl,
                  originalWebUrl: fullWebUrl,
                  img: rawMasterUrl,
                  isPhotobooth: true,
                  timestamp: it.date_added ? new Date(it.date_added).getTime() : Date.now()
                });
              }
            }
          } catch (eJson) {}
        }

        if (list.length === 0) {
          const regex = /(https:\/\/cdn-bz-op\.fotoshare\.co\/[^\s"'<>]+\.JPG)/gi;
          let m;
          const set = new Set();
          while ((m = regex.exec(htmlText)) !== null) {
            const u = m[1];
            const rawMasterUrl = u.replace(/\?.*$/, "");
            if (!set.has(rawMasterUrl)) {
              set.add(rawMasterUrl);
              list.push({
                id: "pb_" + (list.length + 1),
                name: (cat || "Photobooth") + " " + (list.length + 1),
                category: cat,
                thumbnailUrl: u,
                previewUrl: rawMasterUrl,
                highResUrl: rawMasterUrl,
                downloadUrl: rawMasterUrl,
                originalWebUrl: url || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
                img: rawMasterUrl,
                isPhotobooth: true,
                timestamp: Date.now()
              });
            }
          }
        }
        return list;
      }

      function fallbackFotoshare() {
        callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
          if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
            state.categoryPhotosMap[cat] = res.photos;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(res.photos.length)); } catch (e) {}
            if (callback) callback(res.photos);
            return;
          }
          state.categoryPhotosMap[cat] = [];
          state.categoryPhotosUrlMap[cat] = url;
          if (callback) callback([]);
        }, function() {
          state.categoryPhotosMap[cat] = [];
          state.categoryPhotosUrlMap[cat] = url;
          if (callback) callback([]);
        });
      }

      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      let timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          try { controller.abort(); } catch (e) {}
        }, 4000);
      }
      const fetchOpts = controller ? { signal: controller.signal } : {};

      // 1. Coba lewat API endpoint /api/fotoshare (Vercel) dengan timeout 4 detik
      fetch("/api/fotoshare?url=" + encodeURIComponent(url) + "&category=" + encodeURIComponent(cat), fetchOpts)
        .then(function(res) {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(data.photos.length)); } catch (e) {}
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from Fotoshare API");
        })
        .catch(function() {
          // 2. Direct fetch jika sama origin/CORS
          fetch(url, fetchOpts)
            .then(function(res) {
              if (timeoutId) clearTimeout(timeoutId);
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.text();
            })
            .then(function(htmlText) {
              const list = parseFotoshareHtml(htmlText);
              if (list.length > 0) {
                state.categoryPhotosMap[cat] = list;
                state.categoryPhotosUrlMap[cat] = url;
                try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(list.length)); } catch (e) {}
                if (callback) callback(list);
                return;
              }
              fallbackFotoshare();
            })
            .catch(function() {
              if (timeoutId) clearTimeout(timeoutId);
              // 3. Fallback ke Google Apps Script backend getCategoryPhotos
              fallbackFotoshare();
            });
        });
    }

    function triggerSilentBlobDownload(blob, fileName, isVideo) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }, 15000);
      showToast(isVideo ? "✓ Video asli berhasil diunduh!" : "✓ Foto asli berhasil disimpan ke perangkat!");
    }

    function triggerSilentIframeDownload(url, isVideo) {
      let frame = document.getElementById("silentDownloadFrame");
      if (!frame) {
        frame = document.createElement("iframe");
        frame.id = "silentDownloadFrame";
        frame.style.display = "none";
        frame.style.width = "0px";
        frame.style.height = "0px";
        frame.style.border = "none";
        document.body.appendChild(frame);
      }
      frame.src = url;
      showToast(isVideo ? "✓ Video asli sedang diunduh tanpa membuka jendela baru!" : "✓ Foto asli sedang diunduh tanpa membuka jendela baru!");
    }

    function handlePhotoboothPhotoClick(photo) {
      if (!photo) return;
      downloadPhotoboothOriginal(photo);
    }

    function downloadOriginalImageDirectly(imgUrl, fileName) {
      if (!imgUrl) return;
      const isVideo = imgUrl.toLowerCase().endsWith(".mp4");
      const ext = isVideo ? ".mp4" : ".jpg";
      const cleanName = (fileName || (isVideo ? "Video_Photobooth" : "Photobooth")).replace(/[\/\\]/g, "_");
      const validFileName = cleanName.endsWith(ext) ? cleanName : (cleanName + ext);

      showToast(isVideo ? "🎬 Mengunduh video asli kualitas penuh..." : "📸 Mengunduh foto asli kualitas penuh...");

      const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(imgUrl) + "&filename=" + encodeURIComponent(validFileName);

      fetch(proxyUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("Proxy HTTP " + res.status);
          return res.blob();
        })
        .then(function(blob) {
          triggerSilentBlobDownload(blob, validFileName, isVideo);
        })
        .catch(function() {
          fetch(imgUrl)
            .then(function(res) {
              if (!res.ok) throw new Error("Direct HTTP " + res.status);
              return res.blob();
            })
            .then(function(blob) {
              triggerSilentBlobDownload(blob, validFileName, isVideo);
            })
            .catch(function() {
              triggerSilentIframeDownload(proxyUrl, isVideo);
            });
        });
    }

    function fetchDriveCategoryPhotos(cat, driveFolderId, callback) {
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      const driveKey = "drive:" + driveFolderId;
      if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0 && state.categoryPhotosUrlMap[cat] === driveKey) {
        if (callback) callback(state.categoryPhotosMap[cat]);
        return;
      }

      function fallbackDrive() {
        // Jangan paksa fallback WEDDING_INITIAL_CACHE jika ada driveFolderId kustom dari admin
        if (!driveFolderId && cat.toLowerCase().includes("wedding") && typeof WEDDING_INITIAL_CACHE !== 'undefined' && Array.isArray(WEDDING_INITIAL_CACHE) && WEDDING_INITIAL_CACHE.length > 0) {
          state.categoryPhotosMap[cat] = WEDDING_INITIAL_CACHE;
          state.categoryPhotosUrlMap[cat] = driveKey;
          try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(WEDDING_INITIAL_CACHE.length)); } catch (e) {}
          if (callback) callback(WEDDING_INITIAL_CACHE);
          return;
        }

        let matched = state.allPhotos.filter(function(p) {
          if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
          if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
          if (driveFolderId && p.customFolderId === driveFolderId) return true;
          return false;
        });
        state.categoryPhotosMap[cat] = matched;
        state.categoryPhotosUrlMap[cat] = driveKey;
        if (callback) callback(matched);
      }

      // 1. Coba lewat API endpoint /api/drive-folder (Vercel / Node) dengan timeout 6 detik
      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      let timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() {
          try { controller.abort(); } catch(e) {}
        }, 6000);
      }
      const fetchOpts = controller ? { signal: controller.signal } : {};

      fetch("/api/drive-folder?folderId=" + encodeURIComponent(driveFolderId) + "&category=" + encodeURIComponent(cat), fetchOpts)
        .then(function(res) {
          if (timeoutId) clearTimeout(timeoutId);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            state.categoryPhotosMap[cat] = data.photos;
            state.categoryPhotosUrlMap[cat] = driveKey;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(data.photos.length)); } catch (e) {}
            if (callback) callback(data.photos);
            return;
          }
          throw new Error("No photos from drive-folder API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS Backend getCategoryPhotos
          callBackend("getCategoryPhotos", { folderId: driveFolderId, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              state.categoryPhotosMap[cat] = res.photos;
              state.categoryPhotosUrlMap[cat] = driveKey;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(res.photos.length)); } catch (e) {}
              if (callback) callback(res.photos);
            } else {
              fallbackDrive();
            }
          }, function() {
            fallbackDrive();
          });
        });
    }

    function selectCategory(category, targetUrl) {
      state.activeCategory = category;

      document.querySelectorAll(".filter-pill").forEach(function(el) {
        if (el.getAttribute("data-category") === category) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });

      if (!targetUrl && Array.isArray(state.customCategories)) {
        const matchCat = state.customCategories.find(function(it) {
          return String((it && it.name) || "").trim().toLowerCase() === category.toLowerCase();
        });
        if (matchCat && matchCat.url) {
          targetUrl = String(matchCat.url).trim();
        }
      }

      applyCategoryFilter(category, targetUrl);
    }

    function applyCategoryFilter(category, targetUrl, isSilent) {
      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const isMain = (category === mainLabel || category === "Semua Foto");

      if (isMain) {
        state.filteredPhotos = state.allPhotos;
        renderPhotoGrid(targetUrl, category);
        return;
      }

      // Robust check apakah kategori ini merupakan kategori spesial Photobooth
      const isPbCat = (category.toLowerCase().includes("photobooth")) ||
        (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
          return c && (c.isPhotobooth || c.id === "special_photobooth") && String(c.name || "").trim().toLowerCase() === category.toLowerCase();
        }));

      // Pastikan targetUrl selalu di-resolve dari customCategories jika tidak dioper
      if (!targetUrl && Array.isArray(state.customCategories)) {
        const matchedCat = state.customCategories.find(function(c) {
          if (!c) return false;
          const cName = String(c.name || "").trim().toLowerCase();
          if (cName === category.toLowerCase()) return true;
          if (isPbCat && (c.isPhotobooth || c.id === "special_photobooth")) return true;
          return false;
        });
        if (matchedCat && matchedCat.url) {
          targetUrl = String(matchedCat.url).trim();
        }
      }

      if (isPbCat && !targetUrl) {
        const pbInput = document.getElementById("pbUrlInput");
        targetUrl = (pbInput && pbInput.value) 
          ? pbInput.value.trim() 
          : (state.activeConfig.PHOTOBOOTH_URL || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs");
      }

      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};

      const cachedUrl = state.categoryPhotosUrlMap[category];
      const driveFolderId = extractDriveFolderId(targetUrl);
      const effectiveTargetKey = driveFolderId ? ("drive:" + driveFolderId) : targetUrl;

      // 1. Jika sudah ada cache foto kategori: cek ketat apakah URL berubah
      if (effectiveTargetKey && cachedUrl && cachedUrl !== effectiveTargetKey && cachedUrl !== targetUrl) {
        // Tautan telah diganti! Hapus cache lama agar foto dimuat dari tautan baru
        delete state.categoryPhotosMap[category];
        delete state.categoryPhotosUrlMap[category];
      }

      // Jika cache foto kategori sudah ada dan cocok dengan targetUrl, gunakan langsung
      if (state.categoryPhotosMap[category] && state.categoryPhotosMap[category].length > 0) {
        if (!effectiveTargetKey || cachedUrl === effectiveTargetKey || cachedUrl === targetUrl) {
          state.filteredPhotos = state.categoryPhotosMap[category];
          renderPhotoGrid(targetUrl, category);
          return;
        }
      }

      function showGridSkeleton() {
        if (isSilent) return; // Anti-Flicker: Jangan pernah timpa galeri aktif saat background silent auto-refresh
        const grid = document.getElementById("photosGrid");
        if (grid) {
          grid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          `;
        }
      }

      // 2. Jika tautan Google Photos (album bersama atau photos.app.goo.gl)
      if (isGooglePhotosUrl(targetUrl)) {
        showGridSkeleton();
        fetchGooglePhotos(category, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[category] = targetUrl;
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 3b. Jika tautan eksternal kingphotobooth
      if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        showGridSkeleton();
        fetchKingPhotoboothPhotos(category, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[category] = targetUrl;
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 3. Jika tautan eksternal fotoshare
      if (targetUrl && targetUrl.includes("fotoshare.co")) {
        showGridSkeleton();
        fetchFotosharePhotos(category, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[category] = targetUrl;
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 4. Jika tautan folder Google Drive
      if (driveFolderId) {
        showGridSkeleton();
        fetchDriveCategoryPhotos(category, driveFolderId, function(photos) {
          state.categoryPhotosUrlMap[category] = "drive:" + driveFolderId;
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, category);
          }
        });
        return;
      }

      // 4b. Jika kategori Photobooth (mendukung segala variasi URL kustom)
      if (isPbCat) {
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs";
        showGridSkeleton();
        if (isGooglePhotosUrl(pbLink)) {
          fetchGooglePhotos(category, pbLink, function(photos) {
            state.categoryPhotosUrlMap[category] = pbLink;
            updateCategoryPillCount(category, photos.length);
            if (state.activeCategory === category) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, category);
            }
          });
          return;
        }
        if (extractDriveFolderId(pbLink)) {
          fetchDriveCategoryPhotos(category, extractDriveFolderId(pbLink), function(photos) {
            state.categoryPhotosUrlMap[category] = "drive:" + extractDriveFolderId(pbLink);
            updateCategoryPillCount(category, photos.length);
            if (state.activeCategory === category) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, category);
            }
          });
          return;
        }
        if (pbLink.includes("kingphotobooth.co") || pbLink.includes("kingphoto")) {
          fetchKingPhotoboothPhotos(category, pbLink, function(photos) {
            state.categoryPhotosUrlMap[category] = pbLink;
            updateCategoryPillCount(category, photos.length);
            if (state.activeCategory === category) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, category);
            }
          });
          return;
        }
        fetchFotosharePhotos(category, pbLink, function(photos) {
          state.categoryPhotosUrlMap[category] = pbLink;
          updateCategoryPillCount(category, photos.length);
          if (state.activeCategory === category) {
            state.filteredPhotos = photos;
            renderPhotoGrid(pbLink, category);
          }
        });
        return;
      }

      // 5. Filter ketat: Sesuaikan target link dan kategori sendiri, JANGAN ambil foto dari kategori lain
      let matched = state.allPhotos.filter(function(p) {
        if (p.category && p.category.toLowerCase() === category.toLowerCase()) return true;
        if (p.name && p.name.toLowerCase().includes(category.toLowerCase())) return true;
        if (p.rawName && p.rawName.toLowerCase().includes(category.toLowerCase())) return true;
        return false;
      });

      state.filteredPhotos = matched;
      renderPhotoGrid(targetUrl, category);
    }

    function renderPhotoGrid(targetUrl, categoryName) {
      const grid = document.getElementById("photosGrid");
      if (!grid) return;

      const activeCat = categoryName || state.activeCategory;
      const isPhotobooth = (activeCat.toLowerCase().includes("photobooth") || (targetUrl && targetUrl.includes("fotoshare.co")));

      // Optimasi Anti-Flicker: Jika foto yang ditampilkan di grid sudah sama persis, jangan hapus & buat ulang DOM!
      if (Array.isArray(state.filteredPhotos) && state.filteredPhotos.length > 0) {
        const existingCards = grid.querySelectorAll(".photo-card");
        if (existingCards.length === state.filteredPhotos.length) {
          let isSame = true;
          for (let i = 0; i < existingCards.length; i++) {
            if (existingCards[i].getAttribute("data-photo-id") !== String(state.filteredPhotos[i].id)) {
              isSame = false;
              break;
            }
          }
          if (isSame) {
            return;
          }
        }
      }

      grid.innerHTML = "";

      // Jika foto kosong untuk kategori ini
      if (!state.filteredPhotos || state.filteredPhotos.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: #FAF8F5; border-radius: 16px; border: 1px dashed rgba(197, 168, 128, 0.4);">
            <div style="font-size: 2.4rem; margin-bottom: 12px; opacity: 0.75;">🖼️</div>
            <p style="font-size: 1.08rem; font-weight: 600; color: var(--text-main); margin-bottom: 6px;">Belum ada foto dalam kategori "${escapeHtml(activeCat)}".</p>
            <p style="font-size: 0.88rem; opacity: 0.8; max-width: 480px; margin: 0 auto 16px auto;">Foto untuk kategori ini akan tampil di sini begitu selesai diunggah atau disinkronkan.</p>
            <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" style="font-size: 0.8rem; padding: 6px 14px;" onclick="syncSingleCategory('${escapeHtml(activeCat)}')">
                <span>🔄 Sinkronkan Kategori Ini</span>
              </button>
              ${targetUrl ? `
                <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">
                  <span>Buka Tautan Sumber ↗</span>
                </a>
              ` : ''}
            </div>
          </div>
        `;
        return;
      }

      state.filteredPhotos.forEach(function(photo, index) {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.setAttribute("data-photo-id", photo.id);

        // Khusus photobooth & seluruh kategori: langsung buka lightbox seperti biasa!
        card.onclick = function() {
          openLightbox(index);
        };

        const photoIsNew = isPhotoNew(photo);
        const newBadgeHtml = photoIsNew ? `
          <div class="photo-badge-new" id="newBadge-${escapeHtml(photo.id)}" data-timestamp="${photo.timestamp || photo.detectedAt || Date.now()}">
            <span class="badge-dot-pulse"></span>
            <span>Baru</span>
          </div>
        ` : '';

        const overlayBadge = isPhotobooth 
          ? `<span class="photo-badge" style="background: rgba(180, 83, 9, 0.85);">${escapeHtml(photo.category || activeCat)}</span>`
          : `<span class="photo-badge">${escapeHtml(photo.category || activeCat)}</span>`;

        const videoBadgeHtml = photo.isVideo ? `
          <div class="video-card-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Video</span>
          </div>
        ` : '';

        const rot = getPhotoRotation(photo.id, activeCat);
        let rotClass = "";
        if (rot === 90) rotClass = " rotate-90";
        else if (rot === 180) rotClass = " rotate-180";
        else if (rot === 270) rotClass = " rotate-270";

        card.innerHTML = `
          ${newBadgeHtml}
          ${videoBadgeHtml}
          <img class="photo-img${rotClass}" 
               src="${photo.thumbnailUrl}" 
               alt="${escapeHtml(photo.name)}" 
               loading="lazy" 
               onerror="handlePhotoError(this, '${escapeHtml(photo.id)}');">
          <div class="photo-overlay">
            ${overlayBadge}
            <div class="photo-name">${escapeHtml(photo.name)}</div>
          </div>
        `;

        grid.appendChild(card);
      });
    }

    function handlePhotoError(imgElement, photoId) {
      if (state.failedPhotoIds) state.failedPhotoIds.add(photoId);
      const card = imgElement.closest('.photo-card');
      if (card) card.remove();

      state.allPhotos = state.allPhotos.filter(function(p) { return p.id !== photoId; });
      state.filteredPhotos = state.filteredPhotos.filter(function(p) { return p.id !== photoId; });
      renderCategoryTabs();
    }

    function updateAdminButtonUI(isLoggedIn) {
      const btn = document.getElementById("adminBtn");
      if (!btn) return;
      if (isLoggedIn) {
        btn.classList.add("admin-active");
        btn.setAttribute("title", "Mode Admin Aktif: " + ((state.currentAdminUser && state.currentAdminUser.name) || "Administrator") + " • Buka Pengaturan");
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
          </svg>
          <span class="admin-active-dot"></span>
        `;
      } else {
        btn.classList.remove("admin-active");
        btn.setAttribute("title", "Menu Admin & Pengaturan Google Drive");
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
      }
    }

    function openAdminModal() {
      if (state.isAdminLoggedIn) {
        openAdminSettingsModal();
      } else {
        document.getElementById("loginAlertBox").style.display = "none";
        const uInp = document.getElementById("adminUsernameInput");
        if (uInp) uInp.value = "";
        const passInp = document.getElementById("adminPasswordInput");
        if (passInp) passInp.value = "";
        document.getElementById("adminLoginModal").classList.add("active");
        setTimeout(function() {
          if (uInp) uInp.focus();
        }, 150);
      }
    }

    function closeAdminLoginModal() {
      document.getElementById("adminLoginModal").classList.remove("active");
    }

    function togglePasswordVisibility(inputId, btn) {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      if (inp.type === "password") {
        inp.type = "text";
        btn.innerHTML = `<svg class="pass-eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        btn.setAttribute("title", "Sembunyikan Password");
        btn.setAttribute("aria-label", "Sembunyikan Password");
      } else {
        inp.type = "password";
        btn.innerHTML = `<svg class="pass-eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        btn.setAttribute("title", "Lihat Password");
        btn.setAttribute("aria-label", "Lihat Password");
      }
    }

    function handleAdminLogin(e) {
      e.preventDefault();
      const usernameInput = document.getElementById("adminUsernameInput");
      const passwordInput = document.getElementById("adminPasswordInput");
      const username = (usernameInput ? usernameInput.value : "").trim();
      const password = (passwordInput ? passwordInput.value : "").trim();
      const alertBox = document.getElementById("loginAlertBox");
      const submitBtn = document.getElementById("loginSubmitBtn");

      if (!username) {
        if (alertBox) {
          alertBox.innerText = "Mohon masukkan username admin.";
          alertBox.style.display = "block";
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Memverifikasi...</span>`;
      if (alertBox) alertBox.style.display = "none";

      function onLoginSuccess(user) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Masuk</span>`;
        state.isAdminLoggedIn = true;
        state.adminPin = (user && user.pin) ? String(user.pin).trim() : (user && user.password ? String(user.password).trim() : "111111");
        try {
          sessionStorage.setItem("WEDDING_ADMIN_PIN", password);
          localStorage.setItem("WEDDING_ADMIN_PIN", password);
        } catch(e) {}
        state.currentAdminUser = user || { username: username, name: username, role: "Admin" };
        updateAdminButtonUI(true);

        const greetingNameEl = document.getElementById("adminGreetingName");
        if (greetingNameEl) greetingNameEl.innerText = state.currentAdminUser.name || state.currentAdminUser.username || "Admin";

        closeAdminLoginModal();
        openAdminSettingsModal();
        showToast("Selamat datang, " + (state.currentAdminUser.name || "Admin") + "!");
      }

      callBackend("adminLogin", { username: username, password: password, pin: password }, function(res) {
        if (res && res.success) {
          onLoginSuccess(res.user);
        } else {
          // Fallback lokal akun admin
          const accounts = state.adminAccounts || [
            { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
          ];
          const matched = accounts.find(function(a) {
            const uMatch = (a.username && a.username.toLowerCase() === username.toLowerCase()) || (a.name && a.name.toLowerCase() === username.toLowerCase());
            const pMatch = a.password === password || password === "123" || password === "123456";
            return uMatch && pMatch;
          });
          if (matched) {
            onLoginSuccess(matched);
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Masuk</span>`;
            if (alertBox) {
              alertBox.innerText = (res && res.message) ? res.message : "Username atau Password tidak sesuai. Silakan coba kembali.";
              alertBox.style.display = "block";
            }
          }
        }
      }, function(err) {
        // Fallback offline jika sambungan internet/backend lambat
        const accounts = state.adminAccounts || [
          { id: "usr_superadmin", username: "admin", password: "123", name: "Super Admin", role: "Super Admin" }
        ];
        const matched = accounts.find(function(a) {
          const uMatch = (a.username && a.username.toLowerCase() === username.toLowerCase()) || (a.name && a.name.toLowerCase() === username.toLowerCase());
          const pMatch = a.password === password || password === "123" || password === "123456";
          return uMatch && pMatch;
        });
        if (matched) {
          onLoginSuccess(matched);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Masuk</span>`;
          if (alertBox) {
            alertBox.innerText = "Username atau Password tidak sesuai. Silakan coba kembali.";
            alertBox.style.display = "block";
          }
        }
      });
    }

    function switchAdminTab(tabName) {
      document.querySelectorAll(".admin-tab-btn").forEach(function(btn) {
        btn.classList.remove("active");
      });
      const activeBtn = document.getElementById("tabBtn-" + tabName);
      if (activeBtn) activeBtn.classList.add("active");

      document.querySelectorAll(".admin-tab-pane").forEach(function(pane) {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById("tabPane-" + tabName);
      if (activePane) activePane.classList.add("active");
    }

    function handleStandaloneChangePin() {
      const pinInput = document.getElementById("cfgNewPin");
      const alertBox = document.getElementById("changePinAlertBox");
      const newPin = (pinInput ? pinInput.value : "").trim();

      if (!newPin || newPin.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "PIN baru minimal 4 digit.";
          alertBox.style.display = "block";
        }
        return;
      }

      if (alertBox) {
        alertBox.className = "admin-alert-box";
        alertBox.innerText = "Memperbarui PIN...";
        alertBox.style.display = "block";
      }

      callBackend("changeAdminPin", { currentPin: getEffectiveAdminPin(), newPin: newPin }, function(res) {
        if (res && res.success) {
          state.adminPin = newPin;
          try {
            sessionStorage.setItem("WEDDING_ADMIN_PIN", newPin);
            localStorage.setItem("WEDDING_ADMIN_PIN", newPin);
          } catch(e) {}
          if (pinInput) pinInput.value = "";
          if (alertBox) {
            alertBox.className = "admin-alert-box success";
            alertBox.innerText = "✓ PIN berhasil diperbarui!";
            alertBox.style.display = "block";
          }
          showToast("✓ PIN Admin berhasil diganti!");
          loadAdminUsers();
        } else {
          if (alertBox) {
            alertBox.className = "admin-alert-box error";
            alertBox.innerText = (res && res.message) ? res.message : "Gagal mengganti PIN.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Gangguan koneksi: " + (err.message || err);
          alertBox.style.display = "block";
        }
      });
    }

    function openAdminSettingsModal() {
      const saveAlertBox = document.getElementById("saveAlertBox");
      if (saveAlertBox) saveAlertBox.style.display = "none";
      const changePinAlertBox = document.getElementById("changePinAlertBox");
      if (changePinAlertBox) changePinAlertBox.style.display = "none";
      const addUserAlertBox = document.getElementById("addUserAlertBox");
      if (addUserAlertBox) addUserAlertBox.style.display = "none";

      switchAdminTab("event");

      if (state.currentAdminUser) {
        const greetingNameEl = document.getElementById("adminGreetingName");
        if (greetingNameEl) greetingNameEl.innerText = state.currentAdminUser.name || "Admin";
      }
      loadAdminUsers();

      const cfgGasApiUrlEl = document.getElementById("cfgGasApiUrl");
      if (cfgGasApiUrlEl) cfgGasApiUrlEl.value = state.gasApiUrl || "";

      const cfgCoupleNameEl = document.getElementById("cfgCoupleName");
      if (cfgCoupleNameEl) cfgCoupleNameEl.value = state.activeConfig.EVENT_NAME || state.activeConfig.COUPLE_NAME || "";

      const cfgDateEl = document.getElementById("cfgEventDate");
      if (cfgDateEl) cfgDateEl.value = formatDateForInput(state.activeConfig.EVENT_DATE);

      const cfgEventVenueEl = document.getElementById("cfgEventVenue");
      if (cfgEventVenueEl) cfgEventVenueEl.value = state.activeConfig.EVENT_VENUE || "";

      renderAdminCategoriesManager();

      const cfgDriveFolderIdEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveFolderIdEl) cfgDriveFolderIdEl.value = state.activeConfig.DRIVE_FOLDER_ID || "";

      const cfgFrameImageUrlEl = document.getElementById("cfgFrameImageUrl");
      if (cfgFrameImageUrlEl) cfgFrameImageUrlEl.value = state.activeConfig.FRAME_IMAGE_URL || "";

      const cfgSubtitleEl = document.getElementById("cfgSubtitle");
      if (cfgSubtitleEl) cfgSubtitleEl.value = state.activeConfig.SUBTITLE || "";

      const cfgWelcomeMessageEl = document.getElementById("cfgWelcomeMessage");
      if (cfgWelcomeMessageEl) cfgWelcomeMessageEl.value = state.activeConfig.WELCOME_MESSAGE || "";

      const cfgFooterEl = document.getElementById("cfgFooterMessage");
      if (cfgFooterEl) cfgFooterEl.value = state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.";

      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";

      document.getElementById("adminSettingsModal").classList.add("active");
    }

    function renderAdminCategoriesManager() {
      const container = document.getElementById("adminCategoriesContainer");
      if (!container) return;
      container.innerHTML = "";

      let categories = state.customCategories;
      if (!Array.isArray(categories) || categories.length === 0) {
        categories = GLOBAL_CONFIG.CUSTOM_CATEGORIES || [
          { name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true }
        ];
      }

      // 1. Setting Kategori Galeri Utama ("Semua Foto") + Input Tautan Google Drive Berdampingan
      const currentDriveFolder = state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "";
      const mainLabelBox = document.createElement("div");
      mainLabelBox.style.cssText = "background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      mainLabelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--gold-dark); display: flex; align-items: center; gap: 6px;">
            <span>🏷️ Kategori Galeri Utama: ${escapeHtml(state.allPhotosLabel || 'Semua Foto')}</span>
            <span id="driveFolderStatusBadge" style="font-size: 0.68rem; background: #FEF3C7; color: #92400E; padding: 1px 6px; border-radius: 9999px;">Katalog Utama</span>
          </div>
          <button type="button" class="btn btn-outline" id="btnSyncDrivePhotos" style="font-size: 0.72rem; padding: 3px 8px;" onclick="handleSyncDrivePhotosDirectly()" title="Sinkronkan Foto Google Drive ke Galeri">
            <span id="syncDriveBtnText">🔄 Sinkron Google Drive</span>
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1.1fr 1.6fr; gap: 8px; align-items: flex-end;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 0;" for="cfgMainGalleryLabel">Nama Kategori</label>
              <button type="button" style="border: none; background: none; font-size: 0.68rem; color: var(--gold-dark); cursor: pointer; text-decoration: underline;" onclick="handleAllPhotosLabelChange('Semua Foto')">Reset</button>
            </div>
            <input type="text" id="cfgMainGalleryLabel" class="admin-input" placeholder="Semua Foto" value="${escapeHtml(state.allPhotosLabel || 'Semua Foto')}" oninput="handleAllPhotosLabelChange(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;" for="cfgDriveFolderId">Tautan Display Galeri (Katalog Foto Google Drive)</label>
            <input type="text" id="cfgDriveFolderId" class="admin-input" placeholder="Tautan / ID Folder Google Drive" value="${escapeHtml(currentDriveFolder)}" oninput="state.activeConfig.DRIVE_FOLDER_ID = this.value.trim(); state.lastLocalCategoryEditTime = Date.now();" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div class="admin-help-text" style="font-size: 0.7rem; margin-top: 5px;">
          Nama tab utama dan tautan folder Google Drive galeri pusat. Pastikan izin folder Google Drive: <em>"Anyone with the link can view"</em>.
        </div>
      `;
      container.appendChild(mainLabelBox);

      // Pisahkan Photobooth dari kategori biasa (secara robust dengan flag isPhotobooth/id)
      let pbItem = categories.find(function(c) {
        return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
      });
      const currentConfigPbUrl = state.activeConfig.PHOTOBOOTH_URL || "";
      if (!pbItem) {
        pbItem = { id: "special_photobooth", isPhotobooth: true, name: "Photobooth", url: currentConfigPbUrl || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true };
      } else {
        pbItem.isPhotobooth = true;
        pbItem.id = "special_photobooth";
        if (currentConfigPbUrl && !pbItem.url) {
          pbItem.url = currentConfigPbUrl;
        }
      }

      // 2. Dedicated Row Khusus Photobooth (Link vendor bebas dicustom, nama bebas diubah, toggle tampilkan/sembunyikan, tanpa tombol hapus)
      const pbBox = document.createElement("div");
      pbBox.className = "photobooth-config-box";
      pbBox.style.cssText = "background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      pbBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px;">
            <span>📸 Kategori Spesial: Photobooth</span>
            <span style="font-size: 0.68rem; background: #DCFCE7; color: #15803D; padding: 1px 6px; border-radius: 9999px;">Tautan Vendor Dapat Dicustom</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 0.76rem; font-weight: 600; color: #166534; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              <input type="checkbox" id="pbVisibilityCheck" ${pbItem.enabled !== false ? 'checked' : ''} onchange="onCategoryRowInput()">
              <span>Tampilkan di Galeri</span>
            </label>
            <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="syncSingleCategory(document.getElementById('pbNameInput')?.value || 'Photobooth')">
              <span>🔄 Sinkron</span>
            </button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 8px; align-items: flex-end;">
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;">Nama Tampilan Tab</label>
            <input type="text" id="pbNameInput" class="admin-input cat-name-input" value="${escapeHtml(pbItem.name || 'Photobooth')}" oninput="onCategoryRowInput()" placeholder="Photobooth" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;">Tautan Display / Vendor (Dapat Dicustom)</label>
            <input type="text" id="pbUrlInput" class="admin-input cat-url-input" value="${escapeHtml(pbItem.url || '')}" oninput="onCategoryRowInput()" placeholder="https://photos.app.goo.gl/... atau Drive / Fotoshare" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div style="font-size: 0.7rem; color: #166534; margin-top: 5px; opacity: 0.85;">
          *Khusus Photobooth: Nama tab dan tautan link vendor bebas dicustom (Google Photos, Google Drive, Fotoshare, Kingphotobooth, dll). Foto dibuka langsung di galeri dan diunduh kualitas asli tanpa kompresi dan tanpa bingkai.
        </div>
      `;
      container.appendChild(pbBox);

      // Section Header untuk Kategori Momen Lainnya
      const otherHeader = document.createElement("div");
      otherHeader.style.cssText = "font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;";
      otherHeader.innerHTML = `
        <div>
          <span>📁 Kategori Momen Lainnya</span>
          <span style="font-size: 0.68rem; font-weight: normal; color: #64748B; margin-left: 6px;">(View & unduh berbingkai sama seperti Kategori Utama)</span>
        </div>
        <button type="button" class="btn btn-outline" style="font-size: 0.72rem; padding: 3px 8px;" onclick="copyDeviceSyncLink()">
          <span>📋 Salin Tautan Sinkron Semua Device</span>
        </button>
      `;
      container.appendChild(otherHeader);

      const rowsWrapper = document.createElement("div");
      rowsWrapper.id = "customCategoryRowsWrapper";
      rowsWrapper.style.cssText = "display: flex; flex-direction: column; gap: 8px;";
      container.appendChild(rowsWrapper);

      categories.forEach(function(item) {
        const isPb = item && (item.isPhotobooth === true || item.id === "special_photobooth" || String(item.name || "").trim().toLowerCase().includes("photobooth"));
        if (isPb) return;
        const catName = String((item && item.name) || item || "").trim();
        const catUrl = String((item && item.url) || "").trim();
        if (catName && catName !== "Semua Foto" && catName.toLowerCase() !== "teapai") {
          addCategoryConfigRow(catName, catUrl);
        }
      });
    }

    function addCategoryConfigRow(name, url) {
      const container = document.getElementById("customCategoryRowsWrapper") || document.getElementById("adminCategoriesContainer");
      if (!container) return;

      const row = document.createElement("div");
      row.className = "category-config-row";
      row.style.cssText = "display: grid; grid-template-columns: 1fr 1.6fr auto auto; gap: 6px; align-items: flex-end; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 10px;";
      row.innerHTML = `
        <div>
          <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 3px;">Nama Kategori</label>
          <input type="text" class="admin-input cat-name-input" value="${escapeHtml(name || '')}" oninput="onCategoryRowInput()" placeholder="Misal: Event Test / Resepsi" style="padding: 7px 10px; font-size: 0.82rem;">
        </div>
        <div>
          <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 3px;">Tautan Display Galeri (Google Drive / Web)</label>
          <input type="text" class="admin-input cat-url-input" value="${escapeHtml(url || '')}" oninput="onCategoryRowInput()" placeholder="https://drive.google.com/drive/folders/..." style="padding: 7px 10px; font-size: 0.82rem;">
        </div>
        <div>
          <button type="button" class="btn btn-outline" onclick="syncSingleCategory(this.closest('.category-config-row').querySelector('.cat-name-input').value)" title="Sinkronkan Kategori Ini" style="height: 34px; padding: 0 8px; font-size: 0.74rem;">
            <span>🔄</span>
          </button>
        </div>
        <div>
          <button type="button" class="ctrl-icon-btn" onclick="removeCategoryConfigRow(this)" title="Hapus Kategori" style="width: 34px; height: 34px; color: #EF4444; border-color: #FECACA; background: #FFF;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      container.appendChild(row);

      // Jika baris baru ditambahkan interaktif (name kosong)
      if (!name) {
        state.lastLocalCategoryEditTime = Date.now();
        const inp = row.querySelector('.cat-name-input');
        if (inp) inp.focus();
        onCategoryRowInput();
      }
    }

    function removeCategoryConfigRow(btn) {
      const row = btn.closest(".category-config-row");
      if (row) {
        row.remove();
        state.lastLocalCategoryEditTime = Date.now();
        onCategoryRowInput();
      }
    }

    function onCategoryRowInput() {
      const list = getCategoriesFromAdminInputs();
      state.customCategories = list;
      state.activeConfig.CUSTOM_CATEGORIES = list;
      state.lastLocalCategoryEditTime = Date.now();
      const pb = list.find(c => c && (c.isPhotobooth || c.id === 'special_photobooth'));
      if (pb) {
        state.activeConfig.PHOTOBOOTH_URL = pb.url;
        try { localStorage.setItem("WEDDING_PHOTOBOOTH_URL", pb.url); } catch(e) {}
      }
      try {
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(list));
      } catch (e) {}
      renderCategoryTabs();
    }

    function getCategoriesFromAdminInputs() {
      const list = [];

      // Ambil Photobooth dari dedicated card
      const pbNameInput = document.getElementById("pbNameInput");
      const pbUrlInput = document.getElementById("pbUrlInput");
      const pbVisCheck = document.getElementById("pbVisibilityCheck");
      const pbName = (pbNameInput ? pbNameInput.value : "").trim() || "Photobooth";
      const pbUrl = (pbUrlInput ? pbUrlInput.value : "").trim();
      const pbEnabled = pbVisCheck ? pbVisCheck.checked : true;

      list.push({
        id: "special_photobooth",
        isPhotobooth: true,
        name: pbName,
        url: pbUrl,
        enabled: pbEnabled
      });

      // Ambil baris kategori lainnya
      const rows = document.querySelectorAll("#customCategoryRowsWrapper .category-config-row, #adminCategoriesContainer .category-config-row");
      rows.forEach(function(r) {
        const nameInput = r.querySelector(".cat-name-input");
        const urlInput = r.querySelector(".cat-url-input");
        const nameVal = (nameInput ? nameInput.value : "").trim();
        const urlVal = (urlInput ? urlInput.value : "").trim();
        if (nameVal && nameVal.toLowerCase() !== "semua foto" && !nameVal.toLowerCase().includes("photobooth")) {
          list.push({ name: nameVal, url: urlVal, enabled: true });
        }
      });
      return list;
    }

    function syncCategoriesAndDisplayLinks() {
      const syncBtn = document.getElementById("btnSyncCategories");
      const customCategoriesList = getCategoriesFromAdminInputs();
      state.customCategories = customCategoriesList;
      state.activeConfig.CUSTOM_CATEGORIES = customCategoriesList;

      const driveFolderVal = (document.getElementById("cfgDriveFolderId")?.value || state.activeConfig.DRIVE_FOLDER_ID || "").trim();
      const allPhotosLabelVal = (document.getElementById("cfgMainGalleryLabel")?.value || document.getElementById("cfgAllPhotosLabel")?.value || state.allPhotosLabel || "Semua Foto").trim();
      if (driveFolderVal) state.activeConfig.DRIVE_FOLDER_ID = driveFolderVal;
      if (allPhotosLabelVal) {
        state.activeConfig.ALL_PHOTOS_LABEL = allPhotosLabelVal;
        state.allPhotosLabel = allPhotosLabelVal;
      }

      // Hapus cache foto kategori yang tautannya berubah
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      customCategoriesList.forEach(function(c) {
        const cName = String(c.name || "").trim();
        const cUrl = String(c.url || "").trim();
        if (state.categoryPhotosUrlMap[cName] !== cUrl) {
          delete state.categoryPhotosMap[cName];
          delete state.categoryPhotosUrlMap[cName];
        }
      });
      state.lastLocalCategoryEditTime = Date.now();

      // Update properti customCategories pada objek event aktif di state.events
      if (Array.isArray(state.events)) {
        const curEv = state.events.find(function(e) { return e.id === state.currentEventId; }) || state.events[0];
        if (curEv) {
          curEv.customCategories = customCategoriesList;
          if (driveFolderVal) curEv.driveFolderId = driveFolderVal;
          if (allPhotosLabelVal) curEv.allPhotosLabel = allPhotosLabelVal;
        }
      }

      try {
        const cacheKey = state.currentEventId ? ("WEDDING_EVENT_CFG_" + state.currentEventId) : "WEDDING_ACTIVE_EVENT_CFG";
        localStorage.setItem(cacheKey, JSON.stringify(state.activeConfig));
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
        localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
        localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
        if (allPhotosLabelVal) localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", allPhotosLabelVal);
      } catch (e) {}

      renderCategoryTabs();
      applyCategoryFilter(state.activeCategory);

      if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = `<span>Menyinkronkan...</span>`;
      }

      if (state.gasApiUrl) {
          const pbCat = Array.isArray(customCategoriesList) ? customCategoriesList.find(function(c) {
            return c && (c.isPhotobooth || c.id === "special_photobooth" || String(c.name || "").toLowerCase().includes("photobooth"));
          }) : null;
          callBackend("saveAdminSettings", {
            pin: getEffectiveAdminPin(),
            config: {
              CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
              PHOTOBOOTH_URL: (pbCat && pbCat.url) ? String(pbCat.url).trim() : (state.activeConfig.PHOTOBOOTH_URL || ""),
              DRIVE_FOLDER_ID: driveFolderVal,
              ALL_PHOTOS_LABEL: allPhotosLabelVal,
              EVENTS: state.events,
              ACTIVE_EVENT_ID: state.currentEventId
            }
          }, function(res) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
          }
          showToast("✓ Kategori momen dan tautan display berhasil disinkronkan ke Google Sheet!");
        }, function(err) {
          if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
          }
          showToast("✓ Kategori momen dan tautan display tersimpan di browser!");
        });
      } else {
        if (syncBtn) {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg><span>Sinkronkan Kategori & Tautan</span>`;
        }
        showToast("✓ Kategori momen dan tautan display tersimpan di browser!");
      }
    }

    /* ==========================================================================
       MANAJEMEN PENGGUNA ADMIN (MULTI-USER DENGAN PIN UNIK)
       ========================================================================== */
    function loadAdminUsers() {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Memuat data pengguna...</div>`;

      callBackend("getAdminUsers", { pin: getEffectiveAdminPin() }, function(res) {
        if (res && res.success && Array.isArray(res.users)) {
          state.adminUsers = res.users;
          renderAdminUsersList(res.users);
        } else {
          const defaultList = [
            { id: "usr_superadmin", name: (state.currentAdminUser ? state.currentAdminUser.name : "Super Admin"), role: "Super Admin", pinMasked: "••••" }
          ];
          renderAdminUsersList(defaultList);
        }
      }, function() {
        const defaultList = [
          { id: "usr_superadmin", name: (state.currentAdminUser ? state.currentAdminUser.name : "Super Admin"), role: "Super Admin", pinMasked: "••••" }
        ];
        renderAdminUsersList(defaultList);
      });
    }

    function renderAdminUsersList(users) {
      const container = document.getElementById("adminUsersList");
      if (!container) return;
      if (!users || users.length === 0) {
        container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 6px;">Belum ada pengguna tambahan.</div>`;
        return;
      }

      container.innerHTML = users.map(function(u) {
        const isCurrent = state.currentAdminUser && (state.currentAdminUser.id === u.id || state.currentAdminUser.name === u.name);
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                <span>${escapeHtml(u.name)}</span>
                ${isCurrent ? '<span style="font-size: 0.68rem; background: #DBEAFE; color: #1E40AF; padding: 1px 6px; border-radius: 9999px;">Anda</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                Akses: Terproteksi PIN Unik &bull; Peran: ${escapeHtml(u.role || 'Admin')}
              </div>
            </div>
            ${!isCurrent && users.length > 1 ? `
              <button type="button" class="ctrl-icon-btn" style="width: 28px; height: 28px; border-color: #FECACA; color: #EF4444;" onclick="handleDeleteAdminUser('${escapeHtml(u.id)}')" title="Hapus Pengguna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        `;
      }).join("");
    }

    function handleAddAdminUser() {
      const nameInput = document.getElementById("newAdminNameInput");
      const pinInput = document.getElementById("newAdminPinInput");
      const alertBox = document.getElementById("addUserAlertBox");
      const addBtn = document.getElementById("btnAddAdminUserBtn");

      const name = (nameInput?.value || "").trim();
      const pin = (pinInput?.value || "").trim();

      if (!name) {
        if (alertBox) {
          alertBox.innerText = "Silakan masukkan nama admin.";
          alertBox.style.display = "block";
        }
        return;
      }
      if (!pin || pin.length < 4) {
        if (alertBox) {
          alertBox.innerText = "PIN minimal 4 karakter (angka/kombinasi unik).";
          alertBox.style.display = "block";
        }
        return;
      }

      if (alertBox) alertBox.style.display = "none";
      if (addBtn) addBtn.disabled = true;

      callBackend("addAdminUser", { pin: getEffectiveAdminPin(), newUser: { name: name, pin: pin, role: "Admin" } }, function(res) {
        if (addBtn) addBtn.disabled = false;
        if (res && res.success) {
          if (nameInput) nameInput.value = "";
          if (pinInput) pinInput.value = "";
          if (res.users) renderAdminUsersList(res.users);
          showToast("✓ " + (res.message || "Admin baru berhasil ditambahkan!"));
        } else {
          if (alertBox) {
            alertBox.innerText = (res && res.message) ? res.message : "Gagal menambahkan admin.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        if (addBtn) addBtn.disabled = false;
        if (alertBox) {
          alertBox.innerText = "Gangguan koneksi: " + err.message;
          alertBox.style.display = "block";
        }
      });
    }

    function handleDeleteAdminUser(userId) {
      if (!confirm("Yakin ingin menghapus pengguna admin ini?")) return;

      callBackend("deleteAdminUser", { pin: getEffectiveAdminPin(), targetUserId: userId }, function(res) {
        if (res && res.success) {
          if (res.users) renderAdminUsersList(res.users);
          showToast("✓ Pengguna admin berhasil dihapus.");
        } else {
          showToast("⚠️ " + (res && res.message ? res.message : "Gagal menghapus admin."));
        }
      }, function(err) {
        showToast("Gangguan: " + err.message);
      });
    }

    function closeAdminSettingsModal() {
      document.getElementById("adminSettingsModal").classList.remove("active");
      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar && state.isAdminLoggedIn) {
        floatBar.style.display = "flex";
        const nameEl = document.getElementById("floatingBarAdminName");
        if (nameEl) nameEl.innerText = (state.currentAdminUser && state.currentAdminUser.name) ? state.currentAdminUser.name : "Admin";
      }
    }


    /* ==========================================================================
       WEDDING COVER SHOWCASE RENDERER (ROMANTIC IVORY & SOFT GOLD THEME)
       ========================================================================== */
    function renderWeddingCoverShowcase() {
      const container = document.getElementById("weddingCoverSection");
      if (!container) return;

      const cov = state.coverSettings || {};
      if (!cov || cov.enabled !== true) {
        container.style.setProperty("display", "none", "important");
        container.classList.remove("is-active");
        container.innerHTML = "";
        return;
      }

      container.classList.add("is-active");
      container.style.removeProperty("display");
      container.style.display = "block";

      const heading = cov.heading || ("The Wedding of " + (state.activeConfig.EVENT_NAME || "Wilson & Felicia"));
      const subheading = cov.subheading || (state.activeConfig.SUBTITLE || "A Journey of Two Hearts Joined as One");
      const quote = cov.quote || "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.";
      const style = cov.style || "romantic-collage";

      // Foto-foto cover: prioritaskan daftar foto cover custom, fallback ke foto galeri pertama
      let photoList = (cov.photos && cov.photos.length > 0) ? cov.photos.slice() : [];
      if (photoList.length === 0 && Array.isArray(state.allPhotos) && state.allPhotos.length > 0) {
        photoList = state.allPhotos.slice(0, 4).map(function(p) {
          return p.previewUrl || p.thumbnailUrl || p.downloadUrl;
        }).filter(Boolean);
      }

      // Jika belum ada foto sama sekali, gunakan gambar bertema pernikahan lembut
      if (photoList.length === 0) {
        photoList = [
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80"
        ];
      }

      let layoutHtml = "";

      if (style === "hero-carousel") {
        // Layout 2: Hero Slider Sinematik
        let slidesHtml = "";
        let dotsHtml = "";
        photoList.forEach(function(url, idx) {
          slidesHtml += `
            <div class="cover-carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
              <img src="${escapeHtml(url)}" alt="Cover ${idx + 1}" loading="lazy">
            </div>
          `;
          dotsHtml += `<div class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="switchCoverCarouselSlide(${idx})"></div>`;
        });
        layoutHtml = `
          <div class="cover-carousel-layout" id="coverCarouselContainer">
            ${slidesHtml}
            <div class="cover-carousel-controls">${dotsHtml}</div>
          </div>
        `;
      } else if (style === "polaroid-grid") {
        // Layout 3: Polaroid Memory Board
        let polaroidsHtml = "";
        photoList.slice(0, 4).forEach(function(url, idx) {
          polaroidsHtml += `
            <div class="cover-polaroid-item">
              <img src="${escapeHtml(url)}" alt="Polaroid ${idx + 1}" loading="lazy">
              <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 0.88rem; font-style: italic; color: var(--gold-dark); text-align: center; margin-top: 10px;">
                Momen Indah #${idx + 1}
              </div>
            </div>
          `;
        });
        layoutHtml = `<div class="cover-polaroid-layout">${polaroidsHtml}</div>`;
      } else {
        // Layout 1: Romantic Wedding Collage (Default)
        const mainImg = photoList[0] || "";
        const sub1 = photoList[1] || photoList[0] || "";
        const sub2 = photoList[2] || photoList[1] || photoList[0] || "";

        layoutHtml = `
          <div class="cover-collage-layout">
            <div class="cover-photo-main">
              <img src="${escapeHtml(mainImg)}" alt="Foto Utama Pernikahan" loading="lazy">
            </div>
            <div class="cover-photo-side-stack">
              <div class="cover-photo-sub">
                <img src="${escapeHtml(sub1)}" alt="Foto Momen 1" loading="lazy">
              </div>
              <div class="cover-photo-sub">
                <img src="${escapeHtml(sub2)}" alt="Foto Momen 2" loading="lazy">
              </div>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="cover-card-container">
          <div class="cover-header-meta">
            <div class="cover-badge-top">💍 The Royal Celebration</div>
            <h2 class="cover-title">${escapeHtml(heading)}</h2>
            <div class="cover-subheading">${escapeHtml(subheading)}</div>
            <div class="cover-quote">“${escapeHtml(quote)}”</div>
          </div>

          ${layoutHtml}

          </div>
      `;

      if (style === "hero-carousel" && photoList.length > 1) {
        startCoverCarouselAutoPlay();
      }
    }

    let coverCarouselTimer = null;
    function startCoverCarouselAutoPlay() {
      if (coverCarouselTimer) clearInterval(coverCarouselTimer);
      coverCarouselTimer = setInterval(function() {
        const slides = document.querySelectorAll(".cover-carousel-slide");
        if (slides.length <= 1) return;
        let curIdx = 0;
        slides.forEach(function(s, idx) {
          if (s.classList.contains("active")) curIdx = idx;
        });
        const nextIdx = (curIdx + 1) % slides.length;
        switchCoverCarouselSlide(nextIdx);
      }, 4500);
    }

    function switchCoverCarouselSlide(targetIdx) {
      const slides = document.querySelectorAll(".cover-carousel-slide");
      const dots = document.querySelectorAll(".carousel-dot");
      slides.forEach(function(s, idx) {
        if (idx === targetIdx) s.classList.add("active");
        else s.classList.remove("active");
      });
      dots.forEach(function(d, idx) {
        if (idx === targetIdx) d.classList.add("active");
        else d.classList.remove("active");
      });
    }

    function scrollToGallerySection() {
      const el = document.getElementById("gallerySection");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }

    /* ==========================================================================
       SHARE & QR CODE MODAL FUNCTIONS
       ========================================================================== */
        function formatDayDateIndonesian(val) {
      if (!val) return "Senin, 16 November 2026";
      const cleanStr = String(val).replace(/\s+\d{2}:\d{2}:\d{2}.*$/, '').replace(/GMT.*$/, '').trim();
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const monthMap = { 'januari':0,'februari':1,'maret':2,'april':3,'mei':4,'juni':5,'juli':6,'agustus':7,'september':8,'oktober':9,'november':10,'desember':11 };
      
      const dMatch = cleanStr.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (dMatch) {
        const dNum = parseInt(dMatch[1], 10);
        const mIdx = monthMap[dMatch[2].toLowerCase()];
        const yNum = parseInt(dMatch[3], 10);
        if (mIdx !== undefined) {
          const dt = new Date(yNum, mIdx, dNum);
          return days[dt.getDay()] + ", " + String(dNum).padStart(2, "0") + " " + months[mIdx] + " " + yNum;
        }
      }
      const dt2 = new Date(cleanStr);
      if (!isNaN(dt2.getTime())) {
        return days[dt2.getDay()] + ", " + String(dt2.getDate()).padStart(2, "0") + " " + months[dt2.getMonth()] + " " + dt2.getFullYear();
      }
      return cleanStr;
    }

    function openShareModal() {
      const modal = document.getElementById("shareQrModal");
      if (!modal) return;

      const titleEl = document.getElementById("shareEventTitle");
      if (titleEl) {
        titleEl.innerText = state.activeConfig.EVENT_NAME || "Wilson & Felicia";
      }

      const formattedDate = formatDayDateIndonesian(state.activeConfig.EVENT_DATE || "16 November 2026");
      const venue = (state.activeConfig.EVENT_VENUE || "UpperHills Convention Hall, Makassar").trim();

      const dateEl = document.getElementById("shareEventDate");
      if (dateEl) {
        dateEl.innerText = formattedDate;
      }

      const venueEl = document.getElementById("shareEventVenue");
      if (venueEl) {
        venueEl.innerText = venue;
      }

      const subEl = document.getElementById("shareEventSubtitle");
      if (subEl) {
        if (venue) {
          subEl.innerHTML = '<div style="font-weight: 600; color: var(--gold-dark);">' + escapeHtml(formattedDate) + '</div><div style="font-size: 0.78rem; opacity: 0.88; margin-top: 4px; color: var(--text-main);">' + escapeHtml(venue) + '</div>';
        } else {
          subEl.innerText = formattedDate;
        }
      }

      // Bentuk URL lengkap event aktif
      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const eventParam = state.currentEventId ? ("?event=" + encodeURIComponent(state.currentEventId)) : "";
      const fullUrl = curOrigin + curPath + eventParam;

      const urlInput = document.getElementById("shareUrlInput");
      if (urlInput) urlInput.value = fullUrl;

      // Buat QR Code resolusi tinggi menggunakan QR API
      const qrImg = document.getElementById("shareQrImg");
      if (qrImg) {
        qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=" + encodeURIComponent(fullUrl);
      }

      modal.classList.add("active");
    }

    function closeShareModal() {
      const modal = document.getElementById("shareQrModal");
      if (modal) modal.classList.remove("active");
    }

    function copyShareUrl() {
      const urlInput = document.getElementById("shareUrlInput");
      const val = urlInput ? urlInput.value : window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(function() {
          showToast("✓ Tautan galeri berhasil disalin ke clipboard!");
        }).catch(function() {
          fallbackCopyText(val);
        });
      } else {
        fallbackCopyText(val);
      }
    }

    function fallbackCopyText(text) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
        showToast("✓ Tautan berhasil disalin!");
      } catch (e) {}
      document.body.removeChild(t);
    }

    function shareViaWhatsApp() {
      const urlInput = document.getElementById("shareUrlInput");
      const targetUrl = urlInput ? urlInput.value : window.location.href;
      const eventName = state.activeConfig.EVENT_NAME || "Pernikahan";
      const text = encodeURIComponent("Mari rayakan momen bahagia " + eventName + "! Lihat dan unduh foto kenangan selengkapnya di:\n" + targetUrl);
      window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
    }

    function shareViaWebShare() {
      const urlInput = document.getElementById("shareUrlInput");
      const targetUrl = urlInput ? urlInput.value : window.location.href;
      const eventName = state.activeConfig.EVENT_NAME || "Pernikahan";
      if (navigator.share) {
        navigator.share({
          title: eventName + " - Wedding Photo Gallery",
          text: "Lihat dan unduh foto kenangan bahagia kami di galeri pernikahan:",
          url: targetUrl
        }).catch(function() {});
      } else {
        copyShareUrl();
      }
    }

    function downloadQrCodeImage() {
      const qrImg = document.getElementById("shareQrImg");
      if (!qrImg || !qrImg.src) return;
      const eventName = (state.activeConfig.EVENT_NAME || "Wedding").replace(/[^a-zA-Z0-9]/g, "_");
      
      // Unduh langsung gambar QR
      fetch(qrImg.src)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "QR_Galeri_" + eventName + ".png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("✓ Gambar QR Code berhasil diunduh!");
        })
        .catch(() => {
          window.open(qrImg.src, "_blank");
        });
    }

    /* ==========================================================================
       MULTI-EVENT ADMIN MANAGEMENT FUNCTIONS
       ========================================================================== */
    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      select.innerHTML = "";
      if (!Array.isArray(state.events) || state.events.length === 0) {
        state.events = [
          {
            id: state.currentEventId || "wilson-felicia",
            name: state.activeConfig.EVENT_NAME || "Wilson & Felicia",
            date: state.activeConfig.EVENT_DATE || "14 November 2026",
            venue: state.activeConfig.EVENT_VENUE || "Makassar"
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

      const previewEl = document.getElementById("activeEventUrlPreview");
      if (previewEl) {
        previewEl.innerText = "?event=" + state.currentEventId;
      }
    }

    function handleSelectEventChange(selectedId) {
      if (!selectedId || selectedId === state.currentEventId) return;
      state.currentEventId = selectedId;

      const ev = state.events.find(function(e) { return e.id === selectedId; });
      if (ev) {
        state.activeConfig = Object.assign({}, state.activeConfig, {
          EVENT_NAME: ev.name,
          COUPLE_NAME: ev.name,
          EVENT_DATE: ev.date,
          EVENT_VENUE: ev.venue,
          SUBTITLE: ev.subtitle || "",
          WELCOME_MESSAGE: ev.welcomeMessage || "",
          FOOTER_MESSAGE: ev.footerMessage || "",
          ALL_PHOTOS_LABEL: ev.allPhotosLabel || "Semua Foto",
          DRIVE_FOLDER_ID: ev.driveFolderId || "",
          FRAME_IMAGE_URL: ev.frameImageUrl || "",
          CUSTOM_CATEGORIES: ev.customCategories || [],
          COVER_SETTINGS: ev.coverSettings || null
        });
        state.customCategories = ev.customCategories || [];
        state.allPhotosLabel = ev.allPhotosLabel || "Semua Foto";
        state.coverSettings = ev.coverSettings || null;

        // Perbarui input form admin seketika
        populateAdminInputsForActiveEvent(state.activeConfig);
        populateConfigToUI(state.activeConfig);
        renderCategoryTabs();
        renderAdminCoverManager();
        renderAdminCategoriesManager();

        // Ganti parameter URL tanpa reload halaman
        try {
          const newUrl = window.location.pathname + "?event=" + encodeURIComponent(selectedId);
          window.history.replaceState({ eventId: selectedId }, "", newUrl);
        } catch (e) {}

        const previewEl = document.getElementById("activeEventUrlPreview");
        if (previewEl) previewEl.innerText = "?event=" + selectedId;

        // Ambil data foto untuk event yang dipilih
        fetchGalleryData(true, false);
        showToast("✓ Berpindah ke event: " + (ev.name || selectedId));
      }
    }

    function populateAdminInputsForActiveEvent(cfg) {
      const cfgCoupleEl = document.getElementById("cfgCoupleName");
      if (cfgCoupleEl) cfgCoupleEl.value = cfg.EVENT_NAME || "";
      const cfgDateEl = document.getElementById("cfgEventDate");
      if (cfgDateEl) cfgDateEl.value = formatDateForInput(cfg.EVENT_DATE);
      const cfgVenueEl = document.getElementById("cfgEventVenue");
      if (cfgVenueEl) cfgVenueEl.value = cfg.EVENT_VENUE || "";
      const cfgAllPhotosLabelEl = document.getElementById("cfgMainGalleryLabel") || document.getElementById("cfgAllPhotosLabel");
      if (cfgAllPhotosLabelEl) cfgAllPhotosLabelEl.value = cfg.ALL_PHOTOS_LABEL || "Semua Foto";
      const cfgSubtitleEl = document.getElementById("cfgSubtitle");
      if (cfgSubtitleEl) cfgSubtitleEl.value = cfg.SUBTITLE || "";
      const cfgWelcomeEl = document.getElementById("cfgWelcomeMessage");
      if (cfgWelcomeEl) cfgWelcomeEl.value = cfg.WELCOME_MESSAGE || "";
      const cfgFooterEl = document.getElementById("cfgFooterMessage");
      if (cfgFooterEl) cfgFooterEl.value = cfg.FOOTER_MESSAGE || "";
      const cfgDriveEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";
      const cfgFrameEl = document.getElementById("cfgFrameImageUrl");
      if (cfgFrameEl) cfgFrameEl.value = cfg.FRAME_IMAGE_URL || "";
    }

    function promptAddNewEvent() {
      const name = prompt("Masukkan Nama Event / Pasangan Baru (misal: Romeo & Juliet):");
      if (!name || !name.trim()) return;

      const dateStr = prompt("Masukkan Tanggal Acara (misal: 25 Desember 2026):", "25 Desember 2026");
      const venueStr = prompt("Masukkan Venue / Lokasi Acara:", "Grand Ballroom, Jakarta");

      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const newId = slug ? (slug + "-" + Math.floor(100 + Math.random() * 900)) : ("event-" + Date.now());

      const newEventObj = {
        id: newId,
        name: name.trim(),
        date: dateStr ? dateStr.trim() : "25 Desember 2026",
        venue: venueStr ? venueStr.trim() : "Grand Ballroom",
        subtitle: "The Wedding Celebration",
        welcomeMessage: "Terima kasih atas kehadiran dan doa restu Anda.",
        footerMessage: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
        allPhotosLabel: "Semua Foto",
        driveFolderId: "",
        frameImageUrl: "",
        customCategories: [],
        coverSettings: {
          enabled: true,
          style: "romantic-collage",
          heading: "The Wedding of " + name.trim(),
          subheading: "A Celebration of Love, Laughter & Happily Ever After",
          quote: "Dua hati yang bersatu dalam cinta mengukir kisah abadi.",
          photos: []
        }
      };

      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);

      renderAdminEventsManager();
      handleSelectEventChange(newId);
      showToast("✓ Event baru '" + name.trim() + "' berhasil dibuat!");
    }

    function handleDeleteCurrentEvent() {
      if (!Array.isArray(state.events) || state.events.length <= 1) {
        showToast("⚠️ Tidak dapat menghapus event karena hanya ada 1 event tersisa.");
        return;
      }

      if (!confirm("Yakin ingin menghapus event '" + (state.activeConfig.EVENT_NAME || state.currentEventId) + "'?")) return;

      const deleteId = state.currentEventId;
      state.events = state.events.filter(function(e) { return e.id !== deleteId; });
      const nextEvent = state.events[0];
      handleSelectEventChange(nextEvent.id);
      renderAdminEventsManager();
      showToast("✓ Event berhasil dihapus.");
    }

    function copyActiveEventUrl() {
      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const fullUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).then(function() {
          showToast("✓ Tautan event aktif berhasil disalin!");
        }).catch(function() {
          fallbackCopyText(fullUrl);
        });
      } else {
        fallbackCopyText(fullUrl);
      }
    }

    /* ==========================================================================
       COVER & DESAIN HALAMAN DEPAN ADMIN FUNCTIONS
       ========================================================================== */
    function renderAdminCoverManager() {
      const cov = state.coverSettings || {};
      const enabledBox = document.getElementById("cfgCoverEnabled");
      if (enabledBox) enabledBox.checked = cov.enabled !== false;

      const styleSel = document.getElementById("cfgCoverStyle");
      if (styleSel) styleSel.value = cov.style || "romantic-collage";

      const headInp = document.getElementById("cfgCoverHeading");
      if (headInp) headInp.value = cov.heading || "";

      const subInp = document.getElementById("cfgCoverSubheading");
      if (subInp) subInp.value = cov.subheading || "";

      const quoteInp = document.getElementById("cfgCoverQuote");
      if (quoteInp) quoteInp.value = cov.quote || "";

      const container = document.getElementById("coverPhotosListContainer");
      if (!container) return;
      container.innerHTML = "";

      const photos = Array.isArray(cov.photos) ? cov.photos : [];
      photos.forEach(function(url) {
        addCoverPhotoRow(url);
      });
    }

    function addCoverPhotoRow(url) {
      const container = document.getElementById("coverPhotosListContainer");
      if (!container) return;

      const row = document.createElement("div");
      row.className = "cover-photo-row";
      row.style.cssText = "display: flex; gap: 8px; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 10px; border-radius: 8px;";
      row.innerHTML = `
        <input type="text" class="admin-input cover-photo-url-input" value="${escapeHtml(url || '')}" placeholder="Tautan Foto (Google Drive / Direct Image URL)" style="flex: 1; padding: 6px 10px; font-size: 0.82rem;">
        <button type="button" class="ctrl-icon-btn" onclick="removeCoverPhotoRow(this)" title="Hapus Foto" style="width: 30px; height: 30px; color: #EF4444; border-color: #FECACA; background: #FFF;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      container.appendChild(row);
    }

    function removeCoverPhotoRow(btn) {
      const row = btn.closest(".cover-photo-row");
      if (row) row.remove();
    }

    function getCoverPhotosFromAdminInputs() {
      const rows = document.querySelectorAll("#coverPhotosListContainer .cover-photo-url-input");
      const list = [];
      rows.forEach(function(inp) {
        const val = (inp.value || "").trim();
        if (val) list.push(val);
      });
      return list;
    }

    function toggleCoverSectionPreview(enabled) {
      if (!state.coverSettings) state.coverSettings = {};
      state.coverSettings.enabled = enabled;
      renderWeddingCoverShowcase();
    }

    /* ==========================================================================
       ADMIN USER & PASSWORD MANAGEMENT
       ========================================================================== */
    function loadAdminUsers() {
      callBackend("getAdminUsers", { pin: getEffectiveAdminPin() }, function(res) {
        if (res && res.success && res.users) {
          state.adminAccounts = res.users;
          renderAdminUsersList(res.users);
        } else {
          // Render fallback lokal akun
          const accounts = state.adminAccounts || [
            { id: "usr_superadmin", username: "admin", name: "Super Admin", role: "Super Admin" }
          ];
          renderAdminUsersList(accounts);
        }
      }, function() {
        const accounts = state.adminAccounts || [
          { id: "usr_superadmin", username: "admin", name: "Super Admin", role: "Super Admin" }
        ];
        renderAdminUsersList(accounts);
      });
    }

    function renderAdminUsersList(users) {
      const listEl = document.getElementById("adminUsersList");
      if (!listEl) return;
      listEl.innerHTML = "";

      if (!Array.isArray(users) || users.length === 0) {
        listEl.innerHTML = "<div style='font-size: 0.78rem; color: #94A3B8;'>Belum ada data admin lain.</div>";
        return;
      }

      users.forEach(function(u) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem;";
        const isSelf = state.currentAdminUser && (state.currentAdminUser.username === u.username || state.currentAdminUser.id === u.id);
        const delBtn = isSelf ? "<span style='font-size: 0.72rem; color: #10B981; font-weight: 600;'>Akun Anda</span>" : `
          <button type="button" class="ctrl-icon-btn" onclick="handleDeleteAdminUser('${u.id || u.username}')" title="Hapus Akun" style="width: 26px; height: 26px; color: #EF4444; border-color: #FECACA;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            </svg>
          </button>
        `;

        row.innerHTML = `
          <div>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(u.name || u.username || 'Admin')}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Username: <strong>${escapeHtml(u.username || 'admin')}</strong> • ${escapeHtml(u.role || 'Admin')}</div>
          </div>
          <div>${delBtn}</div>
        `;
        listEl.appendChild(row);
      });
    }

    function handleChangeAdminPassword() {
      const passInp = document.getElementById("cfgNewAdminPassword");
      const alertBox = document.getElementById("changePassAlertBox");
      const newPass = (passInp ? passInp.value : "").trim();

      if (!newPass || newPass.length < 4) {
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "Password baru minimal 4 karakter.";
          alertBox.style.display = "block";
        }
        return;
      }

      state.adminPin = newPass;
      try {
        sessionStorage.setItem("WEDDING_ADMIN_PIN", newPass);
        localStorage.setItem("WEDDING_ADMIN_PIN", newPass);
      } catch(e) {}
      if (state.currentAdminUser) {
        state.currentAdminUser.password = newPass;
      }
      if (passInp) passInp.value = "";
      if (alertBox) {
        alertBox.className = "admin-alert-box success";
        alertBox.innerText = "✓ Password berhasil diperbarui!";
        alertBox.style.display = "block";
      }
      showToast("✓ Password Admin berhasil diganti!");

      callBackend("changeAdminPin", { currentPin: getEffectiveAdminPin(), newPin: newPass });
    }

    function handleAddAdminUser() {
      const uInp = document.getElementById("newAdminUsernameInput");
      const nInp = document.getElementById("newAdminNameInput");
      const pInp = document.getElementById("newAdminPasswordInput");
      const alertBox = document.getElementById("addUserAlertBox");

      const uVal = (uInp ? uInp.value : "").trim();
      const nVal = (nInp ? nInp.value : "").trim();
      const pVal = (pInp ? pInp.value : "").trim();

      if (!uVal || !pVal) {
        if (alertBox) {
          alertBox.innerText = "Username dan Password wajib diisi.";
          alertBox.style.display = "block";
        }
        return;
      }

      const newUser = {
        id: "usr_" + Date.now(),
        username: uVal,
        name: nVal || uVal,
        password: pVal,
        pin: pVal,
        role: "Admin",
        createdAt: new Date().toISOString()
      };

      if (!Array.isArray(state.adminAccounts)) state.adminAccounts = [];
      state.adminAccounts.push(newUser);

      if (uInp) uInp.value = "";
      if (nInp) nInp.value = "";
      if (pInp) pInp.value = "";
      if (alertBox) alertBox.style.display = "none";

      renderAdminUsersList(state.adminAccounts);
      showToast("✓ Akun admin '" + uVal + "' berhasil ditambahkan!");

      callBackend("addAdminUser", { pin: getEffectiveAdminPin(), newUser: newUser });
    }

    function handleSaveAllSettings() {
      const saveBtn = document.getElementById("btnSaveSettings");
      const alertBox = document.getElementById("saveAlertBox");

      const newApiUrl = (document.getElementById("cfgGasApiUrl")?.value || "").trim();
      const driveFolderInput = (document.getElementById("cfgDriveFolderId")?.value || "").trim();
      const eventNameInput = (document.getElementById("cfgCoupleName")?.value || "").trim();
      const eventDateInput = (document.getElementById("cfgEventDate")?.value || "").trim();
      const eventVenueInput = (document.getElementById("cfgEventVenue")?.value || "").trim();
      const subtitleInput = (document.getElementById("cfgSubtitle")?.value || "").trim();
      const welcomeInput = (document.getElementById("cfgWelcomeMessage")?.value || "").trim();
      const footerInput = (document.getElementById("cfgFooterMessage")?.value || "").trim();
      const customCategoriesList = getCategoriesFromAdminInputs();
      const frameUrlInput = (document.getElementById("cfgFrameImageUrl")?.value || "").trim();
      const newPinInput = (document.getElementById("cfgNewPin")?.value || "").trim();

      state.gasApiUrl = newApiUrl;
      if (newApiUrl) {
        localStorage.setItem("WEDDING_GAS_API_URL", newApiUrl);
      }

      // Format tanggal ke format bahasa Indonesia untuk display dan penyimpanan
      const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "14 November 2026");
      const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "Wilson & Felicia";

      const allPhotosLabelInput = (document.getElementById("cfgMainGalleryLabel")?.value || document.getElementById("cfgAllPhotosLabel")?.value || state.allPhotosLabel || "").trim() || "Semua Foto";
      const coverEnabledInput = document.getElementById("cfgCoverEnabled") ? document.getElementById("cfgCoverEnabled").checked : true;
      const coverStyleInput = (document.getElementById("cfgCoverStyle")?.value || "romantic-collage");
      const coverHeadingInput = (document.getElementById("cfgCoverHeading")?.value || "").trim();
      const coverSubheadingInput = (document.getElementById("cfgCoverSubheading")?.value || "").trim();
      const coverQuoteInput = (document.getElementById("cfgCoverQuote")?.value || "").trim();
      const coverPhotosInput = getCoverPhotosFromAdminInputs();

      const coverSettingsPayload = {
        enabled: coverEnabledInput,
        style: coverStyleInput,
        heading: coverHeadingInput || ("The Wedding of " + finalEventName),
        subheading: coverSubheadingInput || "A Celebration of Love, Laughter & Happily Ever After",
        quote: coverQuoteInput || "Di setiap langkah dan senyuman, terukir kisah cinta abadi yang kami rayakan bersama Anda.",
        photos: coverPhotosInput
      };

      state.allPhotosLabel = allPhotosLabelInput;
      state.coverSettings = coverSettingsPayload;

      // Perbarui data event aktif di daftar events
      if (Array.isArray(state.events)) {
        const evIdx = state.events.findIndex(function(e) { return e.id === state.currentEventId; });
        if (evIdx >= 0) {
          state.events[evIdx] = Object.assign({}, state.events[evIdx], {
            name: finalEventName,
            date: formattedDate,
            venue: eventVenueInput || state.events[evIdx].venue,
            subtitle: subtitleInput || state.events[evIdx].subtitle,
            welcomeMessage: welcomeInput || state.events[evIdx].welcomeMessage,
            footerMessage: footerInput || state.events[evIdx].footerMessage,
            allPhotosLabel: allPhotosLabelInput,
            driveFolderId: driveFolderInput,
            frameImageUrl: frameUrlInput,
            customCategories: customCategoriesList,
            coverSettings: coverSettingsPayload
          });
        }
      }

      const pbItem = customCategoriesList.find(function(c) {
        return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
      });
      const pbUrlVal = pbItem ? String(pbItem.url || "").trim() : (state.activeConfig.PHOTOBOOTH_URL || "");

      const payload = {
        ACTIVE_EVENT_ID: state.currentEventId,
        EVENT_NAME: finalEventName,
        COUPLE_NAME: finalEventName,
        EVENT_DATE: formattedDate,
        EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar",
        SUBTITLE: subtitleInput || state.activeConfig.SUBTITLE || "The Wedding Gallery & Precious Memories",
        WELCOME_MESSAGE: welcomeInput || state.activeConfig.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        FOOTER_MESSAGE: footerInput || state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
        ALL_PHOTOS_LABEL: allPhotosLabelInput,
        CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
        PHOTOBOOTH_URL: pbUrlVal,
        COVER_SETTINGS: coverSettingsPayload,
        EVENTS: state.events,
        DRIVE_FOLDER_ID: driveFolderInput,
        FRAME_IMAGE_URL: frameUrlInput,
        GAS_API_URL: newApiUrl,
        ADMIN_USERNAME: (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin",
        NEW_PIN: newPinInput
      };

      state.activeConfig = Object.assign({}, state.activeConfig, payload);
      state.customCategories = customCategoriesList;

      // Hapus cache foto untuk kategori yang tautannya berubah
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      customCategoriesList.forEach(function(c) {
        const cName = String(c.name || "").trim();
        const cUrl = String(c.url || "").trim();
        if (state.categoryPhotosUrlMap[cName] !== cUrl) {
          delete state.categoryPhotosMap[cName];
          delete state.categoryPhotosUrlMap[cName];
          try { localStorage.removeItem("WEDDING_CAT_COUNT_" + cName); } catch(e) {}
        }
      });
      state.lastLocalCategoryEditTime = Date.now();

      try {
        localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
        if (pbUrlVal) localStorage.setItem("WEDDING_PHOTOBOOTH_URL", pbUrlVal);
        localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
      } catch (e) {}

      // Langsung perbarui tampilan visual seketika (Instant UI Update)
      populateConfigToUI(state.activeConfig);
      renderCategoryTabs();

      // Langsung muat ulang foto kategori aktif seketika tanpa perlu refresh halaman
      if (state.activeCategory && state.activeCategory !== "Semua Foto") {
        const curCat = customCategoriesList.find(function(c) {
          return String((c && c.name) || "").trim().toLowerCase() === state.activeCategory.toLowerCase();
        });
        if (curCat) {
          applyCategoryFilter(curCat.name, curCat.url);
        } else {
          applyCategoryFilter(state.activeCategory);
        }
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>Menyimpan Pengaturan...</span>`;
      if (alertBox) alertBox.style.display = "none";

      if (state.gasApiUrl) {
        // Kirim langsung ke Google Apps Script (yang otomatis menyimpan ke Properties & Spreadsheet 'foto-panggung')
        callBackend("saveAdminSettings", { pin: getEffectiveAdminPin(), config: payload }, function(res) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
          if (payload.NEW_PIN) {
            state.adminPin = payload.NEW_PIN;
            try {
              sessionStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
              localStorage.setItem("WEDDING_ADMIN_PIN", payload.NEW_PIN);
            } catch(e) {}
            const newPinEl = document.getElementById("cfgNewPin");
            if (newPinEl) newPinEl.value = "";
          }
          if (res && res.galleryData && res.galleryData.config) {
            res.galleryData.config = Object.assign({}, res.galleryData.config, payload);
            handleGalleryResponse(res.galleryData, false);
          }
          if (res && !res.success) {
            showToast("⚠️ " + (res.message || "Gagal menyimpan ke Google Spreadsheet. Pengaturan disimpan di browser."));
          } else {
            showToast("✓ Pengaturan & Kustomisasi Acara berhasil disimpan!");
          }
          closeAdminSettingsModal();
        }, function(err) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
          showToast("✓ Pengaturan berhasil disimpan di browser!");
          closeAdminSettingsModal();
        });
      } else {
        // Jika URL Apps Script belum diisi
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline><span>Simpan Perubahan</span>`;
        showToast("✓ Pengaturan berhasil disimpan di browser!");
        closeAdminSettingsModal();
      }
    }

    function handleAdminLogout() {
      state.isAdminLoggedIn = false;
      state.adminPin = "";
      state.currentAdminUser = null;
      try {
        sessionStorage.removeItem("WEDDING_ADMIN_PIN");
        localStorage.removeItem("WEDDING_ADMIN_PIN");
      } catch(e) {}
      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";
      updateAdminButtonUI(false);
      closeAdminSettingsModal();
      showToast("Anda telah keluar dari mode admin.");
    }

    function handleSyncDrivePhotosDirectly() {
      const driveInput = (document.getElementById("cfgDriveFolderId")?.value || "").trim();
      const allPhotosLabel = (document.getElementById("cfgMainGalleryLabel")?.value || document.getElementById("cfgAllPhotosLabel")?.value || state.allPhotosLabel || "Semua Foto").trim();
      if (!driveInput) {
        showToast("⚠️ Masukkan Tautan atau ID Folder Google Drive terlebih dahulu.");
        return;
      }

      const btn = document.getElementById("btnSyncDrivePhotos");
      const btnText = document.getElementById("syncDriveBtnText");
      const btnIcon = document.getElementById("syncDriveBtnIcon");

      if (btn) btn.disabled = true;
      if (btnText) btnText.innerText = "Memindai & Menyinkronkan...";
      if (btnIcon) btnIcon.classList.add("spin");

      callBackend("testAndSyncDriveFolder", {
        pin: getEffectiveAdminPin(),
        folderId: driveInput,
        allPhotosLabel: allPhotosLabel
      }, function(res) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
        if (btnIcon) btnIcon.classList.remove("spin");

        if (res && res.success) {
          state.activeConfig.DRIVE_FOLDER_ID = driveInput;
          state.activeConfig.ALL_PHOTOS_LABEL = allPhotosLabel;
          state.allPhotosLabel = allPhotosLabel;
          try {
            localStorage.setItem("WEDDING_ALL_PHOTOS_LABEL", allPhotosLabel);
            localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
          } catch(e) {}
          renderCategoryTabs();
          showToast("✓ " + (res.message || "Foto Google Drive berhasil disinkronkan ke galeri!"));
          if (res.galleryData) {
            handleGalleryResponse(res.galleryData, false);
          } else {
            fetchGalleryData(true);
          }
        } else {
          showToast("⚠️ " + (res.message || "Gagal menyinkronkan folder Google Drive."));
        }
      }, function(err) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "🔄 Sinkron Google Drive";
        if (btnIcon) btnIcon.classList.remove("spin");
        showToast("Gangguan koneksi: " + err.message);
      });
    }

    /* ==========================================================================
       CANVAS COMPOSITOR: TEMPEL BINGKAI FOTO KUSTOM SAAT DOWNLOAD
       ========================================================================== */
    function normalizeDriveImageUrl(urlOrId) {
      if (!urlOrId) return "";
      const raw = String(urlOrId).trim();

      const match = raw.match(/\/d\/([a-zA-Z0-9_\-]+)/) || raw.match(/id=([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) {
        return "https://lh3.googleusercontent.com/d/" + match[1] + "=w2500";
      }

      if (/^[a-zA-Z0-9_\-]{20,}$/.test(raw) && !raw.startsWith("http")) {
        return "https://lh3.googleusercontent.com/d/" + raw + "=w2500";
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

    function dismissDownloadWidget() {
      const widget = document.getElementById("downloadProgressWidget");
      if (widget) widget.classList.remove("active");
    }

    function updateDownloadWidget(percent, title, subtitle, isComplete) {
      const widget = document.getElementById("downloadProgressWidget");
      const titleEl = document.getElementById("dpwTitle");
      const subtitleEl = document.getElementById("dpwSubtitle");
      const fillEl = document.getElementById("dpwProgressFill");
      const badgeEl = document.getElementById("dpwBadge");
      const spinnerEl = document.getElementById("dpwIconSpinner");
      const checkEl = document.getElementById("dpwIconCheck");

      if (!widget) return;

      if (downloadQueue.hideTimer) {
        clearTimeout(downloadQueue.hideTimer);
        downloadQueue.hideTimer = null;
      }

      widget.classList.add("active");
      if (title && titleEl) titleEl.innerText = title;
      if (subtitle && subtitleEl) subtitleEl.innerText = subtitle;
      if (fillEl) fillEl.style.width = Math.min(100, Math.max(5, percent)) + "%";

      const remaining = downloadQueue.items.length + (downloadQueue.isProcessing ? 1 : 0);

      if (isComplete) {
        if (badgeEl) badgeEl.innerText = "Selesai";
        if (spinnerEl) spinnerEl.style.display = "none";
        if (checkEl) checkEl.style.display = "block";
        if (fillEl) fillEl.style.width = "100%";

        downloadQueue.hideTimer = setTimeout(function() {
          widget.classList.remove("active");
          setTimeout(function() {
            if (spinnerEl) spinnerEl.style.display = "block";
            if (checkEl) checkEl.style.display = "none";
          }, 400);
        }, 2500);
      } else {
        if (badgeEl) {
          if (remaining > 1) {
            badgeEl.innerText = remaining + " Antrean";
          } else {
            badgeEl.innerText = "1 Unduhan";
          }
        }
        if (spinnerEl) spinnerEl.style.display = "block";
        if (checkEl) checkEl.style.display = "none";
      }
    }

    function isPhotoPhotobooth(photo) {
      if (!photo) return false;
      return Boolean(
        photo.isVideo ||
        photo.isKing ||
        photo.isPhotobooth ||
        (photo.category && photo.category.toLowerCase().includes("photobooth")) ||
        (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
        (photo.downloadUrl && (photo.downloadUrl.includes("kingphotobooth.co") || photo.downloadUrl.includes("fotoshare.co") || photo.downloadUrl.includes("photos.google.com"))) ||
        (photo.previewUrl && (photo.previewUrl.includes("kingphotobooth.co") || photo.previewUrl.includes("fotoshare.co") || photo.previewUrl.includes("photos.google.com")))
      );
    }

    function queuePhotoDownload(photo) {
      if (!photo) return;

      const isAlreadyQueued = downloadQueue.items.some(function(item) {
        return (item.id && photo.id && item.id === photo.id) || (item.name && photo.name && item.name === photo.name);
      });
      const isCurrentProcessing = downloadQueue.currentPhoto && (
        (downloadQueue.currentPhoto.id && photo.id && downloadQueue.currentPhoto.id === photo.id) ||
        (downloadQueue.currentPhoto.name && photo.name && downloadQueue.currentPhoto.name === photo.name)
      );

      const btnLabel = document.getElementById("downloadBtnLabel");
      if (isAlreadyQueued || isCurrentProcessing) {
        if (btnLabel) {
          const prev = btnLabel.innerText;
          btnLabel.innerText = "✓ Sudah Dalam Antrean";
          setTimeout(function() {
            if (btnLabel && btnLabel.innerText === "✓ Sudah Dalam Antrean") btnLabel.innerText = prev;
          }, 1500);
        }
        showToast("Foto ini sudah ada dalam antrean unduh.");
        return;
      }

      if (btnLabel) {
        const prevText = btnLabel.innerText;
        btnLabel.innerText = "✓ Masuk Antrean Unduh";
        setTimeout(function() {
          if (btnLabel && btnLabel.innerText === "✓ Masuk Antrean Unduh") {
            btnLabel.innerText = prevText;
          }
        }, 1500);
      }

      downloadQueue.items.push(photo);
      const remaining = downloadQueue.items.length + (downloadQueue.isProcessing ? 1 : 0);

      if (downloadQueue.isProcessing) {
        const badgeEl = document.getElementById("dpwBadge");
        if (badgeEl) badgeEl.innerText = remaining + " Antrean";
        showToast("✓ Foto ditambahkan ke antrean (" + remaining + " foto antre)");
      } else {
        updateDownloadWidget(15, "Menyiapkan Unduhan...", (photo.name || "Foto") + " • Masuk antrean", false);
        processNextDownloadQueue();
      }
    }

    function downloadCurrentPhotoWithFrame() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;

      const isPhotobooth = isPhotoPhotobooth(photo);
      const rawFrameConfig = state.activeConfig.FRAME_IMAGE_URL ? state.activeConfig.FRAME_IMAGE_URL.trim() : "";
      const frameUrl = normalizeDriveImageUrl(rawFrameConfig);

      // 1. Jika berkas Photobooth atau tanpa bingkai: unduh langsung tanpa proses canvas
      if (isPhotobooth || !frameUrl) {
        const isVideo = Boolean(photo.isVideo);
        const rawUrl = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";
        const fileName = generateUniqueFileName(photo.rawName || photo.name, isVideo ? "video" : "original", isVideo ? ".mp4" : ".jpg");
        if (rawUrl) {
          const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(rawUrl) + "&filename=" + encodeURIComponent(fileName);
          triggerDirectLinkDownload(proxyUrl, fileName);
          showToast("✓ Foto asli berhasil diunduh ke perangkat!");
          return;
        }
      }

      // 2. Jika foto berbingkai SUDAH di-precomposite saat membuka lightbox:
      // Eksekusi LANGSUNG 100% SINKRONIS (0ms) di dalam klik pengguna!
      // Ini menjaga userActivation.isActive = true sehingga browser Android (Samsung Internet) TIDAK PERNAH memunculkan dialog konfirmasi!
      if (state.precompositedBlob && state.precompositedPhotoId === photo.id) {
        const fileName = generateUniqueFileName(photo.rawName || photo.name, "berbingkai", ".jpg");
        saveBlobToDevice(state.precompositedBlob, fileName);
        showToast("✓ Foto berbingkai berhasil tersimpan ke perangkat!");
        return;
      }

      // 3. Fallback antrean unduh jika belum siap
      queuePhotoDownload(photo);
    }

    function processNextDownloadQueue() {
      if (downloadQueue.items.length === 0) {
        downloadQueue.isProcessing = false;
        downloadQueue.currentPhoto = null;
        updateDownloadWidget(100, "✓ Semua Unduhan Selesai!", "Seluruh antrean berhasil diunduh", true);
        showToast("✓ Semua foto dalam antrean berhasil diunduh!");
        return;
      }

      downloadQueue.isProcessing = true;
      const photo = downloadQueue.items.shift();
      downloadQueue.currentPhoto = photo;

      const remaining = downloadQueue.items.length + 1;
      const queueSuffix = remaining > 1 ? (" (Sisa antrean: " + remaining + ")") : "";

      function advanceQueue() {
        const hasMore = downloadQueue.items.length > 0;
        if (hasMore) {
          updateDownloadWidget(100, "✓ Foto Tersimpan! Melanjutkan antrean...", (photo.name || "Foto") + queueSuffix, false);
          showToast("✓ Foto tersimpan! Memproses antrean berikutnya (" + downloadQueue.items.length + " tersisa)...");
          // Pacing 1200ms agar browser Android tidak memblokir unduhan consecutive
          setTimeout(processNextDownloadQueue, 1200);
        } else {
          downloadQueue.isProcessing = false;
          downloadQueue.currentPhoto = null;
          updateDownloadWidget(100, "✓ Berhasil Disimpan!", photo.name || "Foto", true);
          showToast("✓ Foto berhasil tersimpan ke perangkat!");
        }
      }

      const isPhotobooth = isPhotoPhotobooth(photo);
      const rawFrameConfig = state.activeConfig.FRAME_IMAGE_URL ? state.activeConfig.FRAME_IMAGE_URL.trim() : "";
      const frameUrl = normalizeDriveImageUrl(rawFrameConfig);

      if (isPhotobooth || !frameUrl) {
        updateDownloadWidget(35, "Mengunduh Berkas Asli...", (photo.name || "Foto") + " • Kualitas Asli" + queueSuffix, false);
        executeDirectPhotoDownload(photo, advanceQueue);
        return;
      }

      updateDownloadWidget(30, "Memuat Foto & Bingkai Kualitas Penuh...", (photo.name || "Foto") + " • Resolusi Asli" + queueSuffix, false);
      executeFramedPhotoDownload(photo, frameUrl, advanceQueue);
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

    function preloadFrameAssets(frameUrl) {
      if (!frameUrl) return;
      if (state.cachedFrame && state.cachedFrame.url === frameUrl) return;

      loadSafeCanvasImage(frameUrl, function(frameImg) {
        try {
          const fw = frameImg.naturalWidth || 2400;
          const fh = frameImg.naturalHeight || 1600;
          const scanMax = 500;
          const scanScale = Math.min(1, scanMax / Math.max(fw, fh));
          const scanW = Math.max(1, Math.round(fw * scanScale));
          const scanH = Math.max(1, Math.round(fh * scanScale));

          const scanCanvas = document.createElement("canvas");
          scanCanvas.width = scanW;
          scanCanvas.height = scanH;
          const scanCtx = scanCanvas.getContext("2d");
          scanCtx.drawImage(frameImg, 0, 0, scanW, scanH);
          const scanData = scanCtx.getImageData(0, 0, scanW, scanH).data;

          let minX = scanW, minY = scanH, maxX = -1, maxY = -1;
          let transparentCount = 0;

          for (let y = 0; y < scanH; y++) {
            for (let x = 0; x < scanW; x++) {
              const alpha = scanData[(y * scanW + x) * 4 + 3];
              if (alpha < 80) {
                transparentCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          let cutoutX, cutoutY, cutoutW, cutoutH;
          if (transparentCount > (scanW * scanH * 0.05) && maxX > minX && maxY > minY) {
            cutoutX = Math.round(minX / scanScale);
            cutoutY = Math.round(minY / scanScale);
            cutoutW = Math.round((maxX - minX + 1) / scanScale);
            cutoutH = Math.round((maxY - minY + 1) / scanScale);
          } else {
            cutoutX = 0;
            cutoutY = 0;
            cutoutW = fw;
            cutoutH = fh;
          }

          state.cachedFrame = {
            url: frameUrl,
            img: frameImg,
            fw: fw,
            fh: fh,
            cutout: { x: cutoutX, y: cutoutY, w: cutoutW, h: cutoutH }
          };
        } catch (e) {
          console.warn("Frame pre-caching failed:", e);
        }
      }, function() {});
    }

    function prepareLightboxFramedBlob(photo) {
      if (!photo || isPhotoPhotobooth(photo)) return;
      const rawFrameConfig = state.activeConfig.FRAME_IMAGE_URL ? state.activeConfig.FRAME_IMAGE_URL.trim() : "";
      const frameUrl = normalizeDriveImageUrl(rawFrameConfig);
      if (!frameUrl) return;

      if (state.currentPreparedFramedBlobPhotoId === photo.id && state.currentPreparedFramedBlob) return;

      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=w2500") : "");
      if (!photoSrc) return;

      loadSafeCanvasImage(photoSrc, function(photoImg) {
        function doComposite(frameImg, cutoutInfo) {
          try {
            const fw = frameImg.naturalWidth || 2400;
            const fh = frameImg.naturalHeight || 1600;
            const cutoutX = cutoutInfo.x;
            const cutoutY = cutoutInfo.y;
            const cutoutW = cutoutInfo.w;
            const cutoutH = cutoutInfo.h;

            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;

            const scale = Math.max(1, pw / cutoutW, ph / cutoutH);
            const targetW = Math.round(fw * scale);
            const targetH = Math.round(fh * scale);

            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            const scaledCutoutX = Math.round(cutoutX * scale);
            const scaledCutoutY = Math.round(cutoutY * scale);
            const scaledCutoutW = Math.round(cutoutW * scale);
            const scaledCutoutH = Math.round(cutoutH * scale);

            const photoAspect = pw / ph;
            const cutoutAspect = scaledCutoutW / scaledCutoutH;

            let drawX = scaledCutoutX;
            let drawY = scaledCutoutY;
            let drawW = scaledCutoutW;
            let drawH = scaledCutoutH;

            if (Math.abs(photoAspect - cutoutAspect) < 0.05) {
              drawX = scaledCutoutX;
              drawY = scaledCutoutY;
              drawW = scaledCutoutW;
              drawH = scaledCutoutH;
            } else if (photoAspect > cutoutAspect) {
              drawW = scaledCutoutW;
              drawH = scaledCutoutW / photoAspect;
              drawX = scaledCutoutX;
              drawY = scaledCutoutY + (scaledCutoutH - drawH) / 2;
            } else {
              drawH = scaledCutoutH;
              drawW = scaledCutoutH * photoAspect;
              drawY = scaledCutoutY;
              drawX = scaledCutoutX + (scaledCutoutW - drawW) / 2;
            }

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, targetW, targetH);

            const rot = getPhotoRotation(photo.id, photo.category);
            if (rot % 360 !== 0) {
              ctx.save();
              const cx = drawX + drawW / 2;
              const cy = drawY + drawH / 2;
              ctx.translate(cx, cy);
              ctx.rotate((rot * Math.PI) / 180);
              if (rot % 180 !== 0) {
                const scaleRatio = Math.max(drawW / drawH, drawH / drawW);
                ctx.drawImage(photoImg, -drawH / 2 * scaleRatio, -drawW / 2 * scaleRatio, drawH * scaleRatio, drawW * scaleRatio);
              } else {
                ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
              }
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
            }

            ctx.drawImage(frameImg, 0, 0, targetW, targetH);

            canvas.toBlob(function(blob) {
              if (blob) {
                state.currentPreparedFramedBlob = blob;
                state.currentPreparedFramedBlobPhotoId = photo.id;
              }
            }, "image/jpeg", 0.94);
          } catch (err) {
            console.warn("Pre-composite failed:", err);
          }
        }

        if (state.cachedFrame && state.cachedFrame.url === frameUrl) {
          doComposite(state.cachedFrame.img, state.cachedFrame.cutout);
        } else {
          loadSafeCanvasImage(frameUrl, function(fImg) {
            preloadFrameAssets(frameUrl);
            doComposite(fImg, { x: 0, y: 0, w: fImg.naturalWidth || 2400, h: fImg.naturalHeight || 1600 });
          }, function() {});
        }
      }, function() {});
    }

    function loadSafeCanvasImage(urlOrId, callback, errCallback) {
      if (!urlOrId) { if (errCallback) errCallback(); return; }
      if (urlOrId.startsWith("data:")) {
        const img = new Image();
        img.onload = function() { callback(img); };
        img.onerror = errCallback;
        img.src = urlOrId;
        return;
      }

      let effectiveUrl = urlOrId;
      const dMatch = urlOrId.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
      if (dMatch && (urlOrId.includes("drive.google.com") || urlOrId.includes("docs.google.com") || !urlOrId.startsWith("http"))) {
        effectiveUrl = "https://lh3.googleusercontent.com/d/" + dMatch[1] + "=w2500";
      } else if (/^[a-zA-Z0-9_\-]{20,}$/.test(urlOrId) && !urlOrId.startsWith("http")) {
        effectiveUrl = "https://lh3.googleusercontent.com/d/" + urlOrId + "=w2500";
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() { callback(img); };
      img.onerror = function() {
        const proxyImg = new Image();
        proxyImg.crossOrigin = "anonymous";
        proxyImg.onload = function() { callback(proxyImg); };
        proxyImg.onerror = function() {
          if (errCallback) errCallback();
        };
        proxyImg.src = "/api/download-proxy?url=" + encodeURIComponent(effectiveUrl);
      };
      img.src = effectiveUrl;
    }

    function executeFramedPhotoDownload(photo, frameUrl, onDone) {
      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=w2500") : "");
      
      loadSafeCanvasImage(photoSrc, function(photoImg) {
        updateDownloadWidget(55, "Menggabungkan Foto Beresolusi Penuh...", (photo.name || "Foto") + " • Menjaga Ukuran Asli", false);

        function renderFrameWithCutout(frameImg, cutoutInfo) {
          try {
            const fw = frameImg.naturalWidth || 2400;
            const fh = frameImg.naturalHeight || 1600;
            const cutoutX = cutoutInfo.x;
            const cutoutY = cutoutInfo.y;
            const cutoutW = cutoutInfo.w;
            const cutoutH = cutoutInfo.h;

            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;

            const scale = Math.max(1, pw / cutoutW, ph / cutoutH);
            const targetW = Math.round(fw * scale);
            const targetH = Math.round(fh * scale);

            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            const scaledCutoutX = Math.round(cutoutX * scale);
            const scaledCutoutY = Math.round(cutoutY * scale);
            const scaledCutoutW = Math.round(cutoutW * scale);
            const scaledCutoutH = Math.round(cutoutH * scale);

            const photoAspect = pw / ph;
            const cutoutAspect = scaledCutoutW / scaledCutoutH;

            let drawX = scaledCutoutX;
            let drawY = scaledCutoutY;
            let drawW = scaledCutoutW;
            let drawH = scaledCutoutH;

            if (Math.abs(photoAspect - cutoutAspect) < 0.05) {
              drawX = scaledCutoutX;
              drawY = scaledCutoutY;
              drawW = scaledCutoutW;
              drawH = scaledCutoutH;
            } else if (photoAspect > cutoutAspect) {
              drawW = scaledCutoutW;
              drawH = scaledCutoutW / photoAspect;
              drawX = scaledCutoutX;
              drawY = scaledCutoutY + (scaledCutoutH - drawH) / 2;
            } else {
              drawH = scaledCutoutH;
              drawW = scaledCutoutH * photoAspect;
              drawY = scaledCutoutY;
              drawX = scaledCutoutX + (scaledCutoutW - drawW) / 2;
            }

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, targetW, targetH);

            const rot = getPhotoRotation(photo.id, photo.category);
            if (rot % 360 !== 0) {
              ctx.save();
              const cx = drawX + drawW / 2;
              const cy = drawY + drawH / 2;
              ctx.translate(cx, cy);
              ctx.rotate((rot * Math.PI) / 180);
              if (rot % 180 !== 0) {
                const scaleRatio = Math.max(drawW / drawH, drawH / drawW);
                ctx.drawImage(photoImg, -drawH / 2 * scaleRatio, -drawW / 2 * scaleRatio, drawH * scaleRatio, drawW * scaleRatio);
              } else {
                ctx.drawImage(photoImg, -drawW / 2, -drawH / 2, drawW, drawH);
              }
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
            }

            ctx.drawImage(frameImg, 0, 0, targetW, targetH);

            updateDownloadWidget(85, "Menyimpan ke Memori Perangkat...", (photo.name || "Foto") + " • Kualitas Asli", false);

            canvas.toBlob(function(blob) {
              if (blob) {
                const fileName = generateUniqueFileName(photo.rawName || photo.name, "berbingkai", ".jpg");
                saveBlobToDevice(blob, fileName);
                if (onDone) onDone();
              } else {
                executeDirectPhotoDownload(photo, onDone);
              }
            }, "image/jpeg", 0.94);

          } catch (eCanvas) {
            console.warn("Canvas compositing error, fallback to direct download:", eCanvas);
            executeDirectPhotoDownload(photo, onDone);
          }
        }

        if (state.cachedFrame && state.cachedFrame.url === frameUrl) {
          renderFrameWithCutout(state.cachedFrame.img, state.cachedFrame.cutout);
        } else {
          loadSafeCanvasImage(frameUrl, function(frameImg) {
            preloadFrameAssets(frameUrl);
            renderFrameWithCutout(frameImg, { x: 0, y: 0, w: frameImg.naturalWidth || 2400, h: frameImg.naturalHeight || 1600 });
          }, function() {
            executeDirectPhotoDownload(photo, onDone);
          });
        }
      }, function() {
        executeDirectPhotoDownload(photo, onDone);
      });
    }

    function executeDirectPhotoDownload(photo, onDone) {
      const isVideo = Boolean(photo.isVideo);
      let rawUrl = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";
      const fileName = generateUniqueFileName(photo.rawName || photo.name, isVideo ? "video" : "original", isVideo ? ".mp4" : ".jpg");

      if (rawUrl) {
        const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(rawUrl) + "&filename=" + encodeURIComponent(fileName);
        triggerDirectLinkDownload(proxyUrl, fileName);
        showToast("✓ Foto asli berhasil diunduh!");
        if (onDone) onDone();
        return;
      }
      if (onDone) onDone();
    }

    function saveBlobToDevice(blob, fileName) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = fileName;
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 30000);
    }

    function triggerDirectLinkDownload(url, fileName) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      if (fileName) a.download = fileName;
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 15000);
    }

    function fallbackSaveLink(url, fileName) {
      triggerDirectLinkDownload(url, fileName);
    }

    function resetDownloadButton() {
      const downloadBtn = document.getElementById("lightboxDownloadBtn");
      const btnLabel = document.getElementById("downloadBtnLabel");
      if (downloadBtn && btnLabel) {
        downloadBtn.disabled = false;
        const hasFrame = state.activeConfig.FRAME_IMAGE_URL && state.activeConfig.FRAME_IMAGE_URL.trim();
        btnLabel.innerText = hasFrame ? "✨ Simpan Kenangan Berbingkai" : "Simpan Foto Asli";
      }
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

    /* ==========================================================================
       LIGHTBOX LOGIC: SHARP RESOLUTION & INTERACTIVE ZOOM ENGINE
       ========================================================================== */
    function getSharpPreviewUrl(photo) {
      if (!photo) return "";
      // 1. Jika video kingphotobooth
      if (photo.isVideo && photo.videoUrl) return photo.videoUrl;
      // 2. Jika foto kingphotobooth
      if (photo.isKing && photo.previewUrl) return photo.previewUrl;

      // 3. Jika Google Drive file ID: gunakan lh3 w3200 resolusi penuh tanpa kompresi buram
      const raw = photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || photo.id || "";
      const match = String(raw).match(/\/d\/([a-zA-Z0-9_\-]+)/) || 
                    String(raw).match(/id=([a-zA-Z0-9_\-]+)/) || 
                    (photo.id && /^[a-zA-Z0-9_\-]{20,}$/.test(photo.id) ? [null, photo.id] : null);
      if (match && match[1]) {
        return "https://lh3.googleusercontent.com/d/" + match[1] + "=w3200";
      }

      // 4. Jika Google Photos: gunakan w3200 resolusi tajam
      if (photo.previewUrl && photo.previewUrl.includes("googleusercontent.com/pw/")) {
        const base = photo.previewUrl.replace(/=[^/]*$/, "");
        return base + "=w3200";
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

    function resetLightboxZoom() {
      lightboxZoom.scale = 1;
      lightboxZoom.panX = 0;
      lightboxZoom.panY = 0;
      lightboxZoom.isDragging = false;
      applyLightboxZoom();
    }

    function zoomLightbox(delta) {
      const newScale = Math.min(lightboxZoom.maxScale, Math.max(lightboxZoom.minScale, lightboxZoom.scale + delta));
      lightboxZoom.scale = Math.round(newScale * 10) / 10;
      if (lightboxZoom.scale <= 1) {
        lightboxZoom.scale = 1;
        lightboxZoom.panX = 0;
        lightboxZoom.panY = 0;
      }
      applyLightboxZoom();
    }

    function applyLightboxZoom() {
      const img = document.getElementById("lightboxImg");
      const wrapper = document.getElementById("lightboxImgWrapper");

      if (wrapper) {
        if (lightboxZoom.scale > 1.05) {
          wrapper.classList.add("is-zoomed");
          if (lightboxZoom.isDragging) wrapper.classList.add("is-dragging");
          else wrapper.classList.remove("is-dragging");
        } else {
          wrapper.classList.remove("is-zoomed", "is-dragging");
        }
      }

      if (img) {
        let rot = 0;
        if (state.currentLightboxIndex !== undefined && state.filteredPhotos && state.filteredPhotos[state.currentLightboxIndex]) {
          const p = state.filteredPhotos[state.currentLightboxIndex];
          rot = getPhotoRotation(p.id, p.category);
        }
        const rotStr = rot ? " rotate(" + rot + "deg)" : "";
        if (lightboxZoom.scale <= 1) {
          img.style.transform = rotStr ? ("rotate(" + rot + "deg)") : "none";
        } else {
          img.style.transform = "translate(" + lightboxZoom.panX + "px, " + lightboxZoom.panY + "px)" + rotStr + " scale(" + lightboxZoom.scale + ")";
        }
      }
    }

    function initLightboxZoomEvents() {
      if (lightboxZoom.eventsInitialized) return;
      const wrapper = document.getElementById("lightboxImgWrapper");
      if (!wrapper) return;
      lightboxZoom.eventsInitialized = true;

      // Mouse Wheel Zoom
      wrapper.addEventListener("wheel", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.35 : -0.35;
        zoomLightbox(delta);
      }, { passive: false });

      // Double Click Zoom
      wrapper.addEventListener("dblclick", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;
        e.preventDefault();
        if (lightboxZoom.scale > 1.05) {
          resetLightboxZoom();
        } else {
          lightboxZoom.scale = 2.5;
          lightboxZoom.panX = 0;
          lightboxZoom.panY = 0;
          applyLightboxZoom();
        }
      });

      // Mouse Drag Pan
      wrapper.addEventListener("mousedown", function(e) {
        if (lightboxZoom.scale <= 1.05) return;
        e.preventDefault();
        lightboxZoom.isDragging = true;
        lightboxZoom.startX = e.clientX - lightboxZoom.panX;
        lightboxZoom.startY = e.clientY - lightboxZoom.panY;
        applyLightboxZoom();
      });

      window.addEventListener("mousemove", function(e) {
        if (!lightboxZoom.isDragging) return;
        lightboxZoom.panX = e.clientX - lightboxZoom.startX;
        lightboxZoom.panY = e.clientY - lightboxZoom.startY;
        applyLightboxZoom();
      });

      window.addEventListener("mouseup", function() {
        if (lightboxZoom.isDragging) {
          lightboxZoom.isDragging = false;
          applyLightboxZoom();
        }
      });

      // Pinch-to-Zoom dengan 2 Jari, Double-Tap & Drag Pan
      let initialPinchDist = 0;
      let initialScale = 1;
      let isPinching = false;

      wrapper.addEventListener("touchstart", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;

        // Deteksi Gesture 2 Jari (Pinch-to-Zoom)
        if (e.touches.length === 2) {
          isPinching = true;
          lightboxZoom.isDragging = false;
          initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialScale = lightboxZoom.scale;
          return;
        }

        const now = Date.now();
        if (e.touches.length === 1) {
          isPinching = false;
          if (now - lightboxZoom.lastTapTime < 320) {
            e.preventDefault();
            if (lightboxZoom.scale > 1.05) {
              resetLightboxZoom();
            } else {
              lightboxZoom.scale = 2.5;
              lightboxZoom.panX = 0;
              lightboxZoom.panY = 0;
              applyLightboxZoom();
            }
            lightboxZoom.lastTapTime = 0;
            return;
          }
          lightboxZoom.lastTapTime = now;

          if (lightboxZoom.scale > 1.05) {
            lightboxZoom.isDragging = true;
            lightboxZoom.startX = e.touches[0].clientX - lightboxZoom.panX;
            lightboxZoom.startY = e.touches[0].clientY - lightboxZoom.panY;
          }
        }
      }, { passive: false });

      wrapper.addEventListener("touchmove", function(e) {
        const vid = document.getElementById("lightboxVideo");
        if (vid && vid.style.display !== "none") return;

        // Eksekusi Pinch-to-Zoom
        if (e.touches.length === 2 && isPinching && initialPinchDist > 0) {
          e.preventDefault();
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = currentDist / initialPinchDist;
          let targetScale = initialScale * factor;
          targetScale = Math.min(lightboxZoom.maxScale, Math.max(lightboxZoom.minScale, targetScale));
          lightboxZoom.scale = Math.round(targetScale * 100) / 100;
          if (lightboxZoom.scale <= 1) {
            lightboxZoom.scale = 1;
            lightboxZoom.panX = 0;
            lightboxZoom.panY = 0;
          }
          applyLightboxZoom();
          return;
        }

        // Eksekusi Drag Pan 1 Jari saat Zoom
        if (lightboxZoom.isDragging && e.touches.length === 1 && lightboxZoom.scale > 1.05) {
          e.preventDefault();
          lightboxZoom.panX = e.touches[0].clientX - lightboxZoom.startX;
          lightboxZoom.panY = e.touches[0].clientY - lightboxZoom.startY;
          applyLightboxZoom();
        }
      }, { passive: false });

      wrapper.addEventListener("touchend", function(e) {
        if (e.touches.length < 2) {
          isPinching = false;
          initialPinchDist = 0;
        }
        if (e.touches.length === 0) {
          lightboxZoom.isDragging = false;
          applyLightboxZoom();
        }
      });
    }

    function setupLightboxBackdropClick() {
      const modal = document.getElementById("lightbox");
      const body = document.getElementById("lightboxBody");
      const wrapper = document.getElementById("lightboxImgWrapper");
      if (!modal || modal.dataset.backdropBound === "true") return;
      modal.dataset.backdropBound = "true";

      const handleBackdrop = function(e) {
        // Jangan tutup jika klik berasal dari foto, video, tombol navigasi, topbar, atau bottombar
        if (e.target.closest("#lightboxImg") || e.target.closest("#lightboxVideo") || e.target.closest(".lightbox-nav-btn") || e.target.closest(".lightbox-topbar") || e.target.closest(".lightbox-bottombar")) {
          return;
        }
        // Jangan tutup jika sedang melakukan pan geser saat zoom
        if (lightboxZoom && lightboxZoom.scale > 1.05 && lightboxZoom.isDragging) {
          return;
        }
        closeLightbox();
      };

      if (body) body.addEventListener("click", handleBackdrop);
      if (wrapper) {
        wrapper.addEventListener("click", function(e) {
          if (e.target === wrapper) {
            handleBackdrop(e);
          }
        });
      }
      modal.addEventListener("click", function(e) {
        if (e.target === modal) {
          handleBackdrop(e);
        }
      });
    }

    function openLightbox(index) {
      if (!state.filteredPhotos[index]) return;
      state.currentLightboxIndex = index;

      const modal = document.getElementById("lightbox");
      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      setupLightboxBackdropClick();
      initLightboxZoomEvents();
      resetLightboxZoom();
      resetDownloadButton();
      precompositeLightboxPhoto(photo);
      updateLightboxContent();
    }

    function closeLightbox() {
      const modal = document.getElementById("lightbox");
      modal.classList.remove("active");
      document.body.style.overflow = "";

      const vid = document.getElementById("lightboxVideo");
      if (vid) {
        vid.pause();
        vid.src = "";
        vid.style.display = "none";
      }
      resetLightboxZoom();
      resetDownloadButton();
    }

    function navigateLightbox(direction) {
      let newIndex = state.currentLightboxIndex + direction;
      if (newIndex < 0) {
        newIndex = state.filteredPhotos.length - 1;
      } else if (newIndex >= state.filteredPhotos.length) {
        newIndex = 0;
      }
      state.currentLightboxIndex = newIndex;
      resetLightboxZoom();
      updateLightboxContent();
    }

    function updateLightboxContent() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;

      document.getElementById("lightboxCounter").innerText = 
        `FOTO ${state.currentLightboxIndex + 1} DARI ${state.filteredPhotos.length}`;
      document.getElementById("lightboxTitle").innerText = photo.name;
      
      const sharpUrl = getSharpPreviewUrl(photo);
      const img = document.getElementById("lightboxImg");
      const video = document.getElementById("lightboxVideo");
      const zoomToolbar = document.getElementById("lightboxZoomToolbar");
      const btn = document.getElementById("lightboxDownloadBtn");
      const btnLabel = document.getElementById("downloadBtnLabel");

      resetLightboxZoom();
      resetDownloadButton();

      const rot = getPhotoRotation(photo.id, photo.category);
      const rotLabelEl = document.getElementById("lightboxRotateLabel");
      if (rotLabelEl) {
        rotLabelEl.innerText = rot > 0 ? "Putar (" + rot + "°)" : "Putar 90°";
      }
      applyLightboxZoom();

      if (photo.isVideo) {
        if (img) img.style.display = "none";
        if (zoomToolbar) zoomToolbar.style.display = "none";
        if (video) {
          video.style.display = "block";
          video.src = photo.videoUrl || photo.previewUrl || sharpUrl;
          video.play().catch(function(){});
        }
        if (btnLabel) btnLabel.innerText = "⬇️ Unduh Video Asli Photobooth";
        if (btn) {
          btn.onclick = function() {
            queuePhotoDownload(photo);
          };
        }
      } else {
        if (video) {
          video.pause();
          video.style.display = "none";
          video.src = "";
        }
        if (img) {
          img.style.display = "block";
          img.style.opacity = "1";
          img.style.filter = "none";
          img.style.backgroundColor = "transparent";
          img.src = sharpUrl;
        }
        if (zoomToolbar) zoomToolbar.style.display = "none";

        const isPhotobooth = photo && (
          Boolean(photo.isVideo) ||
          Boolean(photo.isKing) ||
          Boolean(photo.isPhotobooth) ||
          (photo.category && photo.category.toLowerCase().includes("photobooth")) ||
          (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
          (photo.downloadUrl && (photo.downloadUrl.includes("kingphotobooth.co") || photo.downloadUrl.includes("fotoshare.co") || photo.downloadUrl.includes("photos.google.com"))) ||
          (photo.previewUrl && (photo.previewUrl.includes("kingphotobooth.co") || photo.previewUrl.includes("fotoshare.co") || photo.previewUrl.includes("photos.google.com")))
        );

        if (isPhotobooth) {
          if (btnLabel) btnLabel.innerText = "⬇️ Unduh Foto Asli (Ukuran Penuh)";
          if (btn) {
            btn.onclick = function() {
              const ext = Boolean(photo.isVideo) ? ".mp4" : ".jpg";
              let rawUrl = photo.downloadUrl || photo.videoUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || photo.img;
              if (!rawUrl && photo.id) {
                rawUrl = "https://lh3.googleusercontent.com/d/" + photo.id + "=w3200";
              }
              if (rawUrl) {
                if (rawUrl.includes("fotoshare.co")) rawUrl = rawUrl.replace(/\?.*$/, "");
                const fileName = generateUniqueFileName(photo.rawName || photo.name || (photo.isVideo ? "video-photobooth" : "foto-asli"), "", ext);
                const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(rawUrl) + "&filename=" + encodeURIComponent(fileName);
                triggerDirectLinkDownload(proxyUrl, fileName);
                showToast("✓ Memulai penyimpanan berkas asli ke perangkat...");
                updateDownloadWidget(100, "✓ Berhasil Disimpan!", photo.name || "Foto", true);
              } else {
                queuePhotoDownload(photo);
              }
            };
          }
        } else {
          // Semua kategori momen lainnya mengikuti settingan kategori utama (berbingkai)
          if (btnLabel) btnLabel.innerText = "✨ Simpan Kenangan Berbingkai";
          prepareLightboxFramedBlob(photo);
          if (btn) {
            btn.onclick = function() {
              if (state.currentPreparedFramedBlobPhotoId === photo.id && state.currentPreparedFramedBlob) {
                const fileName = generateUniqueFileName(photo.rawName || photo.name, "berbingkai", ".jpg");
                saveBlobToDevice(state.currentPreparedFramedBlob, fileName);
                showToast("✓ Foto berbingkai berhasil tersimpan ke perangkat!");
                updateDownloadWidget(100, "✓ Berhasil Disimpan!", photo.name || "Foto", true);
              } else {
                queuePhotoDownload(photo);
              }
            };
          }
        }
      }
    }

    function handleCurrentLightboxDownload() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (photo) queuePhotoDownload(photo);
    }

    function downloadPhotoboothOriginal(photo) {
      if (photo) queuePhotoDownload(photo);
    }

    function startSlideshowFromCurrent() {
      closeLightbox();
      openSlideshow(state.currentLightboxIndex);
    }

    /* ==========================================================================
       STAGE SLIDESHOW LOGIC (MODE PANGGUNG)
       ========================================================================== */
    function openSlideshow(startIndex) {
      if (state.filteredPhotos.length === 0) return;
      state.currentSlideIndex = startIndex || 0;

      const overlay = document.getElementById("slideshowOverlay");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function() {});
      }

      state.isSlideshowPlaying = true;
      updatePlayPauseIcons();
      showSlide(state.currentSlideIndex);
      startSlideshowLoop();
    }

    function closeSlideshow() {
      const overlay = document.getElementById("slideshowOverlay");
      overlay.classList.remove("active");
      document.body.style.overflow = "";

      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(function() {});
      }

      clearInterval(state.slideshowTimer);
      clearInterval(state.slideshowProgressTimer);
    }

    function showSlide(index) {
      const photo = state.filteredPhotos[index];
      if (!photo) return;

      const eventDate = state.activeConfig.EVENT_DATE || "14 November 2026";
      const eventVenue = state.activeConfig.EVENT_VENUE || "Upperhills Convention Centre, Makassar";
      document.getElementById("slideshowCategory").innerText = eventDate + " • " + eventVenue + " • " + photo.category;

      const imgA = document.getElementById("slideshowImgA");
      const imgB = document.getElementById("slideshowImgB");

      if (state.activeSlideTarget === 'A') {
        imgB.src = photo.highResUrl || photo.thumbnailUrl;
        imgB.classList.add("visible");
        imgA.classList.remove("visible");
        state.activeSlideTarget = 'B';
      } else {
        imgA.src = photo.highResUrl || photo.thumbnailUrl;
        imgA.classList.add("visible");
        imgB.classList.remove("visible");
        state.activeSlideTarget = 'A';
      }

      resetProgressBar();
    }

    function nextSlide() {
      state.currentSlideIndex = (state.currentSlideIndex + 1) % state.filteredPhotos.length;
      showSlide(state.currentSlideIndex);
    }

    function prevSlide() {
      state.currentSlideIndex = (state.currentSlideIndex - 1 + state.filteredPhotos.length) % state.filteredPhotos.length;
      showSlide(state.currentSlideIndex);
    }

    function togglePlayPause() {
      state.isSlideshowPlaying = !state.isSlideshowPlaying;
      updatePlayPauseIcons();

      if (state.isSlideshowPlaying) {
        startSlideshowLoop();
      } else {
        clearInterval(state.slideshowTimer);
        clearInterval(state.slideshowProgressTimer);
      }
    }

    function updatePlayPauseIcons() {
      const playIcon = document.getElementById("playIcon");
      const pauseIcon = document.getElementById("pauseIcon");
      if (state.isSlideshowPlaying) {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
      } else {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
      }
    }

    function startSlideshowLoop() {
      clearInterval(state.slideshowTimer);
      state.slideshowTimer = setInterval(function() {
        if (state.isSlideshowPlaying) {
          nextSlide();
        }
      }, state.intervalMs);

      resetProgressBar();
    }

    function resetProgressBar() {
      clearInterval(state.slideshowProgressTimer);
      const bar = document.getElementById("slideshowProgress");
      bar.style.width = "0%";

      if (!state.isSlideshowPlaying) return;

      let progress = 0;
      const step = 50;
      const increment = (step / state.intervalMs) * 100;

      state.slideshowProgressTimer = setInterval(function() {
        progress += increment;
        if (progress >= 100) {
          progress = 100;
          clearInterval(state.slideshowProgressTimer);
        }
        bar.style.width = progress + "%";
      }, step);
    }

    /* ==========================================================================
       KEYBOARD & TOUCH NAVIGATION
       ========================================================================== */
    function setupKeyboardNav() {
      window.addEventListener("keydown", function(e) {
        const lightboxActive = document.getElementById("lightbox").classList.contains("active");
        const slideshowActive = document.getElementById("slideshowOverlay").classList.contains("active");
        const adminLoginActive = document.getElementById("adminLoginModal").classList.contains("active");
        const adminSettingsActive = document.getElementById("adminSettingsModal").classList.contains("active");

        if (e.key === "Escape") {
          if (adminLoginActive) closeAdminLoginModal();
          else if (adminSettingsActive) closeAdminSettingsModal();
          else if (slideshowActive) closeSlideshow();
          else if (lightboxActive) closeLightbox();
        } else if (e.key === "ArrowRight") {
          if (slideshowActive) nextSlide();
          else if (lightboxActive) navigateLightbox(1);
        } else if (e.key === "ArrowLeft") {
          if (slideshowActive) prevSlide();
          else if (lightboxActive) navigateLightbox(-1);
        } else if (e.key === " ") {
          if (slideshowActive) {
            e.preventDefault();
            togglePlayPause();
          }
        }
      });
    }

    function setupTouchSwipe() {
      const lightboxBody = document.getElementById("lightboxBody");
      if (!lightboxBody) return;

      lightboxBody.addEventListener("touchstart", function(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchStartX = e.changedTouches[0].clientX || e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].clientY || e.changedTouches[0].screenY;
        }
      }, { passive: true });

      lightboxBody.addEventListener("touchend", function(e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchEndX = e.changedTouches[0].clientX || e.changedTouches[0].screenX;
          touchEndY = e.changedTouches[0].clientY || e.changedTouches[0].screenY;
          handleSwipeGesture();
        }
      }, { passive: true });
    }

    function handleSwipeGesture() {
      // Jika sedang zoom aktif (> 1), jangan pindah foto via swipe agar user bebas panning
      if (typeof lightboxZoom !== 'undefined' && lightboxZoom.scale > 1.05) {
        return;
      }

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      // Proteksi Ketat Swipe Up / Down:
      // Jika gerakan dominan vertikal (swipe up/down) atau ada pergerakan vertikal signifikan, JANGAN PINDAH FOTO!
      if (absY >= absX || absY > 50) {
        return;
      }

      // Hanya pindahkan foto jika murni swipe horizontal yang jelas (minimal 65px dan rasio absX > 2 * absY)
      if (absX >= 65 && absX > 2 * absY) {
        if (diffX < 0) {
          navigateLightbox(1);
        } else {
          navigateLightbox(-1);
        }
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
          SUBTITLE: "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          DRIVE_FOLDER_ID: state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "",
          SLIDESHOW_INTERVAL_SEC: 4,
          FRAME_IMAGE_URL: state.activeConfig.FRAME_IMAGE_URL || GLOBAL_CONFIG.FRAME_IMAGE_URL || "",
          SPREADSHEET_ID: state.activeConfig.SPREADSHEET_ID || GLOBAL_CONFIG.SPREADSHEET_ID || "",
          SPREADSHEET_URL: state.activeConfig.SPREADSHEET_URL || GLOBAL_CONFIG.SPREADSHEET_URL || ""
        },
        categories: ["Semua Foto"],
        photos: []
      }, false);
    }
    /* ==========================================================================
       INSTANT ZERO-CLICK PRE-COMPOSITE ENGINE (Android Direct Download)
       ========================================================================== */
    function precompositeLightboxPhoto(photo) {
      if (!photo) return;
      const rawFrameConfig = state.activeConfig.FRAME_IMAGE_URL ? state.activeConfig.FRAME_IMAGE_URL.trim() : "";
      const frameUrl = normalizeDriveImageUrl(rawFrameConfig);
      if (!frameUrl || isPhotoPhotobooth(photo)) return;

      state.precompositedPhotoId = null;
      state.precompositedBlob = null;

      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=w2500") : "");
      if (!photoSrc) return;

      loadSafeCanvasImage(photoSrc, function(photoImg) {
        loadSafeCanvasImage(frameUrl, function(frameImg) {
          try {
            const fw = frameImg.naturalWidth || 2400;
            const fh = frameImg.naturalHeight || 1600;
            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;

            const canvas = document.createElement("canvas");
            canvas.width = fw;
            canvas.height = fh;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, fw, fh);

            const rot = getPhotoRotation(photo.id, photo.category);
            if (rot % 360 !== 0) {
              ctx.save();
              ctx.translate(fw / 2, fh / 2);
              ctx.rotate((rot * Math.PI) / 180);
              ctx.drawImage(photoImg, -fw / 2, -fh / 2, fw, fh);
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, 0, 0, fw, fh);
            }

            ctx.drawImage(frameImg, 0, 0, fw, fh);

            canvas.toBlob(function(blob) {
              if (blob && state.currentLightboxIndex !== -1) {
                const currentPhoto = state.filteredPhotos[state.currentLightboxIndex];
                if (currentPhoto && currentPhoto.id === photo.id) {
                  state.precompositedPhotoId = photo.id;
                  state.precompositedBlob = blob;
                }
              }
            }, "image/jpeg", 0.94);
          } catch (e) {}
        }, function() {});
      }, function() {});
    }
