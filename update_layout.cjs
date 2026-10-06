const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

// Ensure GridEventos is imported
if (!code.includes('GridEventos')) {
  code = code.replace(
    /import \{ Card, CardContent, CardHeader, CardTitle, CardDescription \} from "@\/components\/ui\/card";/,
    'import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";\nimport { GridEventos } from "@/components/GridEventos";'
  );
}

// Replace TabsList
const tabsListRegex = /<TabsList className="grid w-full grid-cols-2 lg:w-\[400px\]">[\s\S]*?<\/TabsList>/;
code = code.replace(tabsListRegex, '{((activeTab === \\'evento\\' && selectedEventoId) || activeTab !== \\'evento\\') && (<TabsList className="grid w-full grid-cols-2 lg:w-[400px]"><TabsTrigger value="evento" className="flex items-center gap-2"><MapPin className="size-4" /> Evento Atual</TabsTrigger><TabsTrigger value="configuracao" className="flex items-center gap-2"><File className="size-4" /> Configuração Padrão</TabsTrigger></TabsList>)}');

// Replace Card
const cardRegex = /<Card className="mt-6">\s*<CardHeader className="bg-slate-50 dark:bg-slate-800\/50 border-b">\s*<div className="flex flex-col sm:flex-row gap-4 items-end">\s*<div className="flex-1 space-y-2 w-full">\s*<Label>\{activeTab === 'evento' \? 'Selecione o Evento' : 'Selecione o Show Padrão'\}<\/Label>\s*\{activeTab === 'evento' \? \([\s\S]*?<select value=\{selectedEventoId\}[\s\S]*?<\/select>\s*\) : \([\s\S]*?<select value=\{selectedEspetaculoPadrao\}[\s\S]*?<\/select>\s*\)\}\s*<\/div>/;

const newCardCode = \{activeTab === 'evento' && !selectedEventoId ? (
          <div className="mt-6"><GridEventos onSelect={setSelectedEventoId} /></div>
        ) : (
          <Card className="mt-6">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  {activeTab === 'evento' ? (
                    <div className="flex flex-col gap-2">
                      <Label className="text-slate-500">Evento Selecionado</Label>
                      <Button variant="outline" onClick={() => setSelectedEventoId("")} className="w-fit">? Voltar para Grade de Eventos</Button>
                    </div>
                  ) : (
                    <>
                      <Label>Selecione o Show Padrão</Label>
                      <select value={selectedEspetaculoPadrao} onChange={e => setSelectedEspetaculoPadrao(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Selecione um show...</option>
                        {espetaculosList.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                      </select>
                    </>
                  )}
                </div>\;

code = code.replace(cardRegex, newCardCode);

// Add the closing parenthesis for the conditional we added at the end of the Card.
// The Card ends near line 960 with:
//         </Card>
//       </Tabs>
const cardEndRegex = /<\/Card>\s*<\/Tabs>/;
code = code.replace(cardEndRegex, '</Card>\n        )}\n      </Tabs>');

// And we need to remove the fallback text inside CardContent when no event is selected, because now the GridEventos handles the empty state
const emptyStateRegex = /\{\(\(activeTab === 'evento' && !selectedEventoId\) \|\| \(activeTab === 'configuracao' && !selectedEspetaculoPadrao\)\) \? \([\s\S]*?<p>Selecione um \{activeTab === 'evento' \? 'evento' : 'show'\} acima para gerenciar\.<\/p>\s*<\/div>\s*\) : \(/;
code = code.replace(emptyStateRegex, '{((activeTab === \\'configuracao\\' && !selectedEspetaculoPadrao)) ? (<div className="text-center py-12 text-slate-400 flex flex-col items-center"><DoorOpen className="size-12 mb-4 opacity-50" /><p>Selecione um show acima para gerenciar.</p></div>) : (');

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('done layout update');
