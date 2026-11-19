const fs = require('fs');
const assert = require('assert');
const https = require('https');

console.log('====================================================');
console.log('🧪 VERIFIKASI SINKRONISASI DATABASE GOOGLE SHEETS');
console.log('====================================================\n');

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Verifikasi config.json
test('config.json: Memuat daftar akun admin lengkap (id, username, role, pin) & tautan sistem', () => {
  const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  assert(Array.isArray(cfg.ADMIN_ACCOUNTS) && cfg.ADMIN_ACCOUNTS.length >= 3, 'ADMIN_ACCOUNTS harus memiliki minimal 3 akun admin');
  
  const superAdmin = cfg.ADMIN_ACCOUNTS.find(a => a.username === 'admin');
  assert(superAdmin, 'Super Admin (admin) harus ada di config.json');
  assert(superAdmin.id === 'usr_superadmin', 'ID superadmin harus usr_superadmin');

  const ilham = cfg.ADMIN_ACCOUNTS.find(a => a.username === 'ilham');
  assert(ilham, 'Admin ilham harus ada di config.json');
  assert(ilham.id === 'usr_mwid2vkz_759', 'ID ilham harus usr_mwid2vkz_759');

  const wanta = cfg.ADMIN_ACCOUNTS.find(a => a.username === 'Wanta');
  assert(wanta, 'Admin Wanta harus ada di config.json');
  assert(wanta.id === 'usr_mwii1zmz_598', 'ID Wanta harus usr_mwii1zmz_598');

  assert(cfg.SPREADSHEET_URL && cfg.SPREADSHEET_URL.includes('133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20'), 'SPREADSHEET_URL harus valid');
  assert(cfg.GAS_API_URL && cfg.GAS_API_URL.startsWith('https://script.google.com/'), 'GAS_API_URL harus valid');
  assert(cfg.DRIVE_FOLDER_URL && cfg.DRIVE_FOLDER_URL.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'), 'DRIVE_FOLDER_URL harus valid');
  assert(cfg.PHOTOBOOTH_URL && cfg.PHOTOBOOTH_URL.includes('fotoshare.co'), 'PHOTOBOOTH_URL harus valid');
  assert(cfg.WEDDING_FOLDER_URL && cfg.WEDDING_FOLDER_URL.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), 'WEDDING_FOLDER_URL harus valid');
});

// 2. Verifikasi setup.gs
test('setup.gs: Memuat inisialisasi lengkap Pengaturan, Pengguna_Admin, dan Daftar_Foto', () => {
  const setup = fs.readFileSync('setup.gs', 'utf8');
  assert(setup.includes('SPREADSHEET_URL'), 'setup.gs harus memuat SPREADSHEET_URL');
  assert(setup.includes('GAS_API_URL'), 'setup.gs harus memuat GAS_API_URL');
  assert(setup.includes('DRIVE_FOLDER_URL'), 'setup.gs harus memuat DRIVE_FOLDER_URL');
  assert(setup.includes('PHOTOBOOTH_URL'), 'setup.gs harus memuat PHOTOBOOTH_URL');
  assert(setup.includes('WEDDING_FOLDER_URL'), 'setup.gs harus memuat WEDDING_FOLDER_URL');
  assert(setup.includes('usr_superadmin'), 'setup.gs harus memuat usr_superadmin');
  assert(setup.includes('usr_mwid2vkz_759'), 'setup.gs harus memuat usr_mwid2vkz_759');
  assert(setup.includes('usr_mwii1zmz_598'), 'setup.gs harus memuat usr_mwii1zmz_598');
  assert(setup.includes('Daftar_Foto'), 'setup.gs harus mengelola sheet Daftar_Foto');
  assert(!setup.includes('dummyPhotos.length'), 'Tidak boleh ada error dummyPhotos.length');
});

// 3. Verifikasi code.gs
test('code.gs: Memuat sinkronisasi Daftar_Foto pada testAndSyncDriveFolder dan saveAdminSettings', () => {
  const code = fs.readFileSync('code.gs', 'utf8');
  assert(code.includes('syncPhotosToSheet'), 'code.gs harus memanggil syncPhotosToSheet');
  assert(code.includes('ID_User", "Username", "Nama_Pengguna'), 'Pengguna_Admin di code.gs harus memuat kolom Username');
  assert(code.includes('syncAllDatabaseToSheet'), 'code.gs harus memiliki aksi API syncAllDatabaseToSheet');
});

// 4. Verifikasi live data dari Google Spreadsheet via GViz
function verifyLiveSpreadsheet() {
  const url = 'https://docs.google.com/spreadsheets/d/133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20/gviz/tq?tqx=out:json&sheet=Pengaturan&t=' + Date.now();
  https.get(url, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      test('Google Spreadsheet Live: Data Pengaturan, ID Admin, dan semua tautan sistem terisi', () => {
        const raw = data.replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
        const json = JSON.parse(raw);
        const map = {};
        json.table.rows.forEach(r => {
          if (r.c && r.c[0]) {
            map[r.c[0].v] = r.c[1] ? r.c[1].v : '';
          }
        });

        assert(map.SPREADSHEET_ID === '133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20', 'SPREADSHEET_ID harus terisi di sheet');
        assert(map.SPREADSHEET_URL && map.SPREADSHEET_URL.includes('133_po_5H36hVSwVwGm48pwREPPSowohqvPzauXSEN20'), 'SPREADSHEET_URL harus terisi di sheet');
        assert(map.GAS_API_URL && map.GAS_API_URL.startsWith('https://script.google.com/'), 'GAS_API_URL harus terisi di sheet');
        assert(map.DRIVE_FOLDER_ID === '1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5', 'DRIVE_FOLDER_ID harus terisi di sheet');
        assert(map.DRIVE_FOLDER_URL && map.DRIVE_FOLDER_URL.includes('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'), 'DRIVE_FOLDER_URL harus terisi di sheet');
        assert(map.PHOTOBOOTH_URL && map.PHOTOBOOTH_URL.includes('fotoshare.co'), 'PHOTOBOOTH_URL harus terisi di sheet');
        assert(map.WEDDING_FOLDER_URL && map.WEDDING_FOLDER_URL.includes('1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI'), 'WEDDING_FOLDER_URL harus terisi di sheet');
        assert(map.ADMIN_USERNAME === 'admin', 'ADMIN_USERNAME harus admin di sheet');
        assert(map.ADMIN_ACCOUNTS_INFO && map.ADMIN_ACCOUNTS_INFO.includes('usr_superadmin'), 'ADMIN_ACCOUNTS_INFO harus terisi di sheet');
        assert(!map.EVENTS.includes('[object Object]'), 'EVENTS tidak boleh [object Object]');
        assert(!map.COVER_SETTINGS.includes('[object Object]'), 'COVER_SETTINGS tidak boleh [object Object]');
      });

      console.log(`\n====================================================`);
      console.log(`HASIL: ${passCount} dari ${totalTests} pengujian lolos.`);
      console.log(`====================================================`);
      if (passCount !== totalTests) process.exit(1);
    });
  });
}

verifyLiveSpreadsheet();

