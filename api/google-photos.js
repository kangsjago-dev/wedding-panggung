export default async function handler(req, res) {
  const targetUrl = req.query.url;
  const category = req.query.category || "Photobooth";

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: "Parameter url Google Photos wajib disertakan." });
  }

  try {
    const response = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: "HTTP " + response.status });
    }

    const html = await response.text();
    let matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+/g) || [];
    if (matches.length === 0) {
      matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9_\-]{30,}/g) || [];
    }

    const seen = new Set();
    const photos = [];
    let count = 0;

    for (const base of matches) {
      if (!seen.has(base)) {
        seen.add(base);
        count++;
        photos.push({
          id: "gp_" + count,
          name: category + " " + count,
          thumbnailUrl: base + "=w500-h500-c",
          previewUrl: base + "=w1600-h1200",
          highResUrl: base + "=w2400-h1800",
          downloadUrl: base + "=d",
          category: category,
          isPhotobooth: true,
          timestamp: Date.now() - (matches.length - count) * 1000
        });
      }
    }

    // Urutkan foto paling baru di atas
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

