import fs from 'fs';

let evt = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

// We need to replace everything from "toast.success('Evento salvo com sucesso.');"
// up to "if (espalharTurne && turneId && turneConfig && savedEventId) {"

const startTag = "toast.success('Evento salvo com sucesso.');";
const endTag = "if (espalharTurne && turneId && turneConfig && savedEventId) {";

const startIndex = evt.indexOf(startTag);
const endIndex = evt.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `
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
                      cache: caches[\`\${ea.usuario_id}_\${ea.funcao}\`] || null
                   });
                   await supabase.from('evento_escalas').insert(insertData);
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

    evt = evt.substring(0, startIndex) + newBlock + evt.substring(endIndex);
    fs.writeFileSync('src/routes/_authenticated/eventos.tsx', evt);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find start or end tags!");
}
