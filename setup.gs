/**
 * ================================================================================
 * SETUP & DIAGNOSTIC UTILITY - WEDDING PANGGUNG (v1.2)
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */

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
  var pin = String(newPin || "123456").trim();
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
 * ================================================================================
 * 6. SETUP MANDIRI SATU KLIK: INISIALISASI DATABASE & DUMMY DATA LENGKAP
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

  // Parameter Konfigurasi Master
  var defaultParams = [
    ["EVENT_NAME", "Andre & Fayola", "Nama Event / Pasangan Pengantin"],
    ["COUPLE_NAME", "Andre & Fayola", "Nama Pasangan Pengantin"],
    ["EVENT_DATE", "22 November 2026", "Tanggal Pelaksanaan Acara"],
    ["EVENT_VENUE", "UPPERHILLS CONVENTION HALLS", "Venue / Lokasi Gedung Acara"],
    ["SUBTITLE", "The Wedding Gallery & Precious Memories", "Subjudul Galeri Foto"],
    ["WELCOME_MESSAGE", "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.", "Pesan Sambutan Hangat untuk Tamu"],
    ["FOOTER_MESSAGE", "Diabadikan dengan cinta\nTerima kasih atas doa restunya.", "Pesan Penutup Footer Galeri"],
    ["ALL_PHOTOS_LABEL", "Semua Foto", "Label Tab Galeri Utama"],
    ["ACTIVE_EVENT_ID", "andre-fayola-281", "ID Event Aktif"],
    ["ADMIN_USERNAME", "admin", "Nama Pengguna (Username) Akses Masuk Panel Admin Web"],
    ["ADMIN_PIN", "123456", "PIN Akses Masuk Panel Admin Web"],
    ["SLIDESHOW_INTERVAL_SEC", "4", "Durasi Perpindahan Foto Slideshow (detik)"],
    ["AUTO_REFRESH_INTERVAL_SEC", "25", "Interval Live Auto-Sync Foto (detik)"],
    ["NEW_BADGE_MINUTES", "10", "Durasi Lencana '✨ Baru' Aktif (menit)"],
    ["SPREADSHEET_ID", targetId, "ID File Google Spreadsheet Database Aktif"],
    ["SPREADSHEET_URL", "https://docs.google.com/spreadsheets/d/" + targetId + "/edit", "Tautan Langsung Google Spreadsheet Database"],
    ["GAS_API_URL", "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec", "Tautan Endpoint Google Apps Script Web App"],
    ["DRIVE_FOLDER_ID", "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5", "ID Folder Google Drive Galeri Utama"],
    ["DRIVE_FOLDER_URL", "https://drive.google.com/drive/folders/1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5", "Tautan Folder Google Drive Galeri Utama"],
    ["FRAME_IMAGE_URL", "https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk", "Tautan File Bingkai PNG Transparan Saat Download"],
    ["PHOTOBOOTH_URL", "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs", "Tautan Vendor Kategori Spesial Photobooth"],
    ["WEDDING_FOLDER_URL", "https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI", "Tautan Folder Google Drive Kategori Wedding Panggung"],
    ["CUSTOM_CATEGORIES", '[{"name":"Photobooth","url":"https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs","enabled":true},{"name":"Wedding","url":"https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI","enabled":true}]', "Daftar Kategori Kustom & Tautan Tampilan"],
    ["EVENTS", '[{"id":"andre-fayola-281","name":"Andre & Fayola","date":"22 November 2026","venue":"UPPERHILLS CONVENTION HALLS","subtitle":"The Wedding Gallery & Precious Memories","welcomeMessage":"Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.","footerMessage":"Diabadikan dengan cinta\\nTerima kasih atas doa restunya.","allPhotosLabel":"Semua Foto","driveFolderId":"1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5","frameImageUrl":"https://drive.google.com/file/d/1NlfwT5wYk-Bt1eBIPA0e3_JJ4hJnnguj/view?usp=drivesdk","customCategories":[{"name":"Photobooth","url":"https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs","enabled":true},{"name":"Wedding","url":"https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI","enabled":true}],"coverSettings":{"enabled":false}}]', "Registry Multi-Event Sistem"],
    ["COVER_SETTINGS", '{"enabled":false}', "Pengaturan Cover Halaman Depan"],
    ["ADMIN_ACCOUNTS_INFO", "usr_superadmin (admin), usr_mwid2vkz_759 (ilham), usr_mwii1zmz_598 (Wanta)", "Daftar ID & Username Admin Terdaftar"]
  ];

  // Bersihkan baris lama jika ada lalu tulis ulang baris pengaturan
  var lastSettingsRow = sheetSettings.getLastRow();
  if (lastSettingsRow > 1) {
    sheetSettings.getRange(2, 1, lastSettingsRow - 1, 3).clearContent();
  }
  sheetSettings.getRange(2, 1, defaultParams.length, 3).setValues(defaultParams);
  sheetSettings.setColumnWidth(1, 240);
  sheetSettings.setColumnWidth(2, 380);
  sheetSettings.setColumnWidth(3, 300);
  Logger.log("✅ Sheet 'Pengaturan' berhasil disiapkan dengan " + defaultParams.length + " parameter.");

  // --------------------------------------------------------------------------
  // B. SHEET 2: Pengguna_Admin (Multi-User Admin Lengkap dengan ID & Username)
  // --------------------------------------------------------------------------
  var sheetUsers = ss.getSheetByName("Pengguna_Admin");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("Pengguna_Admin", 1);
  }
  var userHeaders = [["ID_User", "Username", "Nama_Pengguna", "PIN", "Peran", "Tanggal_Dibuat"]];
  sheetUsers.clear();
  sheetUsers.getRange(1, 1, 1, 6).setValues(userHeaders)
    .setBackground("#475569")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetUsers.setFrozenRows(1);

  var initialUsers = [
    ["usr_superadmin", "admin", "Super Admin", "111111", "Super Admin", "2026-11-15 00:00:00"],
    ["usr_mwid2vkz_759", "ilham", "ilham", "121212", "Admin", "2026-11-16 05:43:25"],
    ["usr_mwii1zmz_598", "Wanta", "Wanta", "888888", "Admin", "2026-11-16 08:02:41"]
  ];
  sheetUsers.getRange(2, 1, initialUsers.length, 6).setValues(initialUsers);
  sheetUsers.setColumnWidth(1, 160);
  sheetUsers.setColumnWidth(2, 140);
  sheetUsers.setColumnWidth(3, 180);
  sheetUsers.setColumnWidth(4, 100);
  sheetUsers.setColumnWidth(5, 130);
  sheetUsers.setColumnWidth(6, 170);
  Logger.log("✅ Sheet 'Pengguna_Admin' berhasil disiapkan dengan 3 admin terdaftar.");

  // --------------------------------------------------------------------------
  
    // B2. SHEET: Daftar_Acara (Registry Multi-Event Sistem)
    var sheetEvents = ss.getSheetByName("Daftar_Acara");
    if (!sheetEvents) {
      sheetEvents = ss.insertSheet("Daftar_Acara", 1);
    }
    var eventHeaders = [["ID_Event", "Nama_Acara", "Tanggal_Acara", "Venue_Lokasi", "Tautan_Home_Event", "Google_Drive_Folder_ID", "Photobooth_Vendor_URL", "Kategori_JSON", "Bingkai_URL", "Status"]];
    sheetEvents.clear();
    sheetEvents.getRange(1, 1, 1, 10).setValues(eventHeaders)
      .setBackground("#C5A880")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetEvents.setFrozenRows(1);

    var initialEvents = [
      [
        "andre-fayola-281",
        "Andre & Fayola",
        "22 November 2026",
        "UPPERHILLS CONVENTION HALLS",
        "https://gallery.runway.my.id/?event=andre-fayola-281",
        "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5",
        "https://photos.app.goo.gl/QkqewYw4dWfocxfK8",
        '[{"name":"Photobooth","url":"https://photos.app.goo.gl/QkqewYw4dWfocxfK8","enabled":true,"isPhotobooth":true},{"name":"Wedding","url":"https://drive.google.com/drive/folders/1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI","enabled":true}]',
        "",
        "Aktif"
      ]
    ];
    sheetEvents.getRange(2, 1, initialEvents.length, 10).setValues(initialEvents);
    sheetEvents.setColumnWidth(1, 180);
    sheetEvents.setColumnWidth(2, 220);
    sheetEvents.setColumnWidth(3, 160);
    sheetEvents.setColumnWidth(4, 250);
    sheetEvents.setColumnWidth(5, 320);
    sheetEvents.setColumnWidth(6, 260);
    sheetEvents.setColumnWidth(7, 300);
    sheetEvents.setColumnWidth(8, 300);
    sheetEvents.setColumnWidth(9, 260);
    sheetEvents.setColumnWidth(10, 100);
    Logger.log("✅ Sheet 'Daftar_Acara' berhasil disiapkan dengan format kolom multi-event.");

    // C. SHEET 3: Daftar_Foto (Postingan Foto Aktual dari Google Drive Database)
  // --------------------------------------------------------------------------
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");
  if (!sheetPhotos) {
    sheetPhotos = ss.insertSheet("Daftar_Foto", 2);
  }
  var photoHeaders = [["ID_Foto", "Nama_File", "Kategori", "URL_Thumbnail", "URL_Download", "Ukuran_Bytes", "Waktu_Upload", "Status"]];
  sheetPhotos.clear();
  sheetPhotos.getRange(1, 1, 1, 8).setValues(photoHeaders)
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetPhotos.setFrozenRows(1);

  var photoRows = [];
  try {
    // 1. Pindai berkas dari Folder Utama Google Drive
    var mainFolderId = "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5";
    if (typeof DriveApp !== 'undefined') {
      try {
        var mFolder = DriveApp.getFolderById(mainFolderId);
        var mFiles = mFolder.getFiles();
        while (mFiles.hasNext()) {
          var f = mFiles.next();
          if (f.getSize() >= 20480 && f.getMimeType().indexOf('image/') === 0) {
            var fId = f.getId();
            photoRows.push([
              fId,
              f.getName(),
              "Semua Foto",
              "https://drive.google.com/thumbnail?id=" + fId + "&sz=w1000",
              "https://drive.google.com/uc?export=download&id=" + fId,
              f.getSize(),
              Utilities.formatDate(f.getDateCreated(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
              "Aktif"
            ]);
          }
        }
      } catch (errMainScan) {
        Logger.log("Info scan main folder: " + errMainScan.toString());
      }

      // 2. Pindai berkas dari Folder Kategori Wedding Panggung
      var weddingFolderId = "1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI";
      try {
        var wFolder = DriveApp.getFolderById(weddingFolderId);
        var wFiles = wFolder.getFiles();
        while (wFiles.hasNext()) {
          var wf = wFiles.next();
          if (wf.getSize() >= 20480 && wf.getMimeType().indexOf('image/') === 0) {
            var wfId = wf.getId();
            photoRows.push([
              wfId,
              wf.getName(),
              "Wedding",
              "https://drive.google.com/thumbnail?id=" + wfId + "&sz=w1000",
              "https://drive.google.com/uc?export=download&id=" + wfId,
              wf.getSize(),
              Utilities.formatDate(wf.getDateCreated(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
              "Aktif"
            ]);
          }
        }
      } catch (errWedScan) {
        Logger.log("Info scan wedding folder: " + errWedScan.toString());
      }
    }
  } catch (eDrive) {
    Logger.log("Drive scan error: " + eDrive.toString());
  }

  if (photoRows.length > 0) {
    sheetPhotos.getRange(2, 1, photoRows.length, 8).setValues(photoRows);
    Logger.log("✅ Sheet 'Daftar_Foto' berhasil diisi dengan " + photoRows.length + " postingan foto Google Drive.");
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
    totalPhotos: photoRows.length
  };
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
