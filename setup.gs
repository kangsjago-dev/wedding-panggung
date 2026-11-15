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

/**
 * 8. Setup Lengkap Sistem Demo dengan Berkas Dummy (Folder Drive + foto-panggung + Dummy Photos)
 */
function setupDemoSystemWithDummyFiles() {
  Logger.log("=== MEMULAI SETUP DEMO SISTEM & DUMMY FILES ===");

  // 1. Inisialisasi Spreadsheet foto-panggung
  var ssRes = setupDatabaseSpreadsheet("foto-panggung");
  var ss = getDatabaseSpreadsheet();
  if (!ss) {
    Logger.log("❌ Gagal membuat spreadsheet foto-panggung: " + (ssRes ? ssRes.message : ""));
    return { success: false, message: "Gagal menghubungkan spreadsheet foto-panggung" };
  }
  Logger.log("✅ 1. Spreadsheet 'foto-panggung' Siap! URL: " + ss.getUrl());

  // 2. Buat Struktur Folder Demo di Google Drive
  var demoFolderName = "Galeri Pernikahan Demo - " + WEDDING_CONFIG.EVENT_NAME;
  var demoFolder;
  try {
    var existingFolders = DriveApp.getFoldersByName(demoFolderName);
    if (existingFolders.hasNext()) {
      demoFolder = existingFolders.next();
      Logger.log("ℹ️ Menggunakan folder demo yang sudah ada: " + demoFolderName);
    } else {
      demoFolder = DriveApp.createFolder(demoFolderName);
      Logger.log("✅ 2. Folder Demo dibuat di Google Drive: " + demoFolderName);
    }
    demoFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (eFolder) {
    Logger.log("⚠️ Gagal membuat folder Drive: " + eFolder.toString());
  }

  var folderId = demoFolder ? demoFolder.getId() : "";

  // 3. Buat Subfolder Kategori
  var categoryFolders = {};
  if (demoFolder) {
    var subCats = ["01. Prewedding", "02. Akad Nikah", "03. Resepsi", "04. Photobooth"];
    for (var i = 0; i < subCats.length; i++) {
      var catName = subCats[i];
      var existingSub = demoFolder.getFoldersByName(catName);
      if (existingSub.hasNext()) {
        categoryFolders[catName] = existingSub.next();
      } else {
        categoryFolders[catName] = demoFolder.createFolder(catName);
        categoryFolders[catName].setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    }
    Logger.log("✅ 3. Subfolder kategori berhasil disiapkan.");
  }

  // 4. Perbarui konfigurasi folder di Script Properties dan Sheet Pengaturan
  if (folderId) {
    PropertiesService.getScriptProperties().setProperty("DRIVE_FOLDER_ID", folderId);
    writeConfigToSheet(ss, {
      EVENT_NAME: WEDDING_CONFIG.EVENT_NAME,
      EVENT_DATE: WEDDING_CONFIG.EVENT_DATE,
      EVENT_VENUE: WEDDING_CONFIG.EVENT_VENUE,
      DRIVE_FOLDER_ID: folderId
    });
    Logger.log("✅ 4. DRIVE_FOLDER_ID disetel ke: " + folderId);
  }

  // 5. Isi Sheet Daftar_Foto dengan Dummy Photos beresolusi tinggi (Wedding Collection)
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
  Logger.log("✅ 5. " + dummyPhotos.length + " foto dummy pernikahan berhasil diisi ke Sheet 'Daftar_Foto'.");

  // 6. Buat file dummy info di setiap subfolder Google Drive
  try {
    for (var cat in categoryFolders) {
      var cf = categoryFolders[cat];
      var dummyFileName = "panduan_" + cat.replace(/[^a-zA-Z0-9]/g, "_") + ".txt";
      var existingFiles = cf.getFilesByName(dummyFileName);
      if (!existingFiles.hasNext()) {
        cf.createFile(dummyFileName, "Folder Kategori: " + cat + "\nSilakan unggah foto momen pernikahan ke folder ini.\nFormat foto yang didukung: JPG, PNG, WEBP (> 20KB).");
      }
    }
    Logger.log("✅ 6. Berkas dummy info panduan dibuat di setiap subfolder Google Drive.");
  } catch (eDummyFile) {
    Logger.log("Info dummy file: " + eDummyFile.toString());
  }

  // 7. Catat aktivitas
  logActivityToSheet(ss, "Setup Demo Selesai", "Sistem demo berhasil diinisialisasi lengkap dengan folder Drive & dummy files", "Admin System");

  Logger.log("\n🎉 SELURUH SISTEM DEMO & BERKAS DUMMY SIAP DIGUNAKAN!");
  Logger.log("Spreadsheet: " + ss.getUrl());
  if (demoFolder) Logger.log("Folder Google Drive: " + demoFolder.getUrl());

  return {
    success: true,
    message: "Sistem demo & berkas dummy berhasil disiapkan!",
    spreadsheetUrl: ss.getUrl(),
    driveFolderUrl: demoFolder ? demoFolder.getUrl() : "",
    driveFolderId: folderId
  };
}
