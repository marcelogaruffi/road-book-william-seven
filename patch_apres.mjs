import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// The first changes in loadData
if (!evt.includes('aprRes')) {
  evt = evt.replace(
    "supabase.from('evento_escalas').select('*')",
    "supabase.from('evento_escalas').select('*'),\n        supabase.from('evento_apresentacoes').select('*')"
  );
  evt = evt.replace(
    "const [evRes, trRes, profRes, tempRes, confRes, escRes] = await Promise.all([",
    "const [evRes, trRes, profRes, tempRes, confRes, escRes, aprRes] = await Promise.all(["
  );
  evt = evt.replace(
    "let finalEv = evRes.data;",
    "let finalEv = evRes.data;\n        const allAps = aprRes?.data || [];\n        finalEv = finalEv.map(e => ({ ...e, apresentacoes: allAps.filter(a => a.evento_id === e.id).sort((a,b)=>a.data.localeCompare(b.data)) }));"
  );
}

// Add state
if (!evt.includes('apresentacoesList')) {
  evt = evt.replace(
    "const [viewMode, setViewMode] = useState(false);",
    "const [viewMode, setViewMode] = useState(false);\n  const [apresentacoesList, setApresentacoesList] = useState<{id?: string, data: string, horario: string, local: string}[]>([]);"
  );

  evt = evt.replace(
    "setEscalasOriginais([]);",
    "setEscalasOriginais([]);\n      setApresentacoesList([{ data: '', horario: '', local: '' }]);"
  );

  evt = evt.replace(
    "setEscalasOriginais([...novasEscalas]);",
    "setEscalasOriginais([...novasEscalas]);\n      setApresentacoesList(ev.apresentacoes && ev.apresentacoes.length > 0 ? ev.apresentacoes : [{ data: ev.data || '', horario: ev.horario || '', local: ev.local || '' }]);"
  );
}

// Render Evento Card
const newRenderEventoCard = `const renderEventoCard = (ev: Evento) => {
    let monthStr = '';
    let dayStr = '';
    let hasRange = false;
    
    if (ev.apresentacoes && ev.apresentacoes.length > 0) {
      const dates = ev.apresentacoes.map(a => new Date(a.data + 'T12:00:00Z')).sort((a,b) => a.getTime() - b.getTime());
      if (dates.length > 1) {
        hasRange = true;
        const d1 = dates[0];
        const d2 = dates[dates.length - 1];
        if (d1.getMonth() === d2.getMonth()) {
          dayStr = d1.getDate() + ' a ' + d2.getDate();
          monthStr = d1.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        } else {
          dayStr = d1.getDate() + '/' + (d1.getMonth()+1) + ' a ' + d2.getDate() + '/' + (d2.getMonth()+1);
          monthStr = 'VAR';
        }
      } else {
        const dt = dates[0];
        monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
      }
    } else if (ev.data) {
      const dt = new Date(ev.data + 'T12:00:00Z');
      monthStr = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      dayStr = dt.toLocaleDateString('pt-BR', { day: '2-digit' });
    }

    const logoUrl = logosEspetaculos[ev.espetaculo];

    return (
      <Card key={ev.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
        <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
          {logoUrl ? (
            <img src={logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" alt="Logo" />
          ) : (
            <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover:scale-110 transition-transform">
              {ev.espetaculo?.toUpperCase() || 'EVENTO'}
            </span>
          )}
          <div className={\`absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center h-16 border border-slate-100 dark:border-slate-800 z-10 group-hover:-translate-y-1 transition-transform \${hasRange ? 'px-4' : 'w-14'}\`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
            <span className={\`font-black text-slate-800 dark:text-slate-100 leading-none \${hasRange ? 'text-sm' : 'text-xl'}\`}>{dayStr}</span>
          </div>
        </div>

        <div className="p-4 pt-5 flex flex-col flex-1">
          <div onClick={() => { setViewMode(true); handleOpenEdit(ev); }} className="flex-1">
            <h4 className="text-xl font-black text-[var(--foreground)] truncate pr-16" title={ev.espetaculo}>{ev.espetaculo}</h4>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1 truncate" title={ev.cidade + (ev.local ? ' - ' + ev.local : '')}>
              📍 {ev.cidade} {ev.local ? \` - \${ev.local}\` : ''}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 flex items-center gap-1.5">
              <Clock className="size-3.5" /> {ev.apresentacoes && ev.apresentacoes.length > 1 ? ev.apresentacoes.length + ' apresentações' : (ev.horario ? ev.horario.substring(0,5) : 'A definir')}
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-2" onClick={() => { setViewMode(true); handleOpenEdit(ev); }}>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                <Users className="size-3" /> {ev.equipe?.length || 0}
              </span>
              {ev.turne_id && (
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md truncate max-w-[120px]">
                  {getTourName(ev.turne_id)}
                </span>
              )}
            </div>
            
            {canEdit && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                {permitirSms && (
                  <Button variant="ghost" size="icon" onClick={() => notifyAll(ev)} className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Notificar via SMS">
                    <Megaphone className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => { setViewMode(false); handleOpenEdit(ev); }} className="h-8 w-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Editar">
                  <Edit className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Excluir">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );`;
evt = evt.replace(/const renderEventoCard = \(ev: Evento\) => \{[\s\S]*?^\s*\};\n/ms, newRenderEventoCard + "\n");

// Replace the Local/Data/Horario fields
// They look like:
/*
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Local da Apresenta...o *</Label>
              <Input disabled={viewMode} value={local} onChange={e => setLocal(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data da Apresenta...o *</Label>
              <Input disabled={viewMode} type="date" value={dataApres} onChange={e => setDataApres(e.target.value)} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Horário *</Label>
              <Input disabled={viewMode} type="time" value={horario} onChange={e => setHorario(e.target.value)} className="h-12 rounded-xl" />
            </div>
*/

const fieldBlockRegex = /<div className="space-y-2">\s*<Label className="font-bold text-slate-700 dark:text-slate-300">Local da Apresenta[\s\S]*?className="h-12 rounded-xl" \/>\s*<\/div>\s*<\/div>/;

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

// Note: the original block includes Local, Data, Horario.
evt = evt.replace(fieldBlockRegex, newApresFields);


// 7. handleSave update
const oldSaveEnd = "toast.success('Evento salvo com sucesso.');\n        setOpenDialog(false);\n        loadData();\n        \n        // Delete removed scales";
const newSaveEnd = `
        // Save Apresentacoes
        if (savedEventId) {
          const { data: currentAps } = await supabase.from('evento_apresentacoes').select('id').eq('evento_id', savedEventId);
          const currentIds = (currentAps || []).map(a => a.id);
          const keepIds = apresentacoesList.map(a => a.id).filter(Boolean);
          const toDelete = currentIds.filter(id => !keepIds.includes(id));
          
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
                      cache: caches[\`\${ea.usuario_id}_\${ea.funcao}\`] || null
                   });
                   await supabase.from('evento_escalas').insert(insertData);
                } else if (currentCount > numAps) {
                   const toRemove = currentCount - numAps;
                   if (existingScales && existingScales.length >= toRemove) {
                      const idsToRemove = existingScales.slice(0, toRemove).map(x => x.id);
                      await supabase.from('evento_escalas').delete().in('id', idsToRemove);
                   }
                }
             }
          }
        }

        toast.success('Evento salvo com sucesso.');
        setOpenDialog(false);
        loadData();
        
        // Removed old scales block
`;

evt = evt.replace(oldSaveEnd, newSaveEnd);

// Delete the rest of the old scale management code
evt = evt.replace(/const removedEscalas = escalasOriginais[\s\S]*?await supabase\.from\('evento_escalas'\)\.insert\(insertData\);\n        }/m, '');

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
console.log("Done");
