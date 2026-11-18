const fs = require('fs');

let setupGs = fs.readFileSync('setup.gs', 'utf8');
setupGs = setupGs.replace(/Wilson & Felicia/g, 'Andre & Fayola');
setupGs = setupGs.replace(/14 November 2026/g, '22 November 2026');
setupGs = setupGs.replace(/16 November 2026/g, '22 November 2026');
setupGs = setupGs.replace(/17 November 2026/g, '22 November 2026');
setupGs = setupGs.replace(/Upperhills Convention Centre, Makassar/g, 'UPPERHILLS CONVENTION HALLS');
setupGs = setupGs.replace(/UpperHills Convention Hall, Makassar/g, 'UPPERHILLS CONVENTION HALLS');
setupGs = setupGs.replace(/wilson-felicia/g, 'andre-fayola-281');

fs.writeFileSync('setup.gs', setupGs, 'utf8');
console.log('Fixed setup.gs defaults');

