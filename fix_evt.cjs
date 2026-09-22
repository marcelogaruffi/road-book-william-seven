const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');
const lines = content.split('\n');
const newLines = [];
let found = false;
for (const line of lines) {
  if (line.includes('const [apresentacoesList, setApresentacoesList]')) {
    if (found) continue;
    found = true;
  }
  newLines.push(line);
}
fs.writeFileSync('src/routes/_authenticated/eventos.tsx', newLines.join('\n'));
