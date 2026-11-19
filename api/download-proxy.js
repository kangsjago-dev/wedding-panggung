export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    return res.status(200).end();
  }

  let fileUrl = req.query.url;
  const fileName = req.query.filename || "unduh_foto.jpg";

  if (!fileUrl) {
    return res.status(400).json({ success: false, message: "Parameter url wajib diisi" });
  }

  // Jika domain Fotoshare, bersihkan parameter resize agar selalu mengunduh master kamera 1.5MB asli bukan thumbnail 84KB
  if (fileUrl.includes("fotoshare.co")) {
    fileUrl = fileUrl.replace(/\?.*$/, "");
  }

  // Normalisasi Google Drive link atau ID agar mengunduh berkas master asli 100% tanpa kompresi
  const driveMatch = fileUrl.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
  if (fileUrl.includes("drive.google.com") || fileUrl.includes("docs.google.com") || (driveMatch && !fileUrl.startsWith("http"))) {
    const fileId = driveMatch ? driveMatch[1] : fileUrl.trim();
    fileUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
  }

  try {
    const upstreamRes = await fetch(fileUrl, {
      redirect: "follow",
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
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
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

