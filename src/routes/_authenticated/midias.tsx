import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Smartphone, Image as ImageIcon, Calendar, Plus, Trash2, CheckCircle2, Clock, PlayCircle } from "lucide-react";
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

function MidiasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessMidias: isAllowed } = usePermissions(profile);

  const [cronograma, setCronograma] = useState<any[]>([]);
  const [espetaculos, setEspetaculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isAssetOpen, setIsAssetOpen] = useState(false);

  // Form states
  const [newPost, setNewPost] = useState({ espetaculo: '', rede_social: 'Instagram', data_postagem: '', formato: 'Feed', status: 'Ideia', descricao: '', link_asset: '' });
  const [assetEdit, setAssetEdit] = useState<{nome_espetaculo: string, link: string} | null>(null);

  useEffect(() => {
    if (isAllowed) {
      fetchData();
    }
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    const [cronoRes, espRes] = await Promise.all([
      supabase.from('midias_cronograma').select('*').order('data_postagem', { ascending: true }),
      supabase.from('templates_espetaculos').select('*')
    ]);

    if (cronoRes.data) setCronograma(cronoRes.data);
    if (espRes.data) setEspetaculos(espRes.data);
    setLoading(false);
  };

  const savePost = async () => {
    if (!newPost.espetaculo || !newPost.data_postagem) {
      toast.error('Preencha espetáculo e data');
      return;
    }
    const { data, error } = await supabase.from('midias_cronograma').insert([newPost]).select().single();
    if (error) {
      toast.error('Erro ao salvar postagem');
    } else {
      toast.success('Postagem agendada!');
      setCronograma([...cronograma, data].sort((a, b) => new Date(a.data_postagem).getTime() - new Date(b.data_postagem).getTime()));
      setIsPostOpen(false);
      setNewPost({ ...newPost, descricao: '', link_asset: '' }); // reset some fields
    }
  };

  const updatePostStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase.from('midias_cronograma').update({ status: novoStatus }).eq('id', id);
    if (!error) {
      setCronograma(cronograma.map(c => c.id === id ? { ...c, status: novoStatus } : c));
      toast.success('Status atualizado');
    }
  };

  const deletePost = async (id: string) => {
    if (confirm('Deletar esta postagem?')) {
      await supabase.from('midias_cronograma').delete().eq('id', id);
      setCronograma(cronograma.filter(c => c.id !== id));
      toast.success('Deletado com sucesso');
    }
  };

  const saveAsset = async () => {
    if (!assetEdit) return;
    const { error } = await supabase.from('templates_espetaculos')
      .update({ assets_midia: { drive_link: assetEdit.link } })
      .eq('nome_espetaculo', assetEdit.nome_espetaculo);
    
    if (error) {
      toast.error('Erro ao salvar link');
    } else {
      toast.success('Link do HD Virtual salvo!');
      setEspetaculos(espetaculos.map(e => e.nome_espetaculo === assetEdit.nome_espetaculo ? { ...e, assets_midia: { drive_link: assetEdit.link } } : e));
      setIsAssetOpen(false);
    }
  };

  if (!isAllowed) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl mb-6">
          <Smartphone className="size-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Acesso Negado</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md">
          Você não tem permissão para acessar o painel de Mídias Sociais.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ideia': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'Produzindo': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Agendado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Postado': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Smartphone className="size-8 text-primary" />
            Mídias Sociais
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Cronograma de postagens e repositório de assets.
          </p>
        </div>
      </div>

      <Tabs defaultValue="cronograma" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="cronograma" className="flex items-center gap-2"><Calendar className="size-4" /> Cronograma de Posts</TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2"><ImageIcon className="size-4" /> HD Virtual (Assets)</TabsTrigger>
        </TabsList>

        {/* TAB CRONOGRAMA */}
        <TabsContent value="cronograma" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"><Plus className="size-4 mr-2" /> Agendar Postagem</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Agendar Postagem</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Espetáculo</Label>
                    <Select value={newPost.espetaculo} onValueChange={v => setNewPost({...newPost, espetaculo: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione o espetáculo" /></SelectTrigger>
                      <SelectContent>
                        {espetaculos.filter(e => e.nome_espetaculo).map(e => <SelectItem key={e.nome_espetaculo} value={e.nome_espetaculo}>{e.nome_espetaculo}</SelectItem>)}
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
                          <SelectItem value="Feed">Feed (Foto/Carrossel)</SelectItem>
                          <SelectItem value="Reels">Reels / Vídeo Curto</SelectItem>
                          <SelectItem value="Story">Story</SelectItem>
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

        {/* TAB ASSETS */}
        <TabsContent value="assets" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {espetaculos.filter(esp => esp.nome_espetaculo).map(esp => {
              const link = esp.assets_midia?.drive_link;
              return (
                <Card key={esp.nome_espetaculo} className="border-0 shadow-sm rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                  <CardHeader className="bg-white dark:bg-card">
                    <CardTitle className="text-xl">{esp.nome_espetaculo}</CardTitle>
                    <CardDescription>Repositório oficial de fotos e vídeos</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {link ? (
                      <div className="space-y-4">
                        <Button className="w-full" asChild>
                          <a href={link} target="_blank" rel="noreferrer">
                            Acessar HD Virtual (Drive)
                          </a>
                        </Button>
                        <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-slate-600" onClick={() => {
                          setAssetEdit({nome_espetaculo: esp.nome_espetaculo, link: link});
                          setIsAssetOpen(true);
                        }}>Editar Link</Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <div className="mx-auto w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="size-6" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Nenhum link configurado</p>
                        <Button variant="outline" onClick={() => {
                          setAssetEdit({nome_espetaculo: esp.nome_espetaculo, link: ''});
                          setIsAssetOpen(true);
                        }}>Adicionar Link</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Link do HD Virtual (Assets)</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Link do Google Drive / Dropbox / OneDrive</Label>
                  <Input value={assetEdit?.link || ''} onChange={e => setAssetEdit(prev => prev ? {...prev, link: e.target.value} : null)} placeholder="https://drive.google.com/..." />
                </div>
                <Button onClick={saveAsset} className="w-full">Salvar Link</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
