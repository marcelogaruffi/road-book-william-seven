const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(
    'import { FigurinosPadraoTab } from "@/components/FigurinosPadraoTab";',
    'import { FigurinosPadraoTab } from "@/components/FigurinosPadraoTab";\nimport { PalcoPadraoTab } from "@/components/PalcoPadraoTab";'
);

c = c.replace(/<TabsContent value="palco" className="mt-0">[\s\S]*?<\/TabsContent>/, '<TabsContent value="palco" className="mt-0">\n                    <PalcoPadraoTab espetaculoNome={selectedEspetaculo} />\n                  </TabsContent>');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed palco inject");
