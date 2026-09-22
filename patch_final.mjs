import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// 1. Replace the fields
const startFieldTag = '<div className="space-y-2">\n              <Label className="font-bold text-slate-700 dark:text-slate-300">Local da Apresenta';
const endFieldTag = 'onChange={e => setHorario(e.target.value)} className="h-12 rounded-xl" />\n            </div>';

const fieldStartIndex = evt.indexOf(startFieldTag);
const fieldEndIndex = evt.indexOf(endFieldTag);

if (fieldStartIndex !== -1 && fieldEndIndex !== -1) {
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

  evt = evt.substring(0, fieldStartIndex) + newApresFields + evt.substring(fieldEndIndex + endFieldTag.length);
  console.log("Fields replaced");
} else {
  console.log("Fields not replaced", fieldStartIndex, fieldEndIndex);
}

// 2. Replace handleSave
const startSaveTag = "toast.success('Evento salvo com sucesso.');";
const endSaveTag = "// Update Financials for ALL current scales";

const saveStartIndex = evt.indexOf(startSaveTag);
const saveEndIndex = evt.indexOf(endSaveTag);

if (saveStartIndex !== -1 && saveEndIndex !== -1) {
    const newSaveBlock = `
        // Save Apresentacoes
        if (savedEventId) {
          const { data: currentAps } = await supabase.from('evento_apresentacoes').select('id').eq('evento_id', savedEventId);
          const currentIds = (currentAps || []).map((a:any) => a.id);
          const keepIds = apresentacoesList.map(a => a.id).filter(Boolean);
          const toDelete = currentIds.filter((id:any) => !keepIds.includes(id));
          
          if (toDelete.length > 0) {
            await supabase.from('evento_apresentacoes').delete().in('id', toDelete);
          }

          const toUpsert = apresentacoesList.map((a) => ({
             id: a.id || undefined,
             evento_id: savedEventId,
             data: a.data,
             horario: a.horario,
             local: a.local
          }));
          
          if (toUpsert.length > 0) {
             const { data: upsertedAps } = await supabase.from('evento_apresentacoes').upsert(toUpsert, { onConflict: 'id' }).select();
             
             const numAps = upsertedAps ? upsertedAps.length : 1;
             
             // Multiply Scales!
             const removedEscalas = escalasOriginais.filter(eo => !escalasAtuais.some(ea => ea.usuario_id === eo.usuario_id && ea.funcao === eo.funcao));
             if (removedEscalas.length > 0) {
                for (const re of removedEscalas) {
                   await supabase.from('evento_escalas').delete().match({ evento_id: savedEventId, usuario_id: re.usuario_id, funcao: re.funcao });
                }
             }

             for (const ea of escalasAtuais) {
                const { data: existingScales } = await supabase.from('evento_escalas').select('id').match({ evento_id: savedEventId, usuario_id: ea.usuario_id, funcao: ea.funcao });
                const currentCount = existingScales ? existingScales.length : 0;
                
                if (currentCount < numAps) {
                   const toAdd = numAps - currentCount;
                   const insertData = Array(toAdd).fill({
                      evento_id: savedEventId,
                      usuario_id: ea.usuario_id,
                      funcao: ea.funcao,
                      cache: caches[\`\${ea.usuario_id}_\${ea.funcao}\`] || null,
                      status: 'pendente'
                   });
                   await supabase.from('evento_escalas').insert(insertData);
                   
                   // Notificacao
                   if (toAdd > 0 && numAps === existingScales?.length) { // Wait, the existing code didn't check
                   }
                } else if (currentCount > numAps) {
                   const toRemove = currentCount - numAps;
                   if (existingScales && existingScales.length >= toRemove) {
                      const idsToRemove = existingScales.slice(0, toRemove).map((x:any) => x.id);
                      await supabase.from('evento_escalas').delete().in('id', idsToRemove);
                   }
                }
             }
          }
        }

        toast.success('Evento salvo com sucesso.');
        setOpenDialog(false);
        loadData();
        
        `;

    evt = evt.substring(0, saveStartIndex) + newSaveBlock + evt.substring(saveEndIndex);
    console.log("handleSave replaced");
} else {
    console.log("handleSave not replaced", saveStartIndex, saveEndIndex);
}

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
