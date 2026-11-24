/* ==========================================================================
   WEDDING PANGGUNG - GALLERY MODULE (js/gallery.js)
   Photo Grid, Lightbox Zoom, Slideshow Player, Cover Showcase & Compositor
   ========================================================================== */

    function renderPhotoGrid(targetUrl, categoryName) {
      const grid = document.getElementById("photosGrid");
      if (!grid) return;

      // Pastikan seluruh foto diurutkan berdasarkan waktu terbaru di paling atas
      if (Array.isArray(state.filteredPhotos) && state.filteredPhotos.length > 0) {
        state.filteredPhotos = sortPhotosNewestFirst(state.filteredPhotos);
      }

      const activeCat = String(categoryName || state.activeCategory || state.allPhotosLabel || "Semua Foto");
      const isPhotobooth = (activeCat.toLowerCase().includes("photobooth") || (typeof targetUrl === 'string' && targetUrl.includes("fotoshare.co")));

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
        const isMain = (activeCat.toLowerCase() === (state.allPhotosLabel || "Semua Foto").toLowerCase() || activeCat.toLowerCase() === "semua foto");
        const effectiveUrl = isMain ? (targetUrl || state.activeConfig.DRIVE_FOLDER_ID || "") : targetUrl;
        const isUrlMissing = !effectiveUrl || !String(effectiveUrl).trim();

        let emptyBadgeText = "";
        let emptyTitleText = "";
        let emptyDescText = "";

        if (isMain) {
          if (isUrlMissing) {
            emptyBadgeText = `✦ Momen Utama • ${escapeHtml(activeCat)} ✦`;
            emptyTitleText = "Galeri Foto Belum Terhubung";
            emptyDescText = `Tautan folder Google Drive untuk kategori "${escapeHtml(activeCat)}" belum ditautkan oleh penyelenggara acara. Foto dokumentasi momen bahagia akan otomatis tampil begitu folder ditautkan.`;
          } else {
            emptyBadgeText = `✦ Momen Bahagia Segera Hadir ✦`;
            emptyTitleText = "Galeri Foto Masih Kosong";
            emptyDescText = `Setiap senyuman, tatapan penuh cinta, dan kehangatan momen istimewa ini sedang dalam proses kurasi terbaik. Foto-foto kenangan indah akan segera hadir di sini. Silakan periksa kembali beberapa saat lagi.`;
          }
        } else {
          emptyBadgeText = isUrlMissing ? `✦ Momen Kenangan • ${escapeHtml(activeCat)} ✦` : `✦ Momen Kenangan Segera Hadir ✦`;
          emptyTitleText = isUrlMissing ? "Galeri Foto Belum Terhubung" : "Galeri Foto Masih Kosong";
          emptyDescText = isUrlMissing 
            ? `Tautan album untuk kategori <strong>${escapeHtml(activeCat)}</strong> belum ditautkan oleh penyelenggara acara. Foto momen kenangan indah akan otomatis tampil begitu tautan dokumentasi diperbarui.`
            : `Setiap kebersamaan dan senyuman di kategori <strong>${escapeHtml(activeCat)}</strong> sedang dalam proses kurasi terbaik. Silakan nikmati suasana dan periksa kembali beberapa saat lagi.`;
        }

        grid.innerHTML = `
          <div class="empty-gallery-card">
            <div class="empty-gallery-icon-wrap" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
                <path d="M19 13v.01" stroke-width="2.2"></path>
              </svg>
            </div>
            <div class="empty-gallery-badge">${emptyBadgeText}</div>
            <h3 class="empty-gallery-title">${emptyTitleText}</h3>
            <p class="empty-gallery-desc">
              ${emptyDescText}
            </p>
            <div class="empty-gallery-actions">
              <button type="button" class="empty-gallery-btn-refresh" onclick="syncSingleCategory('${escapeHtml(activeCat)}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>Segarkan Galeri</span>
              </button>
            </div>
          </div>
        `;
        return;
      }

      state.filteredPhotos.forEach(function(photo, index) {
        const card = document.createElement("div");
        card.className = "photo-card" + (photo.isVideo ? " is-video-card" : "");
        card.setAttribute("data-photo-id", photo.id);

        // Khusus photobooth & seluruh kategori: gunakan pencarian mutlak data-photo-id agar bebas swap / desinkronisasi
        card.onclick = function() {
          const photoId = card.getAttribute("data-photo-id");
          const targetIdx = (state.filteredPhotos || []).findIndex(function(p) { return p && String(p.id) === String(photoId); });
          if (targetIdx !== -1) {
            openLightbox(targetIdx);
          } else {
            openLightbox(index);
          }
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

        // Render preview media: Foto di galeri tidak bergerak (statis), dibuka di lightbox baru berputar
        let mediaHtml = `
          <img class="photo-img${rotClass}" 
               src="${escapeHtml(photo.thumbnailUrl)}" 
               alt="${escapeHtml(photo.name)}" 
               loading="lazy" 
               onerror="handlePhotoError(this, '${escapeHtml(photo.id)}');">
        `;
        if (photo.isVideo) {
          mediaHtml += `
            <div class="video-play-hint" aria-hidden="true" title="Klik untuk memutar video">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          `;
        }

        card.innerHTML = `
          ${newBadgeHtml}
          ${videoBadgeHtml}
          ${mediaHtml}
          <div class="photo-overlay">
            ${overlayBadge}
            <div class="photo-name">${escapeHtml(photo.name)}</div>
          </div>
        `;

        grid.appendChild(card);
      });
    }

    function handlePhotoError(imgElement, photoId) {
      if (!imgElement) return;

      // Self-healing 1: jika URL memiliki query string kedaluwarsa (?e=... atau ?s=...), bersihkan dan muat ulang
      const currentSrc = imgElement.getAttribute("src") || imgElement.src || "";
      if (currentSrc.includes("?") && !imgElement.dataset.retriedClean) {
        imgElement.dataset.retriedClean = "true";
        imgElement.src = currentSrc.split("?")[0];
        return;
      }

      // Self-healing 2: jika foto objek memiliki previewUrl alternatif
      const pObj = (state.filteredPhotos || []).find(function(p) { return p && String(p.id) === String(photoId); });
      if (pObj && pObj.previewUrl && !imgElement.dataset.retriedPreview) {
        const cleanPreview = String(pObj.previewUrl).split("?")[0];
        if (cleanPreview && cleanPreview !== currentSrc) {
          imgElement.dataset.retriedPreview = "true";
          imgElement.src = cleanPreview;
          return;
        }
      }

      // Self-healing 3: Jika Kingphotobooth, coba proxy internal thumbnail
      if (pObj && (pObj.isKing || currentSrc.includes("kingphotobooth.co")) && !imgElement.dataset.retriedProxy) {
        imgElement.dataset.retriedProxy = "true";
        const token = pObj.shareToken || (pObj.id ? String(pObj.id).replace(/^king_/, "") : "");
        if (token) {
          imgElement.src = "/api/kingphotobooth?action=thumb&token=" + encodeURIComponent(token);
          return;
        }
      }

      // TIDAK BOLEH MENGHAPUS ELEMEN KARTU! Ke-288 foto harus selalu lengkap di layar
      // Tampilkan placeholder ornamen elegan agar kartu tetap utuh dan dapat dibuka di lightbox
      imgElement.onerror = null;
      imgElement.style.opacity = "0.7";
      imgElement.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="#FAF8F5">
          <rect width="400" height="400" fill="#FAF8F5"/>
          <circle cx="200" cy="180" r="48" fill="#F3EFEA"/>
          <path d="M185 170a15 15 0 1 0 30 0 15 15 0 0 0-30 0zm45 35h-60c-8 0-15 7-15 15v10h90v-10c0-8-7-15-15-15z" fill="#C5A880"/>
          <text x="200" y="270" font-family="sans-serif" font-size="14" font-weight="600" fill="#8C7A6B" text-anchor="middle">Momen Kenangan</text>
        </svg>
      `);
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

      const heading = cov.heading || ("The Wedding of " + (state.activeConfig.EVENT_NAME || ""));
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

      // Jika belum ada foto cover dari database atau galeri, sembunyikan container cover (bebas fallback hardcode)
      if (photoList.length === 0) {
        container.style.display = "none";
        return;
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
      if (!val) return "";
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

    function generateBrandedQrCode(targetUrl, logoUrl, callback) {
      const baseQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=H&margin=12&data=" + encodeURIComponent(targetUrl);
      if (!logoUrl) {
        if (callback) callback(baseQrUrl);
        return;
      }

      const normLogo = normalizeDriveImageUrl(logoUrl);

      loadSafeCanvasImage(baseQrUrl, function(qrImg) {
        loadSafeCanvasImage(normLogo, function(logoImg) {
          try {
            const size = 600;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // 1. Gambar QR Code dasar
            ctx.drawImage(qrImg, 0, 0, size, size);

            // 2. Dapatkan batas objek aktual logo (memotong ruang kosong/transparan bawaan berkas PNG)
            let sx = 0, sy = 0, sw = logoImg.naturalWidth || logoImg.width || 100, sh = logoImg.naturalHeight || logoImg.height || 100;
            try {
              const testCanvas = document.createElement("canvas");
              testCanvas.width = sw;
              testCanvas.height = sh;
              const tCtx = testCanvas.getContext("2d");
              tCtx.drawImage(logoImg, 0, 0);
              const imgData = tCtx.getImageData(0, 0, sw, sh).data;
              let top = -1, bottom = -1, left = -1, right = -1;
              for (let y = 0; y < sh; y++) {
                for (let x = 0; x < sw; x++) {
                  if (imgData[(y * sw + x) * 4 + 3] > 15) {
                    if (top === -1) top = y;
                    bottom = y;
                    if (left === -1 || x < left) left = x;
                    if (right === -1 || x > right) right = x;
                  }
                }
              }
              if (top !== -1 && bottom !== -1 && left !== -1 && right !== -1) {
                sx = left;
                sy = top;
                sw = Math.max(1, right - left + 1);
                sh = Math.max(1, bottom - top + 1);
              }
            } catch (eTrim) {
              // Jika getImageData terhalang CORS, gunakan ukuran dimensi natural
            }

            // 3. Batas dimensi proporsional aman untuk QR Code ECC=H (logo 3x lebih besar dari sebelumnya)
            const maxLogoW = Math.round(size * 0.48); // ~288px (maksimal lebar tengah aman)
            const maxLogoH = Math.round(size * 0.32); // ~192px (maksimal tinggi tengah aman)
            const scale = Math.min(maxLogoW / sw, maxLogoH / sh);
            const dw = Math.round(sw * scale);
            const dh = Math.round(sh * scale);

            // 4. Bidang putih solid dibuat RAPI dan PAS mengikuti objek logo (tanpa border sesuai instruksi)
            const padX = Math.round(Math.max(8, dw * 0.04)); // padding horizontal yang rapi dan pas
            const padY = Math.round(Math.max(6, dh * 0.06)); // padding vertikal yang ringkas
            const bw = dw + (padX * 2);
            const bh = dh + (padY * 2);
            const bx = Math.round((size - bw) / 2);
            const by = Math.round((size - bh) / 2);
            const radius = Math.min(12, Math.round(Math.min(bw, bh) * 0.2));

            // Gambar bidang putih solid (TANPA BORDER)
            ctx.save();
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(bx, by, bw, bh, radius);
            } else {
              const r = radius;
              ctx.moveTo(bx + r, by);
              ctx.lineTo(bx + bw - r, by);
              ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
              ctx.lineTo(bx + bw, by + bh - r);
              ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
              ctx.lineTo(bx + r, by + bh);
              ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
              ctx.lineTo(bx, by + r);
              ctx.quadraticCurveTo(bx, by, bx + r, by);
              ctx.closePath();
            }
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            // JANGAN GAMBAR BORDER! (Garis tepi dihilangkan total sesuai instruksi)
            ctx.restore();

            // 5. Gambar objek logo tepat di atas bidang putih solid
            ctx.drawImage(logoImg, sx, sy, sw, sh, bx + padX, by + padY, dw, dh);

            const brandedUrl = canvas.toDataURL("image/png");
            if (callback) callback(brandedUrl);
          } catch (eCanvas) {
            console.warn("QR logo composition error:", eCanvas);
            if (callback) callback(baseQrUrl);
          }
        }, function() {
          if (callback) callback(baseQrUrl);
        });
      }, function() {
        if (callback) callback(baseQrUrl);
      });
    }

    function openShareModal() {
      const modal = document.getElementById("shareQrModal");
      if (!modal) return;

      const titleEl = document.getElementById("shareEventTitle");
      if (titleEl) {
        titleEl.innerText = state.activeConfig.EVENT_NAME || "";
      }

      const formattedDate = formatDayDateIndonesian(state.activeConfig.EVENT_DATE || "");
      const venue = (state.activeConfig.EVENT_VENUE || "").trim();

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

      // Ambil logo acara / monogram dari konfigurasi event aktif
      const activeLogo = (state.activeConfig.EVENT_LOGO_URL || state.activeConfig.LOGO_URL || state.activeConfig.logoUrl || "").trim();
      const qrImg = document.getElementById("shareQrImg");

      // Tampilkan QR Code awal secara instan (resolusi tinggi ecc=H untuk toleransi logo)
      const baseQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=H&margin=12&data=" + encodeURIComponent(fullUrl);
      if (qrImg) {
        qrImg.src = baseQrUrl;
      }

      // Jika ada logo acara / monogram, gabungkan logo di tengah dengan background solid putih
      if (activeLogo && qrImg) {
        generateBrandedQrCode(fullUrl, activeLogo, function(brandedDataUrl) {
          if (brandedDataUrl && qrImg && modal.classList.contains("active")) {
            qrImg.src = brandedDataUrl;
          }
        });
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
      
      // Jika data URI langsung dari canvas komposit QR dengan logo
      if (qrImg.src.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = qrImg.src;
        a.download = "QR_Galeri_" + eventName + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("✓ Gambar QR Code dengan Logo berhasil diunduh!");
        return;
      }

      // Unduh langsung gambar QR eksternal
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
       DOWNLOAD PROGRESS WIDGET & QUEUE MANAGER
       ========================================================================== */

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
      const effectiveCat = String(state.activeCategory || state.allPhotosLabel || "Semua Foto").trim().toLowerCase();
      const mainLabel = String(state.allPhotosLabel || "Semua Foto").trim().toLowerCase();
      const isMainActive = (effectiveCat === "semua foto" || effectiveCat === mainLabel);
      if (isMainActive) {
        // Kategori utama ("Semua Foto" / label kustom) BUKAN photobooth!
        return false;
      }
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

    function getActiveFrameUrl() {
      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      const raw = (state.activeConfig && state.activeConfig.FRAME_IMAGE_URL) ||
                  (curEv && curEv.frameImageUrl) ||
                  (typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.FRAME_IMAGE_URL) || "";
      return normalizeDriveImageUrl(raw);
    }

    function downloadCurrentPhotoWithFrame() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;

      const isPhotobooth = isPhotoPhotobooth(photo);
      const frameUrl = getActiveFrameUrl();

      // 1. Jika berkas Photobooth atau tanpa bingkai: unduh langsung tanpa proses canvas
      if (isPhotobooth || !frameUrl) {
        executeDirectPhotoDownload(photo);
        return;
      }

      // 2. Jika foto berbingkai SUDAH di-precomposite saat membuka lightbox:
      // Eksekusi LANGSUNG 100% SINKRONIS (0ms) di dalam klik pengguna!
      // Ini menjaga userActivation.isActive = true sehingga browser Android (Samsung Internet) TIDAK PERNAH memunculkan dialog konfirmasi!
      if (state.precompositedBlob && state.precompositedPhotoId === photo.id) {
        const fileName = (typeof getExactPhotoFileName === "function") ? getExactPhotoFileName(photo, ".jpg") : (photo.rawName || photo.name || "Foto.jpg");
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
      const frameUrl = getActiveFrameUrl();

      if (isPhotobooth || !frameUrl) {
        updateDownloadWidget(35, "Mengunduh Berkas Asli...", (photo.name || "Foto") + " • Kualitas Asli" + queueSuffix, false);
        executeDirectPhotoDownload(photo, advanceQueue);
        return;
      }

      updateDownloadWidget(30, "Memuat Foto & Bingkai Kualitas Penuh...", (photo.name || "Foto") + " • Resolusi Asli" + queueSuffix, false);
      executeFramedPhotoDownload(photo, frameUrl, advanceQueue);
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
      const frameUrl = getActiveFrameUrl();
      if (!frameUrl) return;

      if (state.currentPreparedFramedBlobPhotoId === photo.id && state.currentPreparedFramedBlob) return;

      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=s0") : "");
      if (!photoSrc) return;

      loadSafeCanvasImage(photoSrc, function(photoImg) {
        function doComposite(frameImg) {
          try {
            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;
            const rot = getPhotoRotation(photo.id, photo.category);
            const isRotated90 = (rot % 180 !== 0);

            // JANGAN UBAH UKURAN DARI FILE: Dimensi canvas harus 100% persis sama dengan ukuran asli foto
            const canvasW = isRotated90 ? ph : pw;
            const canvasH = isRotated90 ? pw : ph;

            const canvas = document.createElement("canvas");
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvasW, canvasH);

            if (rot % 360 !== 0) {
              ctx.save();
              ctx.translate(canvasW / 2, canvasH / 2);
              ctx.rotate((rot * Math.PI) / 180);
              ctx.drawImage(photoImg, -pw / 2, -ph / 2, pw, ph);
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, 0, 0, pw, ph);
            }

            ctx.drawImage(frameImg, 0, 0, canvasW, canvasH);

            canvas.toBlob(function(blob) {
              if (blob) {
                state.currentPreparedFramedBlob = blob;
                state.currentPreparedFramedBlobPhotoId = photo.id;
              }
            }, "image/jpeg", 0.98);
          } catch (err) {
            console.warn("Pre-composite failed:", err);
          }
        }

        if (state.cachedFrame && state.cachedFrame.url === frameUrl) {
          doComposite(state.cachedFrame.img);
        } else {
          loadSafeCanvasImage(frameUrl, function(fImg) {
            preloadFrameAssets(frameUrl);
            doComposite(fImg);
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
      const dMatch = urlOrId.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
      if (dMatch && (urlOrId.includes("drive.google.com") || urlOrId.includes("docs.google.com") || !urlOrId.startsWith("http"))) {
        effectiveUrl = "https://lh3.googleusercontent.com/d/" + dMatch[1] + "=s0";
      } else if (/^[a-zA-Z0-9_\-]{15,}$/.test(urlOrId) && !urlOrId.startsWith("http")) {
        effectiveUrl = "https://lh3.googleusercontent.com/d/" + urlOrId + "=s0";
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() { callback(img); };
      img.onerror = function() {
        const fileId = dMatch ? dMatch[1] : urlOrId;
        const altImg = new Image();
        altImg.crossOrigin = "anonymous";
        altImg.onload = function() { callback(altImg); };
        altImg.onerror = function() {
          const proxyImg = new Image();
          proxyImg.crossOrigin = "anonymous";
          proxyImg.onload = function() { callback(proxyImg); };
          proxyImg.onerror = function() {
            if (errCallback) errCallback();
          };
          proxyImg.src = "/api/download-proxy?url=" + encodeURIComponent(effectiveUrl);
        };
        altImg.src = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w4000";
      };
      img.src = effectiveUrl;
    }

    function executeFramedPhotoDownload(photo, frameUrl, onDone) {
      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=s0") : "");
      
      loadSafeCanvasImage(photoSrc, function(photoImg) {
        updateDownloadWidget(55, "Menggabungkan Foto Beresolusi Penuh...", (photo.name || "Foto") + " • Menjaga Ukuran Asli", false);

        function renderFrameWithCutout(frameImg) {
          try {
            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;
            const rot = getPhotoRotation(photo.id, photo.category);
            const isRotated90 = (rot % 180 !== 0);

            // JANGAN UBAH UKURAN DARI FILE: Dimensi canvas harus 100% persis sama dengan resolusi asli foto
            const canvasW = isRotated90 ? ph : pw;
            const canvasH = isRotated90 ? pw : ph;

            const canvas = document.createElement("canvas");
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvasW, canvasH);

            if (rot % 360 !== 0) {
              ctx.save();
              ctx.translate(canvasW / 2, canvasH / 2);
              ctx.rotate((rot * Math.PI) / 180);
              ctx.drawImage(photoImg, -pw / 2, -ph / 2, pw, ph);
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, 0, 0, pw, ph);
            }

            ctx.drawImage(frameImg, 0, 0, canvasW, canvasH);

            updateDownloadWidget(85, "Menyimpan ke Memori Perangkat...", (photo.name || "Foto") + " • Kualitas Asli", false);

            canvas.toBlob(function(blob) {
              if (blob) {
                const fileName = (typeof getExactPhotoFileName === "function") ? getExactPhotoFileName(photo, ".jpg") : (photo.rawName || photo.name || "Foto.jpg");
                saveBlobToDevice(blob, fileName);
                if (onDone) onDone();
              } else {
                executeDirectPhotoDownload(photo, onDone);
              }
            }, "image/jpeg", 0.98);

          } catch (eCanvas) {
            console.warn("Canvas compositing error, fallback to direct download:", eCanvas);
            executeDirectPhotoDownload(photo, onDone);
          }
        }

        const activeFrame = frameUrl || getActiveFrameUrl();
        if (state.cachedFrame && state.cachedFrame.url === activeFrame) {
          renderFrameWithCutout(state.cachedFrame.img);
        } else {
          loadSafeCanvasImage(activeFrame, function(frameImg) {
            preloadFrameAssets(activeFrame);
            renderFrameWithCutout(frameImg);
          }, function() {
            showToast("⚠️ Berkas bingkai tidak dapat diakses dari Google Drive. Pastikan izin berbagi disetel 'Anyone with the link can view'.", "error");
            executeDirectPhotoDownload(photo, onDone);
          });
        }
      }, function() {
        showToast("⚠️ Berkas foto tidak dapat dimuat untuk penggabungan bingkai.", "error");
        executeDirectPhotoDownload(photo, onDone);
      });
    }


    function executeDirectPhotoDownload(photo, onDone) {
      if (!photo) { if (onDone) onDone(); return; }
      const isVideo = Boolean(photo.isVideo);
      let rawUrl = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";

      // Jika Google Drive: pastikan mengunduh berkas MASTER ASLI 100% tanpa kompresi
      const driveMatch = String(rawUrl).match(/(?:\/d\/|id=)([a-zA-Z0-9_\-]{25,})/) ||
                         (photo.id && /^[a-zA-Z0-9_\-]{25,}$/.test(photo.id) ? [null, photo.id] : null);
      if (driveMatch && driveMatch[1]) {
        rawUrl = "https://drive.usercontent.google.com/download?id=" + driveMatch[1] + "&export=download";
      } else if (rawUrl && rawUrl.includes("fotoshare.co")) {
        rawUrl = rawUrl.replace(/\?.*$/, "");
      } else if (rawUrl && rawUrl.includes("googleusercontent.com/pw/")) {
        rawUrl = rawUrl.replace(/=[^/]*$/, "") + "=d";
      }

      const ext = isVideo ? ".mp4" : ".jpg";
      const fileName = (typeof getExactPhotoFileName === "function") ? getExactPhotoFileName(photo, ext) : (photo.rawName || photo.name || ("Berkas" + ext));

      if (!rawUrl) {
        showToast("⚠️ Tautan berkas tidak ditemukan");
        updateDownloadWidget(0, "⚠️ Gagal Mengunduh", "Tautan berkas tidak tersedia", true);
        if (onDone) onDone();
        return;
      }

      updateDownloadWidget(20, isVideo ? "Mengunduh Video Asli..." : "Mengunduh Foto Asli...", (photo.name || "Foto") + " • Mengambil dari server...", false);
      showToast(isVideo ? "⏳ Mengunduh video asli kualitas penuh..." : "⏳ Mengunduh foto asli kualitas penuh...");

      const proxyUrl = "/api/download-proxy?url=" + encodeURIComponent(rawUrl) + "&filename=" + encodeURIComponent(fileName);

      // Ambil berkas fisik (Blob) ke memori perangkat sebelum menyimpan
      fetch(proxyUrl)
        .then(function(res) {
          if (!res.ok) throw new Error("Proxy HTTP " + res.status);
          updateDownloadWidget(65, "Menerima Berkas Asli...", (photo.name || "Foto") + " • Menyiapkan penyimpanan...", false);
          return res.blob();
        })
        .then(function(blob) {
          if (!blob || blob.size === 0) throw new Error("Berkas kosong diterima");
          const sizeText = formatFileSize(blob.size);
          updateDownloadWidget(88, "Menyimpan ke Memori Perangkat...", (photo.name || "Foto") + (sizeText ? (" • " + sizeText) : ""), false);

          saveBlobToDevice(blob, fileName);

          updateDownloadWidget(100, "✓ Berhasil Disimpan!", (photo.name || "Foto") + (sizeText ? (" (" + sizeText + ")") : ""), true);
          showToast(isVideo ? "✓ Video asli berhasil disimpan ke perangkat!" : "✓ Foto asli berhasil disimpan ke perangkat!");
          if (onDone) onDone();
        })
        .catch(function(err) {
          console.warn("Proxy download error, mencoba direct fetch:", err);
          // Fallback direct fetch jika proxy terhambat
          fetch(rawUrl)
            .then(function(res) {
              if (!res.ok) throw new Error("Direct HTTP " + res.status);
              return res.blob();
            })
            .then(function(blob) {
              if (!blob || blob.size === 0) throw new Error("Berkas kosong dari direct fetch");
              const sizeText = formatFileSize(blob.size);
              saveBlobToDevice(blob, fileName);
              updateDownloadWidget(100, "✓ Berhasil Disimpan!", (photo.name || "Foto") + (sizeText ? (" (" + sizeText + ")") : ""), true);
              showToast(isVideo ? "✓ Video asli berhasil disimpan ke perangkat!" : "✓ Foto asli berhasil disimpan ke perangkat!");
              if (onDone) onDone();
            })
            .catch(function(finalErr) {
              console.error("Gagal mengunduh berkas fisik:", finalErr);
              triggerDirectLinkDownload(proxyUrl, fileName);
              updateDownloadWidget(0, "⚠️ Gagal Mengunduh Otomatis", "Membuka tautan unduhan via browser...", true);
              showToast("⚠️ Mengalihkan unduhan ke browser...");
              if (onDone) onDone();
            });
        });
    }

    function saveBlobToDevice(blob, fileName) {
      if (!blob) return;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = fileName;
      a.rel = "noopener";
      if (isIOS) {
        a.target = "_blank";
      }
      document.body.appendChild(a);
      try {
        a.click();
      } catch (e) {
        window.open(blobUrl, "_blank");
      }
      setTimeout(function() {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 45000);
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
      if (!Array.isArray(state.filteredPhotos) || !state.filteredPhotos[index]) return;
      state.currentLightboxIndex = index;
      const photo = state.filteredPhotos[index];

      const modal = document.getElementById("lightbox");
      if (modal) modal.classList.add("active");
      document.body.style.overflow = "hidden";

      setupLightboxBackdropClick();
      initLightboxZoomEvents();
      resetLightboxZoom();
      resetDownloadButton();
      updateLightboxContent();
      precompositeLightboxPhoto(photo);
    }

    function closeLightbox() {
      const modal = document.getElementById("lightbox");
      modal.classList.remove("active");
      document.body.style.overflow = "";

      const vid = document.getElementById("lightboxVideo");
      if (vid) {
        if (typeof vid.pause === "function") {
          try { vid.pause(); } catch(e) {}
        }
        vid.src = "";
        vid.style.display = "none";
      }
      resetLightboxZoom();
      resetDownloadButton();
    }

    function navigateLightbox(direction) {
      if (!Array.isArray(state.filteredPhotos) || state.filteredPhotos.length === 0) return;
      let newIndex = state.currentLightboxIndex + direction;
      if (newIndex < 0) {
        newIndex = state.filteredPhotos.length - 1;
      } else if (newIndex >= state.filteredPhotos.length) {
        newIndex = 0;
      }
      state.currentLightboxIndex = newIndex;
      resetLightboxZoom();
      updateLightboxContent();
      const currentPhoto = state.filteredPhotos[newIndex];
      if (currentPhoto) precompositeLightboxPhoto(currentPhoto);
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
          if (typeof video.play === "function") {
            try { video.play().catch(function(){}); } catch(e) {}
          }
        }
        if (btnLabel) btnLabel.innerText = "⬇️ Unduh Video Asli Photobooth";
        if (btn) {
          btn.onclick = function() {
            queuePhotoDownload(photo);
          };
        }
      } else {
        if (video) {
          if (typeof video.pause === "function") {
            try { video.pause(); } catch(e) {}
          }
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

        const isPhotobooth = isPhotoPhotobooth(photo);

        if (isPhotobooth) {
          if (btnLabel) btnLabel.innerText = photo.isVideo ? "⬇️ Unduh Video Asli (Ukuran Penuh)" : "⬇️ Unduh Foto Asli (Ukuran Penuh)";
          if (btn) {
            btn.onclick = function() {
              executeDirectPhotoDownload(photo);
            };
          }
        } else {
          // Semua kategori momen lainnya mengikuti settingan kategori utama (berbingkai jika frame dikonfigurasi)
          const frameUrl = getActiveFrameUrl();
          const hasFrame = Boolean(frameUrl);

          if (hasFrame) {
            if (btnLabel) btnLabel.innerText = "✨ Simpan Kenangan Berbingkai";
            prepareLightboxFramedBlob(photo);
            if (btn) {
              btn.onclick = function() {
                if (state.currentPreparedFramedBlobPhotoId === photo.id && state.currentPreparedFramedBlob) {
                  const fileName = (typeof getExactPhotoFileName === "function") ? getExactPhotoFileName(photo, ".jpg") : (photo.rawName || photo.name || "Foto.jpg");
                  saveBlobToDevice(state.currentPreparedFramedBlob, fileName);
                  showToast("✓ Foto berbingkai berhasil tersimpan ke perangkat!");
                  updateDownloadWidget(100, "✓ Berhasil Disimpan!", photo.name || "Foto", true);
                } else if (state.precompositedPhotoId === photo.id && state.precompositedBlob) {
                  const fileName = (typeof getExactPhotoFileName === "function") ? getExactPhotoFileName(photo, ".jpg") : (photo.rawName || photo.name || "Foto.jpg");
                  saveBlobToDevice(state.precompositedBlob, fileName);
                  showToast("✓ Foto berbingkai berhasil tersimpan ke perangkat!");
                  updateDownloadWidget(100, "✓ Berhasil Disimpan!", photo.name || "Foto", true);
                } else {
                  queuePhotoDownload(photo);
                }
              };
            }
          } else {
            if (btnLabel) btnLabel.innerText = "⬇️ Unduh Foto Asli (Ukuran Penuh)";
            if (btn) {
              btn.onclick = function() {
                executeDirectPhotoDownload(photo);
              };
            }
          }
        }
      }
    }

    function handleCurrentLightboxDownload() {
      const photo = state.filteredPhotos[state.currentLightboxIndex];
      if (!photo) return;
      downloadCurrentPhotoWithFrame();
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
      let photos = state.filteredPhotos;
      if (!photos || photos.length === 0) {
        // Fallback: jika kategori saat ini kosong, putar dari seluruh foto event (state.allPhotos)
        if (state.allPhotos && state.allPhotos.length > 0) {
          state.filteredPhotos = state.allPhotos.slice();
          photos = state.filteredPhotos;
        } else {
          showToast("Belum ada foto yang tersedia untuk Mode Panggung.", "warning");
          return;
        }
      }

      state.currentSlideIndex = startIndex || 0;
      if (state.currentSlideIndex >= photos.length || state.currentSlideIndex < 0) {
        state.currentSlideIndex = 0;
      }

      const overlay = document.getElementById("slideshowOverlay");
      if (!overlay) return;
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";

      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function() {});
      }

      // Pastikan durasi interval mengikuti database realtime
      const dbInterval = parseInt(state.activeConfig.SLIDESHOW_INTERVAL_SEC, 10);
      if (dbInterval && dbInterval > 0) {
        state.intervalMs = dbInterval * 1000;
      }

      state.isSlideshowPlaying = true;
      updatePlayPauseIcons();
      showSlide(state.currentSlideIndex);
      startSlideshowLoop();
    }

    function closeSlideshow() {
      const overlay = document.getElementById("slideshowOverlay");
      if (overlay) overlay.classList.remove("active");
      document.body.style.overflow = "";

      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(function() {});
      }

      clearInterval(state.slideshowTimer);
      clearInterval(state.slideshowProgressTimer);
    }

    function showSlide(index) {
      if (!state.filteredPhotos || state.filteredPhotos.length === 0) {
        if (state.allPhotos && state.allPhotos.length > 0) {
          state.filteredPhotos = state.allPhotos.slice();
        } else {
          return;
        }
      }

      const photo = state.filteredPhotos[index];
      if (!photo) return;

      // Metadata realtime dari activeConfig (Single Source of Truth)
      const eventName = state.activeConfig.EVENT_NAME || state.activeConfig.COUPLE_NAME || "Wedding Gallery";
      const coupleEl = document.getElementById("slideshowCouple");
      if (coupleEl && coupleEl.innerText !== eventName) {
        coupleEl.innerText = eventName;
      }

      const eventDate = state.activeConfig.EVENT_DATE || "";
      const eventVenue = state.activeConfig.EVENT_VENUE || "";
      const photoCat = photo.category || state.activeCategory || "";
      const infoParts = [eventDate, eventVenue, photoCat].filter(Boolean);
      const catEl = document.getElementById("slideshowCategory");
      if (catEl) {
        catEl.innerText = infoParts.join(" • ");
      }

      const imgA = document.getElementById("slideshowImgA");
      const imgB = document.getElementById("slideshowImgB");
      if (!imgA || !imgB) return;

      // Ambil resolusi tajam maksimal untuk layar proyeksi panggung
      const sharpUrl = getSharpPreviewUrl(photo) || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || "";

      // Fallback bertingkat jika foto tajam gagal dimuat (onerror)
      const targetImg = state.activeSlideTarget === 'A' ? imgB : imgA;
      targetImg.onerror = function() {
        this.onerror = null;
        if (photo.previewUrl && this.src !== photo.previewUrl) {
          this.src = photo.previewUrl;
        } else if (photo.thumbnailUrl && this.src !== photo.thumbnailUrl) {
          this.src = photo.thumbnailUrl;
        }
      };

      if (state.activeSlideTarget === 'A') {
        imgB.src = sharpUrl;
        imgB.classList.add("visible");
        imgA.classList.remove("visible");
        state.activeSlideTarget = 'B';
      } else {
        imgA.src = sharpUrl;
        imgA.classList.add("visible");
        imgB.classList.remove("visible");
        state.activeSlideTarget = 'A';
      }

      resetProgressBar();
    }

    function nextSlide() {
      if (!state.filteredPhotos || state.filteredPhotos.length === 0) return;
      state.currentSlideIndex = (state.currentSlideIndex + 1) % state.filteredPhotos.length;
      showSlide(state.currentSlideIndex);
    }

    function prevSlide() {
      if (!state.filteredPhotos || state.filteredPhotos.length === 0) return;
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


    function precompositeLightboxPhoto(photo) {
      if (!photo || isPhotoPhotobooth(photo)) return;
      const frameUrl = getActiveFrameUrl();
      if (!frameUrl) return;

      state.precompositedPhotoId = null;
      state.precompositedBlob = null;

      const photoSrc = photo.downloadUrl || photo.highResUrl || photo.previewUrl || photo.thumbnailUrl || (photo.id ? ("https://lh3.googleusercontent.com/d/" + photo.id + "=s0") : "");
      if (!photoSrc) return;

      loadSafeCanvasImage(photoSrc, function(photoImg) {
        loadSafeCanvasImage(frameUrl, function(frameImg) {
          try {
            const pw = photoImg.naturalWidth || photoImg.width || 1920;
            const ph = photoImg.naturalHeight || photoImg.height || 1080;
            const rot = getPhotoRotation(photo.id, photo.category);
            const isRotated90 = (rot % 180 !== 0);

            // JANGAN UBAH UKURAN DARI FILE: Dimensi canvas harus 100% persis sama dengan ukuran asli foto
            const canvasW = isRotated90 ? ph : pw;
            const canvasH = isRotated90 ? pw : ph;

            const canvas = document.createElement("canvas");
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvasW, canvasH);

            if (rot % 360 !== 0) {
              ctx.save();
              ctx.translate(canvasW / 2, canvasH / 2);
              ctx.rotate((rot * Math.PI) / 180);
              ctx.drawImage(photoImg, -pw / 2, -ph / 2, pw, ph);
              ctx.restore();
            } else {
              ctx.drawImage(photoImg, 0, 0, pw, ph);
            }

            ctx.drawImage(frameImg, 0, 0, canvasW, canvasH);

            canvas.toBlob(function(blob) {
              if (blob && state.currentLightboxIndex !== -1) {
                const currentPhoto = state.filteredPhotos[state.currentLightboxIndex];
                if (currentPhoto && currentPhoto.id === photo.id) {
                  state.precompositedPhotoId = photo.id;
                  state.precompositedBlob = blob;
                }
              }
            }, "image/jpeg", 0.98);
          } catch (e) {}
        }, function() {});
      }, function() {});
    }

    // Explicit Global Window Bindings untuk Modul Gallery & Lightbox
    if (typeof window !== "undefined") {
      window.renderPhotoGrid = renderPhotoGrid;
      window.renderWeddingCoverShowcase = renderWeddingCoverShowcase;
      window.startCoverCarouselAutoPlay = startCoverCarouselAutoPlay;
      window.switchCoverCarouselSlide = switchCoverCarouselSlide;
      window.scrollToGallerySection = scrollToGallerySection;
      window.openShareModal = openShareModal;
      window.closeShareModal = closeShareModal;
      window.copyShareUrl = copyShareUrl;
      window.shareViaWhatsApp = shareViaWhatsApp;
      window.shareViaWebShare = shareViaWebShare;
      window.downloadQrCodeImage = downloadQrCodeImage;
      window.openLightbox = openLightbox;
      window.closeLightbox = closeLightbox;
      window.navigateLightbox = navigateLightbox;
      window.updateLightboxContent = updateLightboxContent;
      window.handleCurrentLightboxDownload = handleCurrentLightboxDownload;
      window.startSlideshowFromCurrent = startSlideshowFromCurrent;
      window.openSlideshow = openSlideshow;
      window.closeSlideshow = closeSlideshow;
      window.togglePlayPause = togglePlayPause;
      window.nextSlide = nextSlide;
      window.prevSlide = prevSlide;
      window.zoomLightbox = zoomLightbox;
      window.resetLightboxZoom = resetLightboxZoom;
      window.applyLightboxZoom = applyLightboxZoom;
      window.initLightboxZoomEvents = initLightboxZoomEvents;
      window.setupLightboxBackdropClick = setupLightboxBackdropClick;
      window.queuePhotoDownload = queuePhotoDownload;
      window.executeDirectPhotoDownload = executeDirectPhotoDownload;
      window.saveBlobToDevice = saveBlobToDevice;
      window.dismissDownloadWidget = dismissDownloadWidget;
    }

