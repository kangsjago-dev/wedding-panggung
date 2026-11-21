/* ==========================================================================
   WEDDING PANGGUNG - ADMIN MODULE (js/admin.js)
   Panel Admin, Manajemen Multi-Event, Akun Admin, Cover & Form Pengaturan
   ========================================================================== */

    function getEffectiveAdminPin() {
      let pin = state.adminPin;
      if (!pin || pin === "123") {
        try {
          pin = sessionStorage.getItem("WEDDING_ADMIN_PIN") || localStorage.getItem("WEDDING_ADMIN_PIN") || "";
        } catch(e) {}
      }
      if (!pin || pin === "123") {
        pin = state.activeConfig.ADMIN_PIN || "";
      }
      return pin;
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
        state.adminPin = (user && user.pin) ? String(user.pin).trim() : (user && user.password ? String(user.password).trim() : "");
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
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Masuk</span>`;
        if (res && res.success) {
          onLoginSuccess(res.user);
        } else {
          if (alertBox) {
            alertBox.innerText = (res && res.message) ? res.message : "Username atau Password tidak sesuai. Silakan coba kembali.";
            alertBox.style.display = "block";
          }
        }
      }, function(err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Masuk</span>`;
        if (alertBox) {
          alertBox.innerText = (err && err.message) ? err.message : "Gagal terhubung ke database. Periksa koneksi internet Anda.";
          alertBox.style.display = "block";
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

    function handleTriggerDatabaseSetup() {
      const btn = document.getElementById("btnSyncDatabaseToSheet");
      const btnText = document.getElementById("syncDbBtnText");
      const statusText = document.getElementById("dbSyncStatusText");

      if (btn) btn.disabled = true;
      if (btnText) btnText.innerText = "⏳ Menghubungi Google Apps Script...";
      if (statusText) { statusText.style.display = "none"; }

      callBackend("setupDatabase", { pin: getEffectiveAdminPin() }, function(res) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "⚡ Sinkronkan / Inisialisasi Database Google Sheets";
        if (statusText) {
          statusText.style.display = "block";
          if (res && res.success) {
            statusText.style.color = "#166534";
            statusText.innerText = "✓ Berhasil! " + (res.message || "Tabel database ERP Google Sheets telah dibuat & disinkronkan.");
            showToast("✓ Database Google Sheets berhasil diinisialisasi!");
          } else {
            statusText.style.color = "#DC2626";
            statusText.innerText = "⚠️ Respons Apps Script: " + (res.message || res.error || "Gagal. Pastikan file setup.gs sudah di-deploy pada Apps Script.");
            showToast("⚠️ " + (res.message || res.error || "Gagal menghubungkan ke database"));
          }
        }
      }, function(err) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = "⚡ Sinkronkan / Inisialisasi Database Google Sheets";
        if (statusText) {
          statusText.style.display = "block";
          statusText.style.color = "#DC2626";
          statusText.innerText = "⚠️ Gangguan koneksi ke backend: " + (err.message || err);
        }
        showToast("⚠️ Gangguan koneksi ke Apps Script.");
      });
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

      if (!state.currentEventId && Array.isArray(state.events) && state.events.length > 0) {
        state.currentEventId = state.events[0].id;
      }

      // Sinkronkan activeConfig dengan event yang sedang dipilih sebelum memuat input form
      const activeEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (activeEv) {
        state.activeConfig.ACTIVE_EVENT_ID = activeEv.id;
        state.activeConfig.EVENT_NAME = activeEv.name || state.activeConfig.EVENT_NAME;
        state.activeConfig.COUPLE_NAME = activeEv.name || state.activeConfig.COUPLE_NAME;
        state.activeConfig.EVENT_DATE = activeEv.date || state.activeConfig.EVENT_DATE;
        state.activeConfig.EVENT_VENUE = activeEv.venue || state.activeConfig.EVENT_VENUE;
        state.activeConfig.EVENT_LOGO_URL = activeEv.logoUrl || activeEv.EVENT_LOGO_URL || state.activeConfig.EVENT_LOGO_URL || GLOBAL_CONFIG.EVENT_LOGO_URL || "";
        state.activeConfig.logoUrl = state.activeConfig.EVENT_LOGO_URL;
        if (activeEv.subtitle) state.activeConfig.SUBTITLE = activeEv.subtitle;
        if (activeEv.welcomeMessage) state.activeConfig.WELCOME_MESSAGE = activeEv.welcomeMessage;
        if (activeEv.footerMessage) state.activeConfig.FOOTER_MESSAGE = activeEv.footerMessage;
        if (activeEv.allPhotosLabel) state.activeConfig.ALL_PHOTOS_LABEL = activeEv.allPhotosLabel;
        if (activeEv.driveFolderId) state.activeConfig.DRIVE_FOLDER_ID = activeEv.driveFolderId;
        if (activeEv.photoboothUrl) state.activeConfig.PHOTOBOOTH_URL = activeEv.photoboothUrl;
        if (activeEv.frameImageUrl) state.activeConfig.FRAME_IMAGE_URL = activeEv.frameImageUrl;
        if (Array.isArray(activeEv.customCategories) && activeEv.customCategories.length > 0) {
          state.activeConfig.CUSTOM_CATEGORIES = activeEv.customCategories;
          state.customCategories = activeEv.customCategories;
        }
      }

      renderAdminEventsManager();

      if (state.currentAdminUser) {
        const greetingNameEl = document.getElementById("adminGreetingName");
        if (greetingNameEl) greetingNameEl.innerText = state.currentAdminUser.name || "Admin";
      }
      loadAdminUsers();

      const cfgGasApiUrlEl = document.getElementById("cfgGasApiUrl");
      if (cfgGasApiUrlEl) cfgGasApiUrlEl.value = state.gasApiUrl || "";

      populateAdminInputsForActiveEvent(state.activeConfig);
      renderAdminCategoriesManager();

      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.getElementById("adminSettingsModal").classList.add("active");
    }

    function handleEventDriveFolderInput(val) {
      const cleanVal = (val || "").trim();
      state.activeConfig.DRIVE_FOLDER_ID = cleanVal;

      const inp = document.getElementById("cfgDriveFolderId");
      if (inp && inp.value !== cleanVal) inp.value = cleanVal;

      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.driveFolderId = cleanVal;
      }
      state.lastLocalCategoryEditTime = Date.now();
    }
    window.handleEventDriveFolderInput = handleEventDriveFolderInput;

    function renderAdminCategoriesManager() {
      const container = document.getElementById("adminCategoriesContainer");
      if (!container) return;
      container.innerHTML = "";

      let categories = state.customCategories;
      if (!Array.isArray(categories)) {
        categories = [];
      }

      // 1. Setting Kategori Galeri Utama ("Semua Foto") Khusus Event Aktif + Input Tautan Google Drive Berdampingan
      const currentDriveFolder = state.activeConfig.DRIVE_FOLDER_ID || "";
      const currentEventName = state.activeConfig.EVENT_NAME || state.currentEventId || "Acara";
      const mainLabelBox = document.createElement("div");
      mainLabelBox.style.cssText = "background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      mainLabelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--gold-dark); display: flex; align-items: center; gap: 6px;">
            <span>🏷️ Kategori "Semua Foto" - Event: <strong>${escapeHtml(currentEventName)}</strong></span>
            <span id="driveFolderStatusBadge" style="font-size: 0.68rem; background: #ECFDF5; color: #059669; padding: 1px 8px; border-radius: 9999px; border: 1px solid #A7F3D0; font-weight: 700;">✓ Link Khusus Event</span>
          </div>
          <button type="button" class="btn btn-outline" id="btnSyncDrivePhotos" style="font-size: 0.72rem; padding: 3px 8px;" onclick="handleSyncDrivePhotosDirectly()" title="Sinkronkan Foto Google Drive ke Galeri Event Ini">
            <span id="syncDriveBtnText">🔄 Sinkron Google Drive</span>
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1.1fr 1.6fr; gap: 8px; align-items: flex-end;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 0;" for="cfgMainGalleryLabel">Nama Tab Galeri</label>
              <button type="button" style="border: none; background: none; font-size: 0.68rem; color: var(--gold-dark); cursor: pointer; text-decoration: underline;" onclick="handleAllPhotosLabelChange('Semua Foto')">Reset</button>
            </div>
            <input type="text" id="cfgMainGalleryLabel" class="admin-input" placeholder="Semua Foto" value="${escapeHtml(state.allPhotosLabel || 'Semua Foto')}" oninput="handleAllPhotosLabelChange(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;" for="cfgDriveFolderId">Tautan / Folder ID Google Drive (${escapeHtml(currentEventName)})</label>
            <input type="text" id="cfgDriveFolderId" class="admin-input" placeholder="Tautan / ID Folder Google Drive khusus event ini" value="${escapeHtml(currentDriveFolder)}" oninput="handleEventDriveFolderInput(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div class="admin-help-text" style="font-size: 0.7rem; margin-top: 5px;">
          * <strong>Khusus Event ${escapeHtml(currentEventName)}:</strong> Tautan folder Google Drive di atas hanya berlaku untuk event ini. Event A menggunakan Link A, Event B menggunakan Link B (tidak saling bercampur).
        </div>
      `;
      container.appendChild(mainLabelBox);

      // Pisahkan Photobooth dari kategori biasa (secara robust dengan flag isPhotobooth/id)
      let pbItem = categories.find(function(c) {
        return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
      });
      const currentConfigPbUrl = state.activeConfig.PHOTOBOOTH_URL || "";
      if (!pbItem) {
        pbItem = { id: "special_photobooth", isPhotobooth: true, name: "Photobooth", url: currentConfigPbUrl, enabled: true };
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

      // Invalidate cache foto seketika saat URL kategori diubah oleh admin agar tidak memunculkan gambar sebelumnya
      if (!state.categoryPhotosMap) state.categoryPhotosMap = {};
      if (!state.categoryPhotosUrlMap) state.categoryPhotosUrlMap = {};
      list.forEach(function(c) {
        if (!c) return;
        const cName = String(c.name || "").trim();
        const cUrl = String(c.url || "").trim();
        const driveId = extractDriveFolderId(cUrl);
        const effectiveKey = driveId ? ("drive:" + driveId) : cUrl;
        if (state.categoryPhotosUrlMap[cName] && state.categoryPhotosUrlMap[cName] !== effectiveKey && state.categoryPhotosUrlMap[cName] !== cUrl) {
          delete state.categoryPhotosMap[cName];
          delete state.categoryPhotosUrlMap[cName];
          try { localStorage.removeItem("WEDDING_CAT_COUNT_" + cName); } catch(e) {}
        }
      });

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
              EVENTS: JSON.stringify(state.events),
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
          renderAdminUsersList(state.adminUsers || []);
        }
      }, function() {
        renderAdminUsersList(state.adminUsers || []);
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
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.getElementById("adminSettingsModal").classList.remove("active");
      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar && state.isAdminLoggedIn) {
        floatBar.style.display = "flex";
        const nameEl = document.getElementById("floatingBarAdminName");
        if (nameEl) nameEl.innerText = (state.currentAdminUser && state.currentAdminUser.name) ? state.currentAdminUser.name : "Admin";
      }
    }


    /* ==========================================================================
       MULTI-EVENT ADMIN MANAGEMENT FUNCTIONS
       ========================================================================== */
    function renderAdminEventsManager() {
      const select = document.getElementById("adminEventSelect");
      if (!select) return;

      // Pastikan registry memuat event dari localStorage jika ada, lalu sanitasi dari phantom/duplicate event
      try {
        // Bersihkan storage dari residual key EVT- atau duplicate lama
        for (let lk = localStorage.length - 1; lk >= 0; lk--) {
          const keyName = localStorage.key(lk);
          if (keyName && (keyName.startsWith("WEDDING_EVENT_CFG_EVT-") || keyName === "WEDDING_EVENT_CFG_wilson-felicia")) {
            localStorage.removeItem(keyName);
          }
        }
        const savedRegistry = localStorage.getItem("WEDDING_EVENTS_REGISTRY");
        if (savedRegistry) {
          let parsed = JSON.parse(savedRegistry);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasCanonicalWilson = (state.events || []).some(function(e) { return e && e.id === "wilson-felicia-133"; }) ||
                                       parsed.some(function(e) { return e && e.id === "wilson-felicia-133"; });
            parsed = parsed.filter(function(e) {
              if (!e || !e.id) return false;
              if (String(e.id).startsWith("EVT-")) return false; // Hapus event phantom
              if (hasCanonicalWilson && e.id === "wilson-felicia") return false; // Hapus duplicate slug lama
              return true;
            });
            const evMap = new Map();
            (state.events || []).forEach(function(e) { if (e && e.id && !String(e.id).startsWith("EVT-")) evMap.set(e.id, e); });
            parsed.forEach(function(e) { if (e && e.id && !evMap.has(e.id)) evMap.set(e.id, e); });
            state.events = Array.from(evMap.values());
          }
        }
      } catch(e) {}

      // Sanitasi final daftar acara:
      // 1. Singkirkan event liar dengan ID "EVT-"
      // 2. Jika ada wilson-felicia-133, singkirkan slug lama wilson-felicia
      const hasWilsonCanonical = (state.events || []).some(function(e) { return e && e.id === "wilson-felicia-133"; });
      state.events = (state.events || []).filter(function(e) {
        if (!e || !e.id) return false;
        if (String(e.id).startsWith("EVT-")) return false;
        if (hasWilsonCanonical && e.id === "wilson-felicia") return false;
        return true;
      });

      if (!Array.isArray(state.events) || state.events.length === 0) {
        if (state.currentEventId && !String(state.currentEventId).startsWith("EVT-")) {
          state.events = [
            {
              id: state.currentEventId,
              name: state.activeConfig.EVENT_NAME || state.currentEventId,
              date: state.activeConfig.EVENT_DATE || "",
              venue: state.activeConfig.EVENT_VENUE || "",
              driveFolderId: state.activeConfig.DRIVE_FOLDER_ID || ""
            }
          ];
        } else {
          state.events = [];
        }
      }

      // Pastikan event aktif saat ini selalu ada dalam daftar options jika valid
      if (state.currentEventId && !String(state.currentEventId).startsWith("EVT-") && !state.events.some(function(e) { return e && e.id === state.currentEventId; })) {
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
        let rawDate = ev.date;
        if (!rawDate) {
          if (ev.id === "andre-fayola-281") rawDate = "22 November 2026";
          else if (ev.id === "wilson-felicia-133") rawDate = "16 November 2026";
          else if (ev.id === "tommy-natasha-594") rawDate = "Rabu, 25 November 2026";
        }
        const formattedDate = rawDate ? normalizeSheetDate(rawDate) : "";
        opt.innerText = (ev.name || ev.id) + (formattedDate ? (" (" + formattedDate + ")") : "");
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

      let ev = (state.events || []).find(function(e) { 
        return e && (e.id === selectedId || (selectedId && (e.id.startsWith(selectedId) || selectedId.startsWith(e.id)))); 
      });
      if (!ev) {
        try {
          const cachedStr = localStorage.getItem("WEDDING_EVENT_CFG_" + selectedId);
          if (cachedStr) ev = JSON.parse(cachedStr);
        } catch(e) {}
      }

      if (ev) {
        const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
        const curPath = window.location.pathname || "/";
        const fullHomeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(ev.id || selectedId);

        state.activeConfig = Object.assign({}, state.activeConfig, {
          ACTIVE_EVENT_ID: ev.id || selectedId,
          EVENT_NAME: ev.name || "",
          COUPLE_NAME: ev.name || "",
          EVENT_DATE: ev.date || "",
          EVENT_VENUE: ev.venue || "",
          EVENT_LOGO_URL: ev.logoUrl || ev.EVENT_LOGO_URL || "",
          logoUrl: ev.logoUrl || ev.EVENT_LOGO_URL || "",
          SUBTITLE: ev.subtitle || "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: ev.welcomeMessage || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          FOOTER_MESSAGE: ev.footerMessage || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
          ALL_PHOTOS_LABEL: ev.allPhotosLabel || "Semua Foto",
          DRIVE_FOLDER_ID: ev.driveFolderId || "",
          PHOTOBOOTH_URL: ev.photoboothUrl || "",
          FRAME_IMAGE_URL: ev.frameImageUrl || "",
          HOME_URL: fullHomeUrl,
          CUSTOM_CATEGORIES: Array.isArray(ev.customCategories) ? ev.customCategories : []
        });

        showEventNotFoundScreen(false);

        state.customCategories = Array.isArray(ev.customCategories) ? ev.customCategories : [];
        state.allPhotosLabel = ev.allPhotosLabel || "Semua Foto";
        state.activeCategory = state.allPhotosLabel;

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
              const sortedCached = sortPhotosNewestFirst(cachedPhotos);
              state.allPhotos = sortedCached;
              state.filteredPhotos = sortedCached;
            }
          }
        } catch(ePh) {}
        renderPhotoGrid();

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
        } catch(e) {}

        // Ambil data foto murni untuk event yang dipilih
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
      const cfgLogoEl = document.getElementById("cfgEventLogoUrl");
      const rawLogo = cfg.EVENT_LOGO_URL || cfg.LOGO_URL || cfg.logoUrl || (state.activeConfig && (state.activeConfig.EVENT_LOGO_URL || state.activeConfig.logoUrl)) || "";
      if (cfgLogoEl) cfgLogoEl.value = rawLogo;
      updateAdminLogoPreview(rawLogo);
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

    function openNewEventModal() {
      const modal = document.getElementById("modalNewEvent");
      if (!modal) return;
      document.getElementById("neEventName").value = "";
      document.getElementById("neEventDate").value = "";
      document.getElementById("neEventVenue").value = "";
      document.getElementById("neDriveFolderId").value = "";
      document.getElementById("nePhotoboothUrl").value = "";
      const neLogoEl = document.getElementById("neLogoUrl");
      if (neLogoEl) neLogoEl.value = "";
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
      const logoUrl = (document.getElementById("neLogoUrl")?.value || "").trim();
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

      const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const curPath = window.location.pathname || "/";
      const homeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(newId);

      const newEventObj = {
        id: newId,
        name: name,
        date: formattedDate,
        venue: venue || "",
        homeUrl: homeUrl,
        subtitle: "The Wedding Gallery & Precious Memories",
        welcomeMessage: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
        footerMessage: "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
        allPhotosLabel: "Semua Foto",
        driveFolderId: driveFolder,
        photoboothUrl: pbUrl,
        logoUrl: logoUrl,
        EVENT_LOGO_URL: logoUrl,
        frameImageUrl: "",
        customCategories: initialCats,
        status: "Aktif"
      };

      if (!Array.isArray(state.events)) state.events = [];
      state.events.push(newEventObj);
      state.currentEventId = newId;

      try {
        localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
        localStorage.setItem("WEDDING_EVENT_CFG_" + newId, JSON.stringify(newEventObj));
        localStorage.setItem("WEDDING_ACTIVE_EVENT_CFG", JSON.stringify(newEventObj));
      } catch(e) {}

      closeNewEventModal();
      renderAdminEventsManager();
      handleSelectEventChange(newId);

      // Otomatis sinkronkan event baru ke database Google Sheets (sheet Daftar_Acara & Pengaturan)
      if (state.gasApiUrl) {
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            EVENTS: JSON.stringify(state.events),
            event: newEventObj,
            ACTIVE_EVENT_ID: newId,
            EVENT_NAME: name,
            COUPLE_NAME: name,
            EVENT_DATE: formattedDate,
            EVENT_VENUE: venue || "",
            DRIVE_FOLDER_ID: driveFolder,
            PHOTOBOOTH_URL: pbUrl,
            CUSTOM_CATEGORIES: JSON.stringify(initialCats)
          }
        }, function() {
          showToast("✓ Event baru '" + name + "' berhasil dibuat dan disimpan ke database!");
        }, function(err) {
          showToast("✓ Event baru '" + name + "' aktif di browser.");
        });

        // Trigger eksplisit penambahan baris langsung ke sheet 'Daftar_Acara'
        callBackend("addEvent", {
          pin: getEffectiveAdminPin(),
          event: newEventObj
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

    function handleDeleteCurrentEvent() {
      if (!Array.isArray(state.events) || state.events.length <= 1) {
        showToast("⚠️ Tidak dapat menghapus event karena hanya ada 1 event tersisa.", "warning");
        return;
      }

      const deleteId = state.currentEventId;
      const curEv = (state.events || []).find(function(e) { return e && e.id === deleteId; }) || {};
      const eventName = curEv.name || state.activeConfig.EVENT_NAME || deleteId;

      if (!confirm("Yakin ingin menghapus permanen event '" + eventName + "' dari sistem dan database? Seluruh konfigurasi event ini akan dihapus.")) return;

      const deleteBtn = document.getElementById("btnDeleteCurrentEvent");
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = "<span>⏳ Menghapus...</span>";
      }

      showToast("⏳ Sedang menghapus event '" + eventName + "' dari database...", "info");

      const pin = getEffectiveAdminPin();
      const updatedEvents = state.events.filter(function(e) { return e && e.id !== deleteId; });
      const nextEvent = updatedEvents[0];
      const nextId = (nextEvent && nextEvent.id) || "";

      function finalizeEventDeletion(resEvents, resActiveId) {
        const finalEvents = (Array.isArray(resEvents) && resEvents.length > 0) ? resEvents : updatedEvents;
        state.events = finalEvents;
        const targetNextId = resActiveId || nextId || (finalEvents[0] && finalEvents[0].id) || "";

        try {
          localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(finalEvents));
          localStorage.removeItem("WEDDING_EVENT_CFG_" + deleteId);
          localStorage.removeItem("WEDDING_EVENT_PHOTOS_" + deleteId);
          localStorage.removeItem("WEDDING_EVENT_PHOTOS_COUNT_" + deleteId);
        } catch(e) {}

        if (targetNextId) {
          handleSelectEventChange(targetNextId);
        }
        renderAdminEventsManager();

        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
        }
        showToast("✓ Event '" + eventName + "' berhasil dihapus permanen dari sistem.");
      }

      // 1. Coba panggil action deleteEvent ke backend
      callBackend("deleteEvent", { pin: pin, targetEventId: deleteId }, function(res) {
        if (res && res.success) {
          finalizeEventDeletion(res.events, res.activeEventId);
        } else if (res && res.message && res.message.includes("Aksi tidak dikenali")) {
          // Fallback ke saveAdminSettings jika GAS deployment sedang versi lama
          callBackend("saveAdminSettings", {
            pin: pin,
            config: {
              ACTIVE_EVENT_ID: nextId,
              EVENTS: JSON.stringify(updatedEvents)
            }
          }, function(saveRes) {
            if (saveRes && saveRes.success) {
              finalizeEventDeletion(updatedEvents, nextId);
            } else {
              if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
              }
              showToast("⚠️ Gagal menghapus event: " + ((saveRes && saveRes.message) || "Terjadi kesalahan."), "error");
            }
          }, function(saveErr) {
            if (deleteBtn) {
              deleteBtn.disabled = false;
              deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
            }
            showToast("⚠️ Gagal menyimpan pembaruan ke database: " + saveErr.message, "error");
          });
        } else {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
          }
          showToast("⚠️ Gagal menghapus event: " + ((res && res.message) || "Terjadi kesalahan."), "error");
        }
      }, function(err) {
        // Fallback jika callBackend error: coba via saveAdminSettings
        callBackend("saveAdminSettings", {
          pin: pin,
          config: {
            ACTIVE_EVENT_ID: nextId,
            EVENTS: JSON.stringify(updatedEvents)
          }
        }, function(saveRes) {
          if (saveRes && saveRes.success) {
            finalizeEventDeletion(updatedEvents, nextId);
          } else {
            if (deleteBtn) {
              deleteBtn.disabled = false;
              deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
            }
            showToast("⚠️ Gagal menghapus event: " + err.message, "error");
          }
        }, function() {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = "<span>🗑️ Hapus</span>";
          }
          showToast("⚠️ Gagal menghubungi server backend: " + err.message, "error");
        });
      });
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

    function triggerSyncDaftarAcara() {
      if (!state.gasApiUrl) {
        showToast("⚠️ URL Google Apps Script belum dikonfigurasi.", "warning");
        return;
      }
      showToast("⏳ Menyinkronkan seluruh event ke sheet 'Daftar_Acara'...", "info");
      callBackend("syncDaftarAcara", {
        pin: getEffectiveAdminPin(),
        events: state.events
      }, function(res) {
        if (res && res.success) {
          showToast("✓ Berhasil! " + (res.message || "Seluruh event berhasil disinkronkan ke sheet 'Daftar_Acara'"));
        } else {
          // Fallback via saveAdminSettings
          callBackend("saveAdminSettings", {
            pin: getEffectiveAdminPin(),
            config: {
              EVENTS: JSON.stringify(state.events)
            }
          }, function() {
            showToast("✓ Seluruh event berhasil disinkronkan ke database Google Sheets!");
          }, function(err) {
            showToast("⚠️ Gagal sinkronisasi ke Sheets: " + (err || "Jaringan sibuk"), "warning");
          });
        }
      }, function(err) {
        callBackend("saveAdminSettings", {
          pin: getEffectiveAdminPin(),
          config: {
            EVENTS: JSON.stringify(state.events)
          }
        }, function() {
          showToast("✓ Seluruh event berhasil disinkronkan ke database Google Sheets!");
        }, function(fallbackErr) {
          showToast("⚠️ Gagal sinkronisasi: " + (fallbackErr || err), "warning");
        });
      });
    }
    window.triggerSyncDaftarAcara = triggerSyncDaftarAcara;

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

    function toggleCoverSectionPreview() {}

    /* ==========================================================================
       ADMIN USER & PASSWORD MANAGEMENT
       ========================================================================== */
    function loadAdminUsers() {
      callBackend("getAdminUsers", { pin: getEffectiveAdminPin() }, function(res) {
        if (res && res.success && Array.isArray(res.users)) {
          state.adminAccounts = res.users;
          renderAdminUsersList(res.users);
        } else {
          renderAdminUsersList(state.adminAccounts || []);
        }
      }, function() {
        renderAdminUsersList(state.adminAccounts || []);
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

      // Immediate Visual Reaction: Nonaktifkan tombol seketika dan tampilkan spinner
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
          <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          <span>Menyimpan Pengaturan...</span>
        `;
      }
      if (alertBox) alertBox.style.display = "none";

      try {
        const newApiUrl = (document.getElementById("cfgGasApiUrl")?.value || "").trim();
        const driveFolderInput = (document.getElementById("cfgDriveFolderId")?.value || state.activeConfig.DRIVE_FOLDER_ID || "").trim();
        const eventNameInput = (document.getElementById("cfgCoupleName")?.value || "").trim();
        const eventDateInput = (document.getElementById("cfgEventDate")?.value || "").trim();
        const eventVenueInput = (document.getElementById("cfgEventVenue")?.value || "").trim();
        const subtitleInput = (document.getElementById("cfgSubtitle")?.value || "").trim();
        const welcomeInput = (document.getElementById("cfgWelcomeMessage")?.value || "").trim();
        const footerInput = (document.getElementById("cfgFooterMessage")?.value || "").trim();
        const customCategoriesList = getCategoriesFromAdminInputs();
        const frameUrlInput = (document.getElementById("cfgFrameImageUrl")?.value || "").trim();
        const logoUrlInput = (document.getElementById("cfgEventLogoUrl")?.value || "").trim();
        const newPinInput = (document.getElementById("cfgNewPin")?.value || "").trim();

        if (newApiUrl) {
          state.gasApiUrl = newApiUrl;
          try { localStorage.setItem("WEDDING_GAS_API_URL", newApiUrl); } catch(e) {}
        } else if (!state.gasApiUrl) {
          state.gasApiUrl = (typeof GLOBAL_CONFIG !== "undefined" && GLOBAL_CONFIG.GAS_API_URL) || localStorage.getItem("WEDDING_GAS_API_URL") || "";
        }

        // Format tanggal ke format bahasa Indonesia untuk display dan penyimpanan
        const formattedDate = eventDateInput ? formatIndonesianDate(eventDateInput) : (state.activeConfig.EVENT_DATE || "");
        const finalEventName = eventNameInput || state.activeConfig.EVENT_NAME || "";

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

        // Perbarui data event aktif di daftar events secara terisolasi
        if (Array.isArray(state.events)) {
          const evIdx = state.events.findIndex(function(e) { return e.id === state.currentEventId; });
          if (evIdx >= 0) {
            const curPbItem = customCategoriesList.find(function(c) {
              return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
            });
            const curPbUrl = curPbItem ? String(curPbItem.url || "").trim() : "";

            const curOrigin = window.location.origin || (window.location.protocol + "//" + window.location.host);
            const curPath = window.location.pathname || "/";
            const homeUrl = curOrigin + curPath + "?event=" + encodeURIComponent(state.currentEventId);

            state.events[evIdx] = Object.assign({}, state.events[evIdx], {
              name: finalEventName,
              date: formattedDate,
              venue: eventVenueInput || "",
              homeUrl: homeUrl,
              subtitle: subtitleInput || "",
              welcomeMessage: welcomeInput || "",
              footerMessage: footerInput || "",
              allPhotosLabel: allPhotosLabelInput,
              driveFolderId: driveFolderInput,
              photoboothUrl: curPbUrl,
              logoUrl: logoUrlInput,
              EVENT_LOGO_URL: logoUrlInput,
              frameImageUrl: frameUrlInput,
              customCategories: customCategoriesList
            });
          }
        }

        const pbItem = customCategoriesList.find(function(c) {
          return c && (c.isPhotobooth === true || c.id === "special_photobooth" || String(c.name || "").trim().toLowerCase().includes("photobooth"));
        });
        const pbUrlVal = pbItem ? String(pbItem.url || "").trim() : (state.activeConfig.PHOTOBOOTH_URL || "");

        const curEvObject = (Array.isArray(state.events) ? state.events.find(function(e) { return e && e.id === state.currentEventId; }) : null) || {};

        const payload = {
          ACTIVE_EVENT_ID: state.currentEventId,
          EVENT_NAME: finalEventName,
          COUPLE_NAME: finalEventName,
          EVENT_DATE: formattedDate,
          EVENT_VENUE: eventVenueInput || state.activeConfig.EVENT_VENUE || "",
          SUBTITLE: subtitleInput || state.activeConfig.SUBTITLE || "The Wedding Gallery & Precious Memories",
          WELCOME_MESSAGE: welcomeInput || state.activeConfig.WELCOME_MESSAGE || "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
          FOOTER_MESSAGE: footerInput || state.activeConfig.FOOTER_MESSAGE || "Diabadikan dengan cinta\nTerima kasih atas doa restunya.",
          ALL_PHOTOS_LABEL: allPhotosLabelInput,
          CUSTOM_CATEGORIES: JSON.stringify(customCategoriesList),
          PHOTOBOOTH_URL: pbUrlVal,
          COVER_SETTINGS: coverSettingsPayload,
          EVENTS: JSON.stringify(state.events),
          DRIVE_FOLDER_ID: driveFolderInput,
          EVENT_LOGO_URL: logoUrlInput,
          logoUrl: logoUrlInput,
          FRAME_IMAGE_URL: frameUrlInput,
          GAS_API_URL: newApiUrl,
          ADMIN_USERNAME: (state.currentAdminUser ? state.currentAdminUser.username : state.adminUsername) || "admin",
          NEW_PIN: newPinInput,
          event: curEvObject
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
            try { localStorage.removeItem("WEDDING_CAT_COUNT_" + (state.currentEventId || "default") + "_" + cName); } catch(e) {}
          }
        });
        // Selalu invalidate Photobooth jika URL diperbarui
        if (pbUrlVal && state.categoryPhotosUrlMap["Photobooth"] !== pbUrlVal) {
          delete state.categoryPhotosMap["Photobooth"];
          delete state.categoryPhotosUrlMap["Photobooth"];
          try { localStorage.removeItem("WEDDING_CAT_COUNT_" + (state.currentEventId || "default") + "_Photobooth"); } catch(e) {}
        }
        state.lastLocalCategoryEditTime = Date.now();

        try {
          localStorage.setItem("WEDDING_SAVED_CUSTOM_CATEGORIES", JSON.stringify(customCategoriesList));
          if (pbUrlVal) localStorage.setItem("WEDDING_PHOTOBOOTH_URL", pbUrlVal);
          localStorage.setItem("WEDDING_SAVED_CONFIG", JSON.stringify(state.activeConfig));
          localStorage.setItem("WEDDING_EVENTS_REGISTRY", JSON.stringify(state.events));
          localStorage.setItem("WEDDING_EVENT_CFG_" + state.currentEventId, JSON.stringify(state.activeConfig));
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

        if (state.gasApiUrl) {
          // Kirim pembaruan ke Google Apps Script (menyimpan ke Pengaturan & Daftar_Acara secara terisolasi)
          const curEvToSync = {
            id: state.currentEventId,
            name: finalEventName,
            date: formattedDate,
            venue: eventVenueInput || "",
            homeUrl: (window.location.origin || "") + (window.location.pathname || "/") + "?event=" + encodeURIComponent(state.currentEventId),
            driveFolderId: driveFolderInput,
            photoboothUrl: pbUrlVal,
            customCategories: customCategoriesList,
            logoUrl: logoUrlInput,
            EVENT_LOGO_URL: logoUrlInput,
            frameImageUrl: frameUrlInput,
            status: "Aktif"
          };

          callBackend("saveAdminSettings", { pin: getEffectiveAdminPin(), config: Object.assign({}, payload, { event: curEvToSync }) }, function(res) {
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Simpan Perubahan</span>
              `;
            }
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
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Simpan Perubahan</span>
              `;
            }
            showToast("✓ Pengaturan berhasil disimpan di browser!");
            closeAdminSettingsModal();
          });

          // Pastikan baris event ini langsung diperbarui di sheet 'Daftar_Acara'
          callBackend("addEvent", {
            pin: getEffectiveAdminPin(),
            event: curEvToSync
          });
        } else {
          // Jika URL Apps Script belum diisi
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Simpan Perubahan</span>
            `;
          }
          showToast("✓ Pengaturan berhasil disimpan di browser!");
          closeAdminSettingsModal();
        }
      } catch (err) {
        console.error("Gagal menyimpan pengaturan:", err);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Simpan Perubahan</span>
          `;
        }
        if (alertBox) {
          alertBox.className = "admin-alert-box error";
          alertBox.innerText = "⚠️ Terjadi kendala saat menyimpan: " + (err.message || err);
          alertBox.style.display = "block";
        }
        showToast("⚠️ Terjadi kendala saat menyimpan: " + (err.message || err));
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


    // Explicit Global Window Bindings untuk Modul Admin
    window.handleSaveAllSettings = handleSaveAllSettings;
    window.handleSaveSettings = handleSaveAllSettings;
    window.openAdminModal = openAdminModal;
    window.openAdminSettingsModal = openAdminSettingsModal;
    window.closeAdminSettingsModal = closeAdminSettingsModal;
    window.closeAdminLoginModal = closeAdminLoginModal;
    window.handleAdminLogin = handleAdminLogin;
    window.handleAdminLogout = handleAdminLogout;
    window.switchAdminTab = switchAdminTab;
    window.triggerSyncDaftarAcara = triggerSyncDaftarAcara;
    window.openNewEventModal = openNewEventModal;
    window.closeNewEventModal = closeNewEventModal;
    window.confirmAddNewEvent = confirmAddNewEvent;
    window.handleSelectEventChange = handleSelectEventChange;
    window.openActiveEventHome = openActiveEventHome;
    window.copyActiveEventUrl = copyActiveEventUrl;
    window.handleDeleteCurrentEvent = handleDeleteCurrentEvent;
    window.handleAddAdminUser = handleAddAdminUser;
    window.handleChangeAdminPassword = handleChangeAdminPassword;
    window.handleTriggerDatabaseSetup = handleTriggerDatabaseSetup;
    window.addCategoryConfigRow = addCategoryConfigRow;
    window.syncCategoriesAndDisplayLinks = syncCategoriesAndDisplayLinks;
    window.handleSyncDrivePhotosDirectly = handleSyncDrivePhotosDirectly;
    window.togglePasswordVisibility = togglePasswordVisibility;
