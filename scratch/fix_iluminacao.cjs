const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/iluminacao.index.tsx', 'utf8');

// Replace the main body of the "eventos" tab with GridEventos.
// Looking at the file, the "eventos" tab content is:
// <TabsContent value="eventos" className="mt-8">
// ... huge block of logic ...
// </TabsContent>

code = code.replace(/<TabsContent value="eventos" className="mt-8">[\s\S]*?<\/TabsContent>/, `<TabsContent value="eventos" className="mt-8">\n          <GridEventos onSelect={handleGridSelect} />\n        </TabsContent>`);

fs.writeFileSync('src/routes/_authenticated/iluminacao.index.tsx', code, 'utf8');
