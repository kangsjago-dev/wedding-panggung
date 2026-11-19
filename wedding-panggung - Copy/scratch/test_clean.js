const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

const cleanApp = app.substring(81113);
console.log('cleanApp length:', cleanApp.length);
console.log('First 200 chars:');
console.log(cleanApp.substring(0, 200));
console.log('Last 200 chars:');
console.log(cleanApp.substring(cleanApp.length - 200));

fs.writeFileSync('scratch/candidate_app.js', cleanApp, 'utf8');

