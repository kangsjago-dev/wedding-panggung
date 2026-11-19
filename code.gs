/**
 * ================================================================================
 * WEDDING PANGGUNG - ELEGANT GOOGLE DRIVE PHOTO GALLERY
 * Backend Controller & Google Apps Script REST API Service (v1.4)
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */

// ================================================================================
// KONFIGURASI PERNIKAHAN MASTER (REALTIME DATABASE DRIVEN)
// ================================================================================
const WEDDING_CONFIG = {
  // Nama Event Acara (Murni Realtime Database Sheet Daftar_Acara / Pengaturan)
  EVENT_NAME: "",

  // Tanggal Acara
  EVENT_DATE: "",

  // Venue / Lokasi Acara
  EVENT_VENUE: "",

  // Subjudul Galeri
  SUBTITLE: "",

  // Pesan Sambutan untuk Tamu
  WELCOME_MESSAGE: "",

  // Pesan Penutup Footer (Mendukung Enter / Multi-baris)
  FOOTER_MESSAGE: "",

  // Label Tab Galeri Utama
  ALL_PHOTOS_LABEL: "Semua Foto",

  // Kategori Kustom & Tautan Target Display Galeri
  CUSTOM_CATEGORIES: '[]',
  PHOTOBOOTH_URL: "",

  // Multi-Event Registry
  ACTIVE_EVENT_ID: "",
  EVENTS: '[]',

  // Akun Admin (Murni Realtime Database Sheet Pengguna_Admin)
  ADMIN_ACCOUNTS: '[]',

  // Konfigurasi Teknis (Dapat dikelola admin via web & spreadsheet)
  DRIVE_FOLDER_ID: "",
  DEFAULT_ADMIN_USERNAME: "",
  DEFAULT_ADMIN_PIN: "",
  SLIDESHOW_INTERVAL_SEC: 4,
  AUTO_REFRESH_INTERVAL_SEC: 20,
  FRAME_IMAGE_URL: "",
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
      ["ADMIN_USERNAME", WEDDING_CONFIG.DEFAULT_ADMIN_USERNAME || "admin", "Nama Pengguna (Username) Akses Masuk Panel Admin Web"],
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
 * 2B. Inisialisasi Database Penuh & Seluruh Postingan ke Spreadsheet Pengguna
 * Termasuk ID Admin, Username, Seluruh Postingan Foto Drive, dan Seluruh Tautan Sistem
 */
function setupTargetSpreadsheetDatabase() {
  Logger.log("=== MEMULAI INISIALISASI DATABASE LENGKAP PADA SPREADSHEET PENGGUNA ===");
  var targetId = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  var props = PropertiesService.getScriptProperties();
  props.setProperty("SPREADSHEET_ID", targetId);

  var ss;
  try {
    ss = SpreadsheetApp.openById(targetId);
  } catch (errOpen) {
    return {
      success: false,
      message: "Gagal membuka spreadsheet (" + targetId + "): " + errOpen.toString()
    };
  }

  // 1. Sheet: Pengaturan
  var sheetSettings = ss.getSheetByName("Pengaturan");
  if (!sheetSettings) {
    var sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() <= 1 && sheet1.getLastColumn() <= 1) {
      sheet1.setName("Pengaturan");
      sheetSettings = sheet1;
    } else {
      sheetSettings = ss.insertSheet("Pengaturan", 0);
    }
  }

  sheetSettings.getRange(1, 1, 1, 3).setValues([["Parameter", "Nilai", "Keterangan"]])
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetSettings.setFrozenRows(1);

  var defaultParams = [
    ["EVENT_NAME", "", "Nama Event / Pasangan Pengantin"],
    ["COUPLE_NAME", "", "Nama Pasangan Pengantin"],
    ["EVENT_DATE", "", "Tanggal Pelaksanaan Acara"],
    ["EVENT_VENUE", "", "Venue / Lokasi Gedung Acara"],
    ["SUBTITLE", "", "Subjudul Galeri Foto"],
    ["WELCOME_MESSAGE", "", "Pesan Sambutan Hangat untuk Tamu"],
    ["FOOTER_MESSAGE", "", "Pesan Penutup Footer Galeri"],
    ["ALL_PHOTOS_LABEL", "Semua Foto", "Label Tab Galeri Utama"],
    ["ACTIVE_EVENT_ID", "", "ID Event Aktif"],
    ["ADMIN_USERNAME", "", "Nama Pengguna (Username) Akses Masuk Panel Admin Web"],
    ["ADMIN_PIN", "", "PIN Akses Masuk Panel Admin Web"],
    ["SLIDESHOW_INTERVAL_SEC", "4", "Durasi Perpindahan Foto Slideshow (detik)"],
    ["AUTO_REFRESH_INTERVAL_SEC", "20", "Interval Live Auto-Sync Foto (detik)"],
    ["NEW_BADGE_MINUTES", "10", "Durasi Lencana '✨ Baru' Aktif (menit)"],
    ["SPREADSHEET_ID", targetId, "ID File Google Spreadsheet Database Aktif"],
    ["SPREADSHEET_URL", "https://docs.google.com/spreadsheets/d/" + targetId + "/edit", "Tautan Langsung Google Spreadsheet Database"],
    ["GAS_API_URL", "", "Tautan Endpoint Google Apps Script Web App"],
    ["DRIVE_FOLDER_ID", "", "ID Folder Google Drive Galeri Utama"],
    ["DRIVE_FOLDER_URL", "", "Tautan Folder Google Drive Galeri Utama"],
    ["FRAME_IMAGE_URL", "", "Tautan File Bingkai PNG Transparan Saat Download"],
    ["PHOTOBOOTH_URL", "", "Tautan Vendor Kategori Spesial Photobooth"],
    ["CUSTOM_CATEGORIES", "[]", "Daftar Kategori Kustom & Tautan Tampilan"],
    ["EVENTS", "[]", "Registry Multi-Event Sistem"],
    ["COVER_SETTINGS", '{"enabled":false}', "Pengaturan Cover Halaman Depan"],
    ["ADMIN_ACCOUNTS_INFO", "", "Daftar ID & Username Admin Terdaftar"]
  ];

  // Safe Migration: Pertahankan konfigurasi riil yang sudah ada di spreadsheet
  var currentSettingsData = sheetSettings.getDataRange().getValues();
  var existingSettingsKeys = {};
  for (var sr = 1; sr < currentSettingsData.length; sr++) {
    var sk = String(currentSettingsData[sr][0]).trim();
    if (sk) existingSettingsKeys[sk] = true;
  }
  var missingSettingsRows = [];
  for (var dp = 0; dp < defaultParams.length; dp++) {
    if (!existingSettingsKeys[defaultParams[dp][0]]) {
      missingSettingsRows.push(defaultParams[dp]);
    }
  }
  if (missingSettingsRows.length > 0) {
    var nextSettingsRow = Math.max(sheetSettings.getLastRow() + 1, 2);
    sheetSettings.getRange(nextSettingsRow, 1, missingSettingsRows.length, 3).setValues(missingSettingsRows);
  }
  sheetSettings.setColumnWidth(1, 240);
  sheetSettings.setColumnWidth(2, 380);
  sheetSettings.setColumnWidth(3, 300);

  // 2. Sheet: Pengguna_Admin (Safe Non-Destructive Init)
  var sheetUsers = ss.getSheetByName("Pengguna_Admin");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("Pengguna_Admin", 1);
  }
  if (sheetUsers.getLastRow() === 0) {
    var userHeaders = [["ID_User", "Username", "Nama_Pengguna", "PIN", "Peran", "Tanggal_Dibuat"]];
    sheetUsers.getRange(1, 1, 1, 6).setValues(userHeaders)
      .setBackground("#475569")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetUsers.setFrozenRows(1);
  }
  sheetUsers.setColumnWidth(1, 160);
  sheetUsers.setColumnWidth(2, 140);
  sheetUsers.setColumnWidth(3, 180);
  sheetUsers.setColumnWidth(4, 100);
  sheetUsers.setColumnWidth(5, 130);
  sheetUsers.setColumnWidth(6, 170);

  // 2b. Sheet: Daftar_Acara (Registry Multi-Event Sistem - Safe Non-Destructive Init)
  var sheetEvents = ss.getSheetByName("Daftar_Acara");
  if (!sheetEvents) {
    sheetEvents = ss.insertSheet("Daftar_Acara", 2);
  }
  var eventHeaders = [["ID_Event", "Nama_Acara", "Tanggal_Acara", "Venue_Lokasi", "Tautan_Home_Event", "Google_Drive_Folder_ID", "Photobooth_Vendor_URL", "Kategori_JSON", "Bingkai_URL", "Logo_Acara", "Status"]];
  if (sheetEvents.getLastRow() === 0) {
    sheetEvents.getRange(1, 1, 1, 11).setValues(eventHeaders)
      .setBackground("#C5A880")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetEvents.setFrozenRows(1);
  }

  // Jika data masih kosong (hanya ada header), masukkan ke-3 event aktif default
  if (sheetEvents.getLastRow() <= 1) {
    var defaultEvents = [
      [
        "andre-fayola-281",
        "Andre & Fayola",
        "22 November 2026",
        "UPPERHILLS CONVENTION HALLS",
        "https://gallery.runway.my.id/?event=andre-fayola-281",
        "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
        "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        JSON.stringify([{ name: "Photobooth", url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", enabled: true, isPhotobooth: true }]),
        "",
        "",
        "Aktif"
      ],
      [
        "wilson-felicia-133",
        "Wilson & Felicia",
        "16 November 2026",
        "UpperHills Convention Hall, Makassar",
        "https://gallery.runway.my.id/?event=wilson-felicia-133",
        "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
        "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
        JSON.stringify([{ name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true }]),
        "",
        "",
        "Aktif"
      ],
      [
        "tommy-natasha-594",
        "Tommy & Natasha",
        "Rabu, 25 November 2026",
        "UpperHills Convention Hall, Makassar",
        "https://gallery.runway.my.id/?event=tommy-natasha-594",
        "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
        "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
        JSON.stringify([{ id: "special_photobooth", name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true, isPhotobooth: true }]),
        "",
        "",
        "Aktif"
      ]
    ];
    sheetEvents.getRange(2, 1, defaultEvents.length, eventHeaders[0].length).setValues(defaultEvents);
  }

  sheetEvents.setColumnWidth(1, 180);
  sheetEvents.setColumnWidth(2, 220);
  sheetEvents.setColumnWidth(3, 160);
  sheetEvents.setColumnWidth(4, 250);
  sheetEvents.setColumnWidth(5, 320);
  sheetEvents.setColumnWidth(6, 260);
  sheetEvents.setColumnWidth(7, 300);
  sheetEvents.setColumnWidth(8, 300);
  sheetEvents.setColumnWidth(9, 260);
  sheetEvents.setColumnWidth(10, 260);
  sheetEvents.setColumnWidth(11, 100);

  // 3. Sheet: Daftar_Foto (Safe Non-Destructive Init)
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");
  if (!sheetPhotos) {
    sheetPhotos = ss.insertSheet("Daftar_Foto", 3);
  }
  if (sheetPhotos.getLastRow() === 0) {
    var photoHeaders = [["ID_Foto", "Nama_File", "Kategori", "URL_Thumbnail", "URL_Download", "Ukuran_Bytes", "Waktu_Upload", "Status"]];
    sheetPhotos.getRange(1, 1, 1, 8).setValues(photoHeaders)
      .setBackground("#C5A880")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetPhotos.setFrozenRows(1);
  }
  sheetPhotos.setColumnWidth(1, 140);
  sheetPhotos.setColumnWidth(2, 220);
  sheetPhotos.setColumnWidth(3, 130);
  sheetPhotos.setColumnWidth(4, 260);
  sheetPhotos.setColumnWidth(5, 260);
  sheetPhotos.setColumnWidth(6, 110);
  sheetPhotos.setColumnWidth(7, 180);
  sheetPhotos.setColumnWidth(8, 100);

  // 4. Sheet: Log_Aktivitas
  var sheetLogs = ss.getSheetByName("Log_Aktivitas");
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet("Log_Aktivitas", 3);
  }
  var logHeaders = [["Timestamp", "Aksi", "Detail", "Pengguna"]];
  sheetLogs.getRange(1, 1, 1, 4).setValues(logHeaders)
    .setBackground("#64748B")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetLogs.setFrozenRows(1);

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  sheetLogs.appendRow([nowStr, "Inisialisasi Database Penuh", "Seluruh postingan foto, ID admin, dan link sistem berhasil diisi ke Google Sheets", "ZettBOT Setup"]);

  try {
    var residualSheet1 = ss.getSheetByName("Sheet1");
    if (residualSheet1 && ss.getSheets().length > 1) {
      ss.deleteSheet(residualSheet1);
    }
  } catch (eDel) {}

  SpreadsheetApp.flush();

  return {
    success: true,
    message: "Database & seluruh postingan foto berhasil dibuat 100% lengkap pada spreadsheet Anda!",
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    totalPhotos: (sheetPhotos && sheetPhotos.getLastRow() > 1) ? (sheetPhotos.getLastRow() - 1) : 0
  };
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
        if (typeof newVal === "object") {
          newVal = JSON.stringify(newVal);
        }
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

/**
 * 4b. Membaca Daftar Acara (Multi-Event) dari Sheet 'Daftar_Acara'
 */
function readEventsFromSheet(ss) {
  if (!ss) return [];
  try {
    var sheet = ss.getSheetByName('Daftar_Acara');
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) return [];

    var header = data[0].map(function(h) { return String(h || '').trim(); });
    var idCol = header.indexOf('ID_Event');
    var nameCol = header.indexOf('Nama_Acara');
    if (idCol === -1 && nameCol === -1) {
      return [];
    }

    var dateCol = header.indexOf('Tanggal_Acara');
    var venueCol = header.indexOf('Venue_Lokasi');
    var urlCol = header.indexOf('Tautan_Home_Event');
    var driveCol = header.indexOf('Google_Drive_Folder_ID');
    var pbCol = header.indexOf('Photobooth_Vendor_URL');
    var catCol = header.indexOf('Kategori_JSON');
    var frameCol = header.indexOf('Bingkai_URL');
    var logoCol = header.indexOf('Logo_Acara');
    if (logoCol === -1) logoCol = header.indexOf('EVENT_LOGO_URL');
    var statusCol = header.indexOf('Status');

    var events = [];
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      var evId = idCol >= 0 ? String(row[idCol] || '').trim() : String(row[0] || '').trim();
      if (!evId) continue;

      var cats = [];
      if (catCol >= 0 && row[catCol]) {
        try {
          cats = typeof row[catCol] === 'string' ? JSON.parse(row[catCol]) : row[catCol];
        } catch(e) { cats = []; }
      }

      var homeUrl = urlCol >= 0 ? String(row[urlCol] || '').trim() : '';
      if (!homeUrl) homeUrl = 'https://gallery.runway.my.id/?event=' + encodeURIComponent(evId);

      events.push({
        id: evId,
        name: nameCol >= 0 ? String(row[nameCol] || '').trim() : evId,
        date: dateCol >= 0 ? String(row[dateCol] || '').trim() : '',
        venue: venueCol >= 0 ? String(row[venueCol] || '').trim() : '',
        homeUrl: homeUrl,
        driveFolderId: driveCol >= 0 ? String(row[driveCol] || '').trim() : '',
        photoboothUrl: pbCol >= 0 ? String(row[pbCol] || '').trim() : '',
        customCategories: Array.isArray(cats) ? cats : [],
        frameImageUrl: frameCol >= 0 ? String(row[frameCol] || '').trim() : '',
        logoUrl: logoCol >= 0 ? String(row[logoCol] || '').trim() : '',
        EVENT_LOGO_URL: logoCol >= 0 ? String(row[logoCol] || '').trim() : '',
        status: statusCol >= 0 ? String(row[statusCol] || 'Aktif').trim() : 'Aktif',
        subtitle: 'The Wedding Gallery & Precious Memories',
        welcomeMessage: 'Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.',
        footerMessage: 'Diabadikan dengan cinta\nTerima kasih atas doa restunya.',
        allPhotosLabel: 'Semua Foto'
      });
    }
    return events;
  } catch (e) {
    Logger.log('Gagal membaca Daftar_Acara: ' + e.toString());
    return [];
  }
}

/**
 * 4c. Menyimpan / Sinkronisasi Daftar Acara ke Sheet 'Daftar_Acara'
 */
function syncEventsToSheet(ss, eventsList) {
  if (!ss || !Array.isArray(eventsList) || eventsList.length === 0) return;
  try {
    var sheet = ss.getSheetByName('Daftar_Acara');
    if (!sheet) {
      sheet = ss.insertSheet('Daftar_Acara', 1);
    }

    var headers = [
      ['ID_Event', 'Nama_Acara', 'Tanggal_Acara', 'Venue_Lokasi', 'Tautan_Home_Event', 'Google_Drive_Folder_ID', 'Photobooth_Vendor_URL', 'Kategori_JSON', 'Bingkai_URL', 'Logo_Acara', 'Status']
    ];

    sheet.clear();
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
      .setBackground('#C5A880')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    var rows = [];
    for (var i = 0; i < eventsList.length; i++) {
      var ev = eventsList[i];
      if (!ev || !ev.id) continue;
      var homeLink = ev.homeUrl || ('https://gallery.runway.my.id/?event=' + encodeURIComponent(ev.id));
      var catStr = '';
      if (ev.customCategories) {
        catStr = typeof ev.customCategories === 'string' ? ev.customCategories : JSON.stringify(ev.customCategories);
      }
      rows.push([
        ev.id,
        ev.name || '',
        ev.date || '',
        ev.venue || '',
        homeLink,
        ev.driveFolderId || '',
        ev.photoboothUrl || '',
        catStr,
        ev.frameImageUrl || '',
        ev.logoUrl || ev.EVENT_LOGO_URL || '',
        ev.status || 'Aktif'
      ]);
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers[0].length).setValues(rows);
    }

    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 160);
    sheet.setColumnWidth(4, 250);
    sheet.setColumnWidth(5, 320);
    sheet.setColumnWidth(6, 260);
    sheet.setColumnWidth(7, 300);
    sheet.setColumnWidth(8, 300);
    sheet.setColumnWidth(9, 260);
    sheet.setColumnWidth(10, 260);
    sheet.setColumnWidth(11, 100);

    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log('Gagal sinkronisasi Daftar_Acara: ' + e.toString());
  }
}

/**
 * 4d. Menambahkan atau Memperbarui 1 Event ke Sheet 'Daftar_Acara'
 */
function addEventToSheet(ss, ev) {
  if (!ss || !ev || !ev.id) return false;
  try {
    var sheet = ss.getSheetByName('Daftar_Acara');
    if (!sheet) {
      syncEventsToSheet(ss, [ev]);
      return true;
    }

    var data = sheet.getDataRange().getValues();
    var existingRowIndex = -1;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][0] || '').trim().toLowerCase() === String(ev.id).trim().toLowerCase()) {
        existingRowIndex = r + 1; // 1-based index
        break;
      }
    }

    var homeLink = ev.homeUrl || ('https://gallery.runway.my.id/?event=' + encodeURIComponent(ev.id));
    var catStr = '';
    if (ev.customCategories) {
      catStr = typeof ev.customCategories === 'string' ? ev.customCategories : JSON.stringify(ev.customCategories);
    }
    var rowData = [
      ev.id,
      ev.name || '',
      ev.date || '',
      ev.venue || '',
      homeLink,
      ev.driveFolderId || '',
      ev.photoboothUrl || '',
      catStr,
      ev.frameImageUrl || '',
      ev.logoUrl || ev.EVENT_LOGO_URL || '',
      ev.status || 'Aktif'
    ];

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    SpreadsheetApp.flush();
    return true;
  } catch (e) {
    Logger.log('Gagal menambah event ke sheet: ' + e.toString());
    return false;
  }
}

/**
 * 4e. Sinkronisasi Semua Event dari Registry / Script Properties ke Sheet 'Daftar_Acara'
 */
function syncAllEventsToSheet() {
  var ss = getDatabaseSpreadsheet();
  if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };

  var config = getEffectiveConfig();
  var evList = [];
  try {
    evList = typeof config.EVENTS === 'string' ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
  } catch (e) {
    evList = [];
  }

  // Jika evList kosong, gunakan default 3 event
  if (!Array.isArray(evList) || evList.length === 0) {
    evList = [
      {
        id: "andre-fayola-281",
        name: "Andre & Fayola",
        date: "22 November 2026",
        venue: "UPPERHILLS CONVENTION HALLS",
        homeUrl: "https://gallery.runway.my.id/?event=andre-fayola-281",
        driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
        photoboothUrl: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        customCategories: [{ name: "Photobooth", url: "https://photos.app.goo.gl/QkqewYw4dWfocxfK8", enabled: true, isPhotobooth: true }],
        frameImageUrl: "",
        logoUrl: "",
        status: "Aktif"
      },
      {
        id: "wilson-felicia-133",
        name: "Wilson & Felicia",
        date: "16 November 2026",
        venue: "UpperHills Convention Hall, Makassar",
        homeUrl: "https://gallery.runway.my.id/?event=wilson-felicia-133",
        driveFolderId: "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
        photoboothUrl: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs",
        customCategories: [{ name: "Photobooth", url: "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", enabled: true, isPhotobooth: true }],
        frameImageUrl: "",
        logoUrl: "",
        status: "Aktif"
      },
      {
        id: "tommy-natasha-594",
        name: "Tommy & Natasha",
        date: "Rabu, 25 November 2026",
        venue: "UpperHills Convention Hall, Makassar",
        homeUrl: "https://gallery.runway.my.id/?event=tommy-natasha-594",
        driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
        photoboothUrl: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
        customCategories: [{ id: "special_photobooth", name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true, isPhotobooth: true }],
        frameImageUrl: "",
        logoUrl: "",
        status: "Aktif"
      }
    ];
  }

  syncEventsToSheet(ss, evList);
  return {
    success: true,
    message: "Seluruh " + evList.length + " event berhasil disinkronkan ke sheet 'Daftar_Acara'!",
    totalEvents: evList.length
  };
}

/**
 * 4f. Alias fungsi populateDaftarAcara untuk kompatibilitas 1-Klik di Apps Script
 */
function populateDaftarAcara() {
  return syncAllEventsToSheet();
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
    EVENT_NAME: (sheetConfig.EVENT_NAME || sheetConfig.COUPLE_NAME || props.EVENT_NAME || props.COUPLE_NAME || WEDDING_CONFIG.EVENT_NAME),
    COUPLE_NAME: (sheetConfig.EVENT_NAME || sheetConfig.COUPLE_NAME || props.EVENT_NAME || props.COUPLE_NAME || WEDDING_CONFIG.EVENT_NAME),
    EVENT_DATE: sheetConfig.EVENT_DATE || props.EVENT_DATE || WEDDING_CONFIG.EVENT_DATE,
    EVENT_VENUE: sheetConfig.EVENT_VENUE || props.EVENT_VENUE || WEDDING_CONFIG.EVENT_VENUE,
    SUBTITLE: sheetConfig.SUBTITLE || props.SUBTITLE || WEDDING_CONFIG.SUBTITLE,
    WELCOME_MESSAGE: sheetConfig.WELCOME_MESSAGE || props.WELCOME_MESSAGE || WEDDING_CONFIG.WELCOME_MESSAGE,
    FOOTER_MESSAGE: sheetConfig.FOOTER_MESSAGE || props.FOOTER_MESSAGE || WEDDING_CONFIG.FOOTER_MESSAGE,
    ALL_PHOTOS_LABEL: sheetConfig.ALL_PHOTOS_LABEL || props.ALL_PHOTOS_LABEL || WEDDING_CONFIG.ALL_PHOTOS_LABEL || "Semua Foto",
    CUSTOM_CATEGORIES: (sheetConfig.CUSTOM_CATEGORIES && sheetConfig.CUSTOM_CATEGORIES !== "[object Object]") ? sheetConfig.CUSTOM_CATEGORIES : ((props.CUSTOM_CATEGORIES && props.CUSTOM_CATEGORIES !== "[object Object]") ? props.CUSTOM_CATEGORIES : WEDDING_CONFIG.CUSTOM_CATEGORIES),
    PHOTOBOOTH_URL: sheetConfig.PHOTOBOOTH_URL || props.PHOTOBOOTH_URL || WEDDING_CONFIG.PHOTOBOOTH_URL || "",
    EVENT_LOGO_URL: sheetConfig.EVENT_LOGO_URL || props.EVENT_LOGO_URL || WEDDING_CONFIG.EVENT_LOGO_URL || "",

    // Multi-Event & Custom Cover
    ACTIVE_EVENT_ID: sheetConfig.ACTIVE_EVENT_ID || props.ACTIVE_EVENT_ID || WEDDING_CONFIG.ACTIVE_EVENT_ID || "",
    EVENTS: (function() {
      var evs = readEventsFromSheet(ss);
      if (evs && evs.length > 0) return JSON.stringify(evs);
      return (sheetConfig.EVENTS && sheetConfig.EVENTS !== "[object Object]") ? sheetConfig.EVENTS : (props.EVENTS || WEDDING_CONFIG.EVENTS);
    })(),
    COVER_SETTINGS: (sheetConfig.COVER_SETTINGS && sheetConfig.COVER_SETTINGS !== "[object Object]") ? sheetConfig.COVER_SETTINGS : (props.COVER_SETTINGS || ""),
    ADMIN_ACCOUNTS: (sheetConfig.ADMIN_ACCOUNTS && sheetConfig.ADMIN_ACCOUNTS !== "[object Object]") ? sheetConfig.ADMIN_ACCOUNTS : (props.ADMIN_ACCOUNTS || WEDDING_CONFIG.ADMIN_ACCOUNTS),

    // Konfigurasi Teknis: Dapat dikelola Admin via Web & Sheets
    DRIVE_FOLDER_ID: sheetConfig.DRIVE_FOLDER_ID || props.DRIVE_FOLDER_ID || WEDDING_CONFIG.DRIVE_FOLDER_ID,
    ADMIN_USERNAME: sheetConfig.ADMIN_USERNAME || props.ADMIN_USERNAME || WEDDING_CONFIG.DEFAULT_ADMIN_USERNAME || "admin",
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
      return getGalleryData(params.eventId || params.event);
    } else if (action === "adminLogin") {
      return adminLogin(params.pin || params, params.username, params.password);
    } else if (action === "getEvents") {
      return getEvents();
    } else if (action === "testAndSyncDriveFolder" || action === "syncDriveFolder") {
      var targetFolder = params.folderId || (params.config && params.config.DRIVE_FOLDER_ID) || params.DRIVE_FOLDER_ID;
      var allLabel = params.allPhotosLabel || (params.config && params.config.ALL_PHOTOS_LABEL) || params.ALL_PHOTOS_LABEL;
      return testAndSyncDriveFolder(params.pin, targetFolder, allLabel);
    } else if (action === "saveAdminSettings") {
      return saveAdminSettings(params.pin, params.config || params);
    } else if (action === "setupDatabase" || action === "setupSpreadsheetDatabase" || action === "setupDemo" || action === "setupDemoSystem" || action === "setupTargetSpreadsheetDatabase" || action === "syncAllDatabaseToSheet" || action === "populateAllDatabase" || action === "syncDaftarFoto") {
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
    } else if (action === "deleteEvent") {
      return deleteEvent(params.pin, params.targetEventId || params.eventId);
    } else if (action === "addEvent") {
      var evData = params.event || params.eventData || params;
      var ssDb = getDatabaseSpreadsheet();
      var added = addEventToSheet(ssDb, evData);
      return { success: added, message: added ? "Event berhasil ditambahkan ke sheet 'Daftar_Acara'!" : "Gagal menambahkan event ke sheet 'Daftar_Acara'." };
    } else if (action === "syncDaftarAcara" || action === "syncEvents" || action === "populateDaftarAcara") {
      return syncAllEventsToSheet();
    } else if (action === "changeAdminPin") {
      return changeAdminPin(params.pin, params.newPin);
    } else if (action === "getFolderPhotos" || action === "getCategoryPhotos") {
      var targetFolder = params.folderId || params.url;
      var catName = params.category || "Kategori";
      return getCategoryDrivePhotos(targetFolder, catName);
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
function getGalleryData(targetEventId) {
  try {
    var config = getEffectiveConfig();

    var ss = getDatabaseSpreadsheet();
    var eventsList = [];
    if (ss) {
      eventsList = readEventsFromSheet(ss);
    }
    if (!Array.isArray(eventsList) || eventsList.length === 0) {
      try {
        eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
      } catch (eEv) {
        eventsList = [];
      }
    }
    if (!Array.isArray(eventsList)) {
      eventsList = [];
    }

    var selectedEventId = targetEventId || config.ACTIVE_EVENT_ID || (eventsList[0] && eventsList[0].id) || "";
    var currentEvent = null;
    for (var evIdx = 0; evIdx < eventsList.length; evIdx++) {
      if (eventsList[evIdx].id === selectedEventId) {
        currentEvent = eventsList[evIdx];
        break;
      }
    }
    if (!currentEvent && eventsList.length > 0) {
      currentEvent = eventsList[0];
      selectedEventId = currentEvent.id;
    }

    var safeConfig = Object.assign({}, config);
    delete safeConfig.ADMIN_PIN;
    delete safeConfig.ADMIN_ACCOUNTS;

    if (currentEvent) {
      safeConfig.ACTIVE_EVENT_ID = currentEvent.id;
      safeConfig.EVENT_NAME = currentEvent.name || safeConfig.EVENT_NAME;
      safeConfig.COUPLE_NAME = currentEvent.name || safeConfig.COUPLE_NAME;
      safeConfig.EVENT_DATE = currentEvent.date || safeConfig.EVENT_DATE;
      safeConfig.EVENT_VENUE = currentEvent.venue || safeConfig.EVENT_VENUE;
      safeConfig.SUBTITLE = currentEvent.subtitle || safeConfig.SUBTITLE;
      safeConfig.WELCOME_MESSAGE = currentEvent.welcomeMessage !== undefined ? currentEvent.welcomeMessage : safeConfig.WELCOME_MESSAGE;
      safeConfig.FOOTER_MESSAGE = currentEvent.footerMessage !== undefined ? currentEvent.footerMessage : safeConfig.FOOTER_MESSAGE;
      safeConfig.ALL_PHOTOS_LABEL = currentEvent.allPhotosLabel || safeConfig.ALL_PHOTOS_LABEL || "Semua Foto";
      safeConfig.DRIVE_FOLDER_ID = currentEvent.driveFolderId || "";
      safeConfig.PHOTOBOOTH_URL = currentEvent.photoboothUrl || "";
      safeConfig.FRAME_IMAGE_URL = currentEvent.frameImageUrl || safeConfig.FRAME_IMAGE_URL;
      safeConfig.EVENT_LOGO_URL = currentEvent.logoUrl || currentEvent.EVENT_LOGO_URL || "";
      safeConfig.logoUrl = safeConfig.EVENT_LOGO_URL;

      // Isolasi Kategori Tiap Event: Gunakan kategori milik event aktif
      if (Array.isArray(currentEvent.customCategories) && currentEvent.customCategories.length > 0) {
        safeConfig.CUSTOM_CATEGORIES = currentEvent.customCategories;
      } else {
        safeConfig.CUSTOM_CATEGORIES = [];
      }

      safeConfig.COVER_SETTINGS = currentEvent.coverSettings || safeConfig.COVER_SETTINGS;
    }
    safeConfig.EVENTS = eventsList;

    var folderId = safeConfig.DRIVE_FOLDER_ID ? String(safeConfig.DRIVE_FOLDER_ID).trim() : "";
    var matchFolder = folderId.match(/folders\/([a-zA-Z0-9_\-]+)/);
    if (matchFolder && matchFolder[1]) folderId = matchFolder[1];

    // Jika folder Google Drive telah diatur, prioritaskan pemindaian langsung dari Google Drive
    if (folderId) {
      var cache = CacheService.getScriptCache();
      var cacheKey = "drive_gallery_" + selectedEventId + "_" + folderId;
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
            totalPhotos: parsed.photos.length,
            events: eventsList,
            activeEventId: selectedEventId
          };
        } catch (eCache) {}
      }

      // Pindai folder Google Drive secara langsung
      var driveScan = scanDriveFolderDirectly(folderId);
      if (driveScan.success) {
        // Pindai folder Google Drive terpisah jika ada di CUSTOM_CATEGORIES
        if (safeConfig.CUSTOM_CATEGORIES) {
          try {
            var rawCats = safeConfig.CUSTOM_CATEGORIES;
            if (typeof rawCats === "string") rawCats = JSON.parse(rawCats);
            if (Array.isArray(rawCats)) {
              for (var cIdx = 0; cIdx < rawCats.length; cIdx++) {
                var cItem = rawCats[cIdx];
                var cName = (cItem && cItem.name) ? String(cItem.name).trim() : "";
                var cUrl = (cItem && cItem.url) ? String(cItem.url).trim() : "";
                if (!cName || !cUrl) continue;
                var cFolderMatch = cUrl.match(/folders\/([a-zA-Z0-9_\-]+)/);
                var cFolderId = (cFolderMatch && cFolderMatch[1]) ? cFolderMatch[1] : (cUrl.indexOf("http") !== 0 && cUrl.length > 20 ? cUrl : "");
                if (cFolderId && cFolderId !== folderId) {
                  var customScan = scanDriveFolderDirectly(cFolderId);
                  if (customScan.success && customScan.photos && customScan.photos.length > 0) {
                    for (var cpIdx = 0; cpIdx < customScan.photos.length; cpIdx++) {
                      var cpPhoto = customScan.photos[cpIdx];
                      cpPhoto.category = cName;
                      cpPhoto.customFolderId = cFolderId;
                      driveScan.photos.push(cpPhoto);
                    }
                    if (driveScan.categories.indexOf(cName) === -1) {
                      driveScan.categories.push(cName);
                    }
                  }
                }
              }
            }
          } catch (eCats) {
            Logger.log("Info scan custom category folders: " + eCats.toString());
          }
        }

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
          totalPhotos: driveScan.photos ? driveScan.photos.length : 0,
          events: eventsList,
          activeEventId: selectedEventId
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
          totalPhotos: 0,
          events: eventsList,
          activeEventId: selectedEventId
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
      totalPhotos: 0,
      events: eventsList,
      activeEventId: selectedEventId
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
 * Mengambil foto dari folder Google Drive atau album Google Photos khusus kategori tertentu
 */
function getCategoryPhotos(urlOrFolderId, categoryName) {
  return getCategoryDrivePhotos(urlOrFolderId, categoryName);
}

function getFolderPhotos(folderId, categoryName) {
  return getCategoryDrivePhotos(folderId, categoryName);
}

/**
 * Mengambil foto dari folder Google Drive, album Google Photos, atau Fotoshare khusus kategori tertentu
 */
function getCategoryDrivePhotos(folderTarget, catName) {
  try {
    var cleanId = String(folderTarget || "").trim();
    if (cleanId.indexOf("photos.google.com") !== -1 || cleanId.indexOf("photos.app.goo.gl") !== -1) {
      return scanGooglePhotosAlbum(cleanId, catName);
    }
    if (cleanId.indexOf("kingphotobooth.co") !== -1 || cleanId.indexOf("kingphoto") !== -1) {
      return scanKingPhotoboothEvent(cleanId, catName);
    }
    if (cleanId.indexOf("fotoshare.co") !== -1) {
      return scanFotoshareAlbum(cleanId, catName);
    }
    var match = cleanId.match(/folders\/([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) cleanId = match[1];

    if (!cleanId) {
      return { success: false, message: "ID Folder Google Drive tidak valid.", photos: [] };
    }

    var scanResult = scanDriveFolderDirectly(cleanId);
    if (scanResult.success && scanResult.photos) {
      var photos = scanResult.photos.map(function(p) {
        p.category = catName;
        p.customFolderId = cleanId;
        return p;
      });
      return {
        success: true,
        category: catName,
        folderId: cleanId,
        photos: photos,
        totalPhotos: photos.length
      };
    } else {
      return { success: false, message: scanResult.message || "Gagal memindai folder", photos: [] };
    }
  } catch (err) {
    return { success: false, error: err.toString(), photos: [] };
  }
}

/**
 * Memindai album bersama Google Photos
 */
function scanGooglePhotosAlbum(albumUrl, catName) {
  try {
    var response = UrlFetchApp.fetch(albumUrl, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (response.getResponseCode() !== 200) {
      return { success: false, message: "Gagal memuat Google Photos album: " + response.getResponseCode(), photos: [] };
    }
    var html = response.getContentText();
    var matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+/g) || [];
    if (matches.length === 0) {
      matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_\-]{30,}/g) || [];
    }
    var seen = {};
    var photos = [];
    var count = 0;
    for (var i = 0; i < matches.length; i++) {
      var base = matches[i];
      if (!seen[base]) {
        seen[base] = true;
        count++;
        photos.push({
          id: "gp_" + count,
          name: (catName || "Photobooth") + " " + count,
          thumbnailUrl: base + "=w500-h500-c",
          previewUrl: base + "=w1600-h1200",
          highResUrl: base + "=w2400-h1800",
          downloadUrl: base + "=d",
          category: catName || "Photobooth",
          isPhotobooth: true
        });
      }
    }
    // Urutkan foto dari yang paling baru di atas
    photos.sort(function(a, b) {
      var tA = a.timestamp || 0;
      var tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });

    return {
      success: true,
      category: catName || "Photobooth",
      photos: photos,
      totalPhotos: photos.length
    };
  } catch (err) {
    return { success: false, error: err.toString(), photos: [] };
  }
}

/**
 * Memindai album / event Fotoshare (https://fotoshare.co/e/...)
 */
function scanFotoshareAlbum(albumUrl, catName) {
  try {
    var response = UrlFetchApp.fetch(albumUrl, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (response.getResponseCode() !== 200) {
      return { success: false, message: "HTTP " + response.getResponseCode(), photos: [] };
    }
    var htmlText = response.getContentText();
    var list = [];
    var sessionMatch = htmlText.match(/let\s+sessionImages\s*=\s*(\{[\s\S]*?\});/);
    if (sessionMatch) {
      try {
        var sessionObj = JSON.parse(sessionMatch[1]);
        var idx = 0;
        for (var sKey in sessionObj) {
          var sess = sessionObj[sKey];
          for (var imgKey in sess) {
            var it = sess[imgKey];
            idx++;
            var fullWebUrl = it.url ? ("https://fotoshare.co" + it.url) : ("https://fotoshare.co/i/" + (it.hash || ""));
            var rawMasterUrl = (it.url_hires || it.highres || it.img || it.url || "").replace(/\?.*$/, "");
            list.push({
              id: it.hash || ("pb_" + idx),
              name: (catName || "Photobooth") + " " + idx,
              category: catName || "Photobooth",
              thumbnailUrl: it.thumb_url || it.img,
              previewUrl: rawMasterUrl,
              highResUrl: rawMasterUrl,
              downloadUrl: rawMasterUrl,
              originalWebUrl: fullWebUrl,
              img: rawMasterUrl,
              isPhotobooth: true
            });
          }
        }
      } catch (eJson) {}
    }
    if (list.length === 0) {
      var regex = /(https:\/\/cdn-bz-op\.fotoshare\.co\/[^\s"'<>]+\.JPG)/gi;
      var m;
      var seen = {};
      var count = 0;
      while ((m = regex.exec(htmlText)) !== null) {
        var u = m[1];
        var cleanU = u.replace(/\?.*$/, "");
        if (!seen[cleanU]) {
          seen[cleanU] = true;
          count++;
          list.push({
            id: "pb_" + count,
            name: (catName || "Photobooth") + " " + count,
            category: catName || "Photobooth",
            thumbnailUrl: cleanU,
            previewUrl: cleanU,
            highResUrl: cleanU,
            downloadUrl: cleanU,
            originalWebUrl: albumUrl,
            img: cleanU,
            isPhotobooth: true
          });
        }
      }
    }
    // Urutkan foto dari yang paling baru di atas
    list.sort(function(a, b) {
      var tA = a.timestamp || 0;
      var tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });

    return {
      success: true,
      category: catName || "Photobooth",
      photos: list,
      totalPhotos: list.length
    };
  } catch (err) {
    return { success: false, error: err.toString(), photos: [] };
  }
}

/**
 * Memindai event Kingphotobooth (mendukung foto & video preview MP4)
 */
function scanKingPhotoboothEvent(eventUrl, catName) {
  try {
    var response = UrlFetchApp.fetch(eventUrl, {
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (response.getResponseCode() !== 200) {
      return { success: false, message: "HTTP " + response.getResponseCode(), photos: [] };
    }
    var html = response.getContentText();
    var match = html.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      return { success: false, message: "ITEMS tidak ditemukan pada halaman vendor", photos: [] };
    }
    var rawItems = JSON.parse(match[1]);
    var origin = "https://x1.kingphotobooth.co";
    var urlMatch = eventUrl.match(/^(https?:\/\/[^\/]+)/);
    if (urlMatch) origin = urlMatch[1];

    var photos = rawItems.map(function(it, idx) {
      var isVideo = Boolean(it.is_video);
      var thumbUrl = it.thumb ? (origin + it.thumb) : "";
      var photoUrl = "";
      var videoUrl = "";
      var downloadUrl = "";

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
        name: isVideo ? ("Video Photobooth #" + (rawItems.length - idx)) : ("Photobooth #" + (rawItems.length - idx)),
        category: catName || "Photobooth",
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

    // Urutkan foto dari yang paling baru di atas
    photos.sort(function(a, b) {
      var tA = a.timestamp || 0;
      var tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });

    return {
      success: true,
      category: catName || "Photobooth",
      photos: photos,
      totalPhotos: photos.length
    };
  } catch (err) {
    return { success: false, error: err.toString(), photos: [] };
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
          downloadUrl: "https://drive.usercontent.google.com/download?id=" + sfId + "&export=download",
          sizeBytes: sf.getSize(),
          timestamp: sfTimestamp
        });
      }
    }
  }

  // Urutkan foto dari yang paling baru diunggah/diperbarui (Newest First)
  scannedPhotos.sort(function(a, b) {
    var diff = (b.timestamp || 0) - (a.timestamp || 0);
    if (diff !== 0) return diff;
    return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
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
  var defaultPin = props.getProperty("ADMIN_PIN") || WEDDING_CONFIG.DEFAULT_ADMIN_PIN || "";

  var users = [];
  if (rawJson) {
    try {
      users = JSON.parse(rawJson);
    } catch (eParse) {}
  }

  // Sinkronkan juga langsung dengan Google Spreadsheet sheet 'Pengguna_Admin' jika ada akun tambahan (seperti ilham, Wanta, dll)
  try {
    var ss = getDatabaseSpreadsheet();
    if (ss) {
      var sheet = ss.getSheetByName("Pengguna_Admin");
      if (sheet && sheet.getLastRow() > 1) {
        var values = sheet.getDataRange().getValues();
        var sheetUsers = [];
        for (var r = 1; r < values.length; r++) {
          var uRow = values[r];
          var uId = String(uRow[0] || "").trim();
          var uUsername = String(uRow[1] || "").trim();
          var uName = String(uRow[2] || uUsername || "").trim();
          var uPin = String(uRow[3] || "").trim();
          var uRole = String(uRow[4] || "Admin").trim();
          var uDate = String(uRow[5] || "").trim();
          if ((uUsername || uName) && uPin) {
            sheetUsers.push({
              id: uId || ("usr_" + r),
              username: uUsername || uName,
              name: uName || uUsername,
              pin: uPin,
              password: uPin,
              role: uRole,
              createdAt: uDate || "2026-11-15 00:00:00"
            });
          }
        }
        if (sheetUsers.length > 0) {
          users = sheetUsers;
          props.setProperty("ADMIN_USERS_JSON", JSON.stringify(users));
        }
      }
    }
  } catch (eSheetUsers) {
    Logger.log("Info load users from sheet: " + eSheetUsers.toString());
  }

  // Jika belum ada daftar user di database, kembalikan array kosong (realtime tanpa dummy)
  if (!users || !Array.isArray(users)) {
    users = [];
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
      var headers = [["ID_User", "Username", "Nama_Pengguna", "PIN", "Peran", "Tanggal_Dibuat"]];
      sheet.clear();
      sheet.getRange(1, 1, 1, 6).setValues(headers)
        .setBackground("#475569")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      var rows = users.map(function(u) {
        return [u.id || "", u.username || u.name || "", u.name || "", u.pin || "", u.role || "Admin", u.createdAt || ""];
      });

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 6).setValues(rows);
      }
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(2, 140);
      sheet.setColumnWidth(3, 180);
      sheet.setColumnWidth(4, 100);
      sheet.setColumnWidth(5, 130);
      sheet.setColumnWidth(6, 170);
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
function getEvents() {
  try {
    var config = getEffectiveConfig();
    var eventsList = [];
    try {
      eventsList = typeof config.EVENTS === "string" ? JSON.parse(config.EVENTS) : (config.EVENTS || []);
    } catch (e) {
      eventsList = [];
    }
    return {
      success: true,
      activeEventId: config.ACTIVE_EVENT_ID || "",
      events: eventsList
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function adminLogin(pin, username, password) {
  try {
    var inputUser = "";
    var inputPass = "";
    var inputPin = "";

    if (typeof pin === "object" && pin !== null) {
      inputUser = String(pin.username || "").trim();
      inputPass = String(pin.password || "").trim();
      inputPin = String(pin.pin || "").trim();
    } else {
      inputPin = String(pin || "").trim();
      inputUser = String(username || "").trim();
      inputPass = String(password || "").trim();
    }

    var users = getAdminUsersList();
    var matchedUser = null;

    // 1. Cek dengan Username & Password (Murni Realtime Database)
    if (inputUser && inputPass) {
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var uName = String(u.username || u.name || "").trim().toLowerCase();
        var uPass = String(u.password || u.pin || "").trim();
        if (uName === inputUser.toLowerCase() && uPass === inputPass) {
          matchedUser = u;
          break;
        }
      }
    }

    // 2. Cek dengan PIN tunggal jika form inputUser tidak diisi
    if (!matchedUser && !inputUser && (inputPin || inputPass)) {
      var checkToken = inputPin || inputPass;
      for (var j = 0; j < users.length; j++) {
        var u2 = users[j];
        if (String(u2.pin).trim() === checkToken || String(u2.password).trim() === checkToken) {
          matchedUser = u2;
          break;
        }
      }
    }

    if (matchedUser) {
      var config = getEffectiveConfig();
      var safeConfig = Object.assign({}, config);
      delete safeConfig.ADMIN_PIN;
      delete safeConfig.ADMIN_ACCOUNTS;

      return {
        success: true,
        message: "Login berhasil! Selamat datang, " + (matchedUser.name || matchedUser.username) + ".",
        user: {
          id: matchedUser.id,
          username: matchedUser.username || "admin",
          name: matchedUser.name || matchedUser.username || "Admin",
          role: matchedUser.role || "Admin"
        },
        config: safeConfig
      };
    } else {
      return {
        success: false,
        message: "Username atau Password yang Anda masukkan tidak sesuai. Silakan coba kembali."
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
 * Menghapus Event Pernikahan Secara Permanen dari Database Spreadsheet & ScriptProperties
 */
function deleteEvent(adminPin, targetEventId) {
  var loginResult = adminLogin(adminPin);
  if (!loginResult.success) {
    return { success: false, message: "Akses ditolak: PIN otorisasi salah." };
  }

  if (!targetEventId || typeof targetEventId !== "string" || !targetEventId.trim()) {
    return { success: false, message: "ID event yang akan dihapus tidak valid." };
  }
  var cleanTargetId = targetEventId.trim();

  var props = PropertiesService.getScriptProperties();
  var ss = getDatabaseSpreadsheet();

  // 1. Baca daftar events saat ini
  var eventsList = [];
  if (ss) {
    eventsList = readEventsFromSheet(ss);
  }
  if (!Array.isArray(eventsList) || eventsList.length === 0) {
    try {
      var rawEvs = props.getProperty("EVENTS") || WEDDING_CONFIG.EVENTS;
      eventsList = typeof rawEvs === "string" ? JSON.parse(rawEvs) : (rawEvs || []);
    } catch (e) {
      eventsList = [];
    }
  }

  if (!Array.isArray(eventsList) || eventsList.length <= 1) {
    return { success: false, message: "Tidak dapat menghapus event karena hanya ada 1 event tersisa dalam sistem." };
  }

  var found = false;
  var targetName = cleanTargetId;
  var remainingEvents = [];

  for (var i = 0; i < eventsList.length; i++) {
    var ev = eventsList[i];
    if (ev && ev.id === cleanTargetId) {
      found = true;
      targetName = ev.name || cleanTargetId;
    } else if (ev && ev.id) {
      remainingEvents.push(ev);
    }
  }

  if (!found) {
    return { success: false, message: "Event dengan ID '" + cleanTargetId + "' tidak ditemukan dalam database." };
  }

  // Tentukan event aktif baru jika event yang dihapus adalah event yang sedang aktif
  var currentActiveId = props.getProperty("ACTIVE_EVENT_ID") || "";
  var newActiveId = currentActiveId;
  if (currentActiveId === cleanTargetId || !remainingEvents.some(function(e) { return e.id === currentActiveId; })) {
    newActiveId = remainingEvents[0].id;
  }

  var updatedEventsJson = JSON.stringify(remainingEvents);

  // 2. Simpan ke ScriptProperties
  props.setProperty("EVENTS", updatedEventsJson);
  props.setProperty("ACTIVE_EVENT_ID", newActiveId);

  // 3. Simpan ke Google Spreadsheet
  if (ss) {
    // A. Update sheet Pengaturan
    writeConfigToSheet(ss, {
      EVENTS: updatedEventsJson,
      ACTIVE_EVENT_ID: newActiveId
    });

    // B. Update sheet Daftar_Acara (ERP Master Table)
    syncEventsToSheet(ss, remainingEvents);

    // C. Hapus baris di sheet Daftar_Foto jika terdapat foto milik event ini
    try {
      var photoSheet = ss.getSheetByName("Daftar_Foto");
      if (photoSheet) {
        var pData = photoSheet.getDataRange().getValues();
        for (var pRow = pData.length - 1; pRow >= 1; pRow--) {
          var rowEventId = String(pData[pRow][0] || "");
          if (rowEventId.indexOf(cleanTargetId) !== -1) {
            photoSheet.deleteRow(pRow + 1);
          }
        }
      }
    } catch (ePDel) {}

    // D. Catat aktivitas admin
    logActivityToSheet(ss, "Hapus Event", "Event '" + targetName + "' (" + cleanTargetId + ") berhasil dihapus secara permanen oleh " + loginResult.user.name, loginResult.user.name);
  }

  // 4. Bersihkan Cache Script
  try {
    var cache = CacheService.getScriptCache();
    cache.remove("drive_gallery_" + cleanTargetId);
  } catch (eCache) {}

  return {
    success: true,
    message: "Event '" + targetName + "' berhasil dihapus secara permanen dari sistem.",
    deletedEventId: cleanTargetId,
    activeEventId: newActiveId,
    events: remainingEvents
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
function testAndSyncDriveFolder(pin, folderId, allPhotosLabel) {
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
    var props = PropertiesService.getScriptProperties();
    props.setProperty("DRIVE_FOLDER_ID", cleanId);

    var sheetPayload = { DRIVE_FOLDER_ID: cleanId };
    if (allPhotosLabel && String(allPhotosLabel).trim()) {
      var cleanLabel = String(allPhotosLabel).trim();
      props.setProperty("ALL_PHOTOS_LABEL", cleanLabel);
      sheetPayload.ALL_PHOTOS_LABEL = cleanLabel;
    }

    // Hapus cache lama agar foto langsung segar dari Drive
    var cache = CacheService.getScriptCache();
    cache.remove("drive_gallery_" + cleanId);

    var ss = getDatabaseSpreadsheet();
    if (ss) {
      writeConfigToSheet(ss, sheetPayload);
      logActivityToSheet(ss, "Tautkan Folder Google Drive", "Folder ID: " + cleanId + (allPhotosLabel ? (" (" + allPhotosLabel + ")") : "") + " ditautkan oleh " + loginResult.user.name, loginResult.user.name);
    }

    var scanResult = scanDriveFolderDirectly(cleanId);
    if (!scanResult.success) {
      return scanResult;
    }

    var updatedGallery = getGalleryData(updatedConfig.ACTIVE_EVENT_ID);
    var targetSs = (typeof ss !== 'undefined' && ss) ? ss : (typeof dbSpreadsheet !== 'undefined' ? dbSpreadsheet : null);
    if (targetSs && updatedGallery && updatedGallery.photos && updatedGallery.photos.length > 0) {
      syncPhotosToSheet(targetSs, updatedGallery.photos);
    }

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

    if (updatedConfig.EVENT_LOGO_URL !== undefined) {
      var cleanLogo = String(updatedConfig.EVENT_LOGO_URL).trim();
      props.setProperty("EVENT_LOGO_URL", cleanLogo);
      try {
        var existingEventsStr = props.getProperty("EVENTS") || WEDDING_CONFIG.EVENTS;
        var existingEvents = JSON.parse(existingEventsStr);
        if (Array.isArray(existingEvents)) {
          var activeEvId = updatedConfig.ACTIVE_EVENT_ID || props.getProperty("ACTIVE_EVENT_ID") || "";
          for (var evI = 0; evI < existingEvents.length; evI++) {
            if (existingEvents[evI].id === activeEvId || existingEvents.length === 1) {
              existingEvents[evI].logoUrl = cleanLogo;
              existingEvents[evI].EVENT_LOGO_URL = cleanLogo;
            }
          }
          var updatedEventsStr = JSON.stringify(existingEvents);
          props.setProperty("EVENTS", updatedEventsStr);
          updatedConfig.EVENTS = updatedEventsStr;
        }
      } catch (eEvLogo) {}
    }

    if (updatedConfig.WELCOME_MESSAGE !== undefined && String(updatedConfig.WELCOME_MESSAGE).trim()) {
      props.setProperty("WELCOME_MESSAGE", String(updatedConfig.WELCOME_MESSAGE).trim());
    }

    if (updatedConfig.FOOTER_MESSAGE !== undefined && String(updatedConfig.FOOTER_MESSAGE).trim()) {
      props.setProperty("FOOTER_MESSAGE", String(updatedConfig.FOOTER_MESSAGE).trim());
    }

    if (updatedConfig.CUSTOM_CATEGORIES !== undefined) {
      var catVal = typeof updatedConfig.CUSTOM_CATEGORIES === "string" 
        ? updatedConfig.CUSTOM_CATEGORIES 
        : JSON.stringify(updatedConfig.CUSTOM_CATEGORIES);
      props.setProperty("CUSTOM_CATEGORIES", catVal);
      updatedConfig.CUSTOM_CATEGORIES = catVal;

      // Sinkronkan juga ke properti event aktif di dalam EVENTS agar tidak kembali ter-reset di device lain
      try {
        var parsedCats = (typeof updatedConfig.CUSTOM_CATEGORIES === "string")
          ? JSON.parse(updatedConfig.CUSTOM_CATEGORIES)
          : updatedConfig.CUSTOM_CATEGORIES;
        var existingEventsStr = props.getProperty("EVENTS") || WEDDING_CONFIG.EVENTS;
        var existingEvents = JSON.parse(existingEventsStr);
        if (Array.isArray(existingEvents)) {
          var activeEvId = updatedConfig.ACTIVE_EVENT_ID || props.getProperty("ACTIVE_EVENT_ID") || "";
          for (var evI = 0; evI < existingEvents.length; evI++) {
            if (existingEvents[evI].id === activeEvId || existingEvents.length === 1) {
              existingEvents[evI].customCategories = parsedCats;
            }
          }
          var updatedEventsStr = JSON.stringify(existingEvents);
          props.setProperty("EVENTS", updatedEventsStr);
          updatedConfig.EVENTS = updatedEventsStr;
        }
      } catch (eEvSync) {
        Logger.log("Info sinkronisasi EVENTS: " + eEvSync.toString());
      }
    }

    if (updatedConfig.PHOTOBOOTH_URL !== undefined) {
      props.setProperty("PHOTOBOOTH_URL", String(updatedConfig.PHOTOBOOTH_URL).trim());
    } else if (updatedConfig.CUSTOM_CATEGORIES) {
      try {
        var checkCats = (typeof updatedConfig.CUSTOM_CATEGORIES === "string")
          ? JSON.parse(updatedConfig.CUSTOM_CATEGORIES)
          : updatedConfig.CUSTOM_CATEGORIES;
        if (Array.isArray(checkCats)) {
          var pbMatch = checkCats.find(function(c) {
            return c && (c.isPhotobooth || c.id === "special_photobooth" || String(c.name || "").toLowerCase().indexOf("photobooth") !== -1);
          });
          if (pbMatch && pbMatch.url) {
            updatedConfig.PHOTOBOOTH_URL = String(pbMatch.url).trim();
            props.setProperty("PHOTOBOOTH_URL", updatedConfig.PHOTOBOOTH_URL);
          }
        }
      } catch (ePb) {}
    }

    if (updatedConfig.ALL_PHOTOS_LABEL !== undefined) {
      props.setProperty("ALL_PHOTOS_LABEL", String(updatedConfig.ALL_PHOTOS_LABEL).trim());
    }

    if (updatedConfig.ACTIVE_EVENT_ID !== undefined) {
      props.setProperty("ACTIVE_EVENT_ID", String(updatedConfig.ACTIVE_EVENT_ID).trim());
    }

    if (updatedConfig.EVENTS !== undefined) {
      var evVal = typeof updatedConfig.EVENTS === "string" ? updatedConfig.EVENTS : JSON.stringify(updatedConfig.EVENTS);
      props.setProperty("EVENTS", evVal);
    }

    if (updatedConfig.COVER_SETTINGS !== undefined) {
      var covVal = typeof updatedConfig.COVER_SETTINGS === "string" ? updatedConfig.COVER_SETTINGS : JSON.stringify(updatedConfig.COVER_SETTINGS);
      props.setProperty("COVER_SETTINGS", covVal);
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

        // Sinkronisasi ERP Master Table ke Sheet 'Daftar_Acara'
        var rawEvs = updatedConfig.EVENTS || props.getProperty("EVENTS");
        if (rawEvs) {
          try {
            var evList = typeof rawEvs === "string" ? JSON.parse(rawEvs) : rawEvs;
            if (Array.isArray(evList) && evList.length > 0) {
              syncEventsToSheet(dbSpreadsheet, evList);
            }
          } catch(eEvSync) {
            Logger.log("Info syncEventsToSheet: " + eEvSync.toString());
          }
        }

        // Jika ada penambahan event tunggal spesifik
        if (updatedConfig.event && updatedConfig.event.id) {
          try {
            addEventToSheet(dbSpreadsheet, updatedConfig.event);
          } catch(eEvSingle) {
            Logger.log("Info addEventToSheet: " + eEvSingle.toString());
          }
        }

        logActivityToSheet(dbSpreadsheet, "Pembaruan Pengaturan", "Admin (" + loginResult.user.name + ") memperbarui data acara via Web Admin", loginResult.user.name);
        SpreadsheetApp.flush();
      }
    } catch (sheetErr) {
      Logger.log("Info write sheet: " + sheetErr.toString());
    }

    var updatedGallery = getGalleryData(updatedConfig.ACTIVE_EVENT_ID);
    var targetSs = (typeof ss !== 'undefined' && ss) ? ss : (typeof dbSpreadsheet !== 'undefined' ? dbSpreadsheet : null);
    if (targetSs && updatedGallery && updatedGallery.photos && updatedGallery.photos.length > 0) {
      syncPhotosToSheet(targetSs, updatedGallery.photos);
    }

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
 * Realtime Photo Provider (Bebas dari hardcoded demo photos)
 */
function getDemoPhotos() {
  return [];
}
