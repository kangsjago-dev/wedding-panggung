export default async function handler(req, res) {
  const targetUrl = req.query.url || "https://fotoshare.co/e/ZJGYCfWbttuEG8Q67ocZs";
  const category = req.query.category || "Photobooth";

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

    const htmlText = await response.text();
    let list = [];
    const sessionMatch = htmlText.match(/let\s+sessionImages\s*=\s*(\{[\s\S]*?\});/);
    if (sessionMatch) {
      try {
        const sessionObj = JSON.parse(sessionMatch[1]);
        let idx = 0;
        for (const sKey in sessionObj) {
          const sess = sessionObj[sKey];
          for (const imgKey in sess) {
            const it = sess[imgKey];
            idx++;
            const fullWebUrl = it.url ? ("https://fotoshare.co" + it.url) : ("https://fotoshare.co/i/" + (it.hash || ""));
            const rawMasterUrl = (it.url_hires || it.highres || it.img || it.url || "").replace(/\?.*$/, "");
            list.push({
              id: it.hash || ("pb_" + idx),
              name: category + " " + idx,
              category: category,
              thumbnailUrl: it.thumb_url || it.img,
              previewUrl: rawMasterUrl,
              highResUrl: rawMasterUrl,
              downloadUrl: rawMasterUrl,
              originalWebUrl: fullWebUrl,
              img: rawMasterUrl,
              isPhotobooth: true,
              timestamp: it.date_added ? new Date(it.date_added).getTime() : Date.now()
            });
          }
        }
      } catch (eJson) {}
    }

    if (list.length === 0) {
      const regex = /(https:\/\/cdn-bz-op\.fotoshare\.co\/[^\s"'<>]+\.JPG)/gi;
      let m;
      const set = new Set();
      while ((m = regex.exec(htmlText)) !== null) {
        const u = m[1];
        const rawMasterUrl = u.replace(/\?.*$/, "");
        if (!set.has(rawMasterUrl)) {
          set.add(rawMasterUrl);
          list.push({
            id: "pb_" + (list.length + 1),
            name: category + " " + (list.length + 1),
            category: category,
            thumbnailUrl: u,
            previewUrl: rawMasterUrl,
            highResUrl: rawMasterUrl,
            downloadUrl: rawMasterUrl,
            originalWebUrl: targetUrl,
            img: rawMasterUrl,
            isPhotobooth: true,
            timestamp: Date.now()
          });
        }
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, count: list.length, photos: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

