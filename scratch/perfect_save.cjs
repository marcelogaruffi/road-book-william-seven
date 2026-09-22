const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const saveStart = code.indexOf('const saveClipping = async () => {');
const saveEnd = code.indexOf('const saveRelevance = async () => {');

const newSaveCode = `const saveClipping = async () => {
    try {
      if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      let urlToFetch = newClipping.link_materia;
      if (urlToFetch && !urlToFetch.startsWith('http')) {
         urlToFetch = 'https://' + urlToFetch;
      }

      const payload: any = { ...newClipping, link_materia: urlToFetch };
      
      if (typeof registeredClipping !== 'undefined' && registeredClipping?.id) {
         payload.id = registeredClipping.id;
      }

      let data, error;
      if (payload.id) {
        const res = await supabase.from('imprensa_clipping').update(payload).eq('id', payload.id).select().single();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase.from('imprensa_clipping').insert([payload]).select().single();
        data = res.data;
        error = res.error;
      }
      
      if (error) {
        toast.error('Erro ao salvar clipping: ' + error.message);
        console.error(error);
      } else if (data) {
        toast.success(payload.id ? 'Atualizado! Ajuste a relevância se necessário.' : 'Matéria salva! Vamos definir a relevância.');
        setRegisteredClipping(data);
        if (payload.id) {
          setClipping(clipping.map(c => c.id === data.id ? data : c));
        } else {
          setClipping([data, ...clipping]);
        }
        setClippingStep(2);
      } else {
        toast.error('Erro inesperado: dados vazios retornados');
      }
    } catch (e) {
      console.error('Crash in saveClipping:', e);
      toast.error('Erro de sistema ao salvar');
    }
  };

  `;

code = code.substring(0, saveStart) + newSaveCode + code.substring(saveEnd);

// Fix potential rendering crashes
code = code.replace(/clippingTags\.includes/g, '(clippingTags || []).includes');
code = code.replace(/clip\.tags\.map/g, 'clip.tags?.map');

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('Fixed file');
