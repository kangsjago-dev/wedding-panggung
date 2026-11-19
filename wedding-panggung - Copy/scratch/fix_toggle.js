const fs = require('fs');
let app = fs.readFileSync('js/app.js', 'utf8');

const target = `    function toggleCoverSectionPreview() {};
      state.coverSettings.enabled = enabled;
      renderWeddingCoverShowcase();
    }`;

const replacement = `    function toggleCoverSectionPreview() {}`;

if (app.includes(target)) {
  app = app.replace(target, replacement);
  fs.writeFileSync('js/app.js', app, 'utf8');
  console.log('Fixed toggleCoverSectionPreview cleanly!');
} else {
  console.log('target not found exactly');
}

