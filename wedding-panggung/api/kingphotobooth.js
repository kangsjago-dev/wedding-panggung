export default async function handler(req, res) {
  const targetUrl = req.query.url || "https://x1.kingphotobooth.co/e/23d0e80056ae8f2fbb5d116f";
  const category = req.query.category || "Photobooth";

  try {
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: "HTTP " + response.status });
    }

    const html = await response.text();
    const match = html.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      return res.status(404).json({ success: false, message: "ITEMS not found in target page" });
    }

    const rawItems = JSON.parse(match[1]);
    const photos = rawItems.map(function(it, idx) {
      const isVideo = Boolean(it.is_video);
      const thumbUrl = it.thumb ? (origin + it.thumb) : "";
      
      // Path full resolusi
      let photoUrl = "";
      let videoUrl = "";
      let downloadUrl = "";

      if (it.thumb) {
        if (isVideo) {
          videoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/").replace(/\.jpg$/i, ".mp4");
          photoUrl = videoUrl;
          downloadUrl = origin + "/dl/" + it.id;
        } else {
          photoUrl = origin + it.thumb.replace("/storage/thumbs/", "/storage/photos/");
          downloadUrl = origin + "/dl/" + it.id;
        }
      }

      return {
        id: "king_" + it.id,
        name: isVideo ? ("Video Photobooth #" + (rawItems.length - idx)) : ("Photobooth #" + (rawItems.length - idx)),
        category: category,
        thumbnailUrl: thumbUrl,
        previewUrl: photoUrl,
        highResUrl: photoUrl,
        downloadUrl: downloadUrl,
        videoUrl: videoUrl,
        isVideo: isVideo,
        isKing: true,
        isPhotobooth: true,
        shareToken: it.share_token,
        originalWebUrl: origin + "/i/" + (it.share_token || it.id)
      };
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, count: photos.length, photos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

