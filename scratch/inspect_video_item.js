const https = require('https');

const url = "https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40";

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (m) {
      const items = JSON.parse(m[1]);
      console.log("Item 0 (is_video true):", items[0]);
      console.log("Item 1 (is_video false):", items[1]);
      
      // Let's check single view of item 0 (share_token: items[0].share_token)
      https.get(`https://x1.kingphotobooth.co/i/${items[0].share_token}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r0 => {
        let b0 = '';
        r0.on('data', c => b0 += c);
        r0.on('end', () => {
          console.log("=== Single view for Item 0 (video) ===");
          const vidMatch = b0.match(/<video[^>]*>[\s\S]*?<\/video>/i) || b0.match(/<video[^>]*>/i);
          console.log("Video tag:", vidMatch ? vidMatch[0] : "No video tag");
          const dlMatch = b0.match(/href=["'](\/dl\/[^"']+)["']/g);
          console.log("DL links in Item 0:", dlMatch);
          const srcMatches = b0.match(/src=["']([^"']+)["']/g);
          console.log("src matches in Item 0:", srcMatches);
        });
      });

      // Let's check single view of item 1 (photo)
      https.get(`https://x1.kingphotobooth.co/i/${items[1].share_token}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r1 => {
        let b1 = '';
        r1.on('data', c => b1 += c);
        r1.on('end', () => {
          console.log("=== Single view for Item 1 (photo) ===");
          const vidMatch1 = b1.match(/<video[^>]*>[\s\S]*?<\/video>/i) || b1.match(/<video[^>]*>/i);
          console.log("Video tag:", vidMatch1 ? vidMatch1[0] : "No video tag");
          const dlMatch1 = b1.match(/href=["'](\/dl\/[^"']+)["']/g);
          console.log("DL links in Item 1:", dlMatch1);
          const srcMatches1 = b1.match(/src=["']([^"']+)["']/g);
          console.log("src matches in Item 1:", srcMatches1);
        });
      });
    }
  });
});

