/**
 * ================================================================================
 * WEDDING PANGGUNG - ELEGANT GOOGLE DRIVE PHOTO GALLERY
 * Backend Controller & Google Apps Script REST API Service (v1.4)
 * Engine: ZettBOT v4.1 by Zettbos
 * ================================================================================
 */

// ================================================================================
// KONFIGURASI PERNIKAHAN MASTER (PATEN / FIXED)
// Sesuai arahan: Informasi Pernikahan (Nama Event, Tanggal, Venue) tidak dapat diubah
// melalui antarmuka web dan diproteksi di konfigurasi master ini.
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

  // Konfigurasi Teknis (Dapat dikelola admin via web)
  DRIVE_FOLDER_ID: "",
  DEFAULT_ADMIN_PIN: "123456",
  SLIDESHOW_INTERVAL_SEC: 4,
  AUTO_REFRESH_INTERVAL_SEC: 25,
  FRAME_IMAGE_URL: ""
};

/**
 * Mengambil konfigurasi aktif (Informasi Pernikahan paten, konfigurasi teknis dinamis)
 */
function getEffectiveConfig() {
  var props = PropertiesService.getScriptProperties().getProperties() || {};
  
  return {
    // Informasi Pernikahan: DIKUNCI / PATEN (tidak dapat diubah via web)
    EVENT_NAME: WEDDING_CONFIG.EVENT_NAME,
    COUPLE_NAME: WEDDING_CONFIG.EVENT_NAME, // kompatibilitas ke belakang
    EVENT_DATE: WEDDING_CONFIG.EVENT_DATE,
    EVENT_VENUE: WEDDING_CONFIG.EVENT_VENUE,
    SUBTITLE: WEDDING_CONFIG.SUBTITLE,
    WELCOME_MESSAGE: WEDDING_CONFIG.WELCOME_MESSAGE,

    // Konfigurasi Teknis: Dapat dikelola Admin
    DRIVE_FOLDER_ID: props.DRIVE_FOLDER_ID || WEDDING_CONFIG.DRIVE_FOLDER_ID,
    ADMIN_PIN: props.ADMIN_PIN || WEDDING_CONFIG.DEFAULT_ADMIN_PIN,
    SLIDESHOW_INTERVAL_SEC: parseInt(props.SLIDESHOW_INTERVAL_SEC, 10) || WEDDING_CONFIG.SLIDESHOW_INTERVAL_SEC,
    AUTO_REFRESH_INTERVAL_SEC: parseInt(props.AUTO_REFRESH_INTERVAL_SEC, 10) || WEDDING_CONFIG.AUTO_REFRESH_INTERVAL_SEC,
    FRAME_IMAGE_URL: props.FRAME_IMAGE_URL || WEDDING_CONFIG.FRAME_IMAGE_URL
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

    var updatedGallery = getGalleryData();

    return {
      success: true,
      message: "Pengaturan teknis dan bingkai berhasil disimpan! (Informasi Pernikahan terlindungi/tidak berubah)",
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
