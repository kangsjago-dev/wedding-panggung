const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Administrator/.gemini/antigravity/brain/c50403be-81d9-48e3-b06a-8b26294283ac/.system_generated/logs/transcript.jsonl')
});

const found = [];
rl.on('line', line => {
  if (line.includes('git commit') || line.includes('git push') || line.includes('robocopy') || line.includes('Copy-Item') || line.includes('Documents/GitHub')) {
    found.push(line);
  }
});

rl.on('close', () => {
  console.log('Found matches:', found.length);
  found.slice(-10).forEach(f => {
    try {
      const obj = JSON.parse(f);
      console.log('--- Step', obj.step_index, '---');
      if (obj.tool_calls) console.log('Tool calls:', JSON.stringify(obj.tool_calls, null, 2));
      if (obj.content) console.log('Content:', obj.content.substring(0, 200));
    } catch(e) {}
  });
});

