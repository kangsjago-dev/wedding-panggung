const fs = require('fs');

let content = fs.readFileSync('setup.gs', 'utf8');

const daftarAcaraSetup = `
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
`;

if (!content.includes('Daftar_Acara')) {
  content = content.replace('// C. SHEET 3: Daftar_Foto', daftarAcaraSetup + '\n    // C. SHEET 3: Daftar_Foto');
  fs.writeFileSync('setup.gs', content, 'utf8');
  console.log('setup.gs updated with Daftar_Acara!');
} else {
  console.log('setup.gs already has Daftar_Acara');
}

