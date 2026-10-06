const fs = require('fs');
const content = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');
const lines = content.split('\n');

lines[499] = "                  {activeTab === 'cardapio' && (\r";
lines[504] = "                  )}\r\n                  {activeTab === 'restricoes' && (\r";

fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', lines.join('\n'));
console.log("Fixed catering.index.tsx");
