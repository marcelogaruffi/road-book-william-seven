const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

const sIdx = code.indexOf('<Card className="mt-6">');
let eIdx = code.indexOf('</select>', sIdx);
eIdx = code.indexOf('</select>', eIdx + 1);
eIdx = code.indexOf('</div>', eIdx);

const newStr = \        {activeTab === 'evento' && !selectedEventoId ? (
          <div className="mt-6">
            <GridEventos onSelect={setSelectedEventoId} />
          </div>
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
code = code.substring(0, sIdx) + newStr + code.substring(eIdx + 6);

const emptyIdx = code.indexOf('{((activeTab === \\'evento\\' && !selectedEventoId) || (activeTab === \\'configuracao\\' && !selectedEspetaculoPadrao)) ? (');
if (emptyIdx !== -1) {
  const emptyEnd = code.indexOf(') : (', emptyIdx);
  code = code.substring(0, emptyIdx) + '{((activeTab === \\'configuracao\\' && !selectedEspetaculoPadrao)) ? (<div className="text-center py-12 text-slate-400 flex flex-col items-center"><DoorOpen className="size-12 mb-4 opacity-50" /><p>Selecione um show acima para gerenciar.</p></div>' + code.substring(emptyEnd);
}

const closeIdx = code.lastIndexOf('</Card>');
if (closeIdx !== -1) {
  code = code.substring(0, closeIdx + 7) + '\n        )}\n' + code.substring(closeIdx + 7);
}

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code);
console.log('Layout fixed successfully');
