const fs = require('fs');
const path = require('path');

// Read app.js
const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

console.log("Checking potential syntax or runtime issues in app.js...");
try {
  new Function(appJs);
  console.log("Syntax valid!");
} catch (e) {
  console.error("Syntax Error:", e);
}

