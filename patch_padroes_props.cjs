const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace('import { TemplateRidersTab } from "@/components/TemplateRidersTab";', 'import TemplateRidersTab from "@/components/TemplateRidersTab";');
c = c.replace(/espetaculoNome=\{selectedEspetaculo\}/g, '');
c = c.replace(/tipo="som"/g, "context='som'");
c = c.replace(/tipo="partitura"/g, '');
c = c.replace(/tipo="musica"/g, '');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed props");
