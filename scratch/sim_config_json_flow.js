const fs = require('fs');

const configJson = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const explicitUrl = "tommy-natasha-594";

const state = {
  events: []
};

// Simulate line 646:
if (Array.isArray(configJson.EVENTS)) {
  const evMap = new Map();
  (state.events || []).forEach(function(e) { if (e && e.id) evMap.set(e.id, e); });
  configJson.EVENTS.forEach(function(e) {
    if (e && e.id) {
      const prev = evMap.get(e.id) || {};
      evMap.set(e.id, Object.assign({}, prev, e));
    }
  });
  state.events = Array.from(evMap.values());
}

console.log("state.events IDs:", state.events.map(e => e.id));

let matchedEv = state.events.find(function(ev) { 
  if (!ev || !ev.id) return false;
  const eId = String(ev.id).toLowerCase().trim();
  const curId = String(explicitUrl).toLowerCase().trim();
  return eId === curId || eId.startsWith(curId) || curId.startsWith(eId) || eId.replace(/-\d+$/, '') === curId.replace(/-\d+$/, ''); 
});

console.log("matchedEv in config.json:", matchedEv);

if (!matchedEv) {
  console.log("==> showEventNotFoundScreen(true, explicitUrl) WAS CALLED!");
  console.log("==> RETURN FROM .then()");
}

