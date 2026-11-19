const fs = require('fs');

const appJs = fs.readFileSync('js/app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log('=== AUDIT MULTI-EVENT & DEDICATED HOME SCREEN PER LINK ===');

// 1. Verify config.json has both events with proper dedicated homeUrl and driveFolderId
console.log('\n1. Checking config.json events:');
if (Array.isArray(configJson.EVENTS) && configJson.EVENTS.length >= 2) {
  configJson.EVENTS.forEach(ev => {
    console.log(`- Event [${ev.id}]: name="${ev.name}", date="${ev.date}", homeUrl="${ev.homeUrl}", folder="${ev.driveFolderId}"`);
  });
} else {
  console.error('❌ config.json does not have 2 events!');
}

// 2. Verify index.html has activeEventUrlInput, activeEventBadgeTag, openActiveEventHome, copyActiveEventUrl
console.log('\n2. Checking index.html UI elements:');
const htmlChecks = [
  'id="adminEventSelect"',
  'id="activeEventUrlInput"',
  'id="activeEventBadgeTag"',
  'onclick="copyActiveEventUrl()"',
  'onclick="openActiveEventHome()"'
];
htmlChecks.forEach(hc => {
  const ok = indexHtml.includes(hc);
  console.log(`- ${hc}: ${ok ? '✓ OK' : '❌ MISSING'}`);
});

// 3. Verify js/app.js functions
console.log('\n3. Checking js/app.js functions & handlers:');
const jsChecks = [
  'function renderAdminEventsManager()',
  'function handleSelectEventChange(selectedId)',
  'function openActiveEventHome()',
  'function copyActiveEventUrl()',
  'function confirmAddNewEvent()',
  'activeEventUrlInput.value = fullHomeUrl',
  'window.history.replaceState({ eventId:',
  'localStorage.setItem("WEDDING_EVENT_PHOTOS_"'
];
jsChecks.forEach(jc => {
  const ok = appJs.includes(jc);
  console.log(`- ${jc}: ${ok ? '✓ OK' : '❌ MISSING'}`);
});

console.log('\n=== AUDIT COMPLETE ===');

