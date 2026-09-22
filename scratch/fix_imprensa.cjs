const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// Fix text mangling
const replacements = {
  'Ã§': 'ç', 'Ã¡': 'á', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã©': 'é', 'Ãª': 'ê', 
  'Ã­': 'í', 'Ã³': 'ó', 'Ãµ': 'õ', 'Ãº': 'ú', 'Ã€': 'À', 'Ã ': 'À', 
  'Ã‡': 'Ç', 'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‚': 'Â', 'Ã”': 'Ô',
  'ðŸŸ¢': '🟢', 'ðŸ”´': '🔴', 'ðŸŸ¡': '🟡', 'ðŸ“ ': '📍', 'ðŸŽ­': '🎭', 
  'ðŸ †': '🏆', 'ðŸ”—': '🔗', 'matÃƒÂ©ria': 'matéria', 'obrigatÃ³rios': 'obrigatórios',
  'PÃºblico': 'Público', 'TÃ­tulo': 'Título', 'VeÃ­culo': 'Veículo', 'RelevÃ¢ncia': 'Relevância',
  'atraÃ§Ã£o': 'atração', 'CirculaÃ§Ã£o': 'Circulação', 'apresentaÃ§Ã£o': 'apresentação',
  'pÃºblico': 'público', 'AvaliaÃ§Ã£o': 'Avaliação', 'ComprovaÃ§Ã£o': 'Comprovação',
  'DivulgaÃ§Ã£o': 'Divulgação', 'EspetÃ¡culo': 'Espetáculo', 'RÃ¡dio': 'Rádio',
  'portfÃ³lio': 'portfólio', 'inscriÃ§Ã£o': 'inscrição', 'MatÃ©ria': 'Matéria', 'PublicaÃ§Ã£o': 'Publicação',
  'produÃ§Ãµes': 'produções', 'artÃ­sticas': 'artísticas', 'Ã§Ã£o': 'ção', 'Ã§Ãµes': 'ções',
  'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã¢': 'â', 'Ãª': 'ê', 'Ã®': 'î', 'Ã´': 'ô', 'Ã»': 'û',
  'Ã£': 'ã', 'Ãµ': 'õ', 'Ã§': 'ç', 'Ã': 'À', 'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

// Ensure https is prepended for hrefs
content = content.replace(
  /href=\{clip\.link_materia\}/g,
  "href={clip.link_materia.startsWith('http') ? clip.link_materia : 'https://' + clip.link_materia}"
);

// We need to implement editing clipping. 
// 1. Add Edit button to card
// 2. Add editClipping logic

const oldCardButtons = /{isAllowed && \(\s*<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity" onClick=\{\(\) => deleteClipping\(clip\.id\)\}>\s*<Trash2 className="w-4 h-4" \/>\s*<\/Button>\s*\)}/g;

const newCardButtons = `{isAllowed && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600" onClick={() => editClipping(clip)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteClipping(clip.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}`;

content = content.replace(oldCardButtons, newCardButtons);

// Inject editClipping function near deleteClipping
const editClippingFn = `  const editClipping = (clip: any) => {
    setNewClipping({
      espetaculo: clip.espetaculo || '',
      veiculo: clip.veiculo || '',
      titulo_materia: clip.titulo_materia || '',
      link_materia: clip.link_materia || '',
      data_publicacao: clip.data_publicacao || '',
      sentimento: clip.sentimento || 'neutro'
    });
    setRegisteredClipping(clip);
    setRelevancia({
      geo: clip.relevancia_geo || 3,
      publico: clip.relevancia_publico || 3,
      autoridade: clip.relevancia_autoridade || 3,
      cta: clip.relevancia_cta || 3
    });
    setClippingTags(clip.tags || []);
    setIsClippingOpen(true);
    setClippingStep(1);
  };`;

content = content.replace("const deleteClipping", editClippingFn + "\n\n  const deleteClipping");

// Update saveClipping to handle UPSERT
const oldSaveClippingBlock = /const saveClipping = async \(\) => \{[\s\S]*?setClippingStep\(2\);\s*\}\s*\};/m;

const newSaveClippingBlock = `const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    let thumbnail_url = registeredClipping?.thumbnail_url || null;
    if (newClipping.link_materia && newClipping.link_materia !== registeredClipping?.link_materia) {
      try {
        toast.info("Buscando preview do site...");
        const res = await fetch(\`https://api.microlink.io?url=\${encodeURIComponent(newClipping.link_materia.startsWith('http') ? newClipping.link_materia : 'https://' + newClipping.link_materia)}\`);
        const json = await res.json();
        if (json.status === 'success' && json.data?.image?.url) {
          thumbnail_url = json.data.image.url;
        } else if (json.data?.logo?.url) {
          thumbnail_url = json.data.logo.url;
        }
      } catch (e) {
        console.error("Microlink error:", e);
      }
    }

    const payload: any = { ...newClipping, thumbnail_url };
    if (registeredClipping?.id) {
       payload.id = registeredClipping.id;
    }

    const { data, error } = await supabase.from('imprensa_clipping').upsert(payload).select().single();
    if (error) {
      toast.error('Erro ao salvar clipping');
    } else {
      toast.success(registeredClipping?.id ? 'Atualizado! Ajuste a relevância se necessário.' : 'Matéria salva! Vamos definir a relevância.');
      setRegisteredClipping(data);
      if (registeredClipping?.id) {
        setClipping(clipping.map(c => c.id === data.id ? data : c));
      } else {
        setClipping([data, ...clipping]);
      }
      setClippingStep(2);
    }
  };`;

content = content.replace(oldSaveClippingBlock, newSaveClippingBlock);

// Clear registeredClipping when opening modal manually to add NEW
const oldButtonTrigger = /<Button className="bg-slate-800 text-white hover:bg-slate-700">\s*<Plus className="w-4 h-4 mr-2" \/> Novo Clipping\s*<\/Button>/g;
const newButtonTrigger = `<Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={() => {
                      setRegisteredClipping(null);
                      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
                      setRelevancia({ geo: 3, publico: 3, autoridade: 3, cta: 3 });
                      setClippingTags([]);
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Novo Clipping
                    </Button>`;
content = content.replace(oldButtonTrigger, newButtonTrigger);

// One last pass to ensure 🟢 🔴 🟡 📍 🎭 🏆 🔗 render correctly
content = content.replace(/ðŸŸ¢/g, '🟢').replace(/ðŸ”´/g, '🔴').replace(/ðŸŸ¡/g, '🟡');
content = content.replace(/ðŸ“ /g, '📍').replace(/ðŸŽ­/g, '🎭').replace(/ðŸ †/g, '🏆').replace(/ðŸ”—/g, '🔗');

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', content, 'utf8');
console.log("Fixed encoding and added edit clipping!");
