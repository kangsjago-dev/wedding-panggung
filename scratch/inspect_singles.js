const https = require('https');

function fetchPage(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(b));
    });
  });
}

async function inspect() {
  const p0 = await fetchPage("https://x1.kingphotobooth.co/i/8e381a55");
  const p1 = await fetchPage("https://x1.kingphotobooth.co/i/7bc4d7d1");

  console.log("=== Item 0 (8e381a55) ===");
  const m0 = p0.match(/<(video|img)[^>]*class=["']ph-media["'][^>]*>/gi);
  console.log("Media tags:", m0);
  const dl0 = p0.match(/<a[^>]*href=["'][^"']*\/dl\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi);
  console.log("Download links:", dl0);

  console.log("=== Item 1 (7bc4d7d1) ===");
  const m1 = p1.match(/<(video|img)[^>]*class=["']ph-media["'][^>]*>/gi);
  console.log("Media tags:", m1);
  const dl1 = p1.match(/<a[^>]*href=["'][^"']*\/dl\/[^"']*["'][^>]*>[\s\S]*?<\/a>/gi);
  console.log("Download links:", dl1);
}

inspect();

