import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

code = code.replace(/\{selectedTipo === 'catering'[\s\S]*?<\/ReportExportButton>\s*<\/>\s*\)\}/g, '');
code = code.replace(/\{selectedTipo === 'catering'[\s\S]*?PDF Catering<\/Button>[\s\S]*?Excel Catering<\/Button>\s*<\/>\s*\)\}/g, '');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Cleaned up buttons');

