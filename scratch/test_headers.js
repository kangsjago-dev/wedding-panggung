const https = require('https');

function testUrl(url, headers, label) {
  return new Promise(resolve => {
    https.get(url, { headers }, res => {
      console.log(`[${label}] status: ${res.statusCode}`);
      resolve(res.statusCode);
    }).on('error', err => {
      console.log(`[${label}] error: ${err.message}`);
      resolve(null);
    });
  });
}

async function run() {
  const thumbUrl = "https://x1.kingphotobooth.co/storage/thumbs/77/5580b5a8de3a41088dbc8f92.jpg";
  const signedThumb = "https://x1.kingphotobooth.co/storage/thumbs/77/5580b5a8de3a41088dbc8f92.jpg?e=1795565601&s=71244eaf3d3c873c2c521af4c1b1c310";
  const videoUrl = "https://x1.kingphotobooth.co/storage/photos/77/5580b5a8de3a41088dbc8f92.mp4?e=1795565722&s=b041392d77101c0e4ada851a90ca8c1e";

  await testUrl(thumbUrl, {}, "Thumb no header");
  await testUrl(thumbUrl, { "Referer": "https://x1.kingphotobooth.co/" }, "Thumb with Referer");
  await testUrl(signedThumb, {}, "Signed thumb no header");
  await testUrl(signedThumb, { "Referer": "https://x1.kingphotobooth.co/" }, "Signed thumb with Referer");
  await testUrl(videoUrl, {}, "Signed video no header");
  await testUrl(videoUrl, { "Referer": "https://x1.kingphotobooth.co/" }, "Signed video with Referer");
}

run();

