function extractCleanCookies(rawSetCookie) {
  if (!rawSetCookie) return "";
  const parts = [];
  const kp = rawSetCookie.match(/KPBSESSID=[^;]+/);
  if (kp) parts.push(kp[0]);
  const liker = rawSetCookie.match(/kpx1_liker_[^;]+/);
  if (liker) parts.push(liker[0]);
  return parts.join("; ");
}

export default async function handler(req, res) {
  const { action, token, path: thumbPath, event: eventUrl, origin: reqOrigin, url: targetUrl, category = "Photobooth", ck: reqCk } = req.query;

  // 1. STREAMING PROXY UNTUK MEDIA (VIDEO / FOTO / THUMBNAIL / DOWNLOAD) DENGAN SESSION RESMI
  if (action === "media" || action === "video" || action === "download" || action === "thumb") {
    const hostOrigin = reqOrigin || "https://x1.kingphotobooth.co";

    // A. JALUR CEPAT THUMBNAIL LANGSUNG DENGAN SESSION COOKIE DARI QUERY / REFERER
    if (action === "thumb" && thumbPath) {
      try {
        let cookieHeader = "";
        if (reqCk) {
          cookieHeader = Buffer.from(reqCk, "base64url").toString("utf-8");
        }

        const decodedPath = decodeURIComponent(thumbPath);
        const fullThumbUrl = decodedPath.startsWith("http") ? decodedPath : (hostOrigin + decodedPath);

        // Jika cookie belum ada atau kadaluarsa, dapatkan dari event atau origin
        if (!cookieHeader) {
          const refPage = eventUrl ? decodeURIComponent(eventUrl) : `${hostOrigin}/`;
          const initRes = await fetch(refPage, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
          });
          const rawCookies = initRes.headers.get("set-cookie") || "";
          cookieHeader = extractCleanCookies(rawCookies);
        }

        const refererUrl = eventUrl ? decodeURIComponent(eventUrl) : `${hostOrigin}/`;
        const thumbHeaders = {
          "Host": new URL(fullThumbUrl).host,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Referer": refererUrl
        };
        if (cookieHeader) thumbHeaders["Cookie"] = cookieHeader;

        const streamRes = await fetch(fullThumbUrl, { headers: thumbHeaders });
        if (!streamRes.ok) {
          return res.status(streamRes.status).send("Gagal mengambil thumbnail.");
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", streamRes.headers.get("content-type") || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");

        const contentLen = streamRes.headers.get("content-length");
        if (contentLen) res.setHeader("Content-Length", contentLen);

        res.status(200);
        const arrayBuffer = await streamRes.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        if (typeof res.send === "function") {
          return res.send(buf);
        }
        if (typeof res.end === "function") {
          return res.end(buf);
        }
        return buf;
      } catch (e) {
        return res.status(500).send("Gagal mengalirkan thumbnail: " + e.message);
      }
    }

    // B. JALUR TOKEN ITEM (/i/{token}) UNTUK VIDEO, DOWNLOAD, ATAU THUMBNAIL BY TOKEN
    if (!token) {
      return res.status(400).send("Parameter token atau path diperlukan.");
    }

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

      // Ambil cookie dari response dengan regex bersih
      const rawCookies = pageRes.headers.get("set-cookie") || "";
      const cookies = extractCleanCookies(rawCookies);

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
        "Host": new URL(mediaUrl).host,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": `${hostOrigin}/i/${encodeURIComponent(token)}`,
        "Accept": isVideo ? "*/*" : "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      };
      if (cookies) mediaHeaders["Cookie"] = cookies;
      if (req.headers.range) mediaHeaders["Range"] = req.headers.range;

      const streamRes = await fetch(mediaUrl, { headers: mediaHeaders });
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", streamRes.headers.get("content-type") || (isVideo ? "video/mp4" : "image/jpeg"));
      res.setHeader("Cache-Control", isVideo ? "public, max-age=3600" : "public, max-age=86400, s-maxage=604800");

      const contentLen = streamRes.headers.get("content-length");
      if (contentLen) res.setHeader("Content-Length", contentLen);

      const contentRange = streamRes.headers.get("content-range");
      if (contentRange) res.setHeader("Content-Range", contentRange);

      const acceptRanges = streamRes.headers.get("accept-ranges");
      if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

      res.status(streamRes.status);
      const arrayBuffer = await streamRes.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      if (typeof res.send === "function") {
        return res.send(buf);
      }
      if (typeof res.end === "function") {
        return res.end(buf);
      }
      return buf;
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

    // Ambil session cookie event Kingphotobooth agar thumbnail bisa diproxy secara instan
    const setCookieHeader = response.headers.get("set-cookie") || "";
    const cleanEventCookies = extractCleanCookies(setCookieHeader);
    const b64Cookie = cleanEventCookies ? Buffer.from(cleanEventCookies).toString("base64url") : "";

    const html = await response.text();
    const match = html.match(/const\s+ITEMS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      return res.status(404).json({ success: false, message: "ITEMS not found in target page" });
    }

    const rawItems = JSON.parse(match[1]);
    const photos = rawItems.map(function(it, idx) {
      const isVideo = Boolean(it.is_video);
      
      // Thumbnail dialirkan lewat internal proxy terotentikasi agar lolos dari anti-hotlink vendor
      let thumbProxyUrl = "";
      if (it.thumb) {
        const ckParam = b64Cookie ? `&ck=${b64Cookie}` : "";
        thumbProxyUrl = `/api/kingphotobooth?action=thumb&path=${encodeURIComponent(it.thumb)}&event=${encodeURIComponent(targetUrl)}&origin=${encodeURIComponent(origin)}${ckParam}`;
      } else if (it.share_token || it.id) {
        thumbProxyUrl = `/api/kingphotobooth?action=thumb&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
      }

      let photoUrl = "";
      let videoUrl = "";
      let downloadUrl = "";

      if (isVideo) {
        // Stream video terotentikasi via proxy internal
        videoUrl = `/api/kingphotobooth?action=media&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
        photoUrl = thumbProxyUrl;
        downloadUrl = `/api/kingphotobooth?action=download&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
      } else {
        // Stream foto HD master resolusi penuh via proxy internal terotentikasi
        photoUrl = `/api/kingphotobooth?action=media&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
        downloadUrl = `/api/kingphotobooth?action=download&token=${encodeURIComponent(it.share_token || it.id)}&origin=${encodeURIComponent(origin)}`;
      }

      return {
        id: "king_" + it.id,
        name: isVideo ? ("Video Photobooth #" + (rawItems.length - idx)) : ("Photobooth #" + (rawItems.length - idx)),
        category: category,
        thumbnailUrl: thumbProxyUrl,
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
