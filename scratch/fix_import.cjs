const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som-operacao.$evento_id.tsx', 'utf8');
code = code.replace('import { TemplateCuesTab } from "@/components/som-operacao/TemplateCuesTab";', 'import TemplateCuesTab from "@/components/som-operacao/TemplateCuesTab";');
fs.writeFileSync('src/routes/_authenticated/som-operacao.$evento_id.tsx', code, 'utf8');
console.log('Fixed import');
