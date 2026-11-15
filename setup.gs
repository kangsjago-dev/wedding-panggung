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
 * 6. Setup Mandiri Satu Klik: Mempersiapkan Seluruh Database pada Berkas Google Spreadsheet Pengguna
 * ID: 133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20
 * URL: https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/edit
 */
function setupTargetSpreadsheetDatabase() {
  Logger.log("=== MEMULAI SETUP SPREADSHEET DATABASE PENGGUNA ===");
  var targetId = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  
  var props = PropertiesService.getScriptProperties();
  props.setProperty("SPREADSHEET_ID", targetId);

  var res = setupDatabaseSpreadsheet(targetId);
  var ss;
  try {
    ss = SpreadsheetApp.openById(targetId);
  } catch (eOpen) {
    Logger.log("❌ Gagal membuka spreadsheet dengan ID: " + targetId + " -> " + eOpen.toString());
    return { success: false, message: "Gagal membuka file spreadsheet. Pastikan izin akses disetel 'Anyone with the link can edit' atau akun memiliki akses." };
  }

  // Tulis parameter konfigurasi acara ke Sheet Pengaturan
  writeConfigToSheet(ss, {
    EVENT_NAME: WEDDING_CONFIG.EVENT_NAME,
    EVENT_DATE: WEDDING_CONFIG.EVENT_DATE,
    EVENT_VENUE: WEDDING_CONFIG.EVENT_VENUE,
    SUBTITLE: WEDDING_CONFIG.SUBTITLE,
    WELCOME_MESSAGE: WEDDING_CONFIG.WELCOME_MESSAGE,
    SLIDESHOW_INTERVAL_SEC: WEDDING_CONFIG.SLIDESHOW_INTERVAL_SEC,
    AUTO_REFRESH_INTERVAL_SEC: WEDDING_CONFIG.AUTO_REFRESH_INTERVAL_SEC,
    FRAME_IMAGE_URL: WEDDING_CONFIG.FRAME_IMAGE_URL,
    ADMIN_PIN: WEDDING_CONFIG.DEFAULT_ADMIN_PIN,
    SPREADSHEET_ID: targetId
  });
  Logger.log("✅ 1. Konfigurasi acara berhasil disimpan ke Sheet 'Pengaturan'.");

  // Isi Sheet Daftar_Foto jika masih kosong
  var sheetPhotos = ss.getSheetByName("Daftar_Foto");
  if (sheetPhotos && sheetPhotos.getLastRow() <= 1) {
    var dummyPhotos = [
      {
        id: "demo_pw_1",
        name: "Prewedding - Tatapan Bahagia",
        category: "Prewedding",
        thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1542000,
        timestamp: Date.now() - 3600000
      },
      {
        id: "demo_pw_2",
        name: "Prewedding - Senja Berdua",
        category: "Prewedding",
        thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1823000,
        timestamp: Date.now() - 3000000
      },
      {
        id: "demo_an_1",
        name: "Akad Nikah - Momen Ijab Kabul",
        category: "Akad Nikah",
        thumbnailUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 2150000,
        timestamp: Date.now() - 2400000
      },
      {
        id: "demo_an_2",
        name: "Akad Nikah - Pemasangan Cincin",
        category: "Akad Nikah",
        thumbnailUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1980000,
        timestamp: Date.now() - 1800000
      },
      {
        id: "demo_rs_1",
        name: "Resepsi - Lempar Bunga Bahagia",
        category: "Resepsi",
        thumbnailUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 2310000,
        timestamp: Date.now() - 1200000
      },
      {
        id: "demo_rs_2",
        name: "Resepsi - Tawa Bersama Sahabat",
        category: "Resepsi",
        thumbnailUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1740000,
        timestamp: Date.now() - 600000
      },
      {
        id: "demo_pb_1",
        name: "Photobooth - Pose Lucu Tamu",
        category: "Photobooth",
        thumbnailUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1650000,
        timestamp: Date.now() - 120000
      },
      {
        id: "demo_pb_2",
        name: "Photobooth - Momen Hangat Keluarga",
        category: "Photobooth",
        thumbnailUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2000&q=90",
        sizeBytes: 1910000,
        timestamp: Date.now() - 30000
      }
    ];
    syncPhotosToSheet(ss, dummyPhotos);
    Logger.log("✅ 2. " + dummyPhotos.length + " foto awal berhasil diisi ke Sheet 'Daftar_Foto'.");
  }

  logActivityToSheet(ss, "Inisialisasi Database", "Database spreadsheet pengguna (133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20) berhasil disiapkan", "ZettBOT Setup");

  Logger.log("\n🎉 SELURUH SISTEM DATABASE BERHASIL DISIAPKAN PADA BERKAS SPREADSHEET!");
  Logger.log("Spreadsheet URL: " + ss.getUrl());
  Logger.log("Spreadsheet ID: " + ss.getId());

  return {
    success: true,
    message: "Seluruh database berhasil disiapkan pada spreadsheet target pengguna!",
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId()
  };
}

/**
 * 7. Menguji Koneksi ke Database Spreadsheet
 */
function testSpreadsheetDatabaseConnection() {
  Logger.log("=== PENGUJIAN DATABASE SPREADSHEET ===");
  var ss = getDatabaseSpreadsheet();
  if (!ss) {
    Logger.log("⚠️ File spreadsheet belum terhubung. Menjalankan setup otomatis...");
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

/**
 * 8. Setup Lengkap Sistem Demo Berbasis Spreadsheet (Tanpa Ketergantungan Google Drive)
 */
function setupDemoSystemWithDummyFiles() {
  return setupTargetSpreadsheetDatabase();
}
