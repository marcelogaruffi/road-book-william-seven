const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
c = c.replace(/<SGroup title=\"Controles e Gest.*\" icon=\{Banknote\}>/g, '<SGroup title=\"Controles e Gestão\" icon={Banknote}>\n                  <SLink to=\"/emissao-relatorios\" icon={FileText} label=\"Emissão de Relatórios\" show={isProdutor} />');
fs.writeFileSync('src/routes/_authenticated/route.tsx', c);
