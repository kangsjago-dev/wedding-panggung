const fs = require('fs');
const code = fs.readFileSync('code.gs', 'utf8');

const sIdx = code.indexOf('function getGalleryData');
const eIdx = code.indexOf('var folderId = safeConfig.DRIVE_FOLDER_ID', sIdx);
console.log(code.substring(sIdx, eIdx + 300));

