/* ==========================================================================
   WEDDING PANGGUNG - CATEGORIES MODULE (js/categories.js)
   Tautan Eksternal: Google Photos, Fotoshare, Kingphotobooth, Drive & Filter Tabs
   ========================================================================== */

    function syncSingleCategory(categoryName, isSilent, callback) {
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

      if (!isSilent) {
        showToast("🔄 Menyinkronkan kategori " + categoryName + "...");
        // Hapus cache foto & URL kategori HANYA jika sinkronisasi manual dipicu oleh pengguna
        if (state.categoryPhotosMap) {
          delete state.categoryPhotosMap[categoryName];
        }
        if (state.categoryPhotosUrlMap) {
          delete state.categoryPhotosUrlMap[categoryName];
        }
        try {
          localStorage.removeItem("WEDDING_CAT_COUNT_" + categoryName);
        } catch (e) {}
      }

      // Jika kategori yang sedang aktif disinkronkan secara manual (bukan silent), bersihkan grid
      if (!isSilent && state.activeCategory === categoryName) {
        state.filteredPhotos = [];
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

      if (isPbCat) {
        const pbInput = document.getElementById("pbUrlInput");
        const customPbUrl = (pbInput && pbInput.value && pbInput.value.trim()) || (state.activeConfig.PHOTOBOOTH_URL && state.activeConfig.PHOTOBOOTH_URL.trim()) || targetUrl;
        if (customPbUrl) targetUrl = customPbUrl;
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
            EVENTS: JSON.stringify(state.events),
            ACTIVE_EVENT_ID: state.currentEventId
          }
        });
      }

      const mainLabel = state.allPhotosLabel || "Semua Foto";
      if (categoryName === mainLabel || categoryName === "Semua Foto") {
        fetchGalleryData(!isSilent, isSilent);
        if (typeof callback === "function") callback(state.allPhotos);
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
          if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          if (typeof callback === "function") callback(photos);
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
          if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " media)!");
          if (typeof callback === "function") callback(photos);
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
          if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
          if (typeof callback === "function") callback(photos);
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
          if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan!");
          if (typeof callback === "function") callback(photos);
        });
        return;
      } else if (isPbCat) {
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "";
        if (isGooglePhotosUrl(pbLink)) {
          fetchGooglePhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
            if (typeof callback === "function") callback(photos);
          });
        } else if (extractDriveFolderId(pbLink)) {
          fetchDriveCategoryPhotos(categoryName, extractDriveFolderId(pbLink), function(photos) {
            state.categoryPhotosUrlMap[categoryName] = "drive:" + extractDriveFolderId(pbLink);
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan!");
            if (typeof callback === "function") callback(photos);
          });
        } else if (pbLink.includes("kingphotobooth.co") || pbLink.includes("kingphoto")) {
          fetchKingPhotoboothPhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " media)!");
            if (typeof callback === "function") callback(photos);
          });
        } else if (pbLink.includes("fotoshare.co")) {
          fetchFotosharePhotos(categoryName, pbLink, function(photos) {
            state.categoryPhotosUrlMap[categoryName] = pbLink;
            updateCategoryPillCount(categoryName, photos.length);
            if (state.activeCategory === categoryName) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, categoryName);
            }
            if (!isSilent) showToast("✓ Kategori " + categoryName + " berhasil disinkronkan (" + photos.length + " foto)!");
            if (typeof callback === "function") callback(photos);
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
      if (!isSilent) showToast("✓ Kategori " + categoryName + " disinkronkan!");
      if (typeof callback === "function") callback(matched);
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

      // Pertahankan tab aktif dari sesi sebelumnya (Anti-Reset saat refresh)
      const evId = state.currentEventId || "default";
      let storedTab = "";
      try {
        storedTab = sessionStorage.getItem("WEDDING_ACTIVE_TAB_" + evId) || "";
      } catch (e) {}
      if (storedTab && (!state.activeCategory || state.activeCategory === "Semua Foto" || state.activeCategory === mainLabel)) {
        if (storedTab !== "Semua Foto" && storedTab !== mainLabel && uniqueCategories.includes(storedTab)) {
          state.activeCategory = storedTab;
        }
      }

      state.categories.forEach(function(cat) {
        let targetUrl = "";
        if (Array.isArray(state.customCategories)) {
          const matchCat = state.customCategories.find(function(it) {
            return String((it && it.name) || "").trim().toLowerCase() === cat.toLowerCase();
          });
          const isPb = (cat.toLowerCase().includes("photobooth")) || (matchCat && (matchCat.isPhotobooth || matchCat.id === "special_photobooth"));
          if (isPb) {
            targetUrl = state.activeConfig.PHOTOBOOTH_URL || (matchCat && matchCat.url) || "";
          } else if (matchCat && matchCat.url) {
            targetUrl = String(matchCat.url).trim();
          }
        }

        const isMain = (cat === mainLabel || cat === "Semua Foto");
        let countBadgeText = "";

        const evId = state.currentEventId || "default";
        const catKey = evId + "::" + cat;
        if (isMain) {
          if (state.allPhotos && state.allPhotos.length > 0) {
            countBadgeText = String(state.allPhotos.length);
          } else {
            countBadgeText = "";
          }
        } else if (state.categoryPhotosMap && state.categoryPhotosMap[catKey] && Array.isArray(state.categoryPhotosMap[catKey])) {
          countBadgeText = String(state.categoryPhotosMap[catKey].length);
        } else if (state.categoryPhotosMap && state.categoryPhotosMap[cat] && Array.isArray(state.categoryPhotosMap[cat])) {
          countBadgeText = String(state.categoryPhotosMap[cat].length);
        } else {
          // Cek cache tersimpan khusus event ini (Anti Bocor Antar-Event)
          const savedCount = localStorage.getItem("WEDDING_CAT_COUNT_" + evId + "_" + cat);
          if (savedCount && parseInt(savedCount, 10) > 0) {
            countBadgeText = String(savedCount);
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
          }

          // Trigger fetch realtime di latar belakang agar badge langsung terisi sesuai data aktual vendor
          if (targetUrl || driveFolderId) {
            prefetchCategoryPhotos(cat, targetUrl);
          }
        }

        const activeCatLower = (state.activeCategory || "").trim().toLowerCase();
        const isTabActive = (cat.toLowerCase() === activeCatLower) ||
          (isMain && (activeCatLower === "semua foto" || activeCatLower === mainLabel.toLowerCase()));

        const pill = document.createElement("button");
        pill.className = "filter-pill " + (isTabActive ? "active" : "");
        pill.setAttribute("data-category", cat);
        pill.onclick = function() { selectCategory(cat, targetUrl); };

        pill.innerHTML = `
          <span>${escapeHtml(cat)}</span>
          <span class="pill-count" id="pill-count-${escapeHtml(cat.replace(/\s+/g, '_'))}" style="${countBadgeText ? '' : 'display: none;'}">${countBadgeText}</span>
        `;
        container.appendChild(pill);
      });
    }

    function updateCategoryPillCount(cat, count) {
      const el = document.getElementById("pill-count-" + escapeHtml(cat.replace(/\s+/g, '_')));
      if (el) {
        if (count && count > 0) {
          el.innerText = String(count);
          el.style.display = "";
        } else {
          el.innerText = "";
          el.style.display = "none";
        }
      }
      try {
        const evId = state.currentEventId || "default";
        if (count > 0) {
          localStorage.setItem("WEDDING_CAT_COUNT_" + evId + "_" + cat, String(count));
        } else {
          localStorage.removeItem("WEDDING_CAT_COUNT_" + evId + "_" + cat);
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
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "";
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

    function applyNewBadgeDeltaDetection(cat, photos) {
      if (!Array.isArray(photos) || photos.length === 0) return photos;
      const isPb = Boolean(
        (cat && cat.toLowerCase().includes("photobooth")) ||
        (state.activeCategory && state.activeCategory.toLowerCase().includes("photobooth")) ||
        (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
          return c && (c.isPhotobooth || c.id === "special_photobooth") && String(c.name || "").trim().toLowerCase() === String(cat || "").trim().toLowerCase();
        }))
      );

      if (!isPb) return photos;

      const evId = state.currentEventId || "default";
      const catKey = (cat || "pb").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const storageKey = "SEEN_PB_IDS_" + evId + "_" + catKey;
      let seenIds = [];
      let isInitial = false;

      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          seenIds = JSON.parse(raw);
          if (!Array.isArray(seenIds)) seenIds = [];
        } else {
          isInitial = true;
        }
      } catch (e) {
        isInitial = true;
      }

      // Kunjungan pertama (Baseline): Simpan semua ID, jangan tandai foto lama sebagai baru
      if (isInitial || seenIds.length === 0) {
        const allIds = photos.map(function(p) { return String(p.id); });
        try {
          localStorage.setItem(storageKey, JSON.stringify(allIds));
        } catch (e) {}
        photos.forEach(function(p) {
          p.isNewlyAdded = false;
        });
        return photos;
      }

      // Deteksi delta penambahan: Hanya foto yang ID-nya belum pernah ada di seenIds yang ditandai BARU
      const seenSet = {};
      seenIds.forEach(function(id) { seenSet[String(id)] = true; });
      let newlyFound = 0;
      const updatedIds = [].concat(seenIds);

      photos.forEach(function(p) {
        const idStr = String(p.id);
        if (!seenSet[idStr]) {
          p.isNewlyAdded = true;
          p.detectedAt = Date.now();
          newlyFound++;
          updatedIds.push(idStr);
        } else {
          p.isNewlyAdded = false;
        }
      });

      if (newlyFound > 0) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedIds));
        } catch (e) {}
      }

      return photos;
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
          const stableToken = cleanBase ? (cleanBase.split('/').pop().replace(/[^a-zA-Z0-9_-]/g, '').slice(-20)) : String(idx + 1);
          return {
            id: (item.id || ("gp_" + stableToken)),
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
            const sorted = sortPhotosNewestFirst(data.photos);
            const processed = applyNewBadgeDeltaDetection(cat, sorted);
            state.categoryPhotosMap[cat] = processed;
            if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch(e) {}
            if (callback) callback(processed);
            return;
          }
          throw new Error("No photos from API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS Backend
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              const sorted = sortPhotosNewestFirst(res.photos);
              const processed = applyNewBadgeDeltaDetection(cat, sorted);
              state.categoryPhotosMap[cat] = processed;
              if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
              state.categoryPhotosUrlMap[cat] = url;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch(e) {}
              if (callback) callback(processed);
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
        const cleanThumb = String(it.thumb || "").split("?")[0];
        const thumbUrl = cleanThumb ? (origin + cleanThumb) : "";
        let photoUrl = "";
        let videoUrl = "";
        let downloadUrl = "";

        if (cleanThumb) {
          if (isVideo) {
            videoUrl = origin + cleanThumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg$/i, ".mp4");
            photoUrl = thumbUrl;
            downloadUrl = origin + "/dl/" + it.id + ".mp4";
          } else {
            photoUrl = thumbUrl;
            downloadUrl = origin + "/dl/" + it.id + ".jpg";
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
        // PERTAHANKAN DATA: Jangan pernah mengosongkan cache jika sudah ada data sebelumnya
        if (state.categoryPhotosMap[cat] && state.categoryPhotosMap[cat].length > 0) {
          if (callback) callback(state.categoryPhotosMap[cat]);
          return;
        }
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
            const sorted = sortPhotosNewestFirst(data.photos);
            const processed = applyNewBadgeDeltaDetection(cat, sorted);
            state.categoryPhotosMap[cat] = processed;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
            if (callback) callback(processed);
            return;
          }
          throw new Error("No photos from Kingphotobooth API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS backend getCategoryPhotos
          callBackend("getCategoryPhotos", { url: url, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              const sorted = sortPhotosNewestFirst(res.photos);
              const processed = applyNewBadgeDeltaDetection(cat, sorted);
              state.categoryPhotosMap[cat] = processed;
              state.categoryPhotosUrlMap[cat] = url;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
              if (callback) callback(processed);
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
                originalWebUrl: url || "",
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
            const sorted = sortPhotosNewestFirst(res.photos);
            const processed = applyNewBadgeDeltaDetection(cat, sorted);
            state.categoryPhotosMap[cat] = processed;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
            if (callback) callback(processed);
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
            const sorted = sortPhotosNewestFirst(data.photos);
            const processed = applyNewBadgeDeltaDetection(cat, sorted);
            state.categoryPhotosMap[cat] = processed;
            state.categoryPhotosUrlMap[cat] = url;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
            if (callback) callback(processed);
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
              const list = sortPhotosNewestFirst(parseFotoshareHtml(htmlText));
              const processed = applyNewBadgeDeltaDetection(cat, list);
              if (processed.length > 0) {
                state.categoryPhotosMap[cat] = processed;
                state.categoryPhotosUrlMap[cat] = url;
                try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
                if (callback) callback(processed);
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
        // Hilangkan fallback hardcode: kembalikan array kosong jika folder kategori belum ada foto
        state.categoryPhotosMap[cat] = [];
        state.categoryPhotosUrlMap[cat] = driveKey;
        if (callback) callback([]);
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
          if (data && data.success && Array.isArray(data.photos)) {
            const sorted = sortPhotosNewestFirst(data.photos);
            const processed = applyNewBadgeDeltaDetection(cat, sorted);
            state.categoryPhotosMap[cat] = processed;
            state.categoryPhotosUrlMap[cat] = driveKey;
            try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
            if (callback) callback(processed);
            return;
          }
          throw new Error("No photos from drive-folder API");
        })
        .catch(function() {
          if (timeoutId) clearTimeout(timeoutId);
          // 2. Coba lewat GAS Backend getCategoryPhotos secara realtime
          callBackend("getCategoryPhotos", { folderId: driveFolderId, category: cat }, function(res) {
            if (res && res.success && Array.isArray(res.photos)) {
              const sorted = sortPhotosNewestFirst(res.photos);
              const processed = applyNewBadgeDeltaDetection(cat, sorted);
              state.categoryPhotosMap[cat] = processed;
              state.categoryPhotosUrlMap[cat] = driveKey;
              try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(processed.length)); } catch (e) {}
              if (callback) callback(processed);
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
      try {
        const evId = state.currentEventId || "default";
        sessionStorage.setItem("WEDDING_ACTIVE_TAB_" + evId, category);
      } catch (e) {}

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
      const effectiveCat = String(category || state.activeCategory || state.allPhotosLabel || "Semua Foto").trim();
      const mainLabel = state.allPhotosLabel || "Semua Foto";
      const isMain = (effectiveCat.toLowerCase() === mainLabel.toLowerCase() || effectiveCat.toLowerCase() === "semua foto");

      if (isMain) {
        const mainDriveId = state.activeConfig.DRIVE_FOLDER_ID ? (extractDriveFolderId(state.activeConfig.DRIVE_FOLDER_ID) || state.activeConfig.DRIVE_FOLDER_ID) : "";
        const mainResolvedUrl = targetUrl || (mainDriveId ? ("https://drive.google.com/drive/folders/" + mainDriveId) : "");
        state.filteredPhotos = state.allPhotos;
        renderPhotoGrid(mainResolvedUrl, effectiveCat);
        return;
      }

      // Robust check apakah kategori ini merupakan kategori spesial Photobooth
      const isPbCat = (effectiveCat.toLowerCase().includes("photobooth")) ||
        (Array.isArray(state.customCategories) && state.customCategories.some(function(c) {
          return c && (c.isPhotobooth || c.id === "special_photobooth") && String(c.name || "").trim().toLowerCase() === effectiveCat.toLowerCase();
        }));

      // Pastikan targetUrl selalu di-resolve dari customCategories jika tidak dioper
      if (isPbCat) {
        const pbInput = document.getElementById("pbUrlInput");
        const livePbUrl = (targetUrl && String(targetUrl).trim()) 
          || (state.activeConfig.PHOTOBOOTH_URL && String(state.activeConfig.PHOTOBOOTH_URL).trim())
          || (pbInput && pbInput.value && pbInput.value.trim())
          || "";
        if (livePbUrl) {
          targetUrl = livePbUrl;
        }
      } else if (!targetUrl && Array.isArray(state.customCategories)) {
        const matchedCat = state.customCategories.find(function(c) {
          if (!c) return false;
          const cName = String(c.name || "").trim().toLowerCase();
          return cName === effectiveCat.toLowerCase();
        });
        if (matchedCat && matchedCat.url) {
          targetUrl = String(matchedCat.url).trim();
        }
      }

      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};

      const cachedUrl = state.categoryPhotosUrlMap[effectiveCat];
      const driveFolderId = extractDriveFolderId(targetUrl);
      const effectiveTargetKey = driveFolderId ? ("drive:" + driveFolderId) : targetUrl;

      // 1. Jika sudah ada cache foto kategori: cek ketat apakah URL berubah
      if (effectiveTargetKey && cachedUrl && cachedUrl !== effectiveTargetKey && cachedUrl !== targetUrl) {
        // Tautan telah diganti! Hapus cache lama agar foto dimuat dari tautan baru
        delete state.categoryPhotosMap[effectiveCat];
        delete state.categoryPhotosUrlMap[effectiveCat];
      }

      // Jika cache foto kategori sudah ada dan cocok dengan targetUrl, gunakan langsung
      if (state.categoryPhotosMap[effectiveCat] && state.categoryPhotosMap[effectiveCat].length > 0) {
        if (!effectiveTargetKey || cachedUrl === effectiveTargetKey || cachedUrl === targetUrl) {
          state.filteredPhotos = sortPhotosNewestFirst(state.categoryPhotosMap[effectiveCat]);
          renderPhotoGrid(targetUrl, effectiveCat);
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
          // Watchdog pengaman agar skeleton kategori tidak terkunci jika server eksternal lambat
          setTimeout(function() {
            if (grid && grid.querySelector(".skeleton-card") && (!state.filteredPhotos || state.filteredPhotos.length === 0)) {
              renderPhotoGrid(targetUrl, effectiveCat);
            }
          }, 3500);
        }
      }

      // Bersihkan foto kategori lama seketika dari memori & DOM hanya jika bukan silent refresh
      if (!isSilent) {
        state.filteredPhotos = [];
        showGridSkeleton();
      }

      // 2. Jika tautan Google Photos (album bersama atau photos.app.goo.gl)
      if (isGooglePhotosUrl(targetUrl)) {
        fetchGooglePhotos(effectiveCat, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[effectiveCat] = targetUrl;
          updateCategoryPillCount(effectiveCat, photos.length);
          if (state.activeCategory === effectiveCat) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, effectiveCat);
          }
        });
        return;
      }

      // 3b. Jika tautan eksternal kingphotobooth
      if (targetUrl && (targetUrl.includes("kingphotobooth.co") || targetUrl.includes("kingphoto"))) {
        fetchKingPhotoboothPhotos(effectiveCat, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[effectiveCat] = targetUrl;
          updateCategoryPillCount(effectiveCat, photos.length);
          if (state.activeCategory === effectiveCat) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, effectiveCat);
          }
        });
        return;
      }

      // 3. Jika tautan eksternal fotoshare
      if (targetUrl && targetUrl.includes("fotoshare.co")) {
        fetchFotosharePhotos(effectiveCat, targetUrl, function(photos) {
          state.categoryPhotosUrlMap[effectiveCat] = targetUrl;
          updateCategoryPillCount(effectiveCat, photos.length);
          if (state.activeCategory === effectiveCat) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, effectiveCat);
          }
        });
        return;
      }

      // 4. Jika tautan folder Google Drive
      if (driveFolderId) {
        fetchDriveCategoryPhotos(effectiveCat, driveFolderId, function(photos) {
          state.categoryPhotosUrlMap[effectiveCat] = "drive:" + driveFolderId;
          updateCategoryPillCount(effectiveCat, photos.length);
          if (state.activeCategory === effectiveCat) {
            state.filteredPhotos = photos;
            renderPhotoGrid(targetUrl, effectiveCat);
          }
        });
        return;
      }

      // 4b. Jika kategori Photobooth (mendukung segala variasi URL kustom)
      if (isPbCat) {
        const pbLink = targetUrl || state.activeConfig.PHOTOBOOTH_URL || "";
        if (isGooglePhotosUrl(pbLink)) {
          fetchGooglePhotos(effectiveCat, pbLink, function(photos) {
            state.categoryPhotosUrlMap[effectiveCat] = pbLink;
            updateCategoryPillCount(effectiveCat, photos.length);
            if (state.activeCategory === effectiveCat) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, effectiveCat);
            }
          });
          return;
        }
        if (extractDriveFolderId(pbLink)) {
          fetchDriveCategoryPhotos(effectiveCat, extractDriveFolderId(pbLink), function(photos) {
            state.categoryPhotosUrlMap[effectiveCat] = "drive:" + extractDriveFolderId(pbLink);
            updateCategoryPillCount(effectiveCat, photos.length);
            if (state.activeCategory === effectiveCat) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, effectiveCat);
            }
          });
          return;
        }
        if (pbLink.includes("kingphotobooth.co") || pbLink.includes("kingphoto")) {
          fetchKingPhotoboothPhotos(effectiveCat, pbLink, function(photos) {
            state.categoryPhotosUrlMap[effectiveCat] = pbLink;
            updateCategoryPillCount(effectiveCat, photos.length);
            if (state.activeCategory === effectiveCat) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, effectiveCat);
            }
          });
          return;
        }
        if (pbLink.includes("fotoshare.co")) {
          fetchFotosharePhotos(effectiveCat, pbLink, function(photos) {
            state.categoryPhotosUrlMap[effectiveCat] = pbLink;
            updateCategoryPillCount(effectiveCat, photos.length);
            if (state.activeCategory === effectiveCat) {
              state.filteredPhotos = photos;
              renderPhotoGrid(pbLink, effectiveCat);
            }
          });
          return;
        }
        // Fleksibilitas Penuh: Mendukung vendor kustom lainnya secara dinamis (tidak terkunci)
        if (pbLink) {
          callBackend("getCategoryPhotos", { url: pbLink, category: effectiveCat }, function(res) {
            if (res && res.success && Array.isArray(res.photos) && res.photos.length > 0) {
              const sorted = sortPhotosNewestFirst(res.photos);
              state.categoryPhotosMap[effectiveCat] = sorted;
              state.categoryPhotosUrlMap[effectiveCat] = pbLink;
              updateCategoryPillCount(effectiveCat, sorted.length);
              if (state.activeCategory === effectiveCat) {
                state.filteredPhotos = sorted;
                renderPhotoGrid(pbLink, effectiveCat);
              }
            } else {
              renderPhotoGrid(pbLink, effectiveCat);
            }
          }, function() {
            renderPhotoGrid(pbLink, effectiveCat);
          });
          return;
        }
      }

      // 5. Filter ketat: Jika tanpa link eksternal, hanya cocokkan label kategori secara eksak (tanpa fallback hardcode)
      let matched = state.allPhotos.filter(function(p) {
        return p.category && p.category.toLowerCase() === effectiveCat.toLowerCase();
      });

      state.filteredPhotos = sortPhotosNewestFirst(matched);
      renderPhotoGrid(targetUrl, effectiveCat);
    }

    // Explicit Global Window Bindings untuk Modul Categories
    if (typeof window !== "undefined") {
      window.applyCategoryFilter = applyCategoryFilter;
      window.selectCategory = selectCategory;
      window.syncSingleCategory = syncSingleCategory;
      window.renderCategoryTabs = renderCategoryTabs;
      window.updateCategoryPillCount = updateCategoryPillCount;
      window.isGooglePhotosUrl = isGooglePhotosUrl;
      window.extractDriveFolderId = extractDriveFolderId;
    }

