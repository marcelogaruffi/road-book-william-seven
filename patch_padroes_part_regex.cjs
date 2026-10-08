const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(/<TabsContent value="partituras" className="mt-0">[\s\S]*?<\/TabsContent>/, '<TabsContent value="partituras" className="mt-0">\n                    <PartiturasPadraoTab espetaculoNome={selectedEspetaculo} />\n                  </TabsContent>');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed partituras inject");
