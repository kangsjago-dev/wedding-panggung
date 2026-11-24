export default async function handler(req, res) {
  const { action, token, origin: reqOrigin, url: targetUrl, category = "Photobooth" } = req.query;

  // 1. STREAMING PROXY UNTUK MEDIA (VIDEO / FOTO / THUMBNAIL) DENGAN SESSION COOKIE RESMI
  if (action === "media" || action === "video" || action === "download" || action === "thumb") {
    if (!token) {
      return res.status(400).send("Parameter token diperlukan.");
    }
    const hostOrigin = reqOrigin || "https://x1.kingphotobooth.co";
    try {
      // Dapatkan session resmi dan link media dari halaman item /i/{token}
      const pageRes = await fetch(`${hostOrigin}/i/${encodeURIComponent(token)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      if (!pageRes.ok) {
        return res.status(pageRes.status).send("Item tidak ditemukan.");
      }

      // Ambil cookie dari response
      const rawCookies = pageRes.headers.get("set-cookie") || "";
      const cookies = rawCookies.split(",").map(c => c.split(";")[0].trim()).join("; ");

      const html = await pageRes.text();
      let mediaPath = "";
      let isVideo = false;

      if (action === "download") {
        const dlMatch = html.match(/<a[^>]*href=["'](\/dl\/[^"']+)["']/i);
        if (dlMatch) mediaPath = dlMatch[1];
      }

      if (action === "thumb") {
        const thumbMatch = html.match(/src=["'](\/storage\/thumbs\/[^"']+)["']/i) || html.match(/src=["'](\/storage\/photos\/[^"']+)["']/i);
        if (thumbMatch) mediaPath = thumbMatch[1].replace(/&amp;/g, "&");
      }

      if (!mediaPath) {
        const vidMatch = html.match(/<video[^>]*src=["']([^"']+)["']/i);
        const imgMatch = html.match(/<img[^>]*class=["']ph-media["'][^>]*src=["']([^"']+)["']/i);
        if (vidMatch) {
          mediaPath = vidMatch[1].replace(/&amp;/g, "&");
          isVideo = true;
        } else if (imgMatch) {
          mediaPath = imgMatch[1].replace(/&amp;/g, "&");
        }
      }

      if (!mediaPath) {
        return res.status(404).send("Media tidak ditemukan pada halaman vendor.");
      }

      const mediaUrl = mediaPath.startsWith("http") ? mediaPath : (hostOrigin + mediaPath);
      const mediaHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": `${hostOrigin}/i/${encodeURIComponent(token)}`
      };
      if (cookies) mediaHeaders["Cookie"] = cookies;
      if (req.headers.range) mediaHeaders["Range"] = req.headers.range;

      const streamRes = await fetch(mediaUrl, { headers: mediaHeaders });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", streamRes.headers.get("content-type") || (isVideo ? "video/mp4" : "image/jpeg"));
      
      const contentLen = streamRes.headers.get("content-length");
      if (contentLen) res.setHeader("Content-Length", contentLen);

      const contentRange = streamRes.headers.get("content-range");
      if (contentRange) res.setHeader("Content-Range", contentRange);

      const acceptRanges = streamRes.headers.get("accept-ranges");
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

      res.status(streamRes.status);
      const arrayBuffer = await streamRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
      return res.status(500).send("Gagal mengalirkan media: " + e.message);
    }
  }

  // 2. PARSING DAFTAR ITEM EVENT PHOTOBOOTH
  if (!targetUrl) {
    return res.status(400).json({ success: false, message: "Parameter url Kingphotobooth wajib disertakan." });
  }

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
      const cleanThumb = String(it.thumb || "").split("?")[0];
      const thumbUrl = cleanThumb ? (origin + cleanThumb) : "";
      
      let photoUrl = "";
      let videoUrl = "";
      let downloadUrl = "";

      if (cleanThumb) {
        if (isVideo) {
          // Stream video terotentikasi via proxy internal
          videoUrl = `/api/kingphotobooth?action=media&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
          photoUrl = thumbUrl;
          downloadUrl = `/api/kingphotobooth?action=download&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
        } else {
          photoUrl = thumbUrl;
          downloadUrl = `/api/kingphotobooth?action=download&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
        }
      }

      return {
        id: "king_" + it.id,
        name: isVideo ? ("Video Photobooth #" + (rawItems.length - idx)) : ("Photobooth #" + (rawItems.length - idx)),
        category: category,
        thumbnailUrl: thumbUrl,
        previewUrl: isVideo ? videoUrl : photoUrl,
        highResUrl: isVideo ? videoUrl : photoUrl,
        downloadUrl: downloadUrl || (origin + "/dl/" + it.id + (isVideo ? ".mp4" : ".jpg")),
        videoUrl: videoUrl,
        isVideo: isVideo,
        isKing: true,
        isPhotobooth: true,
        shareToken: it.share_token,
        originalWebUrl: origin + "/i/" + (it.share_token || it.id),
        timestamp: it.timestamp || it.created_at || (Date.now() - idx * 1000)
      };
    });

    // Urutkan foto berdasarkan waktu paling baru di atas (Newest First)
    photos.sort(function(a, b) {
      const tA = a.timestamp || 0;
      const tB = b.timestamp || 0;
      if (tB !== tA) return tB - tA;
      return String(b.name || "").localeCompare(String(a.name || ""), undefined, { numeric: true });
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, count: photos.length, photos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
