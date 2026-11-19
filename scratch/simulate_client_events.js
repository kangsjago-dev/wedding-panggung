const https = require('https');

// Simulate client loading for ?event=wilson-felicia-133
async function simulateClient(eventId) {
  console.log(`\n=== SIMULATING CLIENT FOR: ?event=${eventId} ===`);
  
  // Step 1: config.json
  const configRes = await fetch('https://gallery.runway.my.id/config.json?v=' + Date.now());
  const config = await configRes.json();
  console.log('1. config.json loaded. Events in config:', config.EVENTS ? config.EVENTS.map(e => e.id) : []);

  // Step 2: GViz Pengaturan
  const gvizRes = await fetch('https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/gviz/tq?tqx=out:json&sheet=Pengaturan&t=' + Date.now());
  const gvizText = await gvizRes.text();
  const raw = gvizText.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
  const parsed = JSON.parse(raw);
  const sheetMap = {};
  parsed.table.rows.forEach(r => {
    const k = r.c && r.c[0] ? r.c[0].v : '';
    const v = r.c && r.c[1] ? r.c[1].v : '';
    if (k) sheetMap[k] = v;
  });
  console.log('2. GViz loaded. ACTIVE_EVENT_ID in sheet:', sheetMap.ACTIVE_EVENT_ID);
  const sheetEvents = sheetMap.EVENTS ? JSON.parse(sheetMap.EVENTS) : [];
  console.log('   Events in sheet:', sheetEvents.map(e => e.id));

  // Step 3: Match event
  let matched = sheetEvents.find(e => e.id === eventId);
  console.log('3. Matched event:', matched ? matched.id : 'NOT FOUND!');
  if (matched) {
    console.log('   Event Name:', matched.name);
    console.log('   Drive Folder:', matched.driveFolderId);
    console.log('   Photobooth URL:', matched.photoboothUrl);
    console.log('   Custom Categories:', matched.customCategories);
  }

  // Step 4: /api/drive-folder
  if (matched && matched.driveFolderId) {
    let cleanFolderId = matched.driveFolderId;
    const m = cleanFolderId.match(/folders\/([a-zA-Z0-9_\-]+)/);
    if (m && m[1]) cleanFolderId = m[1];
    console.log('4. Calling /api/drive-folder with folderId:', cleanFolderId);
    const driveRes = await fetch(`https://gallery.runway.my.id/api/drive-folder?folderId=${encodeURIComponent(cleanFolderId)}&category=Semua%20Foto`);
    const driveData = await driveRes.json();
    console.log('   /api/drive-folder success:', driveData.success, 'photos count:', driveData.photos ? driveData.photos.length : 0);
  }

  // Step 5: GAS API
  const gasUrl = config.GAS_API_URL || sheetMap.GAS_API_URL;
  console.log('5. Calling GAS API getGalleryData for eventId:', eventId);
  const gasRes = await fetch(`${gasUrl}?action=getGalleryData&eventId=${encodeURIComponent(eventId)}&api=true`);
  const gasData = await gasRes.json();
  console.log('   GAS API success:', gasData.success);
  console.log('   GAS API config.EVENT_NAME:', gasData.config ? gasData.config.EVENT_NAME : null);
  console.log('   GAS API config.ACTIVE_EVENT_ID:', gasData.config ? gasData.config.ACTIVE_EVENT_ID : null);
  console.log('   GAS API config.DRIVE_FOLDER_ID:', gasData.config ? gasData.config.DRIVE_FOLDER_ID : null);
  console.log('   GAS API photos count:', gasData.photos ? gasData.photos.length : 0);
}

async function run() {
  await simulateClient('wilson-felicia-133');
  await simulateClient('wilson-felicia');
  await simulateClient('andre-fayola-281');
}

run().catch(console.error);

