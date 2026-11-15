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
 * 6. Inisialisasi Spreadsheet Google 'foto-panggung' untuk Database & Pengaturan
 */
function setupDatabaseSpreadsheetTool() {
  Logger.log("=== MEMULAI SETUP SPREADSHEET DATABASE (foto-panggung) ===");
  var res = setupDatabaseSpreadsheet("foto-panggung");
  if (res.success) {
    Logger.log("✅ SUKSES MEMBUAT / MENGHUBUNGKAN SPREADSHEET 'foto-panggung'!");
    Logger.log("ID Spreadsheet: " + res.spreadsheetId);
    Logger.log("URL Spreadsheet: " + res.spreadsheetUrl);
    Logger.log("Silakan buka link di atas untuk melihat 3 Sheet: Pengaturan, Daftar_Foto, dan Log_Aktivitas.");
  } else {
    Logger.log("❌ Gagal: " + res.message);
  }
  return res;
}

/**
 * 7. Menguji Koneksi ke Database Spreadsheet 'foto-panggung'
 */
function testSpreadsheetDatabaseConnection() {
  Logger.log("=== PENGUJIAN DATABASE SPREADSHEET (foto-panggung) ===");
  var ss = getDatabaseSpreadsheet();
  if (!ss) {
    Logger.log("⚠️ File spreadsheet 'foto-panggung' belum terhubung. Menjalankan setup otomatis...");
    return setupDatabaseSpreadsheetTool();
  }

  Logger.log("✅ SUKSES TERHUBUNG KE SPREADSHEET: " + ss.getName());
  Logger.log("URL: " + ss.getUrl());
  
  var sheets = ss.getSheets();
  Logger.log("Daftar Lembar Kerja (Sheets):");
  for (var i = 0; i < sheets.length; i++) {
    Logger.log("  " + (i + 1) + ". " + sheets[i].getName() + " (" + sheets[i].getLastRow() + " baris)");
  }
}
