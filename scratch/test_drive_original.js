const https = require('https');

// Test with file ID: 1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5 (folder) or let's find an actual photo file ID in that folder
async function checkDriveOriginalDownload() {
  const fetch = globalThis.fetch;
  // Let's call /api/drive-folder to get an actual photo ID
  const folderId = "1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5";
  console.log("Fetching folder contents from google drive...");
  try {
    const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#grid`);
    const text = await res.text();
    const regex = /\/file\/d\/([a-zA-Z0-9_\-]+)/g;
    let match;
    const fileIds = [];
    while ((match = regex.exec(text)) !== null) {
      if (!fileIds.includes(match[1])) fileIds.push(match[1]);
    }
    console.log("Found file IDs:", fileIds.slice(0, 3));

    if (fileIds.length > 0) {
      const testFileId = fileIds[0];
      // Test 1: lh3 =w3200
      const lh3Url = `https://lh3.googleusercontent.com/d/${testFileId}=w3200`;
      const resLh3 = await fetch(lh3Url);
      const bufLh3 = await resLh3.arrayBuffer();
      console.log(`LH3 (=w3200) size: ${(bufLh3.byteLength / 1024 / 1024).toFixed(2)} MB`);

      // Test 2: drive direct download
      const driveDirectUrl = `https://drive.usercontent.google.com/download?id=${testFileId}&export=download`;
      const resDirect = await fetch(driveDirectUrl);
      console.log("Direct status:", resDirect.status, resDirect.headers.get("content-type"), resDirect.headers.get("content-disposition"));
      const bufDirect = await resDirect.arrayBuffer();
      console.log(`Drive Direct size: ${(bufDirect.byteLength / 1024 / 1024).toFixed(2)} MB`);
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}

checkDriveOriginalDownload();

