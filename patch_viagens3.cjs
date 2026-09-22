const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/viagens.tsx', 'utf-8');

// Fix grid gap-5 -> grid grid-cols-...
content = content.replace(/<div className="grid gap-5">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">');

fs.writeFileSync('src/routes/_authenticated/viagens.tsx', content);
