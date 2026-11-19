const fs = require('fs');

const js = fs.readFileSync('js/app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

console.log("=== PASS 1 AUDIT: js/app.js & index.html ===");

const patterns = [
  /usr_superadmin/g,
  /123456/g,
  /ZJGYCfWbttuEG8Q67ocZs/g,
  /23d0e80056ae8f2fbb5d116f/g,
  /1GGB77clCMYBIg17J0ECr2eVbD02ZeInW/g,
  /1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5/g,
  /AF1QipN/g,
  /QkqewYw4dWfocxfK8/g,
  /1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI/g,
  /images\.unsplash\.com/g
];

patterns.forEach(p => {
  const mJs = js.match(p);
  const mHtml = html.match(p);
  if (mJs) console.log("js/app.js matches " + p + ": " + mJs.length + " times");
  if (mHtml) console.log("index.html matches " + p + ": " + mHtml.length + " times");
});

