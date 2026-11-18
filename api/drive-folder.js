export default async function handler(req, res) {
  const folderTarget = req.query.folderId || req.query.url || "1GGB77clCMYBIg17J0ECr2eVbD02ZeInW";
  const category = req.query.category || "Wedding";

  let cleanId = String(folderTarget).trim();
  const match = cleanId.match(/folders\/([a-zA-Z0-9_\-]+)/);
  if (match && match[1]) cleanId = match[1];

  if (!cleanId) {
    return res.status(400).json({ success: false, message: "ID folder Google Drive tidak valid" });
  }

  try {
    const url = "https://drive.google.com/embeddedfolderview?id=" + cleanId + "#grid";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: "HTTP " + response.status });
    }

    const html = await response.text();
    const entryRegex = /class="flip-entry"\s+id="entry-([a-zA-Z0-9_\-]+)"[\s\S]*?<div\s+class="flip-entry-title">([^<]+)<\/div>/g;
    const photos = [];
    const seen = new Set();
    let m;

    const autoRotateDeg = (cleanId === "1G2yIKIEe9SPsLcoMVFDNwHybzvyAfqBI" || String(category).toLowerCase().includes("wedding")) ? 90 : 0;

    while ((m = entryRegex.exec(html)) !== null) {
      const fId = m[1];
      const fName = m[2].trim();
      if (!seen.has(fId)) {
        seen.add(fId);
        photos.push({
          id: fId,
          name: fName,
          category: category,
          thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w600-h600",
          previewUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
          highResUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
          downloadUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
          customFolderId: cleanId,
          autoRotate: autoRotateDeg,
          rotation: autoRotateDeg,
          isVideo: false
        });
      }
    }

    // Fallback ID regex jika flip-entry markup berubah
    if (photos.length === 0) {
      const fileRegex = /\/file\/d\/([a-zA-Z0-9_\-]+)/g;
      let count = 0;
      while ((m = fileRegex.exec(html)) !== null) {
        const fId = m[1];
        if (!seen.has(fId)) {
          seen.add(fId);
          count++;
          photos.push({
            id: fId,
            name: category + " #" + count,
            category: category,
            thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w600-h600",
            previewUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
            highResUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
            downloadUrl: "https://lh3.googleusercontent.com/d/" + fId + "=w3200",
            customFolderId: cleanId,
            autoRotate: autoRotateDeg,
            rotation: autoRotateDeg,
            isVideo: false
          });
        }
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, count: photos.length, category, folderId: cleanId, photos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

