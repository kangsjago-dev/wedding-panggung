const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('setup.gs', 'utf8');
const lines = content.split('\n');

const banner = lines.slice(0, 8).join('\n');
const diagPart = lines.slice(8, 122).join('\n');
const setupFn = lines.slice(122, 439).join('\n');
const tailPart = lines.slice(439).join('\n');

const guideBanner = `/**
 * ================================================================================
 * PANDUAN CEPAT MEMBUAT & MENGISI DATABASE SPREADSHEET (ERP MASTER DATA)
 * ================================================================================
 * 1. Buka Google Apps Script editor di https://script.google.com/
 * 2. Pilih project Web App Anda (ID: AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l)
 * 3. Buka file 'setup.gs' (atau buat file baru 'setup.gs' dan paste seluruh isi file ini).
 * 4. Pastikan dropdown fungsi di toolbar atas memilih: 'setupTargetSpreadsheetDatabase'
 * 5. Klik tombol '▶️ Run' (Jalankan).
 * 6. Berikan izin akses (Review Permissions -> Lanjutkan) jika Google meminta konfirmasi.
 * 
 * HASIL LANGSUNG PADA GOOGLE SPREADSHEET (133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20):
 * - Sheet 'Daftar_Acara' : Terformat sebagai ERP Master Table 10 kolom dengan data event lengkap.
 * - Sheet 'Pengaturan'   : Berisi 26 parameter konfigurasi global sistem.
 * - Sheet 'Pengguna_Admin': Terisi 3 akun admin (Super Admin, ilham, Wanta).
 * - Sheet 'Daftar_Foto'  : Otomatis membaca & mencatat foto Google Drive Anda.
 * - Sheet 'Log_Aktivitas': Mencatat audit trail inisialisasi awal.
 * ================================================================================
 */\n`;

const newContent = banner + '\n\n' + guideBanner + '\n' + setupFn + '\n\n' + diagPart + '\n\n' + tailPart;

try {
  new vm.Script(newContent);
  console.log('Reordered setup.gs syntax PASSED');
  fs.writeFileSync('setup.gs', newContent, 'utf8');
  console.log('setup.gs updated successfully');
} catch (e) {
  console.error('Syntax error:', e);
}

