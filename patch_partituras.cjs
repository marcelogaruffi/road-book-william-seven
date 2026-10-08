const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    '<TabsContent value="partituras" className="mt-0 space-y-8">',
    '<TabsContent value="partituras" className="mt-0">'
);

c = c.replace(
    '<div>\n                    <h3 className="text-lg font-medium mb-4">Arquivos de Partituras</h3>\n                    <TemplateRidersTab espetaculoNome={selectedEspetaculo} />\n                  </div>\n                  <div>\n                    <h3 className="text-lg font-medium mb-4">Arquivos de Músicas</h3>\n                    <TemplateRidersTab espetaculoNome={selectedEspetaculo} />\n                  </div>',
    '<div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">\n                      <p className="text-slate-500 mb-4">O espelho de Partituras e Músicas está sendo integrado a esta central e estará disponível em breve.</p>\n                   </div>'
);

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed partituras");
