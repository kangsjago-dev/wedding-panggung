export default async function handler(req, res) {
  const fileUrl = req.query.url;
  const fileName = req.query.filename || "unduh_photobooth";

  if (!fileUrl) {
    return res.status(400).json({ success: false, message: "Parameter url wajib diisi" });
  }

  try {
    const upstreamRes = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ success: false, message: "Upstream HTTP " + upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstreamRes.headers.get("content-length");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const arrayBuf = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

