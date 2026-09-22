const fs = require('fs');
fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', `import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Newspaper, Mail, Plus, Trash2, Search, Link as LinkIcon, ExternalLink, Filter, Star, Info, CheckCircle2, BarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/imprensa")({
  head: () => ({ meta: [{ title: "Imprensa - Seven Produções Artísticas" }] }),
  component: ImprensaPage,
});

export default function ImprensaPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessImprensa: isAllowed } = usePermissions(profile);

  const [mailing, setMailing] = useState<any[]>([]);
  const [clipping, setClipping] = useState<any[]>([]);
  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clippingTags, setClippingTags] = useState<string[]>([]);

  // Modal states
  const [isMailingOpen, setIsMailingOpen] = useState(false);
  const [isClippingOpen, setIsClippingOpen] = useState(false);
  const [isRelevanceOpen, setIsRelevanceOpen] = useState(false);

  // Form states
  const [newMailing, setNewMailing] = useState({ nome: '', veiculo: '', tipo_midia: 'Portal', email: '', telefone: '', notas: '' });
  const [newClipping, setNewClipping] = useState({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
  const [registeredClipping, setRegisteredClipping] = useState<any>(null);
  const [relevancia, setRelevancia] = useState({ geo: 3, publico: 3, autoridade: 3, cta: 3 });

  useEffect(() => {
    if (isAllowed) {
      fetchData();
    }
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    const [mailingRes, clippingRes, espRes] = await Promise.all([
      supabase.from('imprensa_mailing').select('*').order('nome'),
      supabase.from('imprensa_clipping').select('*').order('data_publicacao', { ascending: false }),
      supabase.from('templates_espetaculos').select('nome_espetaculo')
    ]);

    if (mailingRes.data) setMailing(mailingRes.data);
    if (clippingRes.data) setClipping(clippingRes.data);
    if (espRes.data) {
      const names = Array.from(new Set(espRes.data.map(e => e.nome_espetaculo))).filter(Boolean) as string[];
      setEspetaculos(names);
    }
    setLoading(false);
  };

  const saveMailing = async () => {
    if (!newMailing.nome || !newMailing.veiculo) return toast.error('Nome e veículo obrigatórios');
    const { data, error } = await supabase.from('imprensa_mailing').insert([newMailing]).select().single();
    if (error) { toast.error('Erro ao salvar'); } 
    else { toast.success('Contato salvo!'); setMailing([...mailing, data]); setIsMailingOpen(false); }
  };

  const deleteMailing = async (id: string) => {
    if (!confirm('Excluir contato?')) return;
    await supabase.from('imprensa_mailing').delete().eq('id', id);
    setMailing(mailing.filter(m => m.id !== id));
    toast.success('Contato removido');
  };

  const deleteClipping = async (id: string) => {
    if (!confirm('Excluir clipping?')) return;
    await supabase.from('imprensa_clipping').delete().eq('id', id);
    setClipping(clipping.filter(c => c.id !== id));
    toast.success('Clipping removido');
  };

  const editClipping = (clip: any) => {
    setRegisteredClipping(clip);
    setNewClipping({
      espetaculo: clip.espetaculo || '',
      veiculo: clip.veiculo || '',
      titulo_materia: clip.titulo_materia || '',
      link_materia: clip.link_materia || '',
      data_publicacao: clip.data_publicacao || '',
      sentimento: clip.sentimento || 'neutro'
    });
    setIsClippingOpen(true);
  };

  const openRelevanceDialog = (clip: any) => {
    setRegisteredClipping(clip);
    setRelevancia({
      geo: clip.relevancia_geo || 3,
      publico: clip.relevancia_publico || 3,
      autoridade: clip.relevancia_autoridade || 3,
      cta: clip.relevancia_cta || 3
    });
    setClippingTags(clip.tags || []);
    setIsRelevanceOpen(true);
  };

  const saveClipping = async () => {
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
      if (!payload.espetaculo) {
        delete payload.espetaculo; // Previne erro de chave estrangeira com string vazia
      }
      
      if (registeredClipping?.id) {
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
        toast.error('Erro ao salvar matéria: ' + error.message);
      } else if (data) {
        toast.success(payload.id ? 'Matéria atualizada!' : 'Matéria salva!');
        
        if (payload.id) {
          setClipping(clipping.map(c => c.id === data.id ? data : c));
        } else {
          setClipping([data, ...clipping]);
        }
        
        setIsClippingOpen(false); // Fecha tela 1
        
        // Vai pra tela 2 direto, como pedido!
        if (!payload.id) {
            openRelevanceDialog(data);
        }
      }
    } catch (e) {
      toast.error('Erro de sistema ao salvar');
    }
  };

  const saveRelevance = async () => {
    if (!registeredClipping) return;
    
    // Matemática da relevância
    const score = (relevancia.geo * 0.35) + (relevancia.publico * 0.25) + (relevancia.autoridade * 0.20) + (relevancia.cta * 0.20);
    let tier = 'Tier 3 (Baixo Impacto)';
    if (score >= 4.2) tier = 'Tier 1 (Alto Impacto / Decisor)';
    else if (score >= 3.0) tier = 'Tier 2 (Impacto Médio / Consideração)';

    const payload = {
      relevancia_geo: relevancia.geo,
      relevancia_publico: relevancia.publico,
      relevancia_autoridade: relevancia.autoridade,
      relevancia_cta: relevancia.cta,
      relevancia_score: score.toFixed(2),
      relevancia_tier: tier,
      tags: clippingTags
    };

    const { error } = await supabase.from('imprensa_clipping').update(payload).eq('id', registeredClipping.id);
    
    if (error) {
      toast.error('Erro ao salvar relevância');
    } else {
      toast.success('Matriz de relevância definida!');
      setClipping(clipping.map(c => c.id === registeredClipping.id ? { ...c, ...payload } : c));
      setIsRelevanceOpen(false);
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
  };

  if (!isAllowed) return <div className="p-8 text-center text-red-500 font-medium">Acesso negado.</div>;

  const filteredMailing = mailing.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.veiculo.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Imprensa</h1>
        <p className="text-slate-500 mt-1">Gestão de mailing e clipping de notícias</p>
      </div>

      <Tabs defaultValue="clipping" className="flex-1 flex flex-col p-8">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="clipping" className="gap-2"><Newspaper className="w-4 h-4" /> Clipping</TabsTrigger>
          <TabsTrigger value="mailing" className="gap-2"><Mail className="w-4 h-4" /> Mailing</TabsTrigger>
        </TabsList>

        <TabsContent value="mailing" className="flex-1 mt-0">
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar no mailing..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {isAllowed && (
              <Dialog open={isMailingOpen} onOpenChange={setIsMailingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Novo Contato</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Contato</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nome</Label><Input value={newMailing.nome} onChange={e => setNewMailing({...newMailing, nome: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Veículo</Label><Input value={newMailing.veiculo} onChange={e => setNewMailing({...newMailing, veiculo: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Email</Label><Input value={newMailing.email} onChange={e => setNewMailing({...newMailing, email: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Telefone</Label><Input value={newMailing.telefone} onChange={e => setNewMailing({...newMailing, telefone: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Mídia</Label>
                      <Select value={newMailing.tipo_midia} onValueChange={v => setNewMailing({...newMailing, tipo_midia: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Jornal Impresso', 'Revista', 'Portal', 'Blog', 'TV', 'Rádio', 'Podcast', 'Influenciador'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Notas</Label><Textarea value={newMailing.notas} onChange={e => setNewMailing({...newMailing, notas: e.target.value})} /></div>
                    <Button onClick={saveMailing} className="w-full">Salvar Contato</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center p-12 text-slate-400">Carregando mailing...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMailing.map(contato => (
                <Card key={contato.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAllowed && <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteMailing(contato.id)}><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wider">{contato.tipo_midia}</span>
                    </div>
                    <CardTitle className="text-lg">{contato.veiculo}</CardTitle>
                    <CardDescription className="text-slate-700 font-medium">{contato.nome}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-500 space-y-2">
                    {contato.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {contato.email}</div>}
                    {contato.telefone && <div className="flex items-center gap-2">📱 {contato.telefone}</div>}
                    {contato.notas && <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs italic">{contato.notas}</div>}
                  </CardContent>
                </Card>
              ))}
              {filteredMailing.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhum contato encontrado.</div>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clipping" className="flex-1 mt-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Histórico de Publicações</span>
            </div>
            {isAllowed && (
              <>
                <Dialog open={isClippingOpen} onOpenChange={setIsClippingOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-slate-800 text-white hover:bg-slate-700 shadow-sm" onClick={() => {
                      setRegisteredClipping(null);
                      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '', sentimento: 'neutro' });
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Nova Matéria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{registeredClipping ? 'Editar Matéria' : 'Cadastrar Matéria'}</DialogTitle>
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Veículo <span className="text-red-500">*</span></Label><Input placeholder="Ex: G1, Jovem Pan" value={newClipping.veiculo} onChange={e => setNewClipping({...newClipping, veiculo: e.target.value})} /></div>
                        <div className="space-y-2"><Label>Data <span className="text-red-500">*</span></Label><Input type="date" value={newClipping.data_publicacao} onChange={e => setNewClipping({...newClipping, data_publicacao: e.target.value})} /></div>
                      </div>

                      <div className="space-y-2"><Label>Título da Matéria <span className="text-red-500">*</span></Label><Input value={newClipping.titulo_materia} onChange={e => setNewClipping({...newClipping, titulo_materia: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Link (Opcional mas recomendado)</Label><Input placeholder="https://..." value={newClipping.link_materia} onChange={e => setNewClipping({...newClipping, link_materia: e.target.value})} /></div>

                      <div className="space-y-3 pt-2">
                        <Label>Sentimento da Matéria</Label>
                        <div className="flex gap-4">
                          {[
                            { value: 'positivo', icon: '🟢', label: 'Positiva' },
                            { value: 'neutro', icon: '🟡', label: 'Neutra' },
                            { value: 'negativo', icon: '🔴', label: 'Negativa' }
                          ].map(opt => (
                            <div key={opt.value} onClick={() => setNewClipping({...newClipping, sentimento: opt.value})} className={\`flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all \${newClipping.sentimento === opt.value ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}\`}>
                              <span className="text-2xl mb-1">{opt.icon}</span>
                              <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={saveClipping} className="w-full bg-blue-600 hover:bg-blue-700">Salvar Matéria</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* MODAL 2 SEPARADO: Avaliar Relevância */}
                <Dialog open={isRelevanceOpen} onOpenChange={setIsRelevanceOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Definir Relevância (Circulação)</DialogTitle>
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
                            <div key={tag} onClick={() => toggleTag(tag)} className={\`cursor-pointer px-3 py-1 rounded-full text-sm \${(clippingTags || []).includes(tag) ? 'bg-blue-100 text-blue-700 border border-blue-300 font-medium' : 'bg-slate-100 text-slate-600 border border-slate-200'}\`}>
                              {(clippingTags || []).includes(tag) && <CheckCircle2 className="w-4 h-4 inline-block mr-1" />}
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={saveRelevance} className="w-full bg-emerald-600 hover:bg-emerald-700">Salvar Relevância</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clipping.map(clip => {
                const sentimentEmoji = clip.sentimento === 'positivo' ? '🟢' : clip.sentimento === 'negativo' ? '🔴' : '🟡';
                const tierColor = (clip.relevancia_tier || '').includes('1') ? 'bg-emerald-100 text-emerald-700' : (clip.relevancia_tier || '').includes('2') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700';

                return (
                <Card key={clip.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden flex flex-col md:flex-row relative group">
                  {clip.link_materia && (
                    <div className="w-full md:w-48 h-32 md:h-auto bg-slate-100 shrink-0">
                      <img src={\`https://api.microlink.io?url=\${encodeURIComponent(clip.link_materia || '')}&embed=image.url\`} onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="Thumbnail" className="w-full h-full object-cover" />
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
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600" onClick={() => editClipping(clip)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => deleteClipping(clip.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {clip.espetaculo && <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{clip.espetaculo}</span>}
                        {clip.relevancia_tier && <span className={\`px-2 py-1 text-xs rounded-md font-medium \${tierColor}\`}>{clip.relevancia_tier}</span>}
                        {clip.relevancia_score && <span className="text-xs text-slate-500 font-medium">Score: {clip.relevancia_score}</span>}
                      </div>

                      {Array.isArray(clip.tags) && clip.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {clip.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] rounded-full uppercase tracking-wider">{t}</span>)}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        {clip.link_materia && (
                          <a href={clip.link_materia.startsWith('http') ? clip.link_materia : 'https://' + clip.link_materia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Ler matéria completa <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        
                        <Button variant="outline" size="sm" className="h-7 text-xs rounded-full bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600" onClick={() => openRelevanceDialog(clip)}>
                          <BarChart className="w-3 h-3 mr-1" />
                          {clip.relevancia_score ? 'Editar Relevância' : 'Avaliar Relevância'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
              })}
            {clipping.length === 0 && !loading && <div className="col-span-full text-center py-12 text-slate-400">Nenhum clipping registrado.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
\`;

fs.writeFileSync('src/routes/_authenticated/imprensa.tsx', fileContent, 'utf8');
console.log('Arquitetura reconstruída com sucesso.');`, 'utf8'); console.log('Done');