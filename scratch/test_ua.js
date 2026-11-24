const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function testUrl(url, extraHeaders, label) {
  return new Promise(resolve => {
    const headers = Object.assign({ 'User-Agent': UA }, extraHeaders);
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
  const cleanThumb = "https://x1.kingphotobooth.co/storage/thumbs/77/5580b5a8de3a41088dbc8f92.jpg";
  const signedThumb = "https://x1.kingphotobooth.co/storage/thumbs/77/5580b5a8de3a41088dbc8f92.jpg?e=1795565601&s=71244eaf3d3c873c2c521af4c1b1c310";
  const signedVideo = "https://x1.kingphotobooth.co/storage/photos/77/5580b5a8de3a41088dbc8f92.mp4?e=1795565722&s=b041392d77101c0e4ada851a90ca8c1e";
  const cleanVideo = "https://x1.kingphotobooth.co/storage/photos/77/5580b5a8de3a41088dbc8f92.mp4";

  await testUrl(cleanThumb, {}, "Clean thumb with UA");
  await testUrl(signedThumb, {}, "Signed thumb with UA");
  await testUrl(cleanVideo, {}, "Clean video with UA");
  await testUrl(signedVideo, {}, "Signed video with UA");
}

run();

