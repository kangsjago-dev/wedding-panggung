const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

// 1. Add handleEventDriveFolderInput function
const targetBeforeRenderCats = `    function renderAdminCategoriesManager() {`;
const replaceWithHandler = `    function handleEventDriveFolderInput(val) {
      const cleanVal = (val || "").trim();
      state.activeConfig.DRIVE_FOLDER_ID = cleanVal;

      const inp1 = document.getElementById("cfgEventDriveFolderId");
      if (inp1 && inp1.value !== cleanVal) inp1.value = cleanVal;

      const inp2 = document.getElementById("cfgDriveFolderId");
      if (inp2 && inp2.value !== cleanVal) inp2.value = cleanVal;

      const curEv = (state.events || []).find(function(e) { return e && e.id === state.currentEventId; });
      if (curEv) {
        curEv.driveFolderId = cleanVal;
      }
      state.lastLocalCategoryEditTime = Date.now();
    }
    window.handleEventDriveFolderInput = handleEventDriveFolderInput;

    function renderAdminCategoriesManager() {`;

if (!appJs.includes(targetBeforeRenderCats)) {
  console.error("targetBeforeRenderCats not found!");
  process.exit(1);
}
appJs = appJs.replace(targetBeforeRenderCats, replaceWithHandler);

// 2. Update openAdminSettingsModal and closeAdminSettingsModal to lock body scroll
const targetOpenModal = `      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";

      document.getElementById("adminSettingsModal").classList.add("active");`;

const replaceOpenModal = `      const floatBar = document.getElementById("adminActiveFloatingBar");
      if (floatBar) floatBar.style.display = "none";

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.getElementById("adminSettingsModal").classList.add("active");`;

if (!appJs.includes(targetOpenModal)) {
  console.error("targetOpenModal not found!");
  process.exit(1);
}
appJs = appJs.replace(targetOpenModal, replaceOpenModal);

const targetCloseModal = `    function closeAdminSettingsModal() {
      document.getElementById("adminSettingsModal").classList.remove("active");`;

const replaceCloseModal = `    function closeAdminSettingsModal() {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.getElementById("adminSettingsModal").classList.remove("active");`;

if (!appJs.includes(targetCloseModal)) {
  console.error("targetCloseModal not found!");
  process.exit(1);
}
appJs = appJs.replace(targetCloseModal, replaceCloseModal);

// 3. Update populateAdminInputsForActiveEvent to also populate cfgEventDriveFolderId
const targetPopulateAdmin = `      const cfgDriveEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";`;

const replacePopulateAdmin = `      const cfgDriveEl = document.getElementById("cfgDriveFolderId");
      if (cfgDriveEl) cfgDriveEl.value = cfg.DRIVE_FOLDER_ID || "";
      const cfgEventDriveEl = document.getElementById("cfgEventDriveFolderId");
      if (cfgEventDriveEl) cfgEventDriveEl.value = cfg.DRIVE_FOLDER_ID || "";`;

if (!appJs.includes(targetPopulateAdmin)) {
  console.error("targetPopulateAdmin not found!");
  process.exit(1);
}
appJs = appJs.replace(targetPopulateAdmin, replacePopulateAdmin);

// 4. Update fetchGalleryData to prioritize active event's drive folder via /api/drive-folder
const targetFetchGalleryData = `    function fetchGalleryData(forceRefresh, isSilent) {
      const photosGrid = document.getElementById("photosGrid");
      state.isAutoRefreshing = true;

      if (!isSilent && (forceRefresh || state.allPhotos.length === 0)) {
        photosGrid.innerHTML = \`
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        \`;
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
    }`;

const replaceFetchGalleryData = `    function fetchGalleryData(forceRefresh, isSilent) {
      const photosGrid = document.getElementById("photosGrid");
      state.isAutoRefreshing = true;

      if (!isSilent && (forceRefresh || state.allPhotos.length === 0)) {
        photosGrid.innerHTML = \`
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        \`;
      }

      const refreshIcon = document.getElementById("refreshIconSvg");
      if (forceRefresh && refreshIcon) refreshIcon.classList.add("spin");

      const activeFolder = state.activeConfig.DRIVE_FOLDER_ID ? (extractDriveFolderId(state.activeConfig.DRIVE_FOLDER_ID) || state.activeConfig.DRIVE_FOLDER_ID) : "";

      // Prioritas 1: Ambil foto langsung dari Google Drive Folder spesifik event ini via /api/drive-folder
      if (activeFolder) {
        fetch("/api/drive-folder?folderId=" + encodeURIComponent(activeFolder) + "&category=" + encodeURIComponent(state.allPhotosLabel || "Semua Foto"))
          .then(function(res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then(function(data) {
            if (data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
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
              if (forceRefresh) showToast("✓ Galeri foto berhasil diperbarui (" + data.photos.length + " foto)!");
            } else {
              throw new Error("Folder kosong");
            }
          })
          .catch(function() {
            // Fallback ke backend GAS jika /api/drive-folder belum tersedia
            callBackend("getGalleryData", { eventId: state.currentEventId, folderId: activeFolder }, function(response) {
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
          });
      } else {
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
    }`;

if (!appJs.includes(targetFetchGalleryData)) {
  console.error("targetFetchGalleryData not found!");
  process.exit(1);
}
appJs = appJs.replace(targetFetchGalleryData, replaceFetchGalleryData);

// 5. Update renderAdminCategoriesManager "Semua Foto" row
const targetMainLabelBox = `      // 1. Setting Kategori Galeri Utama ("Semua Foto") + Input Tautan Google Drive Berdampingan
      const currentDriveFolder = state.activeConfig.DRIVE_FOLDER_ID || GLOBAL_CONFIG.DRIVE_FOLDER_ID || "";
      const mainLabelBox = document.createElement("div");
      mainLabelBox.style.cssText = "background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      mainLabelBox.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--gold-dark); display: flex; align-items: center; gap: 6px;">
            <span>🏷️ Kategori Galeri Utama: \${escapeHtml(state.allPhotosLabel || 'Semua Foto')}</span>
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
            <input type="text" id="cfgMainGalleryLabel" class="admin-input" placeholder="Semua Foto" value="\${escapeHtml(state.allPhotosLabel || 'Semua Foto')}" oninput="handleAllPhotosLabelChange(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;" for="cfgDriveFolderId">Tautan Display Galeri (Katalog Foto Google Drive)</label>
            <input type="text" id="cfgDriveFolderId" class="admin-input" placeholder="Tautan / ID Folder Google Drive" value="\${escapeHtml(currentDriveFolder)}" oninput="state.activeConfig.DRIVE_FOLDER_ID = this.value.trim(); state.lastLocalCategoryEditTime = Date.now();" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div class="admin-help-text" style="font-size: 0.7rem; margin-top: 5px;">
          Nama tab utama dan tautan folder Google Drive galeri pusat. Pastikan izin folder Google Drive: <em>"Anyone with the link can view"</em>.
        </div>
      \`;`;

const replaceMainLabelBox = `      // 1. Setting Kategori Galeri Utama ("Semua Foto") Khusus Event Aktif + Input Tautan Google Drive Berdampingan
      const currentDriveFolder = state.activeConfig.DRIVE_FOLDER_ID || "";
      const currentEventName = state.activeConfig.EVENT_NAME || state.currentEventId || "Acara";
      const mainLabelBox = document.createElement("div");
      mainLabelBox.style.cssText = "background: #FAF8F5; border: 1px solid rgba(197, 168, 128, 0.4); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;";
      mainLabelBox.innerHTML = \`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <div style="font-size: 0.84rem; font-weight: 700; color: var(--gold-dark); display: flex; align-items: center; gap: 6px;">
            <span>🏷️ Kategori "Semua Foto" - Event: <strong>\${escapeHtml(currentEventName)}</strong></span>
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
            <input type="text" id="cfgMainGalleryLabel" class="admin-input" placeholder="Semua Foto" value="\${escapeHtml(state.allPhotosLabel || 'Semua Foto')}" oninput="handleAllPhotosLabelChange(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
          <div>
            <label class="admin-label" style="font-size: 0.72rem; margin-bottom: 2px;" for="cfgDriveFolderId">Tautan / Folder ID Google Drive (\${escapeHtml(currentEventName)})</label>
            <input type="text" id="cfgDriveFolderId" class="admin-input" placeholder="Tautan / ID Folder Google Drive khusus event ini" value="\${escapeHtml(currentDriveFolder)}" oninput="handleEventDriveFolderInput(this.value)" style="padding: 7px 10px; font-size: 0.82rem;">
          </div>
        </div>
        <div class="admin-help-text" style="font-size: 0.7rem; margin-top: 5px;">
          * <strong>Khusus Event \${escapeHtml(currentEventName)}:</strong> Tautan folder Google Drive di atas hanya berlaku untuk event ini. Event A menggunakan Link A, Event B menggunakan Link B (tidak saling bercampur).
        </div>
      \`;`;

if (!appJs.includes(targetMainLabelBox)) {
  console.error("targetMainLabelBox not found!");
  process.exit(1);
}
appJs = appJs.replace(targetMainLabelBox, replaceMainLabelBox);

fs.writeFileSync('js/app.js', appJs, 'utf8');
console.log("Successfully applied v421 changes to js/app.js!");

