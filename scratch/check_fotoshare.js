const https = require('https');

const withQuery = 'https://cdn-bz-op.fotoshare.co/b/62348/Mh8kKCULiKdS1_JVqYIugWGzQ/IMG_3189_20261116_213903_3600.JPG?width=450&aspect_ratio=1:1';
const withoutQuery = 'https://cdn-bz-op.fotoshare.co/b/62348/Mh8kKCULiKdS1_JVqYIugWGzQ/IMG_3189_20261116_213903_3600.JPG';

https.get(withQuery, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log('With query - Status:', res.statusCode, 'Content-Length:', res.headers['content-length']);
});

https.get(withoutQuery, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log('WITHOUT query (RAW FULL RES) - Status:', res.statusCode, 'Content-Length:', res.headers['content-length']);
});
