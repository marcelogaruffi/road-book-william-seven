const fs = require('fs');
const lines = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8').split('\n');
const saveAsIdx = lines.findIndex(l => l.includes('const { saveAs } = pkg;'));
const importIdx = lines.findIndex(l => l.includes('import { FileText'));
if (saveAsIdx < importIdx) {
  const saveAsLine = lines.splice(saveAsIdx, 1)[0];
  lines.splice(importIdx, 0, saveAsLine);
}
fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', lines.join('\n'));
