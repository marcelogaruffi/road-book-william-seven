const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(/<CateringPadraoTab \/>/g, '<CateringPadraoTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<MalasTemplateTab \/>/g, '<MalasTemplateTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<TemplateCuesTab \/>/g, '<TemplateCuesTab espetaculoNome={selectedEspetaculo} />');
c = c.replace(/<TemplateRidersTab context='som' \/>/g, "<TemplateRidersTab espetaculoNome={selectedEspetaculo} context='som' />");
c = c.replace(/<TemplateRidersTab \/>/g, '<TemplateRidersTab espetaculoNome={selectedEspetaculo} />');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Re-added props");
