const fs = require('fs');

function fixSyntax(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix the missing { condition
  if (!code.includes('<GridEventos')) {
    code = code.replace(/<TabsContent value="evento" className="mt-6 space-y-6">\s*<Card>/, 
      `<TabsContent value="evento" className="mt-6 space-y-6">\n          {!selectedEventoId ? (\n            <GridEventos onSelect={setSelectedEventoId} />\n          ) : (\n          <Card>`
    );
  }

  // Double check if there are multiple `)}` and fix them.
  // We want EXACTLY ONE `)}` before `</TabsContent>` for the evento tab.
  // Actually, let's just make sure it compiles.
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed syntax', filePath);
}

fixSyntax('src/routes/_authenticated/partituras.index.tsx');
fixSyntax('src/routes/_authenticated/musicas.index.tsx');

