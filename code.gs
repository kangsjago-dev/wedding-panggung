/**
 * ================================================================================
 * WEDDING PANGGUNG - ELEGANT GOOGLE DRIVE PHOTO GALLERY
 * Backend Controller & Google Apps Script Service
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */

// ================================================================================
// KONFIGURASI DEFAULT / CADANGAN
// Pengaturan ini digunakan saat pertama kali atau jika belum ada data di Script Properties.
// Anda dapat mengubahnya langsung dari Panel Admin Web App tanpa perlu menyentuh kode!
// ================================================================================
const WEDDING_CONFIG = {
  COUPLE_NAME: "Romeo & Juliet",
  SUBTITLE: "The Wedding Gallery & Precious Memories",
  EVENT_DATE: "15 November 2026",
  WELCOME_MESSAGE: "Terima kasih atas kehadiran, doa restu, dan kehangatan keluarga serta sahabat terkasih. Silakan nikmati dan unduh momen bahagia kebersamaan kita.",
  DRIVE_FOLDER_ID: "", // Biarkan kosong untuk Mode Demo contoh foto
  SPREADSHEET_URL: "", // URL / ID Google Spreadsheet untuk database jadwal event
  SLIDESHOW_INTERVAL_SEC: 4
};

const DEFAULT_ADMIN_PIN = "1234";

// ================================================================================
// PEMETAAN INDEKS KOLOM (INDEX-BASED MAPPING) UNTUK SHEET JADWAL EVENT
// Kebal terhadap modifikasi teks header di lembar kerja Google Sheets
// ================================================================================
const COL_EVENT = {
  ID: 0,          // Kolom A: ID Event (misal: EVT-001)
  NAMA: 1,        // Kolom B: Nama Acara (misal: Akad Nikah, Resepsi)
  TANGGAL: 2,     // Kolom C: Tanggal Acara (misal: 15/11/2026)
  JAM_MULAI: 3,   // Kolom D: Jam Mulai (misal: 08:00)
  JAM_SELESAI: 4, // Kolom E: Jam Selesai (misal: 10:00)
  LOKASI: 5,      // Kolom F: Tempat / Lokasi Venue
  KETERANGAN: 6,  // Kolom G: Dresscode / Catatan Khusus
  STATUS: 7       // Kolom H: Status Event (Aktif / Selesai)
};

/**
 * Mengambil konfigurasi aktif yang tersimpan di Script Properties (atau fallback ke default)
 */
function getActiveConfig() {
  try {
    var props = PropertiesService.getScriptProperties();
    var stored = props.getProperties();
    
    return {
      COUPLE_NAME: stored.COUPLE_NAME || WEDDING_CONFIG.COUPLE_NAME,
      SUBTITLE: stored.SUBTITLE || WEDDING_CONFIG.SUBTITLE,
      EVENT_DATE: stored.EVENT_DATE || WEDDING_CONFIG.EVENT_DATE,
      WELCOME_MESSAGE: stored.WELCOME_MESSAGE || WEDDING_CONFIG.WELCOME_MESSAGE,
      DRIVE_FOLDER_ID: stored.DRIVE_FOLDER_ID !== undefined ? stored.DRIVE_FOLDER_ID : WEDDING_CONFIG.DRIVE_FOLDER_ID,
      SPREADSHEET_URL: stored.SPREADSHEET_URL !== undefined ? stored.SPREADSHEET_URL : WEDDING_CONFIG.SPREADSHEET_URL,
      SLIDESHOW_INTERVAL_SEC: stored.SLIDESHOW_INTERVAL_SEC ? parseInt(stored.SLIDESHOW_INTERVAL_SEC, 10) : WEDDING_CONFIG.SLIDESHOW_INTERVAL_SEC
    };
  } catch (e) {
    return WEDDING_CONFIG;
  }
}

/**
 * Helper untuk mengekstrak ID Google Spreadsheet dari URL atau string mentah
 */
function extractSpreadsheetId(urlOrId) {
  if (!urlOrId) return "";
  var str = String(urlOrId).trim();
  var match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9\-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return str;
}

/**
 * Mengambil PIN Admin aktif (default: 1234)
 */
function getActiveAdminPin() {
  try {
    var props = PropertiesService.getScriptProperties();
    var pin = props.getProperty('ADMIN_PIN');
    return pin ? String(pin).trim() : DEFAULT_ADMIN_PIN;
  } catch (e) {
    return DEFAULT_ADMIN_PIN;
  }
}

/**
 * Entry point untuk melayani tampilan Web App di browser
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  template.config = getActiveConfig();
  
  return template.evaluate()
    .setTitle(template.config.COUPLE_NAME + " - Wedding Photo Gallery & Event")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Mengambil data galeri (daftar kategori & foto) dari Google Drive serta Jadwal Event
 * Dipanggil oleh JavaScript frontend secara asinkron
 */
function getGalleryData() {
  try {
    var config = getActiveConfig();
    var folderId = config.DRIVE_FOLDER_ID ? String(config.DRIVE_FOLDER_ID).trim() : "";
    var eventsData = getWeddingEvents();
    
    // Jika ID Folder belum diatur atau masih menggunakan placeholder default
    if (!folderId || folderId === "MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_ANDA_DI_SINI") {
      return {
        success: true,
        isDemo: true,
        message: "ID Folder Google Drive belum diatur. Menampilkan galeri contoh (Demo Mode).",
        config: config,
        categories: ["Semua Foto", "Prewedding", "Akad Nikah", "Resepsi", "Photobooth"],
        photos: getDemoPhotos(),
        events: eventsData.events || []
      };
    }

    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderId);
    } catch (err) {
      return {
        success: false,
        error: "FOLDER_NOT_FOUND",
        message: "Folder Google Drive tidak ditemukan atau izin belum dibagikan. Error: " + err.toString(),
        config: config,
        categories: ["Semua Foto"],
        photos: getDemoPhotos(),
        events: eventsData.events || []
      };
    }

    var categories = ["Semua Foto"];
    var photos = [];
    var categoryMap = {};

    // 1. Pindai Sub-Folder untuk mendeteksi Momen (misal: "01. Prewedding", "Akad", "Resepsi")
    var subFolders = rootFolder.getFolders();
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      var cleanCatName = cleanCategoryName(sub.getName());
      if (!categoryMap[cleanCatName]) {
        categoryMap[cleanCatName] = true;
        categories.push(cleanCatName);
      }

      // Pindai file foto di dalam sub-folder
      scanFilesInFolder(sub, cleanCatName, photos);
    }

    // 2. Pindai juga file foto yang berada langsung di root folder utama
    scanFilesInFolder(rootFolder, "Galeri Utama", photos);

    if (photos.some(function(p) { return p.category === "Galeri Utama"; })) {
      if (!categoryMap["Galeri Utama"]) {
        categories.push("Galeri Utama");
      }
    }

    // Urutkan foto berdasarkan waktu terbaru
    photos.sort(function(a, b) {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return {
      success: true,
      isDemo: false,
      config: config,
      categories: categories,
      photos: photos,
      totalPhotos: photos.length,
      events: eventsData.events || []
    };

  } catch (error) {
    return {
      success: false,
      error: "SERVER_ERROR",
      message: error.toString(),
      config: getActiveConfig(),
      categories: ["Semua Foto"],
      photos: getDemoPhotos(),
      events: getDemoEvents()
    };
  }
}

/**
 * Mengambil daftar jadwal acara (event) dari tab sheet "JadwalEvent"
 */
function getWeddingEvents() {
  try {
    var config = getActiveConfig();
    var sheetId = extractSpreadsheetId(config.SPREADSHEET_URL);

    if (!sheetId) {
      return { success: true, isDemo: true, events: getDemoEvents() };
    }

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("JadwalEvent");

    if (!sheet) {
      return { success: true, isDemo: true, events: getDemoEvents(), note: "Tab JadwalEvent belum dibuat." };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, isDemo: false, events: [] };
    }

    // WAJIB gunakan getDisplayValues() agar jam dan tanggal terbaca String murni kebal zona waktu
    var rows = sheet.getRange(2, 1, lastRow - 1, 8).getDisplayValues();
    var events = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var namaEvent = row[COL_EVENT.NAMA];
      if (!namaEvent) continue;

      events.push({
        id: row[COL_EVENT.ID] || ("EVT-" + (i + 1)),
        name: namaEvent,
        date: row[COL_EVENT.TANGGAL] || config.EVENT_DATE,
        startTime: row[COL_EVENT.JAM_MULAI] || "",
        endTime: row[COL_EVENT.JAM_SELESAI] || "",
        location: row[COL_EVENT.LOKASI] || "Venue Utama",
        notes: row[COL_EVENT.KETERANGAN] || "",
        status: row[COL_EVENT.STATUS] || "Aktif"
      });
    }

    return { success: true, isDemo: false, events: events };
  } catch (e) {
    return { success: false, isDemo: true, events: getDemoEvents(), error: e.toString() };
  }
}

/**
 * Memindai berkas gambar di dalam sebuah folder Google Drive
 */
function scanFilesInFolder(folder, categoryName, photoList) {
  var files = folder.getFiles();
  var allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/heic': true
  };

  while (files.hasNext()) {
    var file = files.next();
    var mime = file.getMimeType();
    
    if (allowedTypes[mime] || mime.indexOf('image/') === 0) {
      var fileId = file.getId();
      var fileName = file.getName();
      var dateCreated = file.getDateCreated();

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

// ================================================================================
// FITUR ADMIN: API AUTENTIKASI, PENGATURAN & SPREADSHEET MANAGER
// ================================================================================

function verifyAdminPin(pin) {
  try {
    var activePin = getActiveAdminPin();
    var inputPin = String(pin || '').trim();

    if (inputPin === activePin) {
      return {
        success: true,
        message: "Otentikasi berhasil!",
        config: getActiveConfig()
      };
    } else {
      return {
        success: false,
        message: "PIN Admin salah. Silakan coba lagi."
      };
    }
  } catch (e) {
    return { success: false, message: "Terjadi kesalahan: " + e.toString() };
  }
}

function saveAdminConfig(pin, newConfig) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "Sesi tidak sah / PIN salah. Perubahan ditolak." };
    }

    if (!newConfig || typeof newConfig !== 'object') {
      return { success: false, message: "Data konfigurasi tidak valid." };
    }

    var props = PropertiesService.getScriptProperties();
    var toSave = {};

    if (newConfig.COUPLE_NAME) toSave.COUPLE_NAME = String(newConfig.COUPLE_NAME).trim();
    if (newConfig.SUBTITLE) toSave.SUBTITLE = String(newConfig.SUBTITLE).trim();
    if (newConfig.EVENT_DATE) toSave.EVENT_DATE = String(newConfig.EVENT_DATE).trim();
    if (newConfig.WELCOME_MESSAGE) toSave.WELCOME_MESSAGE = String(newConfig.WELCOME_MESSAGE).trim();
    if (newConfig.DRIVE_FOLDER_ID !== undefined) toSave.DRIVE_FOLDER_ID = String(newConfig.DRIVE_FOLDER_ID).trim();
    if (newConfig.SPREADSHEET_URL !== undefined) toSave.SPREADSHEET_URL = String(newConfig.SPREADSHEET_URL).trim();
    if (newConfig.SLIDESHOW_INTERVAL_SEC) toSave.SLIDESHOW_INTERVAL_SEC = String(parseInt(newConfig.SLIDESHOW_INTERVAL_SEC, 10) || 4);

    if (newConfig.NEW_PIN && String(newConfig.NEW_PIN).trim().length >= 4) {
      toSave.ADMIN_PIN = String(newConfig.NEW_PIN).trim();
    }

    props.setProperties(toSave);

    return {
      success: true,
      message: "Pengaturan berhasil disimpan dan langsung diterapkan!",
      config: getActiveConfig()
    };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan konfigurasi: " + e.toString() };
  }
}

/**
 * Menguji Akses Google Spreadsheet dari Panel Admin
 */
function testSpreadsheetApi(pin, spreadsheetUrl) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "PIN Admin salah." };
    }

    var sheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!sheetId) {
      return { success: false, message: "URL atau ID Spreadsheet tidak boleh kosong." };
    }

    var ss = SpreadsheetApp.openById(sheetId);
    var sheetName = ss.getName();
    var eventSheet = ss.getSheetByName("JadwalEvent");
    
    if (!eventSheet) {
      return {
        success: true,
        sheetName: sheetName,
        hasEventTab: false,
        message: "Spreadsheet terhubung ('" + sheetName + "'), namun tab 'JadwalEvent' belum ada. Klik tombol 'Inisialisasi Tab JadwalEvent' untuk memasangnya secara otomatis."
      };
    }

    var lastRow = eventSheet.getLastRow();
    var eventCount = lastRow > 1 ? (lastRow - 1) : 0;

    return {
      success: true,
      sheetName: sheetName,
      hasEventTab: true,
      eventCount: eventCount,
      message: "Koneksi Sukses! Ditemukan tab 'JadwalEvent' dengan " + eventCount + " jadwal acara tersimpan."
    };
  } catch (e) {
    return {
      success: false,
      message: "Gagal mengakses Spreadsheet: " + e.toString() + ". Pastikan URL benar dan izin disetel 'Anyone with the link can edit/view'."
    };
  }
}

/**
 * Memasang tab "JadwalEvent" ke Spreadsheet yang sudah ada (Safe Migration)
 */
function initSpreadsheetSheetApi(pin, spreadsheetUrl) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "PIN Admin salah." };
    }

    var sheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!sheetId) {
      return { success: false, message: "URL Spreadsheet tidak boleh kosong." };
    }

    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName("JadwalEvent");

    if (!sheet) {
      sheet = ss.insertSheet("JadwalEvent");
    }

    // Jika sheet masih baru/kosong, pasang header dan contoh
    if (sheet.getLastRow() === 0) {
      var headers = ["ID Event", "Nama Acara", "Tanggal", "Jam Mulai", "Jam Selesai", "Lokasi", "Keterangan", "Status"];
      sheet.appendRow(headers);

      // Beri gaya warna header soft gold
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#C5A880");
      headerRange.setFontColor("#FFFFFF");

      // Isi sampel acara
      var sampleRows = [
        ["EVT-001", "Akad Nikah", "15/11/2026", "08:00", "10:00", "Masjid Agung Al-Barkah", "Dresscode: Pakaian Muslim / Putih Bersih", "Aktif"],
        ["EVT-002", "Upacara Temu Manten & Sungkeman", "15/11/2026", "10:30", "11:30", "Gedung Puri Kencana", "Prosesi Adat Keluarga Inti", "Aktif"],
        ["EVT-003", "Resepsi Siang (Sesi 1)", "15/11/2026", "11:30", "14:00", "Ballroom Puri Kencana", "Dresscode: Formal / Batik Elegan", "Aktif"],
        ["EVT-004", "Resepsi Malam & After Party", "15/11/2026", "19:00", "21:30", "Ballroom Puri Kencana", "Dresscode: Modern Chic / Cocktail", "Aktif"]
      ];

      for (var r = 0; r < sampleRows.length; r++) {
        sheet.appendRow(sampleRows[r]);
      }

      SpreadsheetApp.flush();
    }

    return {
      success: true,
      message: "Tab 'JadwalEvent' berhasil disiapkan dengan kolom baku dan sampel acara!"
    };
  } catch (e) {
    return { success: false, message: "Gagal inisialisasi sheet: " + e.toString() };
  }
}

/**
 * Membuat Google Spreadsheet Baru secara Otomatis di Akun Google Pengguna
 */
function autoCreateSpreadsheetApi(pin) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "PIN Admin salah." };
    }

    var config = getActiveConfig();
    var title = "Database Wedding - " + config.COUPLE_NAME;
    var ss = SpreadsheetApp.create(title);

    // Ambil sheet default dan ubah namanya menjadi JadwalEvent
    var sheet = ss.getActiveSheet();
    sheet.setName("JadwalEvent");

    var headers = ["ID Event", "Nama Acara", "Tanggal", "Jam Mulai", "Jam Selesai", "Lokasi", "Keterangan", "Status"];
    sheet.appendRow(headers);

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#C5A880");
    headerRange.setFontColor("#FFFFFF");

    var sampleRows = [
      ["EVT-001", "Akad Nikah", config.EVENT_DATE || "15/11/2026", "08:00", "10:00", "Masjid Agung / Tempat Akad", "Dresscode: Putih Bersih / Muslim", "Aktif"],
      ["EVT-002", "Upacara Temu Manten & Sungkeman", config.EVENT_DATE || "15/11/2026", "10:30", "11:30", "Gedung Resepsi Utama", "Prosesi Adat Keluarga Inti", "Aktif"],
      ["EVT-003", "Resepsi Pernikahan (Sesi 1)", config.EVENT_DATE || "15/11/2026", "11:30", "14:00", "Grand Ballroom Venue", "Dresscode: Formal / Batik Elegan", "Aktif"],
      ["EVT-004", "Resepsi Pernikahan (Sesi 2)", config.EVENT_DATE || "15/11/2026", "18:30", "21:00", "Grand Ballroom Venue", "Dresscode: Formal / Gaun Malam", "Aktif"]
    ];

    for (var r = 0; r < sampleRows.length; r++) {
      sheet.appendRow(sampleRows[r]);
    }

    SpreadsheetApp.flush();

    var ssUrl = ss.getUrl();
    var ssId = ss.getId();

    // Simpan otomatis ke Script Properties
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_URL', ssUrl);

    return {
      success: true,
      spreadsheetUrl: ssUrl,
      spreadsheetId: ssId,
      message: "Google Spreadsheet baru berhasil dibuat dan otomatis dihubungkan ke web app!"
    };
  } catch (e) {
    return { success: false, message: "Gagal membuat spreadsheet otomatis: " + e.toString() };
  }
}

/**
 * Menguji Akses Folder Google Drive dari Panel Admin
 */
function testDriveFolderApi(pin, folderId) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "PIN Admin salah." };
    }

    var cleanId = String(folderId || '').trim();
    if (!cleanId) {
      return { success: false, message: "ID Folder tidak boleh kosong." };
    }

    var folder = DriveApp.getFolderById(cleanId);
    var folderName = folder.getName();
    
    var subs = folder.getFolders();
    var subfolderList = [];
    while (subs.hasNext()) {
      subfolderList.push(subs.next().getName());
    }

    var files = folder.getFiles();
    var imageCount = 0;
    while (files.hasNext()) {
      var f = files.next();
      if (f.getMimeType().indexOf('image/') === 0) imageCount++;
    }

    return {
      success: true,
      folderName: folderName,
      subfolderCount: subfolderList.length,
      subfolders: subfolderList,
      imageCount: imageCount,
      message: "Folder valid dan dapat diakses! (" + imageCount + " foto utama, " + subfolderList.length + " subfolder momen)"
    };
  } catch (e) {
    return {
      success: false,
      message: "Gagal mengakses folder: " + e.toString() + ". Pastikan folder disetel 'Anyone with the link can view'."
    };
  }
}

/**
 * Membuat Struktur Folder Otomatis di Google Drive dari Panel Admin
 */
function autoCreateDriveFolderApi(pin) {
  try {
    var activePin = getActiveAdminPin();
    if (String(pin || '').trim() !== activePin) {
      return { success: false, message: "PIN Admin salah." };
    }

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

    var props = PropertiesService.getScriptProperties();
    props.setProperty('DRIVE_FOLDER_ID', newId);

    return {
      success: true,
      folderId: newId,
      folderName: mainFolderName,
      folderUrl: mainFolder.getUrl(),
      message: "Folder Google Drive berhasil dibuat dan otomatis dihubungkan ke web app!"
    };
  } catch (e) {
    return {
      success: false,
      message: "Gagal membuat folder otomatis: " + e.toString()
    };
  }
}

/**
 * Sampel data jadwal acara untuk Demo Mode
 */
function getDemoEvents() {
  return [
    {
      id: "EVT-001",
      name: "Akad Nikah",
      date: "15 November 2026",
      startTime: "08:00",
      endTime: "10:00",
      location: "Masjid Agung Al-Barkah",
      notes: "Dresscode: Pakaian Muslim / Putih Bersih",
      status: "Selesai"
    },
    {
      id: "EVT-002",
      name: "Upacara Adat Temu Manten",
      date: "15 November 2026",
      startTime: "10:30",
      endTime: "11:30",
      location: "Gedung Puri Kencana",
      notes: "Prosesi Adat & Sungkeman Keluarga Inti",
      status: "Selesai"
    },
    {
      id: "EVT-003",
      name: "Resepsi Pernikahan (Sesi 1)",
      date: "15 November 2026",
      startTime: "11:30",
      endTime: "14:00",
      location: "Ballroom Puri Kencana",
      notes: "Dresscode: Formal / Batik Elegan",
      status: "Aktif"
    },
    {
      id: "EVT-004",
      name: "Resepsi Malam & After Party",
      date: "15 November 2026",
      startTime: "19:00",
      endTime: "21:30",
      location: "Ballroom Puri Kencana",
      notes: "Dresscode: Modern Chic / Cocktail Attire",
      status: "Akan Datang"
    }
  ];
}

/**
 * Penyedia foto sampel beresolusi tinggi bertema pernikahan (Demo Mode)
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
