const https = require('https');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function getExifOrientation(buf) {
  if (!buf || buf.length < 2 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let idx = 2;
  while (idx < buf.length - 4) {
    if (buf[idx] !== 0xFF) break;
    const marker = buf[idx + 1];
    const len = buf.readUInt16BE(idx + 2);
    if (marker === 0xE1) { // APP1 EXIF
      const exifHeader = buf.toString('ascii', idx + 4, idx + 8);
      if (exifHeader === 'Exif') {
        const tiffOffset = idx + 10;
        const isLittleEndian = buf.toString('ascii', tiffOffset, tiffOffset + 2) === 'II';
        const read16 = (off) => isLittleEndian ? buf.readUInt16LE(off) : buf.readUInt16BE(off);
        const read32 = (off) => isLittleEndian ? buf.readUInt32LE(off) : buf.readUInt32BE(off);
        const ifd0Offset = read32(tiffOffset + 4);
        const numEntries = read16(tiffOffset + ifd0Offset);
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffOffset + ifd0Offset + 2 + i * 12;
          const tag = read16(entryOffset);
          if (tag === 0x0112) { // Orientation tag
            return read16(entryOffset + 8);
          }
        }
      }
    }
    idx += 2 + len;
  }
  return null;
}

async function run() {
  const fileId = "1F6STLkgsWq0OIGSfwzmref8yIoF5QZ9B";
  const origUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  console.log("Fetching original file...");
  const buf = await fetchBuffer(origUrl);
  console.log("Original buffer size:", buf.length);
  console.log("EXIF Orientation:", getExifOrientation(buf));
}

run().catch(console.error);

