/**
 * ================================================================================
 * SETUP & DIAGNOSTIC UTILITY - WEDDING PANGGUNG
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 * File ini berisi fungsi bantuan untuk menguji koneksi Google Drive,
 * menguji koneksi Google Spreadsheet, dan membuat struktur data otomatis.
 */

/**
 * 1. Menguji apakah ID Folder Google Drive valid dan dapat diakses
 */
function testDriveConnection() {
  Logger.log("=== MEMULAI PENGUJIAN KONEKSI GOOGLE DRIVE ===");
  var config = getActiveConfig();
  var folderId = config.DRIVE_FOLDER_ID ? String(config.DRIVE_FOLDER_ID).trim() : "";

  if (!folderId) {
    Logger.log("⚠️ PERINGATAN: DRIVE_FOLDER_ID masih kosong.");
    Logger.log("Aplikasi saat ini berjalan dalam Mode Demo dengan foto sampel.");
    Logger.log("Untuk menghubungkan foto Anda, isi ID Folder melalui Panel Admin Web App atau code.gs");
    return;
  }

  try {
    var folder = DriveApp.getFolderById(folderId);
    Logger.log("✅ SUKSES: Folder utama ditemukan!");
    Logger.log("Nama Folder: " + folder.getName());
    Logger.log("Tautan Folder: " + folder.getUrl());

    var subFolders = folder.getFolders();
    var subCount = 0;
    Logger.log("\n--- DAFTAR SUB-FOLDER MOMEN ---");
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      subCount++;
      Logger.log(subCount + ". " + sub.getName());
    }
    if (subCount === 0) {
      Logger.log("(Tidak ada sub-folder. Seluruh foto akan dikelompokkan ke 'Semua Foto')");
    }

    var files = folder.getFiles();
    var fileCount = 0;
    while (files.hasNext()) {
      var f = files.next();
      if (f.getMimeType().indexOf('image/') === 0) {
        fileCount++;
      }
    }
    Logger.log("\nJumlah file gambar di folder utama: " + fileCount + " foto");
    Logger.log("\n🎉 KONEKSI DRIVE SIAP!");

  } catch (e) {
    Logger.log("❌ GAGAL: Terjadi kesalahan saat mengakses folder:");
    Logger.log(e.toString());
  }
}

/**
 * 2. Menguji dan Menginisialisasi Tab "JadwalEvent" di Google Spreadsheet
 * Jalankan fungsi ini untuk memastikan spreadsheet siap menyimpan agenda acara
 */
function testSpreadsheetDatabaseConnection() {
  Logger.log("=== MEMULAI PENGUJIAN GOOGLE SPREADSHEET ===");
  var config = getActiveConfig();
  var sheetId = extractSpreadsheetId(config.SPREADSHEET_URL);

  if (!sheetId) {
    Logger.log("⚠️ SPREADSHEET_URL belum diatur. Menggunakan jadwal demo.");
    return;
  }

  try {
    var ss = SpreadsheetApp.openById(sheetId);
    Logger.log("✅ Berhasil terhubung ke Spreadsheet: " + ss.getName());
    
    var sheet = ss.getSheetByName("JadwalEvent");
    if (!sheet) {
      Logger.log("Membuat tab 'JadwalEvent' baru...");
      sheet = ss.insertSheet("JadwalEvent");
      var headers = ["ID Event", "Nama Acara", "Tanggal", "Jam Mulai", "Jam Selesai", "Lokasi", "Keterangan", "Status"];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#C5A880").setFontColor("#FFFFFF");
      SpreadsheetApp.flush();
      Logger.log("✅ Tab 'JadwalEvent' berhasil dibuat dengan kolom baku.");
    } else {
      Logger.log("✅ Tab 'JadwalEvent' sudah ada dengan " + (sheet.getLastRow() - 1) + " jadwal acara.");
    }
  } catch (e) {
    Logger.log("❌ Gagal mengakses spreadsheet: " + e.toString());
  }
}

/**
 * 3. Fungsi Otomatis: Membuatkan Struktur Folder Pernikahan Siap Pakai di Google Drive Anda
 */
function createSampleFolderStructure() {
  Logger.log("=== MEMBUAT STRUKTUR FOLDER PERNIKAHAN OTOMATIS ===");
  try {
    var config = getActiveConfig();
    var mainFolderName = "Galeri Foto Pernikahan - " + config.COUPLE_NAME;
    var mainFolder = DriveApp.createFolder(mainFolderName);
    
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var subNames = [
      "01. Prewedding",
      "02. Akad Nikah",
      "03. Resepsi",
      "04. Photobooth"
    ];

    for (var i = 0; i < subNames.length; i++) {
      mainFolder.createFolder(subNames[i]);
    }

    var newId = mainFolder.getId();

    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty('DRIVE_FOLDER_ID', newId);
    } catch (err) {}

    Logger.log("✅ BERHASIL MEMBUAT FOLDER DRIVE!");
    Logger.log("ID Folder: " + newId);
    Logger.log("Tautan Folder: " + mainFolder.getUrl());

    return newId;
  } catch (e) {
    Logger.log("❌ Gagal membuat folder otomatis: " + e.toString());
  }
}
