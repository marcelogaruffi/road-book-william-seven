const fs = require('fs');
let t = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf-8');

const sortPatch = `
  const handleSave = async () => {
    // Sort apresentacoes
    if (apresentacoesList.length > 0) {
       apresentacoesList.sort((a,b) => {
         const tA = new Date((a.data||'2000-01-01') + 'T' + (a.horario||'00:00'));
         const tB = new Date((b.data||'2000-01-01') + 'T' + (b.horario||'00:00'));
         return tA.getTime() - tB.getTime();
       });
    }
    
    const finalData = apresentacoesList.length > 0 ? apresentacoesList[0].data : dataApres;
    const finalHorario = apresentacoesList.length > 0 ? apresentacoesList[0].horario : horario;
    const finalLocal = apresentacoesList.length > 0 ? apresentacoesList[0].local : local;

    if (!cidade || !finalData || !finalHorario || !finalLocal || !espetaculo) {
      toast.warning('Preencha os campos obrigatorios.');
      return;
    }

    const payload = {
      cidade,
      produtora_nome: produtoraNome || null,
      produtora_logo_url: produtoraLogoUrl || null,
      turne_id: turneId || null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      data: finalData,
      horario: finalHorario,
      local: finalLocal,
      espetaculo,
      equipe
    };`;

// Find where payload is defined
const handleSaveStart = t.indexOf('  const handleSave = async () => {');
const payloadEnd = t.indexOf('  let error;', handleSaveStart);

if (handleSaveStart !== -1 && payloadEnd !== -1) {
  t = t.substring(0, handleSaveStart) + sortPatch + '\n\n' + t.substring(payloadEnd);
  fs.writeFileSync('src/routes/_authenticated/eventos.tsx', t);
  console.log('Fixed Sorting and Payload');
} else {
  console.log('Failed to find handleSave block');
}
