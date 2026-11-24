const fs = require('fs');

// Simulate Kingphotobooth API mapping
const https = require('https');

https.get("https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40", { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const match = b.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    const rawItems = JSON.parse(match[1]);
    const origin = "https://x1.kingphotobooth.co";

    const photos = rawItems.map(function(it, idx) {
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
        category: "Photobooth",
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

    console.log("=== RAW MAPPED (first 6) ===");
    photos.slice(0, 6).forEach((p, i) => console.log(`[${i}] ${p.id} | isVideo: ${p.isVideo} | ${p.name}`));

    // Now test sort in api/kingphotobooth.js
    photos.sort(function(a, b) {
      const tA = a.timestamp || 0;
      const tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });
    console.log("=== AFTER api/kingphotobooth.js sort (first 6) ===");
    photos.slice(0, 6).forEach((p, i) => console.log(`[${i}] ${p.id} | isVideo: ${p.isVideo} | ${p.name}`));

    // Now test sortPhotosNewestFirst in js/core.js
    function getPhotoTimestamp(photo) {
      if (!photo) return 0;
      if (typeof photo.timestamp === 'number' && !isNaN(photo.timestamp) && photo.timestamp > 0) {
        return photo.timestamp;
      }
      return 0;
    }

    const sortedByCore = photos.slice().sort(function(a, b) {
      const tA = getPhotoTimestamp(a);
      const tB = getPhotoTimestamp(b);
      if (tB !== tA) {
        return tB - tA;
      }
      const nameA = String(a.rawName || a.name || a.id || "");
      const nameB = String(b.rawName || b.name || b.id || "");
      return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
    });

    console.log("=== AFTER sortPhotosNewestFirst (first 6) ===");
    sortedByCore.slice(0, 6).forEach((p, i) => console.log(`[${i}] ${p.id} | isVideo: ${p.isVideo} | ${p.name}`));
  });
});

