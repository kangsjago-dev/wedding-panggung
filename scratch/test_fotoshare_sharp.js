const fs = require('fs');
const appCode = fs.readFileSync('js/app.js', 'utf8');

const sampleFotoshare = {
  id: "ZJGYCfWbttuEG8Q67ocZs", // 21 chars!
  name: "Photobooth 1",
  category: "Photobooth",
  thumbnailUrl: "https://cdn-bz-op.fotoshare.co/sample_thumb.JPG",
  previewUrl: "https://cdn-bz-op.fotoshare.co/sample_master.JPG",
  highResUrl: "https://cdn-bz-op.fotoshare.co/sample_master.JPG",
  downloadUrl: "https://cdn-bz-op.fotoshare.co/sample_master.JPG",
  isPhotobooth: true
};

const raw = sampleFotoshare.highResUrl || sampleFotoshare.previewUrl || sampleFotoshare.thumbnailUrl || sampleFotoshare.id || "";
const match = String(raw).match(/\/d\/([a-zA-Z0-9_\-]+)/) || 
              String(raw).match(/id=([a-zA-Z0-9_\-]+)/) || 
              (sampleFotoshare.id && /^[a-zA-Z0-9_\-]{20,}$/.test(sampleFotoshare.id) ? [null, sampleFotoshare.id] : null);

console.log("Match for Fotoshare photo:", match);
if (match && match[1]) {
  console.log("Result:", "https://lh3.googleusercontent.com/d/" + match[1] + "=w3200");
}

