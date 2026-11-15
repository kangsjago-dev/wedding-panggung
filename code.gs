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
  EVENT_NAME: "The Wedding of Romeo & Juliet",

  // Tanggal Acara
  EVENT_DATE: "15 November 2026",

  // Venue / Lokasi Acara
  EVENT_VENUE: "Grand Ballroom, Jakarta",

  // Subjudul Galeri
  SUBTITLE: "The Wedding Gallery & Precious Memories",

  // Pesan Sambutan untuk Tamu
  WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",

  // Konfigurasi Teknis (Dapat dikelola admin via web & spreadsheet)
  DRIVE_FOLDER_ID: "",
  DEFAULT_ADMIN_PIN: "123456",
  SLIDESHOW_INTERVAL_SEC: 4,
  AUTO_REFRESH_INTERVAL_SEC: 25,
  FRAME_IMAGE_URL: "",
  SPREADSHEET_ID: "",
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
 * 1. Mengambil spreadsheet database aktif ('foto-panggung')
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
  var ssId = optionalCustomId || props.getProperty("SPREADSHEET_ID") || "";
  
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
 * 2. Setup Otomatis Google Spreadsheet Database 'foto-panggung' (Non-Destruktif)
 */
function setupDatabaseSpreadsheet(customName) {
  try {
    var props = PropertiesService.getScriptProperties();
    var ss = getDatabaseSpreadsheet();

    if (!ss) {
      var name = customName || SPREADSHEET_DB_NAME;
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

    // 3. Sheet: Log_Aktivitas
    var sheetLogs = ss.getSheetByName("Log_Aktivitas");
    if (!sheetLogs) {
      sheetLogs = ss.insertSheet("Log_Aktivitas", 2);
    }
    if (sheetLogs.getLastRow() < 1) {
      var logHeaders = [["Timestamp", "Aksi", "Detail", "Pengguna"]];
      sheetLogs.getRange(1, 1, 1, 4).setValues(logHeaders)
        .setBackground("#C5A880")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheetLogs.setFrozenRows(1);
      sheetLogs.setColumnWidth(1, 200);
      sheetLogs.setColumnWidth(2, 180);
      sheetLogs.setColumnWidth(3, 350);
      sheetLogs.setColumnWidth(4, 120);
    }

    logActivityToSheet(ss, "Inisialisasi Database", "Database spreadsheet foto-panggung berhasil disiapkan", "Sistem");

    return {
      success: true,
      message: "Database spreadsheet foto-panggung berhasil disiapkan!",
      spreadsheetId: ssId,
      spreadsheetUrl: ssUrl
    };
  } catch (err) {
    return {
      success: false,
      message: "Gagal menyiapkan spreadsheet database foto-panggung: " + err.toString()
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
    EVENT_NAME: sheetConfig.EVENT_NAME || props.EVENT_NAME || props.COUPLE_NAME || WEDDING_CONFIG.EVENT_NAME,
    COUPLE_NAME: sheetConfig.EVENT_NAME || props.EVENT_NAME || props.COUPLE_NAME || WEDDING_CONFIG.EVENT_NAME,
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

    var action = params.action || "getGalleryData";

    if (action === "getGalleryData") {
      return getGalleryData();
    } else if (action === "adminLogin") {
      return adminLogin(params.pin);
    } else if (action === "testAndSyncDriveFolder") {
      return testAndSyncDriveFolder(params.pin, params.folderId);
    } else if (action === "saveAdminSettings") {
      return saveAdminSettings(params.pin, params.config || params);
    } else if (action === "setupDatabase" || action === "setupSpreadsheetDatabase") {
      return setupDatabaseSpreadsheet(params.name);
    } else if (action === "setupDemo" || action === "setupDemoSystem") {
      return setupDemoSystemWithDummyFiles();
    } else if (action === "getSpreadsheetInfo") {
      var dbSs = getDatabaseSpreadsheet();
      if (dbSs) {
        return { success: true, spreadsheetId: dbSs.getId(), spreadsheetUrl: dbSs.getUrl() };
      } else {
        return { success: false, message: "Database spreadsheet belum dibuat / dihubungkan." };
      }
    } else {
      return { success: false, message: "Aksi tidak dikenali: " + action };
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Mengambil data galeri dari Google Drive
 */
function getGalleryData() {
  try {
    var config = getEffectiveConfig();
    var folderId = config.DRIVE_FOLDER_ID ? config.DRIVE_FOLDER_ID.trim() : "";
    
    var safeConfig = Object.assign({}, config);
    delete safeConfig.ADMIN_PIN;

    if (!folderId || folderId === "MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_ANDA_DI_SINI") {
      return {
        success: true,
        isDemo: true,
        message: "ID Folder Google Drive belum diatur. Menampilkan galeri contoh (Demo Mode). Buka Menu Admin untuk memasukkan ID folder.",
        config: safeConfig,
        categories: ["Semua Foto", "Prewedding", "Akad Nikah", "Resepsi", "Photobooth"],
        photos: getDemoPhotos()
      };
    }

    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderId);
    } catch (err) {
      return {
        success: false,
        error: "FOLDER_NOT_FOUND",
        message: "Folder Google Drive tidak ditemukan atau izin belum dibagikan. Pastikan folder disetel 'Siapa saja yang memiliki link dapat melihat'. Error: " + err.toString(),
        config: safeConfig,
        categories: ["Semua Foto"],
        photos: getDemoPhotos()
      };
    }

    var categories = ["Semua Foto"];
    var photos = [];
    var categoryMap = {};

    var subFolders = rootFolder.getFolders();
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      var cleanCatName = cleanCategoryName(sub.getName());
      if (!categoryMap[cleanCatName]) {
        categoryMap[cleanCatName] = true;
        categories.push(cleanCatName);
      }
      scanFilesInFolder(sub, cleanCatName, photos);
    }

    scanFilesInFolder(rootFolder, "Galeri Utama", photos);

    if (photos.some(function(p) { return p.category === "Galeri Utama"; })) {
      if (!categoryMap["Galeri Utama"]) {
        categories.push("Galeri Utama");
      }
    }

    photos.sort(function(a, b) {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    // Sinkronkan daftar foto ke Sheet Daftar_Foto jika spreadsheet database aktif
    try {
      var activeSs = getDatabaseSpreadsheet();
      if (activeSs && photos.length > 0) {
        syncPhotosToSheet(activeSs, photos);
      }
    } catch (e) {}

    return {
      success: true,
      isDemo: false,
      config: safeConfig,
      categories: categories,
      photos: photos,
      totalPhotos: photos.length
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
      photos: getDemoPhotos()
    };
  }
}

/**
 * Verifikasi Login Admin menggunakan PIN
 */
function adminLogin(pin) {
  try {
    var config = getEffectiveConfig();
    var inputPin = String(pin || "").trim();
    var currentPin = String(config.ADMIN_PIN || WEDDING_CONFIG.DEFAULT_ADMIN_PIN).trim();

    if (inputPin && inputPin === currentPin) {
      var safeConfig = Object.assign({}, config);
      delete safeConfig.ADMIN_PIN;
      return {
        success: true,
        message: "Login Admin berhasil!",
        config: safeConfig
      };
    } else {
      return {
        success: false,
        message: "PIN Admin salah. Silakan coba lagi."
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
 * Sinkronisasi & Uji Coba ID Folder Google Drive
 */
function testAndSyncDriveFolder(pin, folderId) {
  var loginResult = adminLogin(pin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak. PIN salah atau sesi kedaluwarsa." };
  }

  var cleanId = String(folderId || "").trim();
  if (!cleanId) {
    return { success: false, message: "ID Folder Google Drive tidak boleh kosong." };
  }

  var match = cleanId.match(/folders\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }

  try {
    var folder = DriveApp.getFolderById(cleanId);
    var folderName = folder.getName();

    var subCount = 0;
    var subIter = folder.getFolders();
    while (subIter.hasNext()) {
      subIter.next();
      subCount++;
    }

    var imgCount = 0;
    var fileIter = folder.getFiles();
    while (fileIter.hasNext()) {
      var f = fileIter.next();
      if (f.getSize() >= 20480 && f.getMimeType().indexOf('image/') === 0) {
        imgCount++;
      }
    }

    PropertiesService.getScriptProperties().setProperty("DRIVE_FOLDER_ID", cleanId);
    var updatedGallery = getGalleryData();

    return {
      success: true,
      message: "Folder Google Drive berhasil disinkronkan!",
      folderName: folderName,
      folderId: cleanId,
      subfolderCount: subCount,
      rootImageCount: imgCount,
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
 * Menyimpan Pengaturan Teknis Admin
 * (Hanya memproses Folder ID, Bingkai, Slideshow Interval, dan PIN. Informasi Pernikahan tidak diubah)
 */
function saveAdminSettings(pin, updatedConfig) {
  var loginResult = adminLogin(pin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak. PIN tidak sah." };
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

    if (updatedConfig.DRIVE_FOLDER_ID !== undefined) {
      var cleanFolderId = String(updatedConfig.DRIVE_FOLDER_ID).trim();
      var match = cleanFolderId.match(/folders\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) cleanFolderId = match[1];
      props.setProperty("DRIVE_FOLDER_ID", cleanFolderId);
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
      props.setProperty("ADMIN_PIN", String(updatedConfig.NEW_PIN).trim());
    }

    if (updatedConfig.SPREADSHEET_ID !== undefined) {
      var cleanSsId = String(updatedConfig.SPREADSHEET_ID).trim();
      var matchSs = cleanSsId.match(/\/d\/([a-zA-Z0-9_\-]+)/);
      if (matchSs && matchSs[1]) cleanSsId = matchSs[1];
      if (cleanSsId) props.setProperty("SPREADSHEET_ID", cleanSsId);
    }

    // Sinkronisasi pembaruan ke Google Spreadsheet Database jika terhubung
    try {
      var dbSpreadsheet = getDatabaseSpreadsheet(updatedConfig.SPREADSHEET_ID);
      if (dbSpreadsheet) {
        writeConfigToSheet(dbSpreadsheet, updatedConfig);
        logActivityToSheet(dbSpreadsheet, "Pembaruan Pengaturan", "Admin memperbarui data acara & teknis via Web Admin", "Admin Web");
      }
    } catch (sheetErr) {
      Logger.log("Info write sheet: " + sheetErr.toString());
    }

    var updatedGallery = getGalleryData();

    return {
      success: true,
      message: "Pengaturan acara, Google Drive, dan bingkai foto berhasil disimpan!",
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
