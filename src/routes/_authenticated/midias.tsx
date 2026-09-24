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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${newHd.espetaculo.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`;
        
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
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusColor(post.status)}`}>
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

        
      </Tabs>
    </div>
  );
}
