const vm = require('vm');

async function testProdScript() {
  const res = await fetch('https://gallery.runway.my.id/js/app.js?v=' + Date.now());
  const js = await res.text();
  console.log('Fetched prod js. Length:', js.length);

  // Mock DOM
  const sandbox = {
    window: { location: { search: '?event=wilson-felicia-133', origin: 'https://gallery.runway.my.id', host: 'gallery.runway.my.id', pathname: '/' }, history: { replaceState: () => {} } },
    document: {
      getElementById: (id) => {
        return {
          style: {},
          classList: { add: () => {}, remove: () => {}, contains: () => false },
          innerHTML: '',
          innerText: '',
          value: '',
          querySelectorAll: () => [],
          appendChild: () => {},
          addEventListener: () => {}
        };
      },
      querySelector: () => ({ style: {} }),
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, classList: { add: () => {} }, setAttribute: () => {} }),
      addEventListener: () => {}
    },
    localStorage: {
      getItem: (k) => null,
      setItem: (k, v) => {},
      removeItem: (k) => {}
    },
    fetch: fetch,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    URLSearchParams: URLSearchParams,
    Map: Map,
    Set: Set,
    Array: Array,
    Object: Object,
    Date: Date,
    JSON: JSON
  };
  sandbox.window.document = sandbox.document;

  try {
    vm.createContext(sandbox);
    vm.runInContext(js, sandbox);
    console.log('Script ran without parse error.');
  } catch (err) {
    console.error('Runtime error in prod script:', err);
  }
}

testProdScript().catch(console.error);

