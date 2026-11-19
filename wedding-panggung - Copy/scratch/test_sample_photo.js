const fs = require('fs');
const https = require('https');
const content = fs.readFileSync('js/cache-data.js', 'utf8');
const match = content.match(/"id":\s*"([^"]+)"/);
console.log('Sample Photo ID:', match ? match[1] : 'none');
if (match) {
  const url = 'https://lh3.googleusercontent.com/d/' + match[1] + '=w2048';
  https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('CORS:', res.headers['access-control-allow-origin']);
    console.log('Content-Type:', res.headers['content-type']);
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => console.log('Length:', Buffer.concat(chunks).length));
  });
}

