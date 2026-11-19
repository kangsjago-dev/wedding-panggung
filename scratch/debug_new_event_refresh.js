const fs = require('fs');
const path = require('path');

// Simulate the browser environment
console.log("=== SIMULASI ALUR REFRESH EVENT BARU DIBUAT ===");

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

// Check what happens in initApp with a new event id
const newEventId = "cinta-kasih-482";

console.log("Target event ID:", newEventId);

// Check if state.events is loaded from localStorage before config.json
const hasLoadEventsFromStorage = appJs.includes('localStorage.getItem("WEDDING_EVENTS_REGISTRY")');
console.log("Has WEDDING_EVENTS_REGISTRY in app.js:", hasLoadEventsFromStorage);

// Check where WEDDING_EVENTS_REGISTRY is read in app.js
const lines = appJs.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('WEDDING_EVENTS_REGISTRY')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

