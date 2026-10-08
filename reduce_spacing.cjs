const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/emissao-relatorios.tsx', 'utf8');

content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">',
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">'
);
content = content.replace(
  'className="flex items-center gap-3 py-2 cursor-pointer',
  'className="flex items-center gap-3 py-1 cursor-pointer'
);

// Reduce space between groups slightly from space-y-8 to space-y-6
content = content.replace(
  '<div className="space-y-8 mb-8">',
  '<div className="space-y-6 mb-8">'
);

fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content, 'utf8');
