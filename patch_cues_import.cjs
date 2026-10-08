const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');
c = c.replace(
    'import { TemplateCuesTab } from "@/components/som-operacao/TemplateCuesTab";',
    'import TemplateCuesTab from "@/components/som-operacao/TemplateCuesTab";'
);
fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed import");
