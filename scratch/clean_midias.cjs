const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/midias.tsx', 'utf8');

// remove tab trigger
code = code.replace(/<TabsTrigger value="assets"[\s\S]*?<\/TabsTrigger>/, '');

// remove tab content
code = code.replace(/\{\/\* TAB ASSETS \(HD VIRTUAL\) \*\/\}[\s\S]*?<\/TabsContent>/, '');

fs.writeFileSync('src/routes/_authenticated/midias.tsx', code, 'utf8');
console.log('clean');
