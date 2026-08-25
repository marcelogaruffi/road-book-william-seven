const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/som.index.tsx', 'utf8');

// replace TemplateRidersTab import
code = code.replace(
  'import TemplateRidersTab from "@/components/TemplateRidersTab";',
  'import TemplateRiderSomViewer from "@/components/TemplateRiderSomViewer";'
);

// replace Tab trigger
const tabRegex = /<TabsTrigger value="modelos"[^>]*>.*?<\/TabsTrigger>/;
code = code.replace(
  tabRegex,
  '<TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Rider Padrão</TabsTrigger>'
);

// replace component usage
code = code.replace(
  '<TemplateRidersTab role={role} context="som" />',
  '<TemplateRiderSomViewer role={role} />'
);

fs.writeFileSync('src/routes/_authenticated/som.index.tsx', code);
console.log('som.index.tsx updated');
