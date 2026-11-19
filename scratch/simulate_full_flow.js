const fs = require('fs');
const https = require('https');

async function run() {
  console.log("1. Starting simulation of syncFromSpreadsheetGViz...");
  const sid = "133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20";
  const gvizUrl = "https://docs.google.com/spreadsheets/d/" + sid + "/gviz/tq?tqx=out:json&sheet=Pengaturan&t=" + Date.now();

  const gvizRes = await new Promise((resolve, reject) => {
    https.get(gvizUrl, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });

  const raw = gvizRes.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
  const parsed = JSON.parse(raw);
  const sheetMap = {};
  parsed.table.rows.forEach(row => {
    const k = row.c && row.c[0] ? String(row.c[0].v || '').trim() : '';
    const v = row.c && row.c[1] ? String(row.c[1].v || '').trim() : '';
    if (k) sheetMap[k] = v;
  });

  console.log("   SheetMap EVENTS exists:", Boolean(sheetMap.EVENTS));
  const parsedEvs = JSON.parse(sheetMap.EVENTS);
  console.log("   SheetMap EVENTS count:", parsedEvs.length);

  // Now simulate fetchGalleryData:
  const activeEv = parsedEvs.find(e => e.id === "tommy-natasha-594");
  console.log("   Active Event in sheet:", activeEv.name, "Drive Folder:", activeEv.driveFolderId);

  // In fetchGalleryData:
  // Step A: fetch("/api/drive-folder?folderId=...")
  console.log("2. Simulating fetchGalleryData...");
  const folderMatch = (activeEv.driveFolderId || '').match(/folders\/([a-zA-Z0-9_\-]+)/);
  const folderId = (folderMatch && folderMatch[1]) ? folderMatch[1] : activeEv.driveFolderId;

  console.log("   Calling https://gallery.runway.my.id/api/drive-folder with folderId:", folderId);
  const driveApiUrl = "https://gallery.runway.my.id/api/drive-folder?folderId=" + encodeURIComponent(folderId) + "&category=Semua%20Foto";
  
  const driveData = await new Promise((resolve, reject) => {
    https.get(driveApiUrl, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });

  console.log("   /api/drive-folder returned:", driveData);

  // What does js/app.js do with this driveData?
  // lines 1118-1132:
  // if (data && data.success && Array.isArray(data.photos)) {
  //   handleGalleryResponse({ success: true, ... photos: data.photos })
  // }
  console.log("3. Passing to handleGalleryResponse...");
  const photos = driveData.photos || [];
  console.log("   photos length:", photos.length);

  // In handleGalleryResponse:
  // lines 1282-1294:
  // if (sortedIncoming.length === 0) {
  //   state.allPhotos = [];
  //   state.filteredPhotos = [];
  //   renderCategoryTabs();
  //   applyCategoryFilter(state.activeCategory || mainCat);
  //   return;
  // }
  console.log("   sortedIncoming length is 0!");
  console.log("   Calling renderCategoryTabs() and applyCategoryFilter()...");

  // What does applyCategoryFilter do?
  // If effectiveCat is "Semua Foto" (or mainLabel):
  // state.filteredPhotos = state.allPhotos ([]);
  // renderPhotoGrid(targetUrl, effectiveCat);
  console.log("   applyCategoryFilter calls renderPhotoGrid(targetUrl, effectiveCat)");

  // Inside renderPhotoGrid:
  // if (!state.filteredPhotos || state.filteredPhotos.length === 0) {
  //   grid.innerHTML = <div class="empty-gallery-card">...</div>
  // }
  console.log("   renderPhotoGrid sets empty-gallery-card!");

  // BUT WAIT! What else ran in parallel?
  // Let's check what renderCategoryTabs did!
  // In renderCategoryTabs (lines 1704-1707):
  // if (targetUrl || driveFolderId) {
  //   prefetchCategoryPhotos(cat, targetUrl);
  // }
  console.log("4. Checking background tasks from renderCategoryTabs...");
  console.log("   Custom categories for tommy-natasha-594:", activeEv.customCategories);
  const pbCat = (activeEv.customCategories || []).find(c => c.name === "Photobooth" || c.isPhotobooth);
  if (pbCat) {
    console.log("   Photobooth category URL:", pbCat.url);
    console.log("   prefetchCategoryPhotos calls fetchGooglePhotos for url:", pbCat.url);
  }
}

run().catch(console.error);

