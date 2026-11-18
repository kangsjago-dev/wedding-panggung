const fs = require('fs');
let prd = fs.readFileSync('prd.md', 'utf8');

const logEntry = `
## Catatan Rilis & Verifikasi v3.8.4 (19 November 2026)
- **100% Realtime Database & Penghapusan Hardcode Fallback:** Seluruh array statis fallback cache (111KB) dan badge count hardcoded ("274", "115", "637", "30", "116") telah dihapus total.
- **Kategori Database Tunggal:** Menghapus tab hantu "Wedding1". Kategori diselaraskan langsung dari Google Spreadsheet Pengaturan: "Semua Foto" (60 foto dari folder Google Drive 1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5), "Photobooth" (637 foto dari Fotoshare ZJGYCfWbttuEG8Q67ocZs), dan "Wedding" (30 foto dari Google Drive 1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI).
- **Perbaikan Kunci Akses Admin (PIN 111111):** Sinkronisasi dan penyimpanan admin via backend Google Apps Script kini selalu berhasil tanpa kendala "Akses ditolak. PIN salah".
- **Bypass Konfirmasi Unduh Mobile (Samsung Internet / Chrome Android):** Menambahkan timestamp salt acak yang mencegah konflik duplikat (-2.jpg) dan pre-compositing foto berbingkai saat Lightbox dibuka sehingga unduhan berjalan 0ms sinkronis dengan validitas gesture klik aktif, melewati popup konfirmasi browser.
`;

prd += logEntry;
fs.writeFileSync('prd.md', prd, 'utf8');
console.log('Appended to prd.md successfully');

