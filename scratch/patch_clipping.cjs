const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/imprensa.tsx', 'utf8');

// 1. Add lucide icons for emojis and new fields
content = content.replace(
  'import { Newspaper, Mail, Plus, Trash2, Search, Link as LinkIcon, ExternalLink, Filter } from "lucide-react";',
  'import { Newspaper, Mail, Plus, Trash2, Search, Link as LinkIcon, ExternalLink, Filter, Star, Info, CheckCircle2 } from "lucide-react";'
);

// 2. Add extra fields to newClipping state & add Wizard states
content = content.replace(
  "const [newClipping, setNewClipping] = useState({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '' });",
  `const [newClipping, setNewClipping] = useState({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
  const [clippingStep, setClippingStep] = useState(1);
  const [registeredClipping, setRegisteredClipping] = useState<any>(null);
  const [relevancia, setRelevancia] = useState({ geo: 3, publico: 3, autoridade: 3, cta: 3 });
  const [clippingTags, setClippingTags] = useState<string[]>([]);`
);

// 3. Update saveClipping function to fetch thumb and advance to step 2
const oldSaveClipping = `  const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatÃ³rios');
      return;
    }
    const { data, error } = await supabase.from('imprensa_clipping').insert([newClipping]).select().single();
    if (error) {
      toast.error('Erro ao salvar clipping');
    } else {
      toast.success('Clipping salvo!');
      setClipping([data, ...clipping]);
      setIsClippingOpen(false);
      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '' });
    }
  };`;

const newSaveClipping = `  const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    let thumbnail_url = null;
    if (newClipping.link_materia) {
      try {
        toast.info("Buscando preview do site...");
        const res = await fetch(\`https://api.microlink.io?url=\${encodeURIComponent(newClipping.link_materia)}\`);
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

    const { data, error } = await supabase.from('imprensa_clipping').insert([{ ...newClipping, thumbnail_url }]).select().single();
    if (error) {
      toast.error('Erro ao salvar clipping');
    } else {
      toast.success('Matéria salva! Vamos definir a relevância.');
      setRegisteredClipping(data);
      setClipping([data, ...clipping]);
      setClippingStep(2);
    }
  };

  const saveRelevance = async () => {
    if (!registeredClipping) return;
    
    const score = (relevancia.geo * 0.35) + (relevancia.publico * 0.25) + (relevancia.autoridade * 0.20) + (relevancia.cta * 0.20);
    let tier = "Tier 3 (Baixa)";
    if (score >= 4.0) tier = "Tier 1 (Máxima)";
    else if (score >= 2.5) tier = "Tier 2 (Média)";

    const { error } = await supabase.from('imprensa_clipping').update({
      relevancia_geo: relevancia.geo,
      relevancia_publico: relevancia.publico,
      relevancia_autoridade: relevancia.autoridade,
      relevancia_cta: relevancia.cta,
      relevancia_score: score.toFixed(2),
      relevancia_tier: tier,
      tags: clippingTags
    }).eq('id', registeredClipping.id);

    if (error) {
      toast.error('Erro ao salvar relevância');
    } else {
      toast.success('Avaliação concluída!');
      // Update local state
      setClipping(clipping.map(c => c.id === registeredClipping.id ? { ...c, relevancia_tier: tier, relevancia_score: score.toFixed(2), tags: clippingTags } : c));
      setIsClippingOpen(false);
      setClippingStep(1);
      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
      setRelevancia({ geo: 3, publico: 3, autoridade: 3, cta: 3 });
      setClippingTags([]);
    }
  };
  
  const toggleTag = (tag: string) => {
    setClippingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
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
  };`;

content = content.replace(oldSaveClipping, newSaveClipping);

// 4. Update the Dialog for Clipping to support the 2 steps
const oldClippingDialog = /<Dialog open=\{isClippingOpen\} onOpenChange=\{setIsClippingOpen\}>[\s\S]*?<\/Dialog>/;

const newClippingDialog = `<Dialog open={isClippingOpen} onOpenChange={(open) => {
                if (!open) {
                  setIsClippingOpen(false);
                  setTimeout(() => setClippingStep(1), 300);
                } else {
                  setIsClippingOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 text-white hover:bg-slate-700">
                    <Plus className="w-4 h-4 mr-2" /> Novo Clipping
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  {clippingStep === 1 ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Registrar Clipping</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Espetáculo</Label>
                          <Select value={newClipping.espetaculo} onValueChange={v => setNewClipping({...newClipping, espetaculo: v})}>
                            <SelectTrigger><SelectValue placeholder="Selecione o espetáculo" /></SelectTrigger>
                            <SelectContent>
                              {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Título da Matéria</Label>
                          <Input value={newClipping.titulo_materia} onChange={e => setNewClipping({...newClipping, titulo_materia: e.target.value})} placeholder="Ex: Peça encanta público no RJ" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Veículo</Label>
                            <Input value={newClipping.veiculo} onChange={e => setNewClipping({...newClipping, veiculo: e.target.value})} placeholder="Ex: O Globo" />
                          </div>
                          <div className="space-y-2">
                            <Label>Data de Publicação</Label>
                            <Input type="date" value={newClipping.data_publicacao} onChange={e => setNewClipping({...newClipping, data_publicacao: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Sentimento da Matéria</Label>
                          <div className="flex gap-2">
                            <Button variant={newClipping.sentimento === 'positivo' ? 'default' : 'outline'} className={newClipping.sentimento === 'positivo' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={() => setNewClipping({...newClipping, sentimento: 'positivo'})}>🟢 Positivo</Button>
                            <Button variant={newClipping.sentimento === 'neutro' ? 'default' : 'outline'} className={newClipping.sentimento === 'neutro' ? 'bg-yellow-500 hover:bg-yellow-600' : ''} onClick={() => setNewClipping({...newClipping, sentimento: 'neutro'})}>🟡 Neutro</Button>
                            <Button variant={newClipping.sentimento === 'negativo' ? 'default' : 'outline'} className={newClipping.sentimento === 'negativo' ? 'bg-red-600 hover:bg-red-700' : ''} onClick={() => setNewClipping({...newClipping, sentimento: 'negativo'})}>🔴 Negativo</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Link da Matéria</Label>
                          <Input value={newClipping.link_materia} onChange={e => setNewClipping({...newClipping, link_materia: e.target.value})} placeholder="https://" />
                          <p className="text-xs text-slate-500">A thumbnail do site será capturada automaticamente.</p>
                        </div>
                        <Button onClick={saveClipping} className="w-full bg-blue-600 hover:bg-blue-700">Continuar para Relevância</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle>Passo 2: Matriz de Relevância (Circulação)</DialogTitle>
                        <DialogDescription>Classifique o impacto deste canal para a atração do público local.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                          <div className="flex justify-between items-center"><Label className="text-base font-semibold">📍 Impacto Local (35%)</Label></div>
                          <p className="text-xs text-slate-500 mb-2">Atinge a cidade da apresentação? (Ex: Rádio local = 5)</p>
                          {renderStars('geo')}
                        </div>
                        
                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                          <div className="flex justify-between items-center"><Label className="text-base font-semibold">🎭 Público Qualificado (25%)</Label></div>
                          <p className="text-xs text-slate-500 mb-2">Atrai interessados em arte/oficinas? (Ex: Guia cultural = 5)</p>
                          {renderStars('publico')}
                        </div>

                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                          <div className="flex justify-between items-center"><Label className="text-base font-semibold">🏆 Autoridade / Chancela (20%)</Label></div>
                          <p className="text-xs text-slate-500 mb-2">Prestigio do veículo para portfólio. (Ex: Jornal tradicional = 5)</p>
                          {renderStars('autoridade')}
                        </div>

                        <div className="space-y-2 bg-slate-50 p-4 rounded-xl">
                          <div className="flex justify-between items-center"><Label className="text-base font-semibold">🔗 Call to Action (20%)</Label></div>
                          <p className="text-xs text-slate-500 mb-2">Tem data, hora e link de ingressos/inscrição? (Sim = 5)</p>
                          {renderStars('cta')}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Tags de Comprovação (Editais)</Label>
                          <div className="flex flex-wrap gap-2">
                            {["Divulgação de Oficina", "Divulgação de Espetáculo"].map(tag => (
                              <div key={tag} onClick={() => toggleTag(tag)} className={\`cursor-pointer px-3 py-1 rounded-full text-sm \${clippingTags.includes(tag) ? 'bg-blue-100 text-blue-700 border border-blue-300 font-medium' : 'bg-slate-100 text-slate-600 border border-slate-200'}\`}>
                                {clippingTags.includes(tag) && <CheckCircle2 className="w-4 h-4 inline-block mr-1" />}
                                {tag}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button onClick={saveRelevance} className="w-full bg-emerald-600 hover:bg-emerald-700">Finalizar Avaliação</Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>`;

content = content.replace(oldClippingDialog, newClippingDialog);

// 5. Update the Card rendering to show the Thumbnail, Emoji, Tier, and Tags
const oldCardPattern = /\{clipping\.map\(clip => \(\s*<Card key=\{clip\.id\}[\s\S]*?<\/Card>\s*\)\)\}/;
const newCardPattern = `{clipping.map(clip => {
                const sentimentEmoji = clip.sentimento === 'positivo' ? '🟢' : clip.sentimento === 'negativo' ? '🔴' : '🟡';
                const tierColor = clip.relevancia_tier?.includes('1') ? 'bg-emerald-100 text-emerald-700' : clip.relevancia_tier?.includes('2') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700';

                return (
                <Card key={clip.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col md:flex-row relative group">
                  {clip.thumbnail_url && (
                    <div className="w-full md:w-48 h-32 md:h-auto bg-slate-100 shrink-0">
                      <img src={clip.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xl">{sentimentEmoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{clip.titulo_materia}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="font-medium text-blue-600">{clip.veiculo}</span>
                            <span>&bull;</span>
                            <span>{new Date(clip.data_publicacao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        {isAllowed && (
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity" onClick={() => deleteClipping(clip.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {clip.espetaculo && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{clip.espetaculo}</span>}
                        {clip.relevancia_tier && <span className={\`px-2 py-1 text-xs rounded-md font-medium \${tierColor}\`}>{clip.relevancia_tier}</span>}
                        {clip.relevancia_score && <span className="text-xs text-slate-500 font-medium">Score: {clip.relevancia_score}</span>}
                      </div>

                      {clip.tags && clip.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {clip.tags.map((t: string) => <span key={t} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] rounded-full uppercase tracking-wider">{t}</span>)}
                        </div>
                      )}

                      {clip.link_materia && (
                        <a href={clip.link_materia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium">
                          Ler matÃ©ria completa <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )
              })}`;

content = content.replace(oldCardPattern, newCardPattern);

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', content, 'utf8');
console.log("Patched imprensa.tsx");
