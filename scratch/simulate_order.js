const fs = require('fs');
const https = require('https');

// Let's fetch the actual items from https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40
https.get("https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40", { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const m = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) return console.log("No items");
    const rawItems = JSON.parse(m[1]);
    
    // Simulate api/kingphotobooth.js mapping:
    const origin = "https://x1.kingphotobooth.co";
    const mapped = rawItems.map((it, idx) => {
      const isVideo = Boolean(it.is_video);
      const cleanThumb = String(it.thumb || "").split("?")[0];
      const thumbUrl = cleanThumb ? (origin + cleanThumb) : "";
      let photoUrl = "";
      let videoUrl = "";
      let downloadUrl = "";

      if (cleanThumb) {
        if (isVideo) {
          videoUrl = origin + cleanThumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg$/i, ".mp4");
          photoUrl = thumbUrl;
          downloadUrl = origin + "/dl/" + it.id + ".mp4";
        } else {
          photoUrl = thumbUrl;
          downloadUrl = origin + "/dl/" + it.id + ".jpg";
        }
      }

      return {
        id: "king_" + it.id,
        name: isVideo ? ("Video Photobooth #" + (rawItems.length - idx)) : ("Photobooth #" + (rawItems.length - idx)),
        thumbnailUrl: thumbUrl,
        previewUrl: photoUrl,
        highResUrl: photoUrl,
        downloadUrl: downloadUrl,
        videoUrl: videoUrl,
        isVideo: isVideo,
        isKing: true,
        isPhotobooth: true,
        shareToken: it.share_token,
        originalWebUrl: origin + "/i/" + (it.share_token || it.id),
        timestamp: it.timestamp || it.created_at || (Date.now() - idx * 1000)
      };
    });

    console.log("Mapped count:", mapped.length);

    // Now let's see how sorting in api/kingphotobooth affects order:
    const sorted = mapped.slice().sort(function(a, b) {
      const tA = a.timestamp || 0;
      const tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });

    // Now let's check sortPhotosNewestFirst from js/core.js:
    function getPhotoTimestamp(photo) {
      if (!photo) return 0;
      if (typeof photo.timestamp === 'number' && !isNaN(photo.timestamp) && photo.timestamp > 0) {
        return photo.timestamp;
      }
      return 0;
    }

    const coreSorted = sorted.slice().sort(function(a, b) {
      const tA = getPhotoTimestamp(a);
      const tB = getPhotoTimestamp(b);
      if (tB !== tA) return tB - tA;
      const nameA = String(a.rawName || a.name || a.id || "");
      const nameB = String(b.rawName || b.name || b.id || "");
      return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
    });

    console.log("Check if coreSorted matches mapped exactly:");
    let mismatches = 0;
    for (let i = 0; i < mapped.length; i++) {
      if (mapped[i].id !== coreSorted[i].id) {
        mismatches++;
        if (mismatches <= 5) {
          console.log(`Mismatch at index ${i}: mapped[${i}] = ${mapped[i].id} (${mapped[i].name}) vs coreSorted[${i}] = ${coreSorted[i].id} (${coreSorted[i].name})`);
        }
      }
    }
    console.log("Total sorting mismatches:", mismatches);
  });
});

