const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    'import TemplateCuesTab from "@/components/som-operacao/TemplateCuesTab";',
    'import TemplateCuesTab from "@/components/som-operacao/TemplateCuesTab";\nimport { PartiturasPadraoTab } from "@/components/PartiturasPadraoTab";'
);

c = c.replace(
    '<TabsContent value="partituras" className="mt-0">\n                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">\n                        <p className="text-slate-500 font-medium">Módulo de Músicas e Partituras em processo de unificação.</p>\n                     </div>\n                  </TabsContent>',
    '<TabsContent value="partituras" className="mt-0">\n                    <PartiturasPadraoTab espetaculoNome={selectedEspetaculo} />\n                  </TabsContent>'
);

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Injected into padroes.tsx");
