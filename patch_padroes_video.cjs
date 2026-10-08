const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/padroes.tsx', 'utf8');

c = c.replace(/<TabsContent value="video" className="mt-0">[\s\S]*?<\/TabsContent>/, '<TabsContent value="video" className="mt-0">\n                    <TemplateRidersTab espetaculoNome={selectedEspetaculo} context="video" />\n                  </TabsContent>');

fs.writeFileSync('src/routes/_authenticated/padroes.tsx', c, 'utf8');
console.log("Fixed video inject");
