const https = require('https');

function checkPage(token, label) {
  https.get(`https://x1.kingphotobooth.co/i/${token}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => {
      const vid = b.match(/<video[^>]*src=["']([^"']+)["'][^>]*>/i);
      const img = b.match(/<img[^>]*class=["']ph-media["'][^>]*src=["']([^"']+)["'][^>]*>/i);
      console.log(`[${label}] token: ${token}`);
      if (vid) console.log(`  VIDEO src: ${vid[1]}`);
      if (img) console.log(`  IMG src: ${img[1]}`);
    });
  });
}

checkPage('8e381a55', 'Item 0 (family)');
checkPage('7bc4d7d1', 'Item 1 (strip 1)');
checkPage('8ee257f5', 'Item 2 (strip 2)');
checkPage('81d939cb', 'Item 3 (lady)');

