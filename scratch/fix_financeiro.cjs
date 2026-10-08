const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/financeiro.tsx', 'utf8');

if (!code.includes('GridEventos')) {
  code = code.replace(/import { supabase }/, 'import { GridEventos } from "@/components/GridEventos";\nimport { supabase }');
}

// Replace the entire select wrapper
const selectRegex = /<div className="bg-white dark:bg-card\/50 p-6 rounded-2xl border border-slate-200 dark:border-white\/5 shadow-sm space-y-4">[\s\S]*?<\/Select>[\s\S]*?<\/div>\s*<\/div>/;

// Replace with a Voltar button logic
code = code.replace(selectRegex, `<div className="flex items-center justify-start mb-4">
                <Button variant="outline" onClick={() => setSelectedRoadbook("")}>â† Voltar para Grade</Button>
              </div>`);

// Now wrap it inside the condition
code = code.replace(/<TabsContent value="eventos" className="mt-0">/, 
`<TabsContent value="eventos" className="mt-0">
            {!selectedRoadbook ? (
              <div className="mt-4"><GridEventos onSelect={(eId, rId) => { if (rId) setSelectedRoadbook(rId); else toast.info("Este evento ainda nÁƒÂ£o possui um Guia de Viagem (Roadbook). Crie-o primeiro para acessar o financeiro."); }} /></div>
            ) : (`
);

// Close the wrapper
code = code.replace(/<\/Tabs>\s*<\/div>\s*<\/TabsContent>/, `</Tabs>\n              </div>\n            )}</TabsContent>`);

fs.writeFileSync('src/routes/_authenticated/financeiro.tsx', code, 'utf8');
console.log('Fixed financeiro');

