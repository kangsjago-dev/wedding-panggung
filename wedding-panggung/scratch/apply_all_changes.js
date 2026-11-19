const fs = require('fs');

let app = fs.readFileSync('js/app.js', 'utf8');

console.log('Original app.js length:', app.length);

// 1. Update GLOBAL_CONFIG defaults
app = app.replace(
  /PHOTOBOOTH_URL:\s*["'][^"']*["']/,
  'PHOTOBOOTH_URL: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs"'
);

app = app.replace(
  /DRIVE_FOLDER_ID:\s*["'][^"']*["']/,
  'DRIVE_FOLDER_ID: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5"'
);

// 2. Fix getEffectiveAdminPin to return 111111
app = app.replace(
  'return pin || "121212";',
  'return pin || "111111";'
);

// 3. Fix handleAdminLogin onLoginSuccess to store user.pin
app = app.replace(
  'state.adminPin = password;',
  'state.adminPin = (user && user.pin) ? String(user.pin).trim() : (user && user.password ? String(user.password).trim() : "111111");'
);

// 4. In populateConfigToUI: remove hardcoded fallback texts
app = app.replace(
  'const eventName = (rawName && rawName !== "Hans & Yurike") ? rawName : "Wilson & Felicia";',
  'const eventName = rawName ? String(rawName).trim() : "";'
);
app = app.replace(
  'const rawDate = cfg.EVENT_DATE || "14 November 2026";',
  'const rawDate = cfg.EVENT_DATE ? String(cfg.EVENT_DATE).trim() : "";'
);
app = app.replace(
  'const eventVenue = cfg.EVENT_VENUE || "UpperHills Convention Hall, Makassar";',
  'const eventVenue = cfg.EVENT_VENUE ? String(cfg.EVENT_VENUE).trim() : "";'
);

// 5. In renderCategoryTabs: completely replace with clean realtime badge logic
const rctStart = app.indexOf('function renderCategoryTabs() {');
const rctEnd = app.indexOf('function updateCategoryPillCount(cat, count) {', rctStart);

if (rctStart !== -1 && rctEnd !== -1) {
  const newRct = `function renderCategoryTabs() {
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

        pill.innerHTML = \`
          <span>\${escapeHtml(cat)}</span>
          <span class="pill-count" id="pill-count-\${escapeHtml(cat.replace(/\\s+/g, '_'))}">\${countBadgeText}</span>
        \`;
        container.appendChild(pill);
      });
    }

    `;
  app = app.substring(0, rctStart) + newRct + app.substring(rctEnd);
  console.log('Replaced renderCategoryTabs successfully!');
} else {
  console.error('Could not find renderCategoryTabs range!');
}

// 6. In fallbackKing: remove references to KING_PHOTOBOOTH_INITIAL_CACHE
const fbKingOld = `function fallbackKing() {
        if (typeof KING_PHOTOBOOTH_INITIAL_CACHE !== 'undefined' && Array.isArray(KING_PHOTOBOOTH_INITIAL_CACHE) && KING_PHOTOBOOTH_INITIAL_CACHE.length > 0) {
          const list = buildKingPhotoList(KING_PHOTOBOOTH_INITIAL_CACHE, cat, url);
          state.categoryPhotosMap[cat] = list;
          state.categoryPhotosUrlMap[cat] = url;
          try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(list.length)); } catch (e) {}
          if (callback) callback(list);
        } else {
          state.categoryPhotosMap[cat] = [];
          state.categoryPhotosUrlMap[cat] = url;
          if (callback) callback([]);
        }
      }`;

const fbKingNew = `function fallbackKing() {
        state.categoryPhotosMap[cat] = [];
        state.categoryPhotosUrlMap[cat] = url;
        if (callback) callback([]);
      }`;

if (app.includes(fbKingOld)) {
  app = app.replace(fbKingOld, fbKingNew);
  console.log('Replaced fallbackKing successfully!');
} else {
  console.log('fallbackKing already modified or pattern mismatch');
}

// 7. In fallbackDrive: remove references to WEDDING_INITIAL_CACHE
const fbDriveOld = `function fallbackDrive() {
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
          if (driveFolderId && p.customFolderId === driveFolderId) return true;
          if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
          return false;
        });
        state.categoryPhotosMap[cat] = matched;
        state.categoryPhotosUrlMap[cat] = driveKey;
        try { localStorage.setItem("WEDDING_CAT_COUNT_" + cat, String(matched.length)); } catch (e) {}
        if (callback) callback(matched);
      }`;

const fbDriveNew = `function fallbackDrive() {
        let matched = (state.allPhotos || []).filter(function(p) {
          if (p.category && p.category.toLowerCase() === cat.toLowerCase()) return true;
          if (driveFolderId && p.customFolderId === driveFolderId) return true;
          if (p.name && p.name.toLowerCase().includes(cat.toLowerCase())) return true;
          return false;
        });
        state.categoryPhotosMap[cat] = matched;
        state.categoryPhotosUrlMap[cat] = driveKey;
        if (callback) callback(matched);
      }`;

if (app.includes(fbDriveOld)) {
  app = app.replace(fbDriveOld, fbDriveNew);
  console.log('Replaced fallbackDrive successfully!');
} else {
  console.log('fallbackDrive pattern not found');
}

// 8. In generateUniqueFileName: guarantee uniqueness with timestamp & random salt
const fnStart = app.indexOf('function generateUniqueFileName(baseName, suffix, ext) {');
const fnEnd = app.indexOf('function preloadFrameAssets(', fnStart);
if (fnStart !== -1 && fnEnd !== -1) {
  const newFn = `function generateUniqueFileName(baseName, suffix, ext) {
      const clean = (baseName || "wedding-photo")
        .replace(/\\.[^/.]+$/, "")
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

    `;
  app = app.substring(0, fnStart) + newFn + app.substring(fnEnd);
  console.log('Replaced generateUniqueFileName successfully!');
}

// 9. Instant Direct Download in downloadCurrentPhotoWithFrame
const dlStart = app.indexOf('function downloadCurrentPhotoWithFrame() {');
const dlEnd = app.indexOf('function processNextDownloadQueue()', dlStart);
if (dlStart !== -1 && dlEnd !== -1) {
  const newDl = `function downloadCurrentPhotoWithFrame() {
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

    `;
  app = app.substring(0, dlStart) + newDl + app.substring(dlEnd);
  console.log('Replaced downloadCurrentPhotoWithFrame successfully!');
}

// 10. In executeDirectPhotoDownload: route via download-proxy
const edStart = app.indexOf('function executeDirectPhotoDownload(photo, onDone) {');
const edEnd = app.indexOf('function saveBlobToDevice(', edStart);
if (edStart !== -1 && edEnd !== -1) {
  const newEd = `function executeDirectPhotoDownload(photo, onDone) {
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

    `;
  app = app.substring(0, edStart) + newEd + app.substring(edEnd);
  console.log('Replaced executeDirectPhotoDownload successfully!');
}

// 11. In updateLightboxContent: trigger precompositeLightboxPhoto
const ulcTarget = 'resetLightboxZoom();\n      resetDownloadButton();';
const ulcNew = `resetLightboxZoom();
      resetDownloadButton();
      precompositeLightboxPhoto(photo);`;
if (app.includes(ulcTarget)) {
  app = app.replace(ulcTarget, ulcNew);
  console.log('Added precompositeLightboxPhoto call in updateLightboxContent!');
}

// 12. Add precompositeLightboxPhoto function
const precompFunc = `
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
`;

app += precompFunc;

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Saved new app.js, length:', app.length);

