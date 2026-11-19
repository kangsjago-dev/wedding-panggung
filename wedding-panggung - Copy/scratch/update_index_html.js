const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

console.log('Original index.html length:', html.length);

// 1. Remove <section id="weddingCoverSection" ...>
const coverSecRegex = /\s*<!-- Wedding Front Page Cover Showcase[\s\S]*?<\/section>/;
if (coverSecRegex.test(html)) {
  html = html.replace(coverSecRegex, '');
  console.log('Removed weddingCoverSection!');
} else {
  console.log('weddingCoverSection not found by regex');
}

// 2. Remove tabBtn-cover
const coverTabBtnRegex = /\s*<button type="button" class="admin-tab-btn" id="tabBtn-cover"[\s\S]*?<\/button>/;
if (coverTabBtnRegex.test(html)) {
  html = html.replace(coverTabBtnRegex, '');
  console.log('Removed tabBtn-cover!');
} else {
  console.log('tabBtn-cover not found by regex');
}

// 3. Remove tabPane-cover
const coverPaneStart = html.indexOf('<div class="admin-tab-pane" id="tabPane-cover">');
if (coverPaneStart !== -1) {
  // Find closing </div> of tabPane-cover before <!-- Tab 3: Foto & Kategori -->
  const tab3Start = html.indexOf('<!-- Tab 3: Foto & Kategori', coverPaneStart);
  if (tab3Start !== -1) {
    const paneSlice = html.substring(coverPaneStart, tab3Start);
    // Find the last </div> before tab3Start
    const lastCloseDiv = paneSlice.lastIndexOf('</div>');
    if (lastCloseDiv !== -1) {
      html = html.substring(0, coverPaneStart) + html.substring(coverPaneStart + lastCloseDiv + 6);
      console.log('Removed tabPane-cover successfully!');
    }
  }
}

// 4. Remove fallback texts in slideshow watermark and share modal
html = html.replace(
  '<h2 id="slideshowCouple">Wilson & Felicia</h2>',
  '<h2 id="slideshowCouple"></h2>'
);
html = html.replace(
  '<p id="slideshowCategory">14 November 2026 • Upperhills Convention Centre, Makassar</p>',
  '<p id="slideshowCategory"></p>'
);
html = html.replace(
  '<div class="share-event-title" id="shareEventTitle">Wilson & Felicia</div>',
  '<div class="share-event-title" id="shareEventTitle"></div>'
);
html = html.replace(
  '<div class="share-event-venue" id="shareEventVenue">UpperHills Convention Hall, Makassar</div>',
  '<div class="share-event-venue" id="shareEventVenue"></div>'
);

// 5. Update promptAddNewEvent() call to openNewEventModal() and add Buka Home button
html = html.replace(
  'onclick="promptAddNewEvent()"',
  'onclick="openNewEventModal()"'
);

// Add Buka Home Event button next to Salin Tautan Event if not exists
const copyBtnNeedle = '<button type="button" class="btn btn-outline" onclick="copyActiveEventUrl()"';
if (html.includes(copyBtnNeedle) && !html.includes('openActiveEventHome()')) {
  const openHomeBtn = `<button type="button" class="btn btn-outline" onclick="openActiveEventHome()" style="font-size: 0.76rem; padding: 4px 10px; border-color: #CBD5E1; color: #1E293B; display: inline-flex; align-items: center; gap: 4px;" title="Buka halaman utama event ini di tab baru">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                <span>Buka Home</span>
              </button>
              ` + copyBtnNeedle;
  html = html.replace(copyBtnNeedle, openHomeBtn);
  console.log('Added Buka Home Event button!');
}

// 6. Add modalNewEvent before closing </body>
const newEventModalHtml = `
  <!-- Modal Tambah Event Baru dengan Date Picker Native (Tanpa Browser Prompt) -->
  <div id="modalNewEvent" class="admin-modal-overlay" style="z-index: 10500;">
    <div class="admin-card" style="max-width: 500px; margin: 20px auto;">
      <div class="admin-card-header">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
          </svg>
          <span>Tambah Event / Acara Baru</span>
        </h3>
        <button type="button" class="ctrl-icon-btn" onclick="closeNewEventModal()" style="width: 32px; height: 32px;" title="Tutup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="admin-card-body" style="padding: 16px;">
        <div class="admin-field-group" style="margin-bottom: 12px;">
          <label class="admin-label" for="neEventName">Nama Pasangan / Acara <span style="color: #EF4444;">*</span></label>
          <input type="text" id="neEventName" class="admin-input" placeholder="Contoh: Romeo & Juliet" required>
        </div>

        <div class="admin-field-group" style="margin-bottom: 12px;">
          <label class="admin-label" for="neEventDate">Tanggal Acara (Pilih Kalender) <span style="color: #EF4444;">*</span></label>
          <input type="date" id="neEventDate" class="admin-input" onclick="try{this.showPicker()}catch(e){}" style="cursor: pointer;" required>
        </div>

        <div class="admin-field-group" style="margin-bottom: 12px;">
          <label class="admin-label" for="neEventVenue">Venue / Lokasi Acara</label>
          <input type="text" id="neEventVenue" class="admin-input" placeholder="Contoh: Grand Ballroom Hotel Mulia, Jakarta">
        </div>

        <div class="admin-field-group" style="margin-bottom: 12px;">
          <label class="admin-label" for="neDriveFolderId">Tautan / Folder ID Google Drive (Opsional)</label>
          <input type="text" id="neDriveFolderId" class="admin-input" placeholder="ID folder atau URL Google Drive">
        </div>

        <div class="admin-field-group" style="margin-bottom: 14px;">
          <label class="admin-label" for="nePhotoboothUrl">Tautan Vendor Photobooth (Opsional)</label>
          <input type="text" id="nePhotoboothUrl" class="admin-input" placeholder="https://fotoshare.co/... atau link Google Photos">
        </div>

        <div id="neAlertBox" class="admin-alert-box" style="display: none; margin-bottom: 12px;"></div>
      </div>

      <div class="admin-card-footer" style="display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;">
        <button type="button" class="btn btn-outline" onclick="closeNewEventModal()" style="font-size: 0.85rem; padding: 8px 16px;">Batal</button>
        <button type="button" class="btn btn-gold" onclick="confirmAddNewEvent()" style="font-size: 0.85rem; padding: 8px 18px;">
          <span>+ Buat & Simpan Event</span>
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="modalNewEvent"')) {
  html = html.replace('</body>', newEventModalHtml + '\n</body>');
  console.log('Added modalNewEvent to index.html!');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html, new length:', html.length);

