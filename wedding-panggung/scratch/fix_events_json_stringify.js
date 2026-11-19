const fs = require('fs');

let code = fs.readFileSync('js/app.js', 'utf8');

code = code.replace(/EVENTS:\s*state\.events,/g, 'EVENTS: JSON.stringify(state.events),');

fs.writeFileSync('js/app.js', code, 'utf8');
console.log('Replaced all EVENTS: state.events with JSON.stringify(state.events)!');

