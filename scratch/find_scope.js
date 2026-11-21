const fs = require('fs');

const code = fs.readFileSync('js/gallery.js', 'utf8');
let inString = false;
let stringChar = '';
let inLineComment = false;
let inBlockComment = false;
let inTemplate = false;

let blocks = []; // stack of { line, col, preview }
let line = 1;
let col = 1;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i + 1];

  if (c === '\n') {
    line++;
    col = 1;
    inLineComment = false;
    continue;
  }
  col++;

  if (inLineComment) continue;

  if (inBlockComment) {
    if (c === '*' && next === '/') {
      inBlockComment = false;
      i++;
    }
    continue;
  }

  if (inString) {
    if (c === '\\') {
      i++; // skip escaped char
      continue;
    }
    if (c === stringChar) {
      inString = false;
    }
    continue;
  }

  if (inTemplate) {
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '`') {
      inTemplate = false;
      continue;
    }
    if (c === '$' && next === '{') {
      blocks.push({ type: 'template_expr', line, col, preview: '${' });
      i++;
      continue;
    }
  }

  // Not in string or comment
  if (c === '/' && next === '/') {
    inLineComment = true;
    i++;
    continue;
  }
  if (c === '/' && next === '*') {
    inBlockComment = true;
    i++;
    continue;
  }
  if (c === '"' || c === "'") {
    inString = true;
    stringChar = c;
    continue;
  }
  if (c === '`') {
    inTemplate = true;
    continue;
  }

  if (c === '{') {
    const start = Math.max(0, i - 40);
    const preview = code.substring(start, i).replace(/\s+/g, ' ').trim();
    blocks.push({ type: 'brace', line, col, preview });
  } else if (c === '}') {
    if (blocks.length > 0) {
      blocks.pop();
    }
  }

  // Check where openLightbox is!
  if (line > 100 && code.substr(i, 12) === 'openLightbox') {
    console.log('Found openLightbox at line', line, 'col', col);
    console.log('State: inString=', inString, 'stringChar=', stringChar, 'inTemplate=', inTemplate, 'inBlockComment=', inBlockComment, 'inLineComment=', inLineComment);
    console.log('Open blocks count:', blocks.length);
    blocks.forEach((b, idx) => {
      console.log(`Block ${idx + 1}: line ${b.line}:${b.col} -> "${b.preview}"`);
    });
    break;
  }
}
