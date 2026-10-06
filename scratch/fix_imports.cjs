const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/musicas.index.tsx', 'utf8');

const regex = /import {([^}]+)} from "lucide-react";/;
const match = code.match(regex);
if (match) {
  let imports = match[1].split(',').map(s => s.trim());
  imports = [...new Set(imports)]; // remove duplicates
  code = code.replace(regex, `import { ${imports.join(', ')} } from "lucide-react";`);
}

fs.writeFileSync('src/routes/_authenticated/musicas.index.tsx', code, 'utf8');
console.log('Fixed imports');
