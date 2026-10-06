const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.$evento_id.tsx', 'utf8');
code = code.replace(/import TemplateRiderSomViewer from ["']@\/components\/TemplateRiderSomViewer["'];/, 'import TemplateRidersTab from "@/components/TemplateRidersTab";');
code = code.replace(/<TemplateRiderSomViewer role=\{role\} \/>/, '<TemplateRidersTab role={role} context="som" />');
fs.writeFileSync('src/routes/_authenticated/som.$evento_id.tsx', code, 'utf8');
console.log('Replaced viewer with editor');
