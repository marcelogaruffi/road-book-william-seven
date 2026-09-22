const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Regex para remover o bloco de debug
const debugRegex = /<div className="bg-red-100 text-red-900[\s\S]*?<\/div>\s*<div className="flex gap-2">/g;
content = content.replace(debugRegex, '<div className="flex gap-2">');

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', content, 'utf8');
console.log("Removed Debug UI");
