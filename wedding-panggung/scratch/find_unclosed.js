const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

// Find open and close braces/parentheses balance
let openBrace = 0, closeBrace = 0;
let openParen = 0, closeParen = 0;

for (let i = 0; i < app.length; i++) {
  const ch = app[i];
  if (ch === '{') openBrace++;
  else if (ch === '}') closeBrace++;
  else if (ch === '(') openParen++;
  else if (ch === ')') closeParen++;
}

console.log('Braces: open =', openBrace, 'close =', closeBrace, 'diff =', openBrace - closeBrace);
console.log('Parens: open =', openParen, 'close =', closeParen, 'diff =', openParen - closeParen);

