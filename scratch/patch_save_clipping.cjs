const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

const saveStart = code.indexOf('const saveClipping = async () => {');
const saveEnd = code.indexOf('const deleteMailing = async (id: string) => {');

const newCode = `const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    let thumbnail_url = typeof registeredClipping !== 'undefined' && registeredClipping ? registeredClipping.thumbnail_url : null;
    let urlToFetch = newClipping.link_materia;
    
    if (urlToFetch) {
      if (!urlToFetch.startsWith('http')) {
         urlToFetch = 'https://' + urlToFetch;
         setNewClipping({...newClipping, link_materia: urlToFetch});
      }
      
      const oldLink = typeof registeredClipping !== 'undefined' && registeredClipping ? registeredClipping.link_materia : null;
      if (urlToFetch !== oldLink) {
        try {
          toast.info('Buscando preview do site...');
          const res = await fetch('https://api.microlink.io?url=' + encodeURIComponent(urlToFetch));
          const json = await res.json();
          if (json.status === 'success' && json.data?.image?.url) {
            thumbnail_url = json.data.image.url;
          } else if (json.data?.logo?.url) {
            thumbnail_url = json.data.logo.url;
          }
        } catch (e) {
          console.error('Microlink error:', e);
        }
      }
    }

    const payload: any = { ...newClipping, link_materia: urlToFetch, thumbnail_url };
    if (typeof registeredClipping !== 'undefined' && registeredClipping?.id) {
       payload.id = registeredClipping.id;
    }

    const { data, error } = await supabase.from('imprensa_clipping').upsert(payload).select().single();
    if (error) {
      toast.error('Erro ao salvar clipping');
    } else {
      toast.success(payload.id ? 'Atualizado! Ajuste a relevância se necessário.' : 'Matéria salva! Vamos definir a relevância.');
      setRegisteredClipping(data);
      if (payload.id) {
        setClipping(clipping.map(c => c.id === data.id ? data : c));
      } else {
        setClipping([data, ...clipping]);
      }
      setClippingStep(2);
    }
  };

  const saveRelevance = async () => {
    if (!registeredClipping) return;
    
    const score = (relevancia.geo * 0.35) + (relevancia.publico * 0.25) + (relevancia.autoridade * 0.20) + (relevancia.cta * 0.20);
    let tier = 'Tier 3 (Baixa)';
    if (score >= 4.0) tier = 'Tier 1 (Máxima)';
    else if (score >= 2.5) tier = 'Tier 2 (Média)';

    const { error } = await supabase.from('imprensa_clipping').update({
      relevancia_geo: relevancia.geo,
      relevancia_publico: relevancia.publico,
      relevancia_autoridade: relevancia.autoridade,
      relevancia_cta: relevancia.cta,
      relevancia_score: score.toFixed(2),
      relevancia_tier: tier,
      tags: typeof clippingTags !== 'undefined' ? clippingTags : []
    }).eq('id', registeredClipping.id);

    if (error) {
      toast.error('Erro ao salvar relevância');
    } else {
      toast.success('Avaliação concluída!');
      setClipping(clipping.map(c => c.id === registeredClipping.id ? { ...c, relevancia_tier: tier, relevancia_score: score.toFixed(2), tags: typeof clippingTags !== 'undefined' ? clippingTags : [] } : c));
      setIsClippingOpen(false);
      setClippingStep(1);
      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
      setRelevancia({ geo: 3, publico: 3, autoridade: 3, cta: 3 });
      if (typeof setClippingTags !== 'undefined') setClippingTags([]);
    }
  };
  
  const toggleTag = (tag: string) => {
    if (typeof setClippingTags !== 'undefined') {
       setClippingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    }
  };
  
  const renderStars = (field: keyof typeof relevancia) => {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map(v => (
          <Star key={v} className={\`w-6 h-6 cursor-pointer \${relevancia[field] >= v ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}\`} 
            onClick={() => setRelevancia({...relevancia, [field]: v})} />
        ))}
      </div>
    )
  };

  `;

code = code.substring(0, saveStart) + newCode + code.substring(saveEnd);

// Also need to make sure the href in UI uses https
code = code.replace(
  /href=\{clip\.link_materia\}/g,
  "href={clip.link_materia?.startsWith('http') ? clip.link_materia : 'https://' + clip.link_materia}"
);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', code, 'utf8');
console.log('REPLACED SAVES!');
