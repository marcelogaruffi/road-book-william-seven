const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

const regex = /(<CachesEquipeTab roadbookId={selectedRoadbook} \/>\s*<\/TabsContent>)/;
if (regex.test(c)) {
    c = c.replace(regex, `$1\n\n                    <TabsContent value="notas" className="mt-0">\n                      <NotasBoletosTab roadbookId={selectedRoadbook} />\n                    </TabsContent>`);
    fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', c, 'utf8');
    console.log("Fixed tab content");
} else {
    console.log("Could not find insertion point");
}
