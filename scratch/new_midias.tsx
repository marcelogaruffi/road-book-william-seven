import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Smartphone, Image as ImageIcon, Calendar, Plus, Trash2, CheckCircle2, Clock, PlayCircle, HardDrive, Link as LinkIcon, UploadCloud, FolderUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/midias")({
  head: () => ({ meta: [{ title: "Mídias Sociais - Seven Produções Artísticas" }] }),
  component: MidiasPage,
});

export default function MidiasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessMidias: isAllowed } = usePermissions(profile);

  const [cronograma, setCronograma] = useState<any[]>([]);
  const [espetaculos, setEspetaculos] = useState<any[]>([]);
  const [midiasHd, setMidiasHd] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isHdOpen, setIsHdOpen] = useState(false);

  // States
  const [newPost, setNewPost] = useState({ espetaculo: '', rede_social: 'Instagram', formato: 'Reels', data_postagem: '', descricao: '', status: 'Ideia' });
  
  const [newHd, setNewHd] = useState({ espetaculo: '', titulo: '', tipo: 'link', url: '', provedor: 'drive' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isAllowed) fetchData();
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    const [cronoRes, espRes, hdRes] = await Promise.all([
      supabase.from('midias_cronograma').select('*').order('data_postagem', { ascending: true }),
      supabase.from('templates_espetaculos').select('nome_espetaculo'),
      supabase.from('midias_hd').select('*').order('created_at', { ascending: false }).catch(() => ({data: []})) // Catch case it doesn't exist yet
    ]);

    if (cronoRes.data) setCronograma(cronoRes.data);
    if (espRes.data) {
      const names = Array.from(new Set(espRes.data.map(e => e.nome_espetaculo))).filter(Boolean) as string[];
      setEspetaculos(names);
    }
    if (hdRes && hdRes.data) setMidiasHd(hdRes.data);
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ideia': return 'bg-slate-100 text-slate-600';
      case 'Produzindo': return 'bg-amber-100 text-amber-700';
      case 'Agendado': return 'bg-blue-100 text-blue-700';
      case 'Postado': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const savePost = async () => {
    if (!newPost.espetaculo || !newPost.data_postagem) return toast.error('Preencha o espetáculo e a data');
    const { data, error } = await supabase.from('midias_cronograma').insert([newPost]).select().single();
    if (error) toast.error('Erro ao salvar');
    else { toast.success('Post planejado!'); setCronograma([...cronograma, data].sort((a,b) => a.data_postagem.localeCompare(b.data_postagem))); setIsPostOpen(false); }
  };

  const updatePostStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase.from('midias_cronograma').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      setCronograma(cronograma.map(c => c.id === id ? { ...c, status: novoStatus } : c));
      toast.success('Status atualizado');
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Excluir este planejamento?')) return;
    await supabase.from('midias_cronograma').delete().eq('id', id);
    setCronograma(cronograma.filter(c => c.id !== id));
  };

  const saveHd = async () => {
    if (!newHd.espetaculo || !newHd.titulo) return toast.error('Preencha o espetáculo e o título/descrição');
    
    setIsUploading(true);
    let finalUrl = newHd.url;
    let finalProvedor = newHd.provedor;

    try {
      if (newHd.tipo === 'upload' && uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = \`\${Math.random()}.\${fileExt}\`;
        const filePath = \`\${newHd.espetaculo.replace(/[^a-zA-Z0-9]/g, '_')}/\${fileName}\`;
        
        const { error: uploadError } = await supabase.storage.from('midias').upload(filePath, uploadFile);
        
        if (uploadError) {
          throw new Error('Erro no upload do arquivo. Verifique se as políticas de Storage (RLS) estão configuradas no Supabase.');
        }

        const { data: publicUrlData } = supabase.storage.from('midias').getPublicUrl(filePath);
        finalUrl = publicUrlData.publicUrl;
        finalProvedor = 'supabase';
      } else if (newHd.tipo === 'link') {
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
        
        if (finalUrl.includes('drive.google')) finalProvedor = 'drive';
        else if (finalUrl.includes('dropbox')) finalProvedor = 'dropbox';
        else if (finalUrl.includes('icloud') || finalUrl.includes('apple')) finalProvedor = 'icloud';
        else finalProvedor = 'link';
      } else {
        throw new Error('Selecione um arquivo para upload ou preencha o link.');
      }

      const payload = {
        espetaculo: newHd.espetaculo,
        titulo: newHd.titulo,
        tipo: newHd.tipo,
        url: finalUrl,
        provedor: finalProvedor
      };

      const { data, error } = await supabase.from('midias_hd').insert([payload]).select().single();
      
      if (error) {
        // Se a tabela não existir, avisa o usuário para rodar o SQL
        if (error.code === '42P01') throw new Error('A tabela midias_hd não existe. Por favor, rode o script SQL no Supabase.');
        throw new Error('Erro ao salvar no banco de dados.');
      }

      toast.success('Mídia / Link salvo com sucesso!');
      setMidiasHd([data, ...midiasHd]);
      setIsHdOpen(false);
      setNewHd({ espetaculo: '', titulo: '', tipo: 'link', url: '', provedor: 'drive' });
      setUploadFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteHd = async (id: string) => {
    if (!confirm('Excluir este item do HD Virtual?')) return;
    await supabase.from('midias_hd').delete().eq('id', id);
    setMidiasHd(midiasHd.filter(m => m.id !== id));
  };

  if (!isAllowed) return <div className="p-8 text-center text-red-500 font-medium">Acesso negado.</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Smartphone className="size-8 text-purple-600" /> Comunicação e Mídia
        </h1>
        <p className="text-slate-500 mt-1">Gestão de redes sociais, cronograma e assets criativos</p>
      </div>

      <Tabs defaultValue="cronograma" className="flex-1 flex flex-col p-8">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="cronograma" className="flex items-center gap-2"><Calendar className="size-4" /> Cronograma de Posts</TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2"><HardDrive className="size-4" /> Sessão de Fotos (HD)</TabsTrigger>
        </TabsList>

        <TabsContent value="cronograma" className="flex-1 mt-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              Calendário de Publicações
            </div>
            <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Planejar Post</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Post</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Espetáculo / Evento</Label>
                    <Select value={newPost.espetaculo} onValueChange={v => setNewPost({...newPost, espetaculo: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rede Social</Label>
                      <Select value={newPost.rede_social} onValueChange={v => setNewPost({...newPost, rede_social: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select value={newPost.formato} onValueChange={v => setNewPost({...newPost, formato: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Reels">Reels / Shorts</SelectItem>
                          <SelectItem value="Feed">Foto Feed</SelectItem>
                          <SelectItem value="Carrossel">Carrossel</SelectItem>
                          <SelectItem value="Stories">Stories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Postagem</Label>
                      <Input type="date" value={newPost.data_postagem} onChange={e => setNewPost({...newPost, data_postagem: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newPost.status} onValueChange={v => setNewPost({...newPost, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ideia">Ideia</SelectItem>
                          <SelectItem value="Produzindo">Produzindo</SelectItem>
                          <SelectItem value="Agendado">Agendado</SelectItem>
                          <SelectItem value="Postado">Postado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Briefing / Legenda (Opcional)</Label>
                    <Textarea value={newPost.descricao} onChange={e => setNewPost({...newPost, descricao: e.target.value})} placeholder="Ideia para o vídeo ou texto da legenda..." />
                  </div>
                  <Button onClick={savePost} className="w-full bg-purple-600 hover:bg-purple-700">Salvar Cronograma</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cronograma.map(post => (
                <Card key={post.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col relative group">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => deletePost(post.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={\`text-xs font-bold px-2 py-1 rounded-md \${getStatusColor(post.status)}\`}>
                      {post.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md flex items-center gap-1">
                      {post.formato === 'Reels' ? <PlayCircle className="size-3"/> : <ImageIcon className="size-3"/>}
                      {post.rede_social}
                    </span>
                  </div>
                  
                  <h3 className="font-black text-lg text-slate-800 dark:text-white mb-1">{post.espetaculo}</h3>
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-500 mb-3">
                    <Calendar className="size-3.5" /> {new Date(post.data_postagem + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                  
                  {post.descricao && <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-3 mb-4 flex-1">"{post.descricao}"</p>}

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Select value={post.status} onValueChange={(v) => updatePostStatus(post.id, v)}>
                      <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800/50 border-0">
                        <SelectValue placeholder="Mudar Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ideia">Voltar para Ideia</SelectItem>
                        <SelectItem value="Produzindo">Em Produção</SelectItem>
                        <SelectItem value="Agendado">Agendado</SelectItem>
                        <SelectItem value="Postado">Postado (Concluído)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
              {cronograma.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhum post planejado.</div>}
            </div>
          )}
        </TabsContent>

        {/* TAB ASSETS (HD VIRTUAL) */}
        <TabsContent value="assets" className="flex-1 mt-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              Repositório de Fotos e Links
            </div>
            <Dialog open={isHdOpen} onOpenChange={setIsHdOpen}>
              <DialogTrigger asChild>
                <Button className="bg-slate-800 hover:bg-slate-700 text-white shadow-sm"><FolderUp className="w-4 h-4 mr-2" /> Adicionar Mídia</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar ao HD Virtual</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Espetáculo / Apresentação <span className="text-red-500">*</span></Label>
                    <Select value={newHd.espetaculo} onValueChange={v => setNewHd({...newHd, espetaculo: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Título (ex: Ensaio Geral, Drive de Fotos) <span className="text-red-500">*</span></Label>
                    <Input value={newHd.titulo} onChange={e => setNewHd({...newHd, titulo: e.target.value})} placeholder="Descrição breve..." />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label>Forma de Inserção</Label>
                    <div className="flex gap-4">
                      <div onClick={() => setNewHd({...newHd, tipo: 'link'})} className={\`flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all \${newHd.tipo === 'link' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}\`}>
                        <LinkIcon className="size-6 text-blue-500 mb-2" />
                        <span className="text-xs font-medium text-slate-600">Link Externo (Nuvem)</span>
                      </div>
                      <div onClick={() => setNewHd({...newHd, tipo: 'upload'})} className={\`flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all \${newHd.tipo === 'upload' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'}\`}>
                        <UploadCloud className="size-6 text-emerald-500 mb-2" />
                        <span className="text-xs font-medium text-slate-600">Fazer Upload (Foto)</span>
                      </div>
                    </div>
                  </div>

                  {newHd.tipo === 'link' ? (
                    <div className="space-y-2 pt-2 animate-in fade-in zoom-in duration-200">
                      <Label>Link do Drive / Dropbox / iCloud</Label>
                      <Input value={newHd.url} onChange={e => setNewHd({...newHd, url: e.target.value})} placeholder="https://..." />
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 animate-in fade-in zoom-in duration-200">
                      <Label>Selecionar Arquivo</Label>
                      <Input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="file:bg-slate-100 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-sm file:font-medium" />
                    </div>
                  )}

                  <Button disabled={isUploading} onClick={saveHd} className="w-full bg-slate-800 hover:bg-slate-900 mt-2">
                    {isUploading ? 'Processando...' : 'Salvar no HD Virtual'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {midiasHd.map(item => {
                const isImage = item.tipo === 'upload' || item.url.match(/\\.(jpeg|jpg|gif|png)$/) != null;
                return (
                  <Card key={item.id} className="border-0 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900 group relative flex flex-col">
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                      <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full" onClick={() => deleteHd(item.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>

                    <a href={item.url} target="_blank" rel="noreferrer" className="flex-1 flex flex-col">
                      <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
                        {isImage ? (
                          <img src={item.url} alt={item.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                            {item.provedor === 'drive' && <div className="p-3 bg-white rounded-2xl shadow-sm"><svg className="size-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg"><path d="m6.6 66.85 22.35 43.9h44.7l-22.35-43.9z" fill="#0066da"/><path d="m28.95 22.95 22.35-43.9h-44.7l-22.35 43.9z" fill="#00ac47"/><path d="m51.3 22.95 22.35 43.9-22.35 43.9-22.35-43.9z" fill="#ea4335"/></svg></div>}
                            {item.provedor === 'dropbox' && <div className="p-3 bg-white rounded-2xl shadow-sm"><svg className="size-8" viewBox="0 0 24 24" fill="#0061FE" xmlns="http://www.w3.org/2000/svg"><path d="M12 0L3 5.766L12 11.234L21 5.766L12 0ZM3 17.297L12 23.063L21 17.297L12 11.531L3 17.297ZM3 6.094L12 11.859L21 6.094L12 0.328L3 6.094Z"/></svg></div>}
                            {item.provedor === 'icloud' && <div className="p-3 bg-white rounded-2xl shadow-sm"><svg className="size-8" viewBox="0 0 24 24" fill="#333" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 7.5c-1.3 0-2.5.6-3.3 1.5-.7-2.3-2.9-4-5.4-4-3.1 0-5.7 2.6-5.7 5.7 0 .3 0 .6.1.9C1.4 12.2 0 13.9 0 16c0 2.2 1.8 4 4 4h13.5c3.6 0 6.5-2.9 6.5-6.5S21.1 7.5 17.5 7.5z"/></svg></div>}
                            {item.provedor !== 'drive' && item.provedor !== 'dropbox' && item.provedor !== 'icloud' && <div className="p-3 bg-white rounded-2xl shadow-sm"><LinkIcon className="size-8 text-blue-500" /></div>}
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.provedor}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-1">
                        <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">{item.espetaculo}</div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-tight line-clamp-2">{item.titulo}</h4>
                      </div>
                    </a>
                  </Card>
                )
              })}
              {midiasHd.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhum item salvo no HD Virtual.</div>}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
