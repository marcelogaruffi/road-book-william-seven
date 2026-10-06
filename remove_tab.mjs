import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

code = code.replace(/\{activeTab === 'evento' && \([\s\S]*?<button onClick=\{\(\) => setSelectedTipo\(\"catering\"\)\}[\s\S]*?<\/button>[\s\S]*?\)\}/, '');
code = code.replace(/\| \"catering\"/g, '');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Removed tab button');

