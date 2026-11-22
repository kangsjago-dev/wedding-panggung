const https = require('https');

function check() {
  const url = 'https://drive.google.com/embeddedfolderview?id=1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh#grid';
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTTP status:', res.statusCode);
      console.log('HTML length:', data.length);
      console.log('First 500 chars:', data.substring(0, 500));
      if (data.includes('flip-entry')) {
        console.log('Contains flip-entry!');
      } else {
        console.log('Does NOT contain flip-entry');
      }
      if (data.includes('Sign in') || data.includes('accounts.google.com')) {
        console.log('Requires Sign In / Not public!');
      }
    });
  });
}
check();
