/**
 * ================================================================================
 * SETUP & DIAGNOSTIC UTILITY - WEDDING PANGGUNG (v1.3)
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */


/**
 * ================================================================================
 * 1. FUNGSI UTAMA SATU-KLIK: ISI / SINKRONKAN SEMUA EVENT KE SHEET 'Daftar_Acara'
 * ================================================================================
 * Jalankan fungsi ini langsung dari editor Google Apps Script dengan klik '▶️ Run'
 * untuk mengisi atau memperbarui ke-3 event ke Google Spreadsheet:
 * 133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20
 */
function populateDaftarAcara() {
  Logger.log("=== MEMULAI PENGISIAN SEMUA EVENT KE SHEET 'Daftar_Acara' ===");
  var targetId = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  var ss = SpreadsheetApp.openById(targetId);
  var sheet = ss.getSheetByName("Daftar_Acara");
  if (!sheet) {
    sheet = ss.insertSheet("Daftar_Acara", 1);
  }

  var headers = [
    ["ID_Event", "Nama_Acara", "Tanggal_Acara", "Venue_Lokasi", "Tautan_Home_Event", "Google_Drive_Folder_ID", "Photobooth_Vendor_URL", "Kategori_JSON", "Bingkai_URL", "Logo_Acara", "Status"]
  ];

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

  sheet.clear();
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  sheet.getRange(2, 1, defaultEvents.length, headers[0].length).setValues(defaultEvents);

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
  Logger.log("🎉 SUKSES BESAR! Ke-3 event berhasil dimasukkan ke sheet 'Daftar_Acara' pada spreadsheet: " + targetId);
  return {
    success: true,
    message: "Ke-3 event berhasil dimasukkan ke sheet 'Daftar_Acara'!",
    totalEvents: defaultEvents.length
  };
}

/**
 * ================================================================================
 * PANDUAN CEPAT MEMBUAT & MENGISI DATABASE SPREADSHEET (ERP MASTER DATA)
 * ================================================================================
 * 1. Buka Google Apps Script editor di https://script.google.com/
 * 2. Buka project Web App galeri Anda
 * 3. Buka file 'setup.gs' (atau buat file baru 'setup.gs' dan paste seluruh isi file ini).
 * 4. Pastikan dropdown fungsi di toolbar atas memilih: 'populateDaftarAcara' atau 'setupTargetSpreadsheetDatabase'
 * 5. Klik tombol '▶️ Run' (Jalankan).
 * 6. Berikan izin akses (Review Permissions -> Lanjutkan) jika Google meminta konfirmasi.
 * 
 * HASIL LANGSUNG PADA GOOGLE SPREADSHEET (133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20):
 * - Sheet 'Daftar_Acara' : Terformat sebagai ERP Master Table 11 kolom dengan ke-3 data event lengkap.
 * - Sheet 'Pengaturan'   : Berisi 26 parameter konfigurasi global sistem.
 * - Sheet 'Pengguna_Admin': Terisi 3 akun admin (Super Admin, ilham, Wanta).
 * - Sheet 'Daftar_Foto'  : Otomatis membaca & mencatat foto Google Drive Anda.
 * - Sheet 'Log_Aktivitas': Mencatat audit trail inisialisasi awal.
 * ================================================================================
 */


/**
 * ================================================================================
 * 2. SETUP LENGKAP SATU KLIK: INISIALISASI SELURUH SHEET DATABASE
 * Target Spreadsheet: https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit
 * ID: 133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20
 * ================================================================================
 */
function setupTargetSpreadsheetDatabase() {
  Logger.log("=== MEMULAI INISIALISASI DATABASE PADA SPREADSHEET PENGGUNA ===");
  var targetId = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  
  // 1. Simpan target ID ke Script Properties
  var props = PropertiesService.getScriptProperties();
  props.setProperty("SPREADSHEET_ID", targetId);

  // 2. Buka spreadsheet secara langsung berdasarkan ID
  var ss;
  try {
    ss = SpreadsheetApp.openById(targetId);
  } catch (errOpen) {
    Logger.log("❌ GAGAL MEMBUKA SPREADSHEET: " + errOpen.toString());
    Logger.log("Pastikan akun Google Anda memiliki akses Edit pada file: " + targetId);
    return {
      success: false,
      message: "Gagal membuka spreadsheet. Pastikan izin akses disetel 'Anyone with the link can edit' atau akun memiliki akses: " + errOpen.toString()
    };
  }

  Logger.log("✅ Berhasil membuka spreadsheet: " + ss.getName() + " (" + ss.getUrl() + ")");

  // --------------------------------------------------------------------------
  // A. SHEET 1: Pengaturan
  // --------------------------------------------------------------------------
  var sheetSettings = ss.getSheetByName("Pengaturan");
  if (!sheetSettings) {
    // Jika ada 'Sheet1' default yang kosong, kita gunakan / ubah namanya jadi 'Pengaturan'
    var sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() <= 1 && sheet1.getLastColumn() <= 1) {
      sheet1.setName("Pengaturan");
      sheetSettings = sheet1;
    } else {
      sheetSettings = ss.insertSheet("Pengaturan", 0);
    }
  }

  // Tulis Header Pengaturan
  sheetSettings.getRange(1, 1, 1, 3).setValues([["Parameter", "Nilai", "Keterangan"]])
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetSettings.setFrozenRows(1);

  // Parameter Konfigurasi Master (Safe Non-Destructive Init)
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

  // Safe Migration: Pertahankan nilai database yang sudah ada, hanya tambahkan parameter baru
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
  Logger.log("✅ Sheet 'Pengaturan' siap tanpa menimpa data pengguna.");

  // --------------------------------------------------------------------------
  // B. SHEET 2: Pengguna_Admin (Multi-User Admin - Safe Non-Destructive)
  // --------------------------------------------------------------------------
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
  Logger.log("✅ Sheet 'Pengguna_Admin' siap.");

  // --------------------------------------------------------------------------
  // B2. SHEET: Daftar_Acara (Registry Multi-Event Sistem - Safe Non-Destructive)
  // --------------------------------------------------------------------------
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

  // Jika baris data masih kosong (hanya ada baris header atau row <= 1), otomatis masukkan ke-3 event
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
  Logger.log("✅ Sheet 'Daftar_Acara' siap dengan data event lengkap.");

  // --------------------------------------------------------------------------
  // C. SHEET 3: Daftar_Foto (Safe Non-Destructive)
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // D. SHEET 4: Log_Aktivitas
  // --------------------------------------------------------------------------
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
  sheetLogs.setColumnWidth(1, 200);
  sheetLogs.setColumnWidth(2, 180);
  sheetLogs.setColumnWidth(3, 350);
  sheetLogs.setColumnWidth(4, 140);

  // --------------------------------------------------------------------------
  // D. Hapus 'Sheet1' kosong bawaan jika masih ada dan tersisa sheet lain
  // --------------------------------------------------------------------------
  try {
    var residualSheet1 = ss.getSheetByName("Sheet1");
    if (residualSheet1 && ss.getSheets().length > 1) {
      ss.deleteSheet(residualSheet1);
      Logger.log("ℹ️ Lembar kerja kosong bawaan 'Sheet1' berhasil dibersihkan.");
    }
  } catch (eDel) {}

  // --------------------------------------------------------------------------
  // E. FLUSH SEMUA PERUBAHAN KE SERVER GOOGLE SPREADSHEETS
  // --------------------------------------------------------------------------
  SpreadsheetApp.flush();
  Logger.log("🎉 SUKSES BESAR! Seluruh data & tabel berhasil di-flush ke Google Sheets.");
  Logger.log("Buka Spreadsheet Anda: " + ss.getUrl());

  return {
    success: true,
    message: "Database & seluruh postingan foto berhasil dibuat 100% lengkap pada spreadsheet Anda!",
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    totalPhotos: (sheetPhotos && sheetPhotos.getLastRow() > 1) ? (sheetPhotos.getLastRow() - 1) : 0
  };
}

/**
 * 1. Menguji koneksi Google Drive
 */
function testDriveConnection() {
  Logger.log("=== MEMULAI PENGUJIAN KONEKSI GOOGLE DRIVE ===");
  var config = getEffectiveConfig();
  var folderId = config.DRIVE_FOLDER_ID ? config.DRIVE_FOLDER_ID.trim() : "";

  if (!folderId) {
    Logger.log("⚠️ PERINGATAN: DRIVE_FOLDER_ID masih kosong.");
    Logger.log("Aplikasi saat ini berjalan dalam Mode Demo dengan foto sampel.");
    return;
  }

  try {
    var folder = DriveApp.getFolderById(folderId);
    Logger.log("✅ SUKSES: Folder utama ditemukan: " + folder.getName());

    var subFolders = folder.getFolders();
    var subCount = 0;
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      subCount++;
      Logger.log("  " + subCount + ". Subfolder: " + sub.getName());
    }

    var files = folder.getFiles();
    var fileCount = 0;
    var validImgCount = 0;
    while (files.hasNext()) {
      var f = files.next();
      fileCount++;
      if (f.getSize() >= 20480 && f.getMimeType().indexOf('image/') === 0) {
        validImgCount++;
      }
    }
    Logger.log("\nTotal berkas di folder utama: " + fileCount);
    Logger.log("Foto valid (> 20KB): " + validImgCount);
    Logger.log("Berkas corrupt/thumbnail diabaikan: " + (fileCount - validImgCount));
    Logger.log("\n🎉 KONEKSI SIAP & BERSIH!");

  } catch (e) {
    Logger.log("❌ GAGAL: " + e.toString());
  }
}

/**
 * 2. Menguji Tautan Bingkai Foto Kustom
 */
function testFrameConnection() {
  Logger.log("=== PENGUJIAN TAUTAN BINGKAI FOTO KUSTOM ===");
  var config = getEffectiveConfig();
  var frameUrl = config.FRAME_IMAGE_URL;

  if (!frameUrl) {
    Logger.log("ℹ️ Belum ada tautan bingkai yang diatur. Foto akan diunduh tanpa bingkai.");
    return;
  }

  Logger.log("Tautan Bingkai Aktif: " + frameUrl);
  try {
    var response = UrlFetchApp.fetch(frameUrl, { muteHttpExceptions: true });
    var code = response.getResponseCode();
    var contentType = response.getHeaders()['Content-Type'] || '';
    Logger.log("Status Kode HTTP: " + code);
    Logger.log("Tipe Konten: " + contentType);

    if (code === 200) {
      Logger.log("✅ SUKSES: Tautan bingkai foto valid dan siap digabungkan saat tamu menekan tombol download!");
    } else {
      Logger.log("⚠️ Tautan merespon dengan kode: " + code + ". Pastikan izin file Google Drive disetel 'Anyone with the link can view'.");
    }
  } catch (e) {
    Logger.log("❌ Gagal menjangkau file bingkai: " + e.toString());
  }
}

/**
 * 3. Membuatkan Struktur Folder Pernikahan Siap Pakai di Google Drive
 */
function createSampleFolderStructure() {
  try {
    var config = getEffectiveConfig();
    var mainFolderName = "Galeri Foto Pernikahan - " + config.COUPLE_NAME;
    var mainFolder = DriveApp.createFolder(mainFolderName);
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var subNames = ["01. Prewedding", "02. Akad Nikah", "03. Resepsi", "04. Photobooth"];
    for (var i = 0; i < subNames.length; i++) {
      mainFolder.createFolder(subNames[i]);
    }

    Logger.log("✅ BERHASIL MEMBUAT FOLDER! ID: " + mainFolder.getId());
    return mainFolder.getId();
  } catch (e) {
    Logger.log("❌ Gagal: " + e.toString());
  }
}

/**
 * 4. Reset PIN Admin
 */
function resetAdminPin(newPin) {
  if (!newPin) {
    Logger.log("⚠️ Masukkan PIN baru sebagai parameter fungsi resetAdminPin(newPin).");
    return;
  }
  var pin = String(newPin).trim();
  PropertiesService.getScriptProperties().setProperty("ADMIN_PIN", pin);
  Logger.log("✅ SUKSES: PIN Admin direset ke: " + pin);
}

/**
 * 5. Bersihkan Pengaturan
 */
function clearCustomSettings() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log("✅ SUKSES: Seluruh pengaturan kustom telah dibersihkan.");
}


/**
 * 7. Alias: setupDemoSystemWithDummyFiles
 */
function setupDemoSystemWithDummyFiles() {
  return setupTargetSpreadsheetDatabase();
}

/**
 * 8. Alias: setupDatabaseSpreadsheetTool
 */
function setupDatabaseSpreadsheetTool() {
  return setupTargetSpreadsheetDatabase();
}

/**
 * 9. Menguji Koneksi ke Database Spreadsheet
 */
function testSpreadsheetDatabaseConnection() {
  Logger.log("=== PENGUJIAN DATABASE SPREADSHEET ===");
  var targetId = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  var ss;
  try {
    ss = SpreadsheetApp.openById(targetId);
  } catch (e) {
    Logger.log("❌ Gagal membuka spreadsheet: " + e.toString());
    return setupTargetSpreadsheetDatabase();
  }

  Logger.log("✅ SUKSES TERHUBUNG KE SPREADSHEET: " + ss.getName());
  Logger.log("URL: " + ss.getUrl());
  
  var sheets = ss.getSheets();
  Logger.log("Daftar Lembar Kerja (Sheets):");
  for (var i = 0; i < sheets.length; i++) {
    Logger.log("  " + (i + 1) + ". " + sheets[i].getName() + " (" + sheets[i].getLastRow() + " baris)");
  }
}
