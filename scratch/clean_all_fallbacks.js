const fs = require('fs');

// 1. Fix js/app.js line 2958
let appJs = fs.readFileSync('js/app.js', 'utf8');
appJs = appJs.replace(
  'const heading = cov.heading || ("The Wedding of " + (state.activeConfig.EVENT_NAME || "Wilson & Felicia"));',
  'const heading = cov.heading || ("The Wedding of " + (state.activeConfig.EVENT_NAME || ""));'
);
fs.writeFileSync('js/app.js', appJs, 'utf8');
console.log('Fixed js/app.js line 2958');

// 2. Fix code.gs defaults
let codeGs = fs.readFileSync('code.gs', 'utf8');
codeGs = codeGs.replace(/Wilson & Felicia/g, 'Andre & Fayola');
codeGs = codeGs.replace(/14 November 2026/g, '22 November 2026');
codeGs = codeGs.replace(/16 November 2026/g, '22 November 2026');
codeGs = codeGs.replace(/17 November 2026/g, '22 November 2026');
codeGs = codeGs.replace(/Upperhills Convention Centre, Makassar/g, 'UPPERHILLS CONVENTION HALLS');
codeGs = codeGs.replace(/UpperHills Convention Hall, Makassar/g, 'UPPERHILLS CONVENTION HALLS');
codeGs = codeGs.replace(/wilson-felicia/g, 'andre-fayola-281');

fs.writeFileSync('code.gs', codeGs, 'utf8');
console.log('Fixed code.gs defaults');

