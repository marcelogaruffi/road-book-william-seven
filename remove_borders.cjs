const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

const oldLabelClass = 'className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors bg-white shadow-sm"';
const newLabelClass = 'className="flex items-center gap-3 py-2 cursor-pointer text-slate-700 hover:text-primary transition-colors"';

content = content.replace(oldLabelClass, newLabelClass);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
