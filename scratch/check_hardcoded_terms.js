const fs = require('fs');

const js = fs.readFileSync('js/app.js', 'utf8');
const lines = js.split('\n');

const patterns = [
  '1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5',
  'QkqewYw4dWfocxfK8',
  '1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI',
  '1GGB77clCMYBIg17J0ECr2eVbD02ZeInW'
];

patterns.forEach(term => {
  lines.forEach((l, i) => {
    if (l.includes(term)) console.log(term + ' -> line ' + (i+1) + ': ' + l.trim());
  });
});

