const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

if (!content.includes('Printer')) {
    content = content.replace('File, Download', 'File, Download, Printer');
}
content = content.replace('<File className="size-8 text-blue-600" />', '<Printer className="size-8 text-blue-600" />');

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
