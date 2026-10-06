import fs from 'fs';
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

code = code.replace(/\{\/\* TAB: CATERING \(Apenas Evento\) \*\/\}\s*\{selectedTipo === 'catering' && activeTab === 'evento' && \([\s\S]*?<table className="w-full text-sm text-left">[\s\S]*?<\/table>\s*<\/div>\s*<\/div>\s*\)\}/g, '');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Cleaned up dead code');

