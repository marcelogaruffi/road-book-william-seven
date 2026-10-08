const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    'import { PartiturasPadraoTab } from "@/components/PartiturasPadraoTab";',
    'import { PartiturasPadraoTab } from "@/components/PartiturasPadraoTab";\nimport { FigurinosPadraoTab } from "@/components/FigurinosPadraoTab";'
);

c = c.replace(/<TabsContent value="figurino" className="mt-0">[\s\S]*?<\/TabsContent>/, '<TabsContent value="figurino" className="mt-0">\n                    <FigurinosPadraoTab espetaculoNome={selectedEspetaculo} />\n                  </TabsContent>');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed figurino inject");
