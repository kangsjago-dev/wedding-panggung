const fs = require('fs');

// Check config.json
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));
console.log("Config EVENTS:", cfg.EVENTS);

