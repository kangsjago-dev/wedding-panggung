const https = require('https');

// Item 0: id 12063, share_token: '8e381a55'
// Item 1: id 12062, share_token: '7bc4d7d1'
// Item 2: id 12061, share_token: '6d12354c'
// Let's inspect the HTML of both single view pages in detail!

function fetchPage(token) {
  https.get(`https://x1.kingphotobooth.co/i/${token}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      console.log(`\n=== PAGE FOR TOKEN ${token} ===`);
      const title = b.match(/<title>([^<]+)<\/title>/i);
      console.log("Title:", title ? title[1] : "");
      const metaOg = b.match(/<meta property="og:[^"]+" content="([^"]+)"/g);
      console.log("Meta OG:", metaOg);
      const media = b.match(/<(?:video|img)[^>]+class="ph-media"[^>]*>/g);
      console.log("ph-media elements:", media);
      const dl = b.match(/<a[^>]+id="ph-dl-link"[^>]*>/g);
      console.log("Download link:", dl);
    });
  });
}

fetchPage('8e381a55');
fetchPage('7bc4d7d1');

