export default async function handler(req, res) {
  const targetUrl = req.query.url || "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR";
  const category = req.query.category || "Photobooth";

  try {
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
    const matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_\-]+/g) || [];
    const seen = new Set();
    const photos = [];
    let count = 0;

    for (const base of matches) {
      if (!seen.has(base)) {
        seen.add(base);
        count++;
        photos.push({
          id: "gp_" + count,
          name: "Photobooth " + count,
          thumbnailUrl: base + "=w500-h500-c",
          previewUrl: base + "=w1600-h1200",
          highResUrl: base + "=w2400-h1800",
          downloadUrl: base + "=d",
          category: category
        });
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, count: photos.length, photos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

