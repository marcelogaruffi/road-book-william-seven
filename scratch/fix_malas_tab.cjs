const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/malas.index.tsx', 'utf8');
code = code.replace(/<TabsTrigger value="estoque"[^>]*>.*?<\/TabsTrigger>/gs, '');
fs.writeFileSync('src/routes/_authenticated/malas.index.tsx', code, 'utf8');
