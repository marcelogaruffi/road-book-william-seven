const fs = require('fs');

function fixGridPage(filePath, routeName) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Inject GridEventos
  if (!code.includes('GridEventos')) {
    code = code.replace(/import { supabase }/, 'import { GridEventos } from "@/components/GridEventos";\nimport { supabase }');
  }

  // Replace the entire TabsContent value="eventos" internal code with GridEventos
  // It starts at <TabsContent value="eventos"...> and ends at </TabsContent>
  const tabsContentRegex = /<TabsContent value="eventos"[^>]*>[\s\S]*?<\/TabsContent>/;
  
  // if it's som-operacao it might not have tabs? Let's assume it has tabs for now.
  code = code.replace(tabsContentRegex, `<TabsContent value="eventos" className="mt-8">
            <GridEventos onSelect={(id) => window.location.href = \`/${routeName}/\${id}\`} />
          </TabsContent>`);

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed', filePath);
}

try { fixGridPage('src/routes/_authenticated/som-operacao.index.tsx', 'som-operacao'); } catch (e) { console.log('Error som-operacao', e) }
