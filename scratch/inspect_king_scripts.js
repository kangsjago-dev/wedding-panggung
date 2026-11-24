const https = require('https');

https.get("https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40", { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const scripts = b.match(/<script[\s\S]*?<\/script>/gi);
    console.log("Total script tags:", scripts ? scripts.length : 0);
    if (scripts) {
      scripts.forEach((s, idx) => {
        // print summary of each script
        console.log(`Script ${idx} length: ${s.length}, snippet: ${s.substring(0, 150).replace(/\n/g, ' ')}`);
        // if script contains function or modal
        if (s.includes("openModal") || s.includes("lightbox") || s.includes("play") || s.includes("click") || s.includes("video")) {
          // find occurrences
          const lines = s.split('\n');
          console.log(`Matching lines in Script ${idx}:`);
          lines.forEach((l, li) => {
            if (/modal|video|click|thumb|preview|photo|storage/i.test(l) && !l.includes("ITEMS = [")) {
              console.log(`  L${li}: ${l.trim().substring(0, 120)}`);
            }
          });
        }
      });
    }
  });
});
