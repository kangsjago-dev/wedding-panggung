const fs = require('fs');
let code = fs.readFileSync('code.gs', 'utf8');

let changed = false;
if (code.includes('DEFAULT_ADMIN_PIN = "123456"')) {
  code = code.replace('DEFAULT_ADMIN_PIN = "123456"', 'DEFAULT_ADMIN_PIN = "111111"');
  changed = true;
}
if (code.includes('props.getProperty("ADMIN_PIN") || WEDDING_CONFIG.DEFAULT_ADMIN_PIN || "123456"')) {
  code = code.replace('props.getProperty("ADMIN_PIN") || WEDDING_CONFIG.DEFAULT_ADMIN_PIN || "123456"', 'props.getProperty("ADMIN_PIN") || WEDDING_CONFIG.DEFAULT_ADMIN_PIN || "111111"');
  changed = true;
}

if (changed) {
  fs.writeFileSync('code.gs', code, 'utf8');
  console.log('Updated code.gs DEFAULT_ADMIN_PIN to 111111');
} else {
  console.log('code.gs already has correct pin');
}

