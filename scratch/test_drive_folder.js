const https = require('https');

async function testFolder(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  console.log(`Folder ${folderId} status: ${res.status}`);
  const html = await res.text();
  const entryMatches = html.match(/class="flip-entry"/g);
  console.log(`Folder ${folderId} entries found: ${entryMatches ? entryMatches.length : 0}`);
}

async function run() {
  await testFolder('1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh'); // Andre & Fayola
  await testFolder('1B1HyALBKEetXRoakAZuZ3iZYUeEsnjU5'); // Wilson & Felicia
  await testFolder('1GGB77clCMYBIg17J0ECr2eVbD02ZeInW'); // Wilson & Felicia Wedding
}

run().catch(console.error);

