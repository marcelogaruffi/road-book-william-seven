import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

const startFieldTag = '<Label className="font-bold text-slate-700 dark:text-slate-300">Local da Apresentaç';
const startIdx = evt.indexOf(startFieldTag);

if (startIdx !== -1) {
    // find the previous <div className="space-y-2">
    const divStart = evt.lastIndexOf('<div className="space-y-2">', startIdx);
    
    const endFieldTag = 'className="h-12 rounded-xl" />';
    const endIdx = evt.indexOf(endFieldTag, evt.indexOf('Horário *', divStart));
    const divEnd = evt.indexOf('</div>', endIdx) + 6;
    
    if (divStart !== -1 && endIdx !== -1) {
          const newApresFields = `<div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Apresentações (Sessões) *</Label>
                  {!viewMode && (
                    <Button variant="outline" size="sm" onClick={() => setApresentacoesList([...apresentacoesList, { data: '', horario: '', local: local }])} className="h-8 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                      <Plus className="size-3 mr-1" /> Adicionar Sessão
                    </Button>
                  )}
                </div>
                
                {apresentacoesList.length === 0 && (
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                    Clique no botão acima para adicionar datas e locais.
                  </div>
                )}

                <div className="space-y-3">
                  {apresentacoesList.map((ap, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 relative">
                      <div className="flex-[0.8] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Data *</Label>
                        <Input type="date" disabled={viewMode} value={ap.data} onChange={e => { const nl = [...apresentacoesList]; nl[idx].data = e.target.value; setApresentacoesList(nl); if (idx === 0) setDataApres(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      <div className="flex-[0.6] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Horário *</Label>
                        <Input type="time" disabled={viewMode} value={ap.horario} onChange={e => { const nl = [...apresentacoesList]; nl[idx].horario = e.target.value; setApresentacoesList(nl); if (idx === 0) setHorario(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      <div className="flex-[1.5] space-y-1">
                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Local *</Label>
                        <Input disabled={viewMode} value={ap.local} onChange={e => { const nl = [...apresentacoesList]; nl[idx].local = e.target.value; setApresentacoesList(nl); if (idx === 0) setLocal(e.target.value); }} className="h-10 bg-white dark:bg-slate-900" />
                      </div>
                      {!viewMode && apresentacoesList.length > 1 && (
                        <div className="pt-5 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => { const nl = [...apresentacoesList]; nl.splice(idx, 1); setApresentacoesList(nl); }} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>`;
              
          evt = evt.substring(0, divStart) + newApresFields + evt.substring(divEnd);
          console.log("Fields Replaced");
          fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
    } else {
        console.log("Could not find ends");
    }
} else {
    console.log("Could not find start");
}
