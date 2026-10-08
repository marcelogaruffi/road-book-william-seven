const fs = require('fs');

function refactorPage(filePath, title, iconName, typeVal) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Remove the toggle buttons for Tipo
  const togglePattern = /<div className="bg-slate-100\/50[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  code = code.replace(togglePattern, ''); // Remove the toggle header

  // Hardcode selectedTipo based on the page (partitura or musica)
  code = code.replace(/const \[selectedTipo, setSelectedTipo\] = useState<"partitura" \| "musica">\("partitura"\);/, `const selectedTipo = "${typeVal}";`);
  
  // Replace the h1 title
  code = code.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, `<h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <${iconName} className="size-8 text-primary" />
            ${title}
          </h1>`);

  // Inject GridEventos import
  if (!code.includes('GridEventos')) {
    code = code.replace(/import { supabase }/, 'import { GridEventos } from "@/components/GridEventos";\nimport { supabase }');
  }

  // Find the TabsContent value="evento" and replace the select with GridEventos
  // We'll replace the `<div className="flex flex-col sm:flex-row gap-4 items-end">` that contains the select
  // Actually, let's locate the CardHeader inside TabsContent value="evento"
  
  const selectBlockRegex = /<div className="flex flex-col sm:flex-row gap-4 items-end">\s*<div className="flex-1 space-y-2 w-full">\s*<Label>Selecione o Evento<\/Label>[\s\S]*?<\/div>\s*<\/div>/;
  
  // Replace select with Voltar button
  code = code.replace(selectBlockRegex, `<div className="flex items-center justify-between mb-4">
                  <Button variant="outline" onClick={() => setSelectedEventoId("")}>← Voltar para Grade</Button>
                  {/* Keep the import button logic */}
                </div>`);

  // Wrap the Card with conditional
  code = code.replace(/<Card className="border-0 shadow-xl overflow-hidden bg-white\/50 dark:bg-slate-900\/20 backdrop-blur-sm">/, 
    `{!selectedEventoId ? (
            <GridEventos onSelect={setSelectedEventoId} />
          ) : (
            <Card className="border-0 shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">`
  );

  // Close the conditional after the Card
  // The Card ends before `<TabsContent value="configuracao">`
  code = code.replace(/<\/Card>\s*<\/TabsContent>/, `</Card>\n          )}\n        </TabsContent>`);

  return code;
}

// 1. Refactor Partituras
const partiturasPath = 'src/routes/_authenticated/partituras.index.tsx';
let pCode = refactorPage(partiturasPath, 'Partituras', 'FileText', 'partitura');
// Rename title
pCode = pCode.replace(/title: "Partituras e Músicas/, 'title: "Partituras');
pCode = pCode.replace(/import { Music, FileText/g, 'import { Music, FileText, ArrowLeft');
fs.writeFileSync(partiturasPath, pCode, 'utf8');
console.log('Fixed Partituras');

// 2. Generate Músicas
let mCode = fs.readFileSync('src/routes/_authenticated/partituras.index.tsx', 'utf8');
mCode = mCode.replace(/\/partituras\//g, '/musicas/');
mCode = mCode.replace(/PartiturasPage/g, 'MusicasPage');
mCode = mCode.replace(/Partituras/g, 'Músicas');
mCode = mCode.replace(/FileText/g, 'FileAudio');
mCode = mCode.replace(/partitura"/g, 'musica"');
mCode = mCode.replace(/partitura'/g, "musica'");
mCode = mCode.replace(/Partitura/g, 'Música');
fs.writeFileSync('src/routes/_authenticated/musicas.index.tsx', mCode, 'utf8');
console.log('Created Musicas');

