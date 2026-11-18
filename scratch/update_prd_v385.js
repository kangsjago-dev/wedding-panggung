const fs = require('fs');
let prd = fs.readFileSync('prd.md', 'utf8');

const logEntry = `
## Catatan Rilis & Verifikasi v3.8.5 (19 November 2026)
- **Modal Tambah Event Baru dengan Native Date Picker:** Dialog browser bawaan \`prompt()\` digantikan dengan modal UI terpadu berisikan kalender native HTML5 (\`<input type="date">\`). Tanggal yang dipilih otomatis terformat rapi dalam bahasa Indonesia.
- **Isolasi Mutlak Multi-Event & Dedicated Home Link:** Setiap event memiliki tautan home mandiri (\`/?event=id_event\`), folder Google Drive terisolasi, tautan vendor photobooth tersendiri, dan daftar kategori independen. Menambahkan tombol "Buka Home" dan "Salin Link" di panel admin.
- **Pembersihan Total Fallback Statis:** Mengosongkan teks watermark slideshow, teks modal share, serta string default di \`formatIndonesianDate\` dan \`code.gs\`. Data kini murni 100% dibaca realtime dari Google Spreadsheet \`Pengaturan\`.
- **Penghapusan Fitur Cover Depan:** Menghapus tab, panel admin, dan seksi \`weddingCoverSection\` secara menyeluruh dari seluruh berkas projek.
`;

prd += logEntry;
fs.writeFileSync('prd.md', prd, 'utf8');
console.log('Appended v3.8.5 to prd.md');

