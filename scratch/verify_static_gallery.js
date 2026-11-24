const fs = require('fs');

const js = fs.readFileSync('js/gallery.js', 'utf8');
const hasAutoplayVideoInCard = js.includes('photo-video-preview');
console.log('Has autoplay video in card:', hasAutoplayVideoInCard);
console.log('Has video-play-hint:', js.includes('video-play-hint'));
console.log('Card click uses data-photo-id:', js.includes('card.getAttribute("data-photo-id")'));
console.log('Lightbox video playback present:', js.includes('video.src = photo.videoUrl || photo.previewUrl || sharpUrl'));

const css = fs.readFileSync('css/style.css', 'utf8');
console.log('Has video-play-hint CSS:', css.includes('.video-play-hint'));

