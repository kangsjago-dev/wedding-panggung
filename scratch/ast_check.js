const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('js/app.js', 'utf8');

try {
  const ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });
  console.log("AST parsed successfully!");
} catch (e) {
  console.error("Acorn parse error:", e.message);
}

