const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(/<CateringPadraoTab\s*\/>/g, '<CateringPadraoTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<MalasTemplateTab\s*\/>/g, '<MalasTemplateTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<TemplateCuesTab\s*\/>/g, '<TemplateCuesTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<TemplateRidersTab\s*context='som'\s*\/>/g, "<TemplateRidersTab espetaculoNome={selectedEspetaculo} context='som' />");
c = c.replace(/<TemplateRidersTab\s*\/>/g, '<TemplateRidersTab espetaculoNome={selectedEspetaculo} />');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed props in padroes");
