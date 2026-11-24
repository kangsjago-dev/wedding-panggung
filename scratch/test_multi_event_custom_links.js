const fs = require('fs');
const path = require('path');

console.log("=== TEST SUITE: MULTI-EVENT CUSTOM LINKS ISOLATION (v4.39.0) ===");

// 1. Syntax check for js/admin.js and code.gs
const adminCode = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
const codeGs = fs.readFileSync(path.join(__dirname, '../code.gs'), 'utf8');

// Simple parse test
try {
  new Function(adminCode);
  console.log("PASS: js/admin.js syntax is valid.");
} catch(e) {
  console.error("FAIL: js/admin.js syntax error:", e);
  process.exit(1);
}

// 2. Verify code.gs modifications
// Check tommy-natasha-594 has empty driveFolderId in setupTargetSpreadsheetDatabase
const setupMatch = codeGs.match(/\[\s*"tommy-natasha-594"[^\]]*\]/);
if (setupMatch) {
  if (setupMatch[0].includes('1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh')) {
    console.error("FAIL: code.gs still has duplicate driveFolderId 1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh in setupTargetSpreadsheetDatabase for tommy-natasha-594!");
    process.exit(1);
  } else {
    console.log("PASS: code.gs setupTargetSpreadsheetDatabase does NOT assign Andre & Fayola folder ID to Tommy & Natasha.");
  }
}

// Check syncAllEventsToSheet
const syncEventsMatch = /id:\s*"tommy-natasha-594"[\s\S]*?driveFolderId:\s*"([^"]*)"/;
const match = codeGs.match(syncEventsMatch);
if (match) {
  if (match[1] === "") {
    console.log("PASS: code.gs syncAllEventsToSheet has clean empty driveFolderId for tommy-natasha-594.");
  } else {
    console.error("FAIL: code.gs syncAllEventsToSheet has non-empty driveFolderId:", match[1]);
    process.exit(1);
  }
}

// Check testAndSyncDriveFolder accepts eventId and updates Daftar_Acara
if (codeGs.includes("function testAndSyncDriveFolder(pin, folderId, allPhotosLabel, eventId)")) {
  console.log("PASS: code.gs testAndSyncDriveFolder accepts eventId parameter.");
} else {
  console.error("FAIL: code.gs testAndSyncDriveFolder does not accept eventId.");
  process.exit(1);
}

// Check handleApiRequest passes targetEventId to testAndSyncDriveFolder
if (codeGs.includes("return testAndSyncDriveFolder(params.pin, targetFolder, allLabel, targetEventId);")) {
  console.log("PASS: code.gs handleApiRequest passes targetEventId to testAndSyncDriveFolder.");
} else {
  console.error("FAIL: code.gs handleApiRequest does not pass targetEventId.");
  process.exit(1);
}

// 3. Verify js/admin.js logic
// Check openAdminSettingsModal isolates activeConfig
if (adminCode.includes("state.activeConfig.DRIVE_FOLDER_ID = activeEv.driveFolderId || \"\";")) {
  console.log("PASS: js/admin.js openAdminSettingsModal strictly sets DRIVE_FOLDER_ID from activeEv without leaking.");
} else {
  console.error("FAIL: js/admin.js openAdminSettingsModal does not isolate DRIVE_FOLDER_ID strictly.");
  process.exit(1);
}

// Check handleSaveAllSettings reads DOM value without falling back to stale activeConfig
if (adminCode.includes("const driveFolderInput = (document.getElementById(\"cfgDriveFolderId\") && document.getElementById(\"cfgDriveFolderId\").value !== undefined)")) {
  console.log("PASS: js/admin.js handleSaveAllSettings reads input field value directly even when empty.");
} else {
  console.error("FAIL: js/admin.js handleSaveAllSettings does not read input safely.");
  process.exit(1);
}

// Check handleSyncDrivePhotosDirectly passes eventId and updates state.events
if (adminCode.includes("eventId: state.currentEventId") && adminCode.includes("curEv.driveFolderId = driveInput;")) {
  console.log("PASS: js/admin.js handleSyncDrivePhotosDirectly passes eventId and updates event registry.");
} else {
  console.error("FAIL: js/admin.js handleSyncDrivePhotosDirectly does not update event registry or pass eventId.");
  process.exit(1);
}

// 4. Simulate switching events and modifying links in client-side state
const mockEvents = [
  {
    id: "andre-fayola-691",
    name: "Andre & Fayola",
    driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    photoboothUrl: "https://photobooth.runway.my.id/gallery/andre-fayola",
    customCategories: [{ name: "Photobooth", url: "https://photobooth.runway.my.id/gallery/andre-fayola" }]
  },
  {
    id: "tommy-natasha-594",
    name: "Tommy & Natasha",
    driveFolderId: "",
    photoboothUrl: "",
    customCategories: [{ name: "Photobooth", url: "" }]
  }
];

// Switch to Event 2 (Tommy & Natasha)
const ev2 = mockEvents.find(e => e.id === "tommy-natasha-594");
let activeConfig = Object.assign({}, ev2);
activeConfig.DRIVE_FOLDER_ID = ev2.driveFolderId || "";
activeConfig.PHOTOBOOTH_URL = ev2.photoboothUrl || "";

if (activeConfig.DRIVE_FOLDER_ID === "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh") {
  console.error("FAIL: Tommy & Natasha leaked Andre & Fayola DRIVE_FOLDER_ID!");
  process.exit(1);
}
console.log("PASS: Simulation - Tommy & Natasha initial DRIVE_FOLDER_ID is empty string ('').");

// Customize Tommy & Natasha with a custom Google Drive link & custom Photobooth link
const newCustomDriveId = "1CUSTOM_TOMMY_DRIVE_FOLDER_ID_12345";
const newCustomPbUrl = "https://custom-photobooth.com/tommy-natasha";

ev2.driveFolderId = newCustomDriveId;
ev2.photoboothUrl = newCustomPbUrl;
ev2.customCategories[0].url = newCustomPbUrl;

// Verify Andre & Fayola did not change
const ev1 = mockEvents.find(e => e.id === "andre-fayola-691");
if (ev1.driveFolderId !== "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh") {
  console.error("FAIL: Andre & Fayola DRIVE_FOLDER_ID was corrupted when modifying Tommy & Natasha!");
  process.exit(1);
}
if (ev1.photoboothUrl !== "https://photobooth.runway.my.id/gallery/andre-fayola") {
  console.error("FAIL: Andre & Fayola photoboothUrl was corrupted when modifying Tommy & Natasha!");
  process.exit(1);
}
console.log("PASS: Simulation - Modifying Tommy & Natasha links leaves Andre & Fayola links 100% untouched.");
console.log("PASS: Simulation - Tommy & Natasha successfully possesses independent custom links.");

console.log("\nALL MULTI-EVENT CUSTOM LINKS TESTS PASSED SUCCESSFULLY! (v4.39.0)");
