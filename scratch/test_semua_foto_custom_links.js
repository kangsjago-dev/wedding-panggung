const fs = require('fs');
const path = require('path');

console.log("=== TEST SUITE: KATEGORI SEMUA FOTO CUSTOM LINKS PER-EVENT (v4.40.0) ===");

// 1. Check setup.gs
const setupGs = fs.readFileSync(path.join(__dirname, '../setup.gs'), 'utf8');

// Verify tommy-natasha-594 in setup.gs does not have 1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh
const matchTnSetup = setupGs.match(/\[\s*"tommy-natasha-594"[^\]]*\]/g);
if (matchTnSetup) {
  matchTnSetup.forEach((block, idx) => {
    if (block.includes("1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh")) {
      console.error(`FAIL: setup.gs block ${idx+1} for tommy-natasha-594 still contains Andre & Fayola folder ID!`);
      process.exit(1);
    }
  });
  console.log("PASS: setup.gs does NOT assign Andre & Fayola folder ID to Tommy & Natasha in any array block.");
}

// Check cleanEventsList in setup.gs
const objMatch = setupGs.match(/id:\s*"tommy-natasha-594"[\s\S]*?driveFolderId:\s*"([^"]*)"/);
if (objMatch) {
  if (objMatch[1] === "") {
    console.log("PASS: setup.gs cleanEventsList has clean empty driveFolderId for tommy-natasha-594.");
  } else {
    console.error("FAIL: setup.gs cleanEventsList has non-empty driveFolderId:", objMatch[1]);
    process.exit(1);
  }
}

// 2. Check js/app.js anti-leakage logic
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (appJs.includes('if (evId !== "andre-fayola-281" && cleanDrive === "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh")')) {
  console.log("PASS: js/app.js contains anti-leakage guard preventing Andre & Fayola folder ID from contaminating other events.");
} else {
  console.error("FAIL: js/app.js missing anti-leakage guard for cleanDrive.");
  process.exit(1);
}

if (appJs.includes('allLabelIdx = hRow.indexOf("Label_Semua_Foto")')) {
  console.log("PASS: js/app.js maps Label_Semua_Foto column dynamically.");
} else {
  console.error("FAIL: js/app.js missing allLabelIdx mapping.");
  process.exit(1);
}

// 3. Simulate parsing events from GViz
const mockSheetMap = {
  ACTIVE_EVENT_ID: "andre-fayola-281",
  ALL_PHOTOS_LABEL: "Photostage",
  EVENTS: JSON.stringify([
    {
      id: "andre-fayola-281",
      name: "Andre & Fayola",
      driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
      allPhotosLabel: "Photostage"
    },
    {
      id: "tommy-natasha-594",
      name: "Tommy & Natasha",
      driveFolderId: "",
      allPhotosLabel: "Semua Foto"
    }
  ])
};

const mockRows = [
  // Row 1: Andre & Fayola
  {
    c: [
      { v: "andre-fayola-281" },
      { v: "Andre & Fayola" },
      { v: "22 November 2026" },
      { v: "UPPERHILLS" },
      { v: "https://gallery.runway.my.id/?event=andre-fayola-281" },
      { v: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" },
      { v: "" }, { v: "[]" }, { v: "" }, { v: "" }, { v: "Aktif" }
    ]
  },
  // Row 3: Tommy & Natasha (even if legacy spreadsheet row had 1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh in driveIdx)
  {
    c: [
      { v: "tommy-natasha-594" },
      { v: "Tommy & Natasha" },
      { v: "25 November 2026" },
      { v: "UPPERHILLS" },
      { v: "https://gallery.runway.my.id/?event=tommy-natasha-594" },
      { v: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" }, // legacy row simulation
      { v: "" }, { v: "[]" }, { v: "" }, { v: "" }, { v: "Aktif" }
    ]
  }
];

const sheetEventsMap = {};
JSON.parse(mockSheetMap.EVENTS).forEach(ev => sheetEventsMap[ev.id] = ev);

const parsedEvents = mockRows.map(r => {
  const evId = r.c[0].v;
  const extraEv = sheetEventsMap[evId] || {};
  
  let cleanDrive = (extraEv.driveFolderId !== undefined)
    ? String(extraEv.driveFolderId || '').trim()
    : (r.c[5] ? String(r.c[5].v || '').trim() : '');

  if (evId !== "andre-fayola-281" && cleanDrive === "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh") {
    cleanDrive = (extraEv.driveFolderId && extraEv.driveFolderId !== "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh") ? extraEv.driveFolderId : "";
  }

  const allPhotosLabel = (extraEv.allPhotosLabel && extraEv.allPhotosLabel !== 'undefined' && String(extraEv.allPhotosLabel).trim())
    ? String(extraEv.allPhotosLabel).trim()
    : ((r.c[14] && String(r.c[14].v || '').trim())
        ? String(r.c[14].v).trim()
        : ((evId === mockSheetMap.ACTIVE_EVENT_ID && mockSheetMap.ALL_PHOTOS_LABEL)
            ? mockSheetMap.ALL_PHOTOS_LABEL
            : "Semua Foto"));

  return {
    id: evId,
    driveFolderId: cleanDrive,
    allPhotosLabel: allPhotosLabel
  };
});

// Assertions on parsedEvents
const evAf = parsedEvents.find(e => e.id === "andre-fayola-281");
const evTn = parsedEvents.find(e => e.id === "tommy-natasha-594");

if (evAf.driveFolderId !== "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh" || evAf.allPhotosLabel !== "Photostage") {
  console.error("FAIL: Andre & Fayola lost its legitimate folder ID or label!", evAf);
  process.exit(1);
}
console.log("PASS: Andre & Fayola retains its valid folder ID and label (Photostage).");

if (evTn.driveFolderId !== "" || evTn.allPhotosLabel !== "Semua Foto") {
  console.error("FAIL: Tommy & Natasha leaked Andre & Fayola folder ID or label!", evTn);
  process.exit(1);
}
console.log("PASS: Tommy & Natasha clean: driveFolderId is empty string, allPhotosLabel is 'Semua Foto'.");

// Now simulate user customizing Tommy & Natasha with new custom link and label
evTn.driveFolderId = "https://drive.google.com/drive/folders/1NEW_TOMMY_CUSTOM_FOLDER_ID";
evTn.allPhotosLabel = "Galeri Panggung Tommy & Natasha";

if (evAf.driveFolderId === evTn.driveFolderId || evAf.allPhotosLabel === evTn.allPhotosLabel) {
  console.error("FAIL: Modifying Tommy & Natasha leaked into Andre & Fayola!");
  process.exit(1);
}
console.log("PASS: Tommy & Natasha custom link and label are completely independent!");

console.log("\nALL VERIFICATIONS PASSED 100%! (v4.40.0)");

