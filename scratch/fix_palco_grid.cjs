const fs = require('fs');

function fixTabsContentPage(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Inject GridEventos
  if (!code.includes('GridEventos')) {
    code = code.replace(/import { supabase }/, 'import { GridEventos } from "@/components/GridEventos";\nimport { supabase }');
  }

  // <TabsContent value="evento" className="mt-6 space-y-6">
  //   <Card>
  //     <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
  //       <div className="flex flex-col sm:flex-row gap-4 items-end">
  //         <div className="flex-1 space-y-2 w-full">
  //           <Label>Selecione o Evento</Label>
  //           <select value={selectedEventoId} ...>
  //           </select>
  //         </div>

  const selectBlockRegex = /<div className="flex-1 space-y-2 w-full">\s*<Label>Selecione o Evento<\/Label>\s*<select value=\{selectedEventoId\}[\s\S]*?<\/select>\s*<\/div>/;
  code = code.replace(selectBlockRegex, `<div className="flex-1 space-y-2 w-full flex items-center justify-start">
                    <Button variant="outline" onClick={() => setSelectedEventoId("")}>← Voltar para Grade</Button>
                  </div>`);

  code = code.replace(/<TabsContent value="evento" className="mt-6 space-y-6">\s*<Card>/, 
    `<TabsContent value="evento" className="mt-6 space-y-6">
          {!selectedEventoId ? (
            <GridEventos onSelect={setSelectedEventoId} />
          ) : (
          <Card>`
  );

  code = code.replace(/<\/Card>\s*<\/TabsContent>/, 
    `</Card>\n          )}\n        </TabsContent>`
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed', filePath);
}

fixTabsContentPage('src/routes/_authenticated/palco.index.tsx');
