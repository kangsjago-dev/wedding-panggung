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
    ["EVENT_NAME", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.EVENT_NAME) ? WEDDING_CONFIG.EVENT_NAME : "The Wedding of Romeo & Juliet", "Nama Event / Pasangan Pengantin"],
    ["EVENT_DATE", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.EVENT_DATE) ? WEDDING_CONFIG.EVENT_DATE : "15 November 2026", "Tanggal Pelaksanaan Acara"],
    ["EVENT_VENUE", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.EVENT_VENUE) ? WEDDING_CONFIG.EVENT_VENUE : "Grand Ballroom, Jakarta", "Venue / Lokasi Gedung Acara"],
    ["SUBTITLE", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.SUBTITLE) ? WEDDING_CONFIG.SUBTITLE : "The Wedding Gallery & Precious Memories", "Subjudul Galeri Foto"],
    ["WELCOME_MESSAGE", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.WELCOME_MESSAGE) ? WEDDING_CONFIG.WELCOME_MESSAGE : "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.", "Pesan Sambutan Hangat untuk Tamu"],
    ["DRIVE_FOLDER_ID", "", "ID / Tautan Folder Google Drive (Opsional / Tidak Wajib)"],
    ["FRAME_IMAGE_URL", "", "Tautan / ID File Bingkai PNG Transparan Saat Download"],
    ["ADMIN_PIN", (typeof WEDDING_CONFIG !== 'undefined' && WEDDING_CONFIG.DEFAULT_ADMIN_PIN) ? WEDDING_CONFIG.DEFAULT_ADMIN_PIN : "123456", "PIN Akses Masuk Panel Admin Web"],
    ["SLIDESHOW_INTERVAL_SEC", "4", "Durasi Perpindahan Foto Slideshow (detik)"],
    ["AUTO_REFRESH_INTERVAL_SEC", "25", "Interval Live Auto-Sync Foto (detik)"],
    ["NEW_BADGE_MINUTES", "10", "Durasi Lencana '✨ Baru' Aktif (menit)"],
    ["SPREADSHEET_ID", targetId, "ID File Google Spreadsheet Database Aktif"]
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
  // B. SHEET 2: Daftar_Foto (Lengkap dengan Dummy Photos)
  // --------------------------------------------------------------------------
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");
  if (!sheetPhotos) {
    sheetPhotos = ss.insertSheet("Daftar_Foto", 1);
  }

  // Tulis Header Daftar_Foto
  var photoHeaders = [["ID_Foto", "Nama_Foto", "Kategori", "URL_Foto", "URL_Download", "Ukuran_Bytes", "Waktu_Upload", "Status"]];
  sheetPhotos.getRange(1, 1, 1, 8).setValues(photoHeaders)
    .setBackground("#C5A880")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetPhotos.setFrozenRows(1);

  // Koleksi Foto Dummy Pernikahan Berkualitas Tinggi
  var dummyPhotos = [
    [
      "foto_pw_01",
      "Tatapan Penuh Bahagia",
      "Prewedding",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=100",
      1542000,
      Utilities.formatDate(new Date(Date.now() - 3600000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_pw_02",
      "Senja Berdua di Tepi Pantai",
      "Prewedding",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=100",
      1823000,
      Utilities.formatDate(new Date(Date.now() - 3000000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_an_01",
      "Momen Ijab Kabul Penuh Khidmat",
      "Akad Nikah",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2400&q=100",
      2150000,
      Utilities.formatDate(new Date(Date.now() - 2400000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_an_02",
      "Pemasangan Cincin Pernikahan",
      "Akad Nikah",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=2400&q=100",
      1980000,
      Utilities.formatDate(new Date(Date.now() - 1800000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_rs_01",
      "Lempar Bunga & Tawa Bahagia",
      "Resepsi",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2400&q=100",
      2310000,
      Utilities.formatDate(new Date(Date.now() - 1200000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_rs_02",
      "Momen Dansa & Suasana Romantis",
      "Resepsi",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2400&q=100",
      1740000,
      Utilities.formatDate(new Date(Date.now() - 600000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_pb_01",
      "Pose Ceria Tamu & Sahabat",
      "Photobooth",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=2400&q=100",
      1650000,
      Utilities.formatDate(new Date(Date.now() - 120000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ],
    [
      "foto_pb_02",
      "Keluarga Besar & Sahabat Tercinta",
      "Photobooth",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2400&q=100",
      1910000,
      Utilities.formatDate(new Date(Date.now() - 30000), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      "Aktif"
    ]
  ];

  // Bersihkan baris lama jika ada lalu isi foto dummy
  var lastPhotoRow = sheetPhotos.getLastRow();
  if (lastPhotoRow > 1) {
    sheetPhotos.getRange(2, 1, lastPhotoRow - 1, 8).clearContent();
  }
  sheetPhotos.getRange(2, 1, dummyPhotos.length, 8).setValues(dummyPhotos);
  sheetPhotos.setColumnWidth(1, 130);
  sheetPhotos.setColumnWidth(2, 240);
  sheetPhotos.setColumnWidth(3, 140);
  sheetPhotos.setColumnWidth(4, 280);
  sheetPhotos.setColumnWidth(5, 280);
  sheetPhotos.setColumnWidth(6, 120);
  sheetPhotos.setColumnWidth(7, 180);
  sheetPhotos.setColumnWidth(8, 100);
  Logger.log("✅ Sheet 'Daftar_Foto' berhasil diisi dengan " + dummyPhotos.length + " foto pernikahan demo.");

  // --------------------------------------------------------------------------
  // C. SHEET 3: Log_Aktivitas
  // --------------------------------------------------------------------------
  var sheetLogs = ss.getSheetByName("Log_Aktivitas");
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet("Log_Aktivitas", 2);
  }
  var logHeaders = [["Timestamp", "Aksi", "Detail", "Pengguna"]];
  sheetLogs.getRange(1, 1, 1, 4).setValues(logHeaders)
    .setBackground("#64748B")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheetLogs.setFrozenRows(1);

  var nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  sheetLogs.appendRow([nowStr, "Inisialisasi Database", "Database spreadsheet pengguna & foto dummy berhasil dibuat lengkap", "ZettBOT Setup"]);
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
    message: "Database & foto dummy berhasil dibuat 100% lengkap pada spreadsheet Anda!",
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    totalPhotos: dummyPhotos.length
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
