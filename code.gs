/**
 * ================================================================================
 * WEDDING PANGGUNG - ELEGANT GOOGLE DRIVE PHOTO GALLERY
 * Backend Controller & Google Apps Script REST API Service (v1.4)
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */

// ================================================================================
// KONFIGURASI PERNIKAHAN MASTER (FALLBACK)
// ================================================================================
const WEDDING_CONFIG = {
  // Nama Event Acara
  EVENT_NAME: "Wilson & Felicia",

  // Tanggal Acara
  EVENT_DATE: "14 November 2026",

  // Venue / Lokasi Acara
  EVENT_VENUE: "Upperhills Convention Centre, Makassar",

  // Subjudul Galeri
  SUBTITLE: "The Wedding Gallery & Precious Memories",

  // Pesan Sambutan untuk Tamu
  WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",

  // Konfigurasi Teknis (Dapat dikelola admin via web & spreadsheet)
  DRIVE_FOLDER_ID: "1AhdkSch9C-F2FvYKd_IO2O7RSsRDJxl5",
  DEFAULT_ADMIN_PIN: "123456",
  SLIDESHOW_INTERVAL_SEC: 4,
  AUTO_REFRESH_INTERVAL_SEC: 20,
  FRAME_IMAGE_URL: "https://drive.google.com/file/d/11u-XHGv13oljACPnwSfTIS65NE/view",
  SPREADSHEET_ID: "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20",
  NEW_BADGE_MINUTES: 10
};

const SPREADSHEET_DB_NAME = "foto-panggung";

/**
 * ================================================================================
 * MODUL DATABASE GOOGLE SPREADSHEET TERINTEGRASI ('foto-panggung')
 * Mengelola 3 Sheet: Pengaturan, Daftar_Foto, dan Log_Aktivitas
 * ================================================================================
 */

/**
 * 1. Mengambil spreadsheet database aktif
 */
function getDatabaseSpreadsheet(optionalCustomId) {
  // A. Cek apakah script terikat langsung (Container-Bound) ke file Spreadsheet
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      return activeSs;
    }
  } catch (eActive) {}

  var props = PropertiesService.getScriptProperties();
  var ssId = optionalCustomId || props.getProperty("SPREADSHEET_ID") || WEDDING_CONFIG.SPREADSHEET_ID || "";
  
  // B. Cek berdasarkan ID jika tersimpan
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (eId) {
      Logger.log("⚠️ Gagal membuka spreadsheet dengan ID: " + ssId);
    }
  }
  
  // C. Cari di Google Drive berdasarkan nama file 'foto-panggung'
  try {
    var files = DriveApp.getFilesByName(SPREADSHEET_DB_NAME);
    if (files.hasNext()) {
      var file = files.next();
      var ss = SpreadsheetApp.open(file);
      props.setProperty("SPREADSHEET_ID", ss.getId());
      return ss;
    }
  } catch (errDrive) {}

  // D. Pencarian toleran di Google Drive (pencarian judul foto-panggung)
  try {
    var searchFiles = DriveApp.searchFiles("title contains '" + SPREADSHEET_DB_NAME + "' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    if (searchFiles.hasNext()) {
      var matchedFile = searchFiles.next();
      var matchedSs = SpreadsheetApp.open(matchedFile);
      props.setProperty("SPREADSHEET_ID", matchedSs.getId());
      return matchedSs;
    }
  } catch (errSearch) {}
  
  return null;
}

/**
 * 2. Setup Otomatis Google Spreadsheet Database (Non-Destruktif)
 */
function setupDatabaseSpreadsheet(customNameOrId) {
  try {
    var props = PropertiesService.getScriptProperties();
    var targetId = (customNameOrId && customNameOrId.length > 20) ? customNameOrId : (props.getProperty("SPREADSHEET_ID") || WEDDING_CONFIG.SPREADSHEET_ID || "");
    var ss = null;

    if (targetId && targetId.length > 20) {
      try {
        ss = SpreadsheetApp.openById(targetId);
        props.setProperty("SPREADSHEET_ID", ss.getId());
      } catch (eId) {
        Logger.log("⚠️ Gagal openById targetId: " + eId.toString());
      }
    }

    if (!ss) {
      ss = getDatabaseSpreadsheet(targetId);
    }

    if (!ss) {
      var name = customNameOrId || SPREADSHEET_DB_NAME;
      ss = SpreadsheetApp.create(name);
      props.setProperty("SPREADSHEET_ID", ss.getId());
    }

    var ssId = ss.getId();
    var ssUrl = ss.getUrl();

    // 1. Sheet: Pengaturan
    var sheetSettings = ss.getSheetByName("Pengaturan");
    if (!sheetSettings) {
      sheetSettings = ss.insertSheet("Pengaturan", 0);
    }

    if (sheetSettings.getLastRow() < 1) {
      var settingsHeaders = [["Parameter", "Nilai", "Keterangan"]];
      sheetSettings.getRange(1, 1, 1, 3).setValues(settingsHeaders)
        .setBackground("#C5A880")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheetSettings.setFrozenRows(1);
    }

    // Periksa apakah parameter default sudah ada, jika belum tambahkan barisnya (tanpa menimpa yang sudah ada)
    var currentData = sheetSettings.getDataRange().getValues();
    var existingKeys = {};
    for (var r = 1; r < currentData.length; r++) {
      var k = String(currentData[r][0]).trim();
      if (k) existingKeys[k] = true;
    }

    var defaultParams = [
      ["EVENT_NAME", WEDDING_CONFIG.EVENT_NAME, "Nama Event / Pasangan Pengantin"],
      ["EVENT_DATE", WEDDING_CONFIG.EVENT_DATE, "Tanggal Pelaksanaan Acara"],
      ["EVENT_VENUE", WEDDING_CONFIG.EVENT_VENUE, "Venue / Lokasi Gedung Acara"],
      ["SUBTITLE", WEDDING_CONFIG.SUBTITLE, "Subjudul Galeri Foto"],
      ["WELCOME_MESSAGE", WEDDING_CONFIG.WELCOME_MESSAGE, "Pesan Sambutan Hangat untuk Tamu"],
      ["DRIVE_FOLDER_ID", WEDDING_CONFIG.DRIVE_FOLDER_ID || "", "ID / Tautan Folder Google Drive Foto"],
      ["FRAME_IMAGE_URL", WEDDING_CONFIG.FRAME_IMAGE_URL || "", "Tautan / ID File Bingkai PNG Transparan"],
      ["ADMIN_PIN", WEDDING_CONFIG.DEFAULT_ADMIN_PIN, "PIN Akses Masuk Panel Admin Web"],
      ["SLIDESHOW_INTERVAL_SEC", String(WEDDING_CONFIG.SLIDESHOW_INTERVAL_SEC), "Durasi Perpindahan Foto Slideshow (detik)"],
      ["NEW_BADGE_MINUTES", "10", "Durasi Lencana '✨ Baru' Aktif (menit)"],
      ["AUTO_REFRESH_INTERVAL_SEC", String(WEDDING_CONFIG.AUTO_REFRESH_INTERVAL_SEC), "Interval Live Auto-Sync Foto (detik)"]
    ];

    var rowsToAdd = [];
    for (var p = 0; p < defaultParams.length; p++) {
      if (!existingKeys[defaultParams[p][0]]) {
        rowsToAdd.push(defaultParams[p]);
      }
    }
    if (rowsToAdd.length > 0) {
      var startRow = Math.max(sheetSettings.getLastRow() + 1, 2);
      sheetSettings.getRange(startRow, 1, rowsToAdd.length, 3).setValues(rowsToAdd);
    }

    sheetSettings.setColumnWidth(1, 220);
    sheetSettings.setColumnWidth(2, 380);
    sheetSettings.setColumnWidth(3, 300);

    // 2. Sheet: Daftar_Foto
    var sheetPhotos = ss.getSheetByName("Daftar_Foto");
    if (!sheetPhotos) {
      sheetPhotos = ss.insertSheet("Daftar_Foto", 1);
    }
    if (sheetPhotos.getLastRow() < 1) {
      var photoHeaders = [["ID_Foto", "Nama_File", "Kategori", "URL_Thumbnail", "URL_Download", "Ukuran_Bytes", "Waktu_Upload", "Status"]];
      sheetPhotos.getRange(1, 1, 1, 8).setValues(photoHeaders)
        .setBackground("#C5A880")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheetPhotos.setFrozenRows(1);
      sheetPhotos.setColumnWidth(1, 120);
      sheetPhotos.setColumnWidth(2, 220);
      sheetPhotos.setColumnWidth(3, 140);
      sheetPhotos.setColumnWidth(4, 250);
      sheetPhotos.setColumnWidth(5, 250);
      sheetPhotos.setColumnWidth(6, 110);
      sheetPhotos.setColumnWidth(7, 180);
      sheetPhotos.setColumnWidth(8, 100);
    }

    // Isi foto dummy langsung ke sheet Daftar_Foto jika masih kosong
    if (sheetPhotos.getLastRow() <= 1) {
      syncPhotosToSheet(ss, []);
    }

    // 3. Sheet: Log_Aktivitas
    var sheetLogs = ss.getSheetByName("Log_Aktivitas");
    if (!sheetLogs) {
      sheetLogs = ss.insertSheet("Log_Aktivitas", 2);
    }
    if (sheetLogs.getLastRow() < 1) {
      var logHeaders = [["Timestamp", "Aksi", "Detail", "Pengguna"]];
      sheetLogs.getRange(1, 1, 1, 4).setValues(logHeaders)
        .setBackground("#64748B")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheetLogs.setFrozenRows(1);
      sheetLogs.setColumnWidth(1, 200);
      sheetLogs.setColumnWidth(2, 180);
      sheetLogs.setColumnWidth(3, 350);
      sheetLogs.setColumnWidth(4, 120);
    }

    logActivityToSheet(ss, "Inisialisasi Database", "Database spreadsheet pengguna & dummy photos berhasil disiapkan", "Sistem");

    // Hapus Sheet1 kosong bawaan Google Sheets jika ada dan lembar kerja lain sudah ada
    try {
      var residualSheet1 = ss.getSheetByName("Sheet1");
      if (residualSheet1 && ss.getSheets().length > 1) {
        ss.deleteSheet(residualSheet1);
      }
    } catch (eDel) {}

    // Flush semua perubahan ke Google Sheets
    SpreadsheetApp.flush();

    return {
      success: true,
      message: "Database spreadsheet pengguna & foto dummy pernikahan berhasil disiapkan 100%!",
      spreadsheetId: ssId,
      spreadsheetUrl: ssUrl
    };
  } catch (err) {
    return {
      success: false,
      message: "Gagal menyiapkan spreadsheet database: " + err.toString()
    };
  }
}

/**
 * 3. Membaca Konfigurasi dari Sheet Pengaturan
 */
function readConfigFromSheet(ss) {
  if (!ss) return {};
  try {
    var sheet = ss.getSheetByName("Pengaturan");
    if (!sheet) return {};
    var data = sheet.getDataRange().getValues();
    var result = {};
    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0]).trim();
      var val = data[i][1];
      if (key) {
        result[key] = (val !== undefined && val !== null) ? String(val).trim() : "";
      }
    }
    return result;
  } catch (e) {
    Logger.log("Gagal membaca sheet pengaturan: " + e.toString());
    return {};
  }
}

/**
 * 4. Menulis / Sinkronisasi Konfigurasi ke Sheet Pengaturan
 */
function writeConfigToSheet(ss, configDict) {
  if (!ss || !configDict) return;
  try {
    var sheet = ss.getSheetByName("Pengaturan");
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    var rowIndexMap = {};
    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0]).trim();
      if (key) rowIndexMap[key] = i + 1; // 1-based index di Google Sheets
    }

    for (var prop in configDict) {
      if (configDict.hasOwnProperty(prop)) {
        var newVal = configDict[prop];
        if (newVal === undefined || newVal === null) continue;
        if (rowIndexMap[prop]) {
          sheet.getRange(rowIndexMap[prop], 2).setValue(String(newVal));
        } else {
          sheet.appendRow([prop, String(newVal), "Ditambahkan via Admin"]);
        }
      }
    }
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log("Gagal menulis ke sheet pengaturan: " + e.toString());
  }
}

/**
 * 5. Mencatat Log Aktivitas ke Sheet Log_Aktivitas
 */
function logActivityToSheet(ss, action, detail, user) {
  if (!ss) return;
  try {
    var sheet = ss.getSheetByName("Log_Aktivitas");
    if (!sheet) return;
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, action, detail || "", user || "Admin"]);
  } catch (e) {}
}

/**
 * 6. Menyimpan Daftar Foto ke Sheet Daftar_Foto
 */
function syncPhotosToSheet(ss, photos) {
  if (!ss || !photos || photos.length === 0) return;
  try {
    var sheet = ss.getSheetByName("Daftar_Foto");
    if (!sheet) return;
    
    // Bersihkan baris lama (sisakan baris header)
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
    }

    var rows = [];
    for (var i = 0; i < photos.length; i++) {
      var p = photos[i];
      var timeStr = p.timestamp ? Utilities.formatDate(new Date(p.timestamp), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss") : "";
      rows.push([
        p.id || "",
        p.name || "",
        p.category || "",
        p.thumbnailUrl || "",
        p.downloadUrl || "",
        p.sizeBytes || 0,
        timeStr,
        "Aktif"
      ]);
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 8).setValues(rows);
    }
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log("Gagal sync foto ke sheet: " + e.toString());
  }
}

/**
 * Mengambil konfigurasi aktif (Spreadsheet -> Script Properties -> Fallback Master)
 */
function getEffectiveConfig() {
  var props = PropertiesService.getScriptProperties().getProperties() || {};
  
  // Baca konfigurasi dari Google Spreadsheet Database jika terhubung
  var sheetConfig = {};
  var ss = getDatabaseSpreadsheet();
  var ssUrl = "";
  var ssId = "";
  if (ss) {
    ssId = ss.getId();
    ssUrl = ss.getUrl();
    sheetConfig = readConfigFromSheet(ss);
  }
  
  return {
    // Informasi Pernikahan: Prioritas Google Sheets -> Script Properties -> Fallback Master
    EVENT_NAME: (sheetConfig.EVENT_NAME || sheetConfig.COUPLE_NAME || ((props.EVENT_NAME && props.EVENT_NAME !== "Hans & Yurike") ? props.EVENT_NAME : "") || ((props.COUPLE_NAME && props.COUPLE_NAME !== "Hans & Yurike") ? props.COUPLE_NAME : "") || WEDDING_CONFIG.EVENT_NAME),
    COUPLE_NAME: (sheetConfig.EVENT_NAME || sheetConfig.COUPLE_NAME || ((props.EVENT_NAME && props.EVENT_NAME !== "Hans & Yurike") ? props.EVENT_NAME : "") || ((props.COUPLE_NAME && props.COUPLE_NAME !== "Hans & Yurike") ? props.COUPLE_NAME : "") || WEDDING_CONFIG.EVENT_NAME),
    EVENT_DATE: sheetConfig.EVENT_DATE || props.EVENT_DATE || WEDDING_CONFIG.EVENT_DATE,
    EVENT_VENUE: sheetConfig.EVENT_VENUE || props.EVENT_VENUE || WEDDING_CONFIG.EVENT_VENUE,
    SUBTITLE: sheetConfig.SUBTITLE || props.SUBTITLE || WEDDING_CONFIG.SUBTITLE,
    WELCOME_MESSAGE: sheetConfig.WELCOME_MESSAGE || props.WELCOME_MESSAGE || WEDDING_CONFIG.WELCOME_MESSAGE,

    // Konfigurasi Teknis: Dapat dikelola Admin via Web & Sheets
    DRIVE_FOLDER_ID: sheetConfig.DRIVE_FOLDER_ID || props.DRIVE_FOLDER_ID || WEDDING_CONFIG.DRIVE_FOLDER_ID,
    ADMIN_PIN: sheetConfig.ADMIN_PIN || props.ADMIN_PIN || WEDDING_CONFIG.DEFAULT_ADMIN_PIN,
    SLIDESHOW_INTERVAL_SEC: parseInt(sheetConfig.SLIDESHOW_INTERVAL_SEC || props.SLIDESHOW_INTERVAL_SEC, 10) || WEDDING_CONFIG.SLIDESHOW_INTERVAL_SEC,
    AUTO_REFRESH_INTERVAL_SEC: parseInt(sheetConfig.AUTO_REFRESH_INTERVAL_SEC || props.AUTO_REFRESH_INTERVAL_SEC, 10) || WEDDING_CONFIG.AUTO_REFRESH_INTERVAL_SEC,
    FRAME_IMAGE_URL: sheetConfig.FRAME_IMAGE_URL || props.FRAME_IMAGE_URL || WEDDING_CONFIG.FRAME_IMAGE_URL,
    NEW_BADGE_MINUTES: parseInt(sheetConfig.NEW_BADGE_MINUTES || props.NEW_BADGE_MINUTES, 10) || 10,

    // Informasi Database Spreadsheet
    SPREADSHEET_ID: ssId || props.SPREADSHEET_ID || "",
    SPREADSHEET_URL: ssUrl || (ssId ? "https://docs.google.com/spreadsheets/d/" + ssId + "/edit" : "")
  };
}

/**
 * GET Handler: Melayani REST API untuk Vercel atau Halaman Web langsung
 */
function doGet(e) {
  var hasParam = e && e.parameter && Object.keys(e.parameter).length > 0;
  
  if (hasParam && (e.parameter.action || e.parameter.api)) {
    var result = handleApiRequest(e);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var template = HtmlService.createTemplateFromFile('index');
  var config = getEffectiveConfig();
  var safeConfig = Object.assign({}, config);
  delete safeConfig.ADMIN_PIN;
  template.config = safeConfig;

  return template.evaluate()
    .setTitle(safeConfig.EVENT_NAME + " - Wedding Photo Gallery")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * POST Handler: Melayani pembaruan data dari frontend Vercel
 */
function doPost(e) {
  var result = handleApiRequest(e);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Router Terpusat untuk Permintaan API dari Vercel
 */
function handleApiRequest(e) {
  try {
    var params = {};
    if (e && e.parameter) {
      params = Object.assign({}, e.parameter);
    }
    if (e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        params = Object.assign(params, parsed);
      } catch (err) {}
    }

    // Parsing config jika dikirim dalam bentuk JSON string via GET parameter
    if (typeof params.config === "string") {
      try {
        params.config = JSON.parse(params.config);
      } catch (errCfg) {}
    }

    var action = params.action || "getGalleryData";

    if (action === "getGalleryData") {
      return getGalleryData();
    } else if (action === "adminLogin") {
      return adminLogin(params.pin);
    } else if (action === "testAndSyncDriveFolder" || action === "syncDriveFolder") {
      var targetFolder = params.folderId || (params.config && params.config.DRIVE_FOLDER_ID) || params.DRIVE_FOLDER_ID;
      return testAndSyncDriveFolder(params.pin, targetFolder);
    } else if (action === "saveAdminSettings") {
      return saveAdminSettings(params.pin, params.config || params);
    } else if (action === "setupDatabase" || action === "setupSpreadsheetDatabase" || action === "setupDemo" || action === "setupDemoSystem" || action === "setupTargetSpreadsheetDatabase") {
      return setupTargetSpreadsheetDatabase();
    } else if (action === "getSpreadsheetInfo") {
      var dbSs = getDatabaseSpreadsheet();
      if (dbSs) {
        return { success: true, spreadsheetId: dbSs.getId(), spreadsheetUrl: dbSs.getUrl() };
      } else {
        return { success: false, message: "Database spreadsheet belum dibuat / dihubungkan." };
      }
    } else if (action === "getAdminUsers") {
      return getAdminUsers(params.pin);
    } else if (action === "addAdminUser") {
      return addAdminUser(params.pin, params.newUser);
    } else if (action === "deleteAdminUser") {
      return deleteAdminUser(params.pin, params.targetUserId);
    } else if (action === "changeAdminPin") {
      return changeAdminPin(params.pin, params.newPin);
    } else if (action === "getImageBase64") {
      return getImageBase64(params.fileId);
    } else {
      return { success: false, message: "Aksi tidak dikenali: " + action };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Mengambil data galeri foto.
 * Sesuai instruksi: Data foto otomatis diambil langsung dari Google Drive (bukan dari spreadsheet Daftar_Foto).
 * Menggunakan cache mikro 20 detik agar tidak membebani kuota API Google Drive pada live auto-refresh.
 */
function getGalleryData() {
  try {
    var config = getEffectiveConfig();
    var safeConfig = Object.assign({}, config);
    delete safeConfig.ADMIN_PIN;

    var folderId = config.DRIVE_FOLDER_ID ? String(config.DRIVE_FOLDER_ID).trim() : "";
    var matchFolder = folderId.match(/folders\/([a-zA-Z0-9_\-]+)/);
    if (matchFolder && matchFolder[1]) folderId = matchFolder[1];

    // Jika folder Google Drive telah diatur, prioritaskan pemindaian langsung dari Google Drive
    if (folderId) {
      var cache = CacheService.getScriptCache();
      var cacheKey = "drive_gallery_" + folderId;
      var cachedJson = cache.get(cacheKey);
      if (cachedJson) {
        try {
          var parsed = JSON.parse(cachedJson);
          return {
            success: true,
            isDemo: false,
            message: "Foto diambil dari Google Drive (Cached)",
            config: safeConfig,
            categories: parsed.categories,
            photos: parsed.photos,
            totalPhotos: parsed.photos.length
          };
        } catch (eCache) {}
      }

      // Pindai folder Google Drive secara langsung
      var driveScan = scanDriveFolderDirectly(folderId);
      if (driveScan.success) {
        if (driveScan.photos && driveScan.photos.length > 0) {
          // Simpan di ScriptCache selama 20 detik untuk mencegah over-quota
          try {
            cache.put(cacheKey, JSON.stringify({
              categories: driveScan.categories,
              photos: driveScan.photos
            }), 20);
          } catch (ePut) {}
        }

        // Jika folder ada tapi kosong, kembalikan galeri kosong tanpa foto sampel
        return {
          success: true,
          isDemo: false,
          message: (driveScan.photos && driveScan.photos.length > 0) 
            ? ("Berhasil memindai " + driveScan.photos.length + " foto langsung dari Google Drive")
            : "Folder Google Drive kosong.",
          config: safeConfig,
          categories: (driveScan.categories && driveScan.categories.length > 0) ? driveScan.categories : ["Semua Foto"],
          photos: driveScan.photos || [],
          totalPhotos: driveScan.photos ? driveScan.photos.length : 0
        };
      } else {
        // Jika folder Google Drive kosong atau gagal dipindai, kembalikan galeri kosong tanpa foto sampel
        return {
          success: true,
          isDemo: false,
          message: driveScan.message || "Folder Google Drive kosong.",
          config: safeConfig,
          categories: ["Semua Foto"],
          photos: [],
          totalPhotos: 0
        };
      }
    }

    // Jika folder Google Drive belum diatur, kembalikan galeri kosong (dilarang memuat foto sampel)
    return {
      success: true,
      isDemo: false,
      message: "Folder Google Drive kosong atau belum diatur.",
      config: safeConfig,
      categories: ["Semua Foto"],
      photos: [],
      totalPhotos: 0
    };

  } catch (error) {
    var safeConfig = Object.assign({}, getEffectiveConfig());
    delete safeConfig.ADMIN_PIN;
    return {
      success: false,
      error: "SERVER_ERROR",
      message: error.toString(),
      config: safeConfig,
      categories: ["Semua Foto"],
      photos: []
    };
  }
}

/**
 * Memindai file foto langsung dari folder Google Drive tanpa menulis ke spreadsheet Daftar_Foto
 */
function scanDriveFolderDirectly(folderId) {
  var cleanId = String(folderId || "").trim();
  var match = cleanId.match(/folders\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) cleanId = match[1];

  var folder;
  try {
    folder = DriveApp.getFolderById(cleanId);
  } catch (errOpen) {
    return { success: false, message: "Folder Google Drive tidak ditemukan: " + errOpen.toString() };
  }

  var folderName = folder.getName();
  var scannedPhotos = [];
  var categoryMap = { "Semua Foto": true };
  var categories = ["Semua Foto"];

  // 1. Pindai foto langsung di folder utama (kategori: Semua Foto)
  var rootFiles = folder.getFiles();
  while (rootFiles.hasNext()) {
    var rf = rootFiles.next();
    if (rf.getSize() >= 20480 && rf.getMimeType().indexOf('image/') === 0) {
      var rfId = rf.getId();
      var rfDate = rf.getLastUpdated ? (rf.getLastUpdated() || rf.getDateCreated()) : rf.getDateCreated();
      var rfTimestamp = rfDate ? rfDate.getTime() : Date.now();
      var rfName = cleanFileName(rf.getName());

      scannedPhotos.push({
        id: rfId,
        name: rfName,
        rawName: rf.getName(),
        category: "Semua Foto",
        thumbnailUrl: "https://drive.google.com/thumbnail?id=" + rfId + "&sz=w1000",
        highResUrl: "https://drive.google.com/thumbnail?id=" + rfId + "&sz=w2500",
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + rfId,
        sizeBytes: rf.getSize(),
        timestamp: rfTimestamp
      });
    }
  }

  // 2. Pindai subfolder momen (misal: Prewedding, Akad Nikah, Resepsi, Photobooth)
  var subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    var sub = subFolders.next();
    var subCategory = cleanCategoryName(sub.getName());
    if (subCategory && !categoryMap[subCategory]) {
      categoryMap[subCategory] = true;
      categories.push(subCategory);
    }

    var subFiles = sub.getFiles();
    while (subFiles.hasNext()) {
      var sf = subFiles.next();
      if (sf.getSize() >= 20480 && sf.getMimeType().indexOf('image/') === 0) {
        var sfId = sf.getId();
        var sfDate = sf.getLastUpdated ? (sf.getLastUpdated() || sf.getDateCreated()) : sf.getDateCreated();
        var sfTimestamp = sfDate ? sfDate.getTime() : Date.now();
        var sfName = cleanFileName(sf.getName());

        scannedPhotos.push({
          id: sfId,
          name: sfName,
          rawName: sf.getName(),
          category: subCategory,
          thumbnailUrl: "https://drive.google.com/thumbnail?id=" + sfId + "&sz=w1000",
          highResUrl: "https://drive.google.com/thumbnail?id=" + sfId + "&sz=w2500",
          downloadUrl: "https://drive.google.com/uc?export=download&id=" + sfId,
          sizeBytes: sf.getSize(),
          timestamp: sfTimestamp
        });
      }
    }
  }

  // Urutkan foto dari yang paling baru diunggah/diperbarui
  scannedPhotos.sort(function(a, b) {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return {
    success: true,
    folderName: folderName,
    folderId: cleanId,
    categories: categories,
    photos: scannedPhotos,
    totalPhotos: scannedPhotos.length
  };
}

/**
 * ==============================================================================
 * SISTEM MANAJEMEN MULTI-USER ADMIN
 * - Login hanya menggunakan PIN
 * - Setiap user wajib memiliki PIN yang unik (berbeda satu sama lain)
 * - Menampilkan nama pengguna yang sedang masuk
 * ==============================================================================
 */

/**
 * Mengambil daftar seluruh pengguna admin (internal backend)
 */
function getAdminUsersList() {
  var props = PropertiesService.getScriptProperties();
  var rawJson = props.getProperty("ADMIN_USERS_JSON");
  var defaultPin = props.getProperty("ADMIN_PIN") || WEDDING_CONFIG.DEFAULT_ADMIN_PIN || "123456";

  var users = [];
  if (rawJson) {
    try {
      users = JSON.parse(rawJson);
    } catch (eParse) {}
  }

  // Jika belum ada daftar user, buat user default pertama
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = [
      {
        id: "usr_superadmin",
        name: "Super Admin",
        pin: defaultPin,
        role: "Super Admin",
        createdAt: "2026-11-15 00:00:00"
      }
    ];
    saveAdminUsersList(users);
  }

  return users;
}

/**
 * Menyimpan daftar pengguna admin ke Script Properties & Google Spreadsheet (Sheet 'Pengguna_Admin')
 */
function saveAdminUsersList(users) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty("ADMIN_USERS_JSON", JSON.stringify(users));

  // Sinkronkan ke spreadsheet jika terhubung
  try {
    var ss = getDatabaseSpreadsheet();
    if (ss) {
      var sheet = ss.getSheetByName("Pengguna_Admin");
      if (!sheet) {
        sheet = ss.insertSheet("Pengguna_Admin");
      }
      var headers = [["ID_User", "Nama_Pengguna", "PIN", "Peran", "Tanggal_Dibuat"]];
      sheet.clear();
      sheet.getRange(1, 1, 1, 5).setValues(headers)
        .setBackground("#475569")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      var rows = users.map(function(u) {
        return [u.id || "", u.name || "", u.pin || "", u.role || "Admin", u.createdAt || ""];
      });

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(4, 140);
      sheet.setColumnWidth(5, 180);
      SpreadsheetApp.flush();
    }
  } catch (errSync) {
    Logger.log("Info sync users to sheet: " + errSync.toString());
  }
}

/**
 * Mengambil daftar pengguna admin yang aman untuk UI (PIN disamarkan)
 */
function getSafeUsersList(users) {
  return users.map(function(u) {
    return {
      id: u.id,
      name: u.name,
      role: u.role || "Admin",
      createdAt: u.createdAt || "-",
      pinMasked: "••••"
    };
  });
}

/**
 * Verifikasi Login Admin: Murni hanya dengan PIN.
 * Mengembalikan informasi nama pengguna yang sesuai dengan PIN tersebut.
 */
function adminLogin(pin) {
  try {
    var inputPin = String(pin || "").trim();
    if (!inputPin) {
      return { success: false, message: "PIN Admin tidak boleh kosong." };
    }

    var users = getAdminUsersList();
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      if (String(users[i].pin).trim() === inputPin) {
        matchedUser = users[i];
        break;
      }
    }

    if (matchedUser) {
      var config = getEffectiveConfig();
      var safeConfig = Object.assign({}, config);
      delete safeConfig.ADMIN_PIN;

      return {
        success: true,
        message: "Login berhasil! Selamat datang, " + matchedUser.name + ".",
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          role: matchedUser.role || "Admin"
        },
        config: safeConfig
      };
    } else {
      return {
        success: false,
        message: "PIN Admin salah atau tidak terdaftar. Silakan coba lagi."
      };
    }
  } catch (e) {
    return {
      success: false,
      message: "Terjadi kesalahan server saat login: " + e.toString()
    };
  }
}

/**
 * Mengambil daftar admin untuk ditampilkan di panel pengaturan (butuh autentikasi PIN admin)
 */
function getAdminUsers(pin) {
  var loginResult = adminLogin(pin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak: PIN tidak sah." };
  }

  var users = getAdminUsersList();
  return {
    success: true,
    users: getSafeUsersList(users)
  };
}

/**
 * Menambahkan pengguna admin baru.
 * Setiap user WAJIB memiliki PIN yang unik (berbeda satu sama lain).
 */
function addAdminUser(currentPin, newUser) {
  var loginResult = adminLogin(currentPin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak: PIN otorisasi salah." };
  }

  if (typeof newUser === "string") {
    try { newUser = JSON.parse(newUser); } catch (e) {}
  }
  if (!newUser || typeof newUser !== "object") {
    return { success: false, message: "Data pengguna baru tidak valid." };
  }

  var name = String(newUser.name || "").trim();
  var pin = String(newUser.pin || "").trim();
  var role = String(newUser.role || "Admin").trim();

  if (!name) {
    return { success: false, message: "Nama admin tidak boleh kosong." };
  }
  if (!pin || pin.length < 4) {
    return { success: false, message: "PIN admin minimal 4 karakter (angka/huruf)." };
  }

  var users = getAdminUsersList();

  // Validasi Keunikan PIN: Tidak boleh sama dengan PIN user lain
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].pin).trim() === pin) {
      return {
        success: false,
        message: "Kombinasi PIN ini telah terdaftar demi menjaga privasi & keamanan akun. Mohon gunakan kombinasi angka rahasia lainnya yang unik."
      };
    }
  }

  var tz = Session.getScriptTimeZone() || "GMT+7";
  var nowFormatted = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");

  var newUserObj = {
    id: "usr_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1000),
    name: name,
    pin: pin,
    role: role,
    createdAt: nowFormatted
  };

  users.push(newUserObj);
  saveAdminUsersList(users);

  // Catat ke log aktivitas
  try {
    var ss = getDatabaseSpreadsheet();
    if (ss) {
      logActivityToSheet(ss, "Tambah Pengguna Admin", "Menambahkan user baru: " + name + " (Peran: " + role + ")", loginResult.user.name);
    }
  } catch (eLog) {}

  return {
    success: true,
    message: "Pengguna '" + name + "' berhasil ditambahkan dengan PIN tersendiri!",
    users: getSafeUsersList(users)
  };
}

/**
 * Menghapus pengguna admin
 */
function deleteAdminUser(currentPin, targetUserId) {
  var loginResult = adminLogin(currentPin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak: PIN otorisasi salah." };
  }

  var users = getAdminUsersList();
  if (users.length <= 1) {
    return { success: false, message: "Tidak dapat menghapus. Sistem wajib memiliki minimal 1 pengguna admin!" };
  }

  var targetIdx = -1;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === targetUserId) {
      targetIdx = i;
      break;
    }
  }

  if (targetIdx === -1) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  var deletedUser = users[targetIdx];

  // Cegah menghapus user yang sedang aktif login jika ID sama
  if (deletedUser.id === loginResult.user.id) {
    return { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk!" };
  }

  users.splice(targetIdx, 1);
  saveAdminUsersList(users);

  try {
    var ss = getDatabaseSpreadsheet();
    if (ss) {
      logActivityToSheet(ss, "Hapus Pengguna Admin", "Menghapus user: " + deletedUser.name, loginResult.user.name);
    }
  } catch (eLog) {}

  return {
    success: true,
    message: "Pengguna '" + deletedUser.name + "' berhasil dihapus.",
    users: getSafeUsersList(users)
  };
}

/**
 * Mengganti PIN admin pengguna aktif
 */
function changeAdminPin(currentPin, newPin) {
  var loginResult = adminLogin(currentPin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak: PIN otorisasi lama tidak cocok." };
  }

  var cleanNew = String(newPin || "").trim();
  if (cleanNew.length < 4) {
    return { success: false, message: "PIN baru minimal 4 karakter (angka/kombinasi unik)." };
  }

  var users = getAdminUsersList();
  for (var i = 0; i < users.length; i++) {
    if (users[i].id !== loginResult.user.id && String(users[i].pin).trim() === cleanNew) {
      return {
        success: false,
        message: "Kombinasi PIN ini telah terdaftar demi menjaga privasi & keamanan akun. Mohon gunakan kombinasi angka rahasia lainnya yang unik."
      };
    }
  }

  for (var j = 0; j < users.length; j++) {
    if (users[j].id === loginResult.user.id || (loginResult.user.role === "Super Admin" && users[j].role === "Super Admin")) {
      users[j].pin = cleanNew;
      break;
    }
  }

  saveAdminUsersList(users);
  PropertiesService.getScriptProperties().setProperty("ADMIN_PIN", cleanNew);

  return {
    success: true,
    message: "PIN Anda berhasil diperbarui ke: " + cleanNew,
    newPin: cleanNew
  };
}

/**
 * Mengambil Base64 Data URI dari gambar Google Drive untuk canvas tanpa terkena blokir CORS
 */
function getImageBase64(fileIdOrUrl) {
  try {
    var cleanId = String(fileIdOrUrl || "").trim();
    if (!cleanId) return { success: false, message: "ID atau URL file kosong." };

    var match = cleanId.match(/\/d\/([a-zA-Z0-9_\-]+)/) || cleanId.match(/id=([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) cleanId = match[1];

    var file = DriveApp.getFileById(cleanId);
    var blob = file.getBlob();
    var mime = blob.getContentType() || "image/jpeg";
    var base64Data = Utilities.base64Encode(blob.getBytes());

    return {
      success: true,
      contentType: mime,
      fileName: file.getName(),
      dataUrl: "data:" + mime + ";base64," + base64Data
    };
  } catch (e) {
    return {
      success: false,
      message: "Gagal mengambil data gambar: " + e.toString()
    };
  }
}

/**
 * Sinkronisasi & Uji Coba ID Folder Google Drive (Tanpa menulis ke sheet Daftar_Foto)
 */
function testAndSyncDriveFolder(pin, folderId) {
  var loginResult = adminLogin(pin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak. PIN salah atau sesi kedaluwarsa." };
  }

  var cleanId = String(folderId || "").trim();
  if (!cleanId) {
    return { success: false, message: "Tautan atau ID Folder Google Drive tidak boleh kosong." };
  }

  var match = cleanId.match(/folders\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }

  try {
    PropertiesService.getScriptProperties().setProperty("DRIVE_FOLDER_ID", cleanId);

    // Hapus cache lama agar foto langsung segar dari Drive
    var cache = CacheService.getScriptCache();
    cache.remove("drive_gallery_" + cleanId);

    var ss = getDatabaseSpreadsheet();
    if (ss) {
      writeConfigToSheet(ss, { DRIVE_FOLDER_ID: cleanId });
      logActivityToSheet(ss, "Tautkan Folder Google Drive", "Folder ID: " + cleanId + " ditautkan oleh " + loginResult.user.name, loginResult.user.name);
    }

    var scanResult = scanDriveFolderDirectly(cleanId);
    if (!scanResult.success) {
      return scanResult;
    }

    var updatedGallery = getGalleryData();

    return {
      success: true,
      message: "Sukses! Berhasil membaca " + scanResult.totalPhotos + " foto langsung dari Google Drive '" + scanResult.folderName + "'!",
      folderName: scanResult.folderName,
      folderId: cleanId,
      totalPhotos: scanResult.totalPhotos,
      galleryData: updatedGallery
    };

  } catch (e) {
    return {
      success: false,
      message: "Gagal mengakses folder Google Drive: " + e.toString()
    };
  }
}

/**
 * Menyimpan Pengaturan Teknis Admin & Informasi Acara
 */
function saveAdminSettings(pin, updatedConfig) {
  var loginResult = adminLogin(pin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak. PIN tidak sah." };
  }

  if (typeof updatedConfig === "string") {
    try {
      updatedConfig = JSON.parse(updatedConfig);
    } catch (eParse) {}
  }
  if (!updatedConfig || typeof updatedConfig !== "object") {
    updatedConfig = {};
  }

  try {
    var props = PropertiesService.getScriptProperties();

    // Kustomisasi Informasi Acara & Pernikahan
    if (updatedConfig.EVENT_NAME !== undefined && String(updatedConfig.EVENT_NAME).trim()) {
      var cleanEventName = String(updatedConfig.EVENT_NAME).trim();
      props.setProperty("EVENT_NAME", cleanEventName);
      props.setProperty("COUPLE_NAME", cleanEventName);
    } else if (updatedConfig.COUPLE_NAME !== undefined && String(updatedConfig.COUPLE_NAME).trim()) {
      var cleanCoupleName = String(updatedConfig.COUPLE_NAME).trim();
      props.setProperty("EVENT_NAME", cleanCoupleName);
      props.setProperty("COUPLE_NAME", cleanCoupleName);
    }

    if (updatedConfig.EVENT_DATE !== undefined && String(updatedConfig.EVENT_DATE).trim()) {
      props.setProperty("EVENT_DATE", String(updatedConfig.EVENT_DATE).trim());
    }

    if (updatedConfig.EVENT_VENUE !== undefined && String(updatedConfig.EVENT_VENUE).trim()) {
      props.setProperty("EVENT_VENUE", String(updatedConfig.EVENT_VENUE).trim());
    }

    if (updatedConfig.SUBTITLE !== undefined && String(updatedConfig.SUBTITLE).trim()) {
      props.setProperty("SUBTITLE", String(updatedConfig.SUBTITLE).trim());
    }

    if (updatedConfig.WELCOME_MESSAGE !== undefined && String(updatedConfig.WELCOME_MESSAGE).trim()) {
      props.setProperty("WELCOME_MESSAGE", String(updatedConfig.WELCOME_MESSAGE).trim());
    }

    var dbSpreadsheet = getDatabaseSpreadsheet(updatedConfig.SPREADSHEET_ID);

    if (updatedConfig.DRIVE_FOLDER_ID !== undefined) {
      var cleanFolderId = String(updatedConfig.DRIVE_FOLDER_ID).trim();
      var match = cleanFolderId.match(/folders\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) cleanFolderId = match[1];
      props.setProperty("DRIVE_FOLDER_ID", cleanFolderId);

      // Bersihkan cache galeri saat folder ID diperbarui
      if (cleanFolderId) {
        CacheService.getScriptCache().remove("drive_gallery_" + cleanFolderId);
      }
    }

    if (updatedConfig.SLIDESHOW_INTERVAL_SEC) {
      props.setProperty("SLIDESHOW_INTERVAL_SEC", String(updatedConfig.SLIDESHOW_INTERVAL_SEC));
    }
    if (updatedConfig.AUTO_REFRESH_INTERVAL_SEC) {
      props.setProperty("AUTO_REFRESH_INTERVAL_SEC", String(updatedConfig.AUTO_REFRESH_INTERVAL_SEC));
    }

    if (updatedConfig.FRAME_IMAGE_URL !== undefined) {
      var normalizedFrameUrl = normalizeDriveImageUrl(updatedConfig.FRAME_IMAGE_URL);
      props.setProperty("FRAME_IMAGE_URL", normalizedFrameUrl);
    }

    if (updatedConfig.NEW_PIN && String(updatedConfig.NEW_PIN).trim().length >= 4) {
      var newPin = String(updatedConfig.NEW_PIN).trim();
      var users = getAdminUsersList();
      for (var uCheck = 0; uCheck < users.length; uCheck++) {
        if (users[uCheck].id !== loginResult.user.id && String(users[uCheck].pin).trim() === newPin) {
          return {
            success: false,
            message: "Kombinasi PIN ini telah terdaftar demi menjaga privasi & keamanan akun. Mohon gunakan kombinasi angka rahasia lainnya yang unik."
          };
        }
      }
      for (var u = 0; u < users.length; u++) {
        if (users[u].id === loginResult.user.id || (loginResult.user.role === "Super Admin" && users[u].role === "Super Admin")) {
          users[u].pin = newPin;
          break;
        }
      }
      saveAdminUsersList(users);
      props.setProperty("ADMIN_PIN", newPin);
    }

    if (updatedConfig.SPREADSHEET_ID !== undefined) {
      var cleanSsId = String(updatedConfig.SPREADSHEET_ID).trim();
      var matchSs = cleanSsId.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (matchSs && matchSs[1]) cleanSsId = matchSs[1];
      if (cleanSsId) props.setProperty("SPREADSHEET_ID", cleanSsId);
    }

    // Sinkronisasi pembaruan ke Google Spreadsheet Database jika terhubung
    try {
      if (dbSpreadsheet) {
        writeConfigToSheet(dbSpreadsheet, updatedConfig);
        logActivityToSheet(dbSpreadsheet, "Pembaruan Pengaturan", "Admin (" + loginResult.user.name + ") memperbarui data acara via Web Admin", loginResult.user.name);
        SpreadsheetApp.flush();
      }
    } catch (sheetErr) {
      Logger.log("Info write sheet: " + sheetErr.toString());
    }

    var updatedGallery = getGalleryData();

    return {
      success: true,
      message: "Pengaturan berhasil disimpan!",
      galleryData: updatedGallery
    };

  } catch (e) {
    return {
      success: false,
      message: "Gagal menyimpan pengaturan: " + e.toString()
    };
  }
}

/**
 * Normalisasi URL atau ID Berkas Google Drive
 */
function normalizeDriveImageUrl(urlOrId) {
  if (!urlOrId) return "";
  var raw = String(urlOrId).trim();
  
  var match = raw.match(/\/d\/([a-zA-Z0-9_\-]+)/) || raw.match(/id=([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) {
    return "https://lh3.googleusercontent.com/d/" + match[1] + "=w2048";
  }
  
  if (/^[a-zA-Z0-9_\-]{20,}$/.test(raw)) {
    return "https://lh3.googleusercontent.com/d/" + raw + "=w2048";
  }
  
  return raw;
}

/**
 * Memindai berkas gambar dengan filter ketat (>20KB)
 */
function scanFilesInFolder(folder, categoryName, photoList) {
  var files = folder.getFiles();
  var allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true
  };

  while (files.hasNext()) {
    var file = files.next();
    var fileName = file.getName();
    var mime = file.getMimeType();
    var size = file.getSize();

    if (size < 20480) continue;
    if (fileName.indexOf('.') === 0 || fileName.indexOf('~') === 0 || fileName.toLowerCase().indexOf('.tmp') !== -1) continue;

    if (allowedTypes[mime] || (mime.indexOf('image/') === 0 && mime !== 'image/svg+xml' && mime !== 'image/gif')) {
      var fileId = file.getId();
      var dateCreated = file.getLastUpdated ? (file.getLastUpdated() || file.getDateCreated()) : file.getDateCreated();

      var thumbUrl = "https://lh3.googleusercontent.com/d/" + fileId + "=w800";
      var highResUrl = "https://lh3.googleusercontent.com/d/" + fileId + "=w2048";
      var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

      photoList.push({
        id: fileId,
        name: cleanFileName(fileName),
        rawName: fileName,
        category: categoryName,
        thumbnailUrl: thumbUrl,
        highResUrl: highResUrl,
        downloadUrl: downloadUrl,
        date: Utilities.formatDate(dateCreated, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm'),
        timestamp: dateCreated.getTime()
      });
    }
  }
}

function cleanCategoryName(name) {
  if (!name) return "Lainnya";
  return name.replace(/^[0-9]+[\.\-_ ]+/, '').trim();
}

function cleanFileName(fileName) {
  if (!fileName) return "Foto Pernikahan";
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ').trim();
}

/**
 * Demo Photos
 */
function getDemoPhotos() {
  return [
    {
      id: "demo-1",
      name: "Tatapan Penuh Bahagia",
      category: "Prewedding",
      thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 09:30",
      timestamp: 1731634200000
    },
    {
      id: "demo-2",
      name: "Janji Suci Akad Nikah",
      category: "Akad Nikah",
      thumbnailUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 10:15",
      timestamp: 1731636900000
    },
    {
      id: "demo-3",
      name: "Cincin Pengikat Dua Jiwa",
      category: "Akad Nikah",
      thumbnailUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 10:45",
      timestamp: 1731638700000
    },
    {
      id: "demo-4",
      name: "Bunga Tangan Mempelai",
      category: "Resepsi",
      thumbnailUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 12:00",
      timestamp: 1731643200000
    },
    {
      id: "demo-5",
      name: "Senyum Bahagia Pelaminan",
      category: "Resepsi",
      thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 13:30",
      timestamp: 1731648600000
    },
    {
      id: "demo-6",
      name: "Keseruan Bersama Sahabat",
      category: "Photobooth",
      thumbnailUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 14:10",
      timestamp: 1731651000000
    },
    {
      id: "demo-7",
      name: "Dansa Pertama Suami Istri",
      category: "Resepsi",
      thumbnailUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 15:00",
      timestamp: 1731654000000
    },
    {
      id: "demo-8",
      name: "Kisah Kasih Abadi",
      category: "Prewedding",
      thumbnailUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      highResUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2000&q=90",
      downloadUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2400&q=100",
      date: "15/11/2026 16:30",
      timestamp: 1731659400000
    }
  ];
}
