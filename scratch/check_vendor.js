const https = require('https');

const candidates = [
  'https://x1.kingphotobooth.co/dl/12695.jpg',
  'https://x1.kingphotobooth.co/dl/12695',
  'https://x1.kingphotobooth.co/storage/photos/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/original/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/originals/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/highres/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/hires/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/raw/78/cb02ef5429c7228e382cad42.jpg',
  'https://x1.kingphotobooth.co/storage/full/78/cb02ef5429c7228e382cad42.jpg'
];

candidates.forEach(url => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let size = 0;
    res.on('data', c => size += c.length);
    res.on('end', () => {
      console.log(url, 'Status:', res.statusCode, 'Size:', size, 'Header:', res.headers['content-length']);
    });
  }).on('error', e => {});
});
