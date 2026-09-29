import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Megaphone, ExternalLink, Trash2, Plus, Calendar, Instagram, Facebook, Youtube, Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/divulgacoes")({
  head: () => ({ meta: [{ title: "Divulgações Redes Sociais - Seven Produções Artísticas" }] }),
  component: DivulgacoesPage,
});

export default function DivulgacoesPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessMidias: isAllowed } = usePermissions(profile);

  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [divulgacoes, setDivulgacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [newDiv, setNewDiv] = useState({ espetaculo: '', link: '', rede_social: '', data_publicacao: new Date().toISOString().split('T')[0], observacoes: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAllowed) fetchData();
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: espData } = await supabase.from('templates_espetaculos').select('nome_espetaculo');
      let names = new Set<string>();
      if (espData) espData.forEach(e => e.nome_espetaculo && names.add(e.nome_espetaculo));
      setEspetaculos(Array.from(names).sort());

      const res = await supabase.from('midias_divulgacoes').select('*').order('data_publicacao', { ascending: false }).catch(() => ({data: [], error: null}));
      
      if (res.error && (res.error as any).code === '42P01') {
        toast.error('A tabela midias_divulgacoes não existe. Rode o SQL no Supabase.');
      } else if (res.data) {
        setDivulgacoes(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inferNetwork = (url: string) => {
    const l = url.toLowerCase();
    if (l.includes('instagram.com')) return 'Instagram';
    if (l.includes('facebook.com') || l.includes('fb.watch')) return 'Facebook';
    if (l.includes('tiktok.com')) return 'TikTok';
    if (l.includes('youtube.com') || l.includes('youtu.be')) return 'YouTube';
    return 'Outros';
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    const inferred = inferNetwork(link);
    setNewDiv({ ...newDiv, link, rede_social: newDiv.rede_social || inferred });
  };

  const saveDiv = async () => {
    if (!newDiv.espetaculo || !newDiv.link) return toast.error('Preencha o espetáculo e o link');
    
    let finalUrl = newDiv.link;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    
    const finalRede = newDiv.rede_social || inferNetwork(finalUrl);

    setIsSaving(true);
    try {
      const payload = {
        espetaculo: newDiv.espetaculo,
        link: finalUrl,
        rede_social: finalRede,
        data_publicacao: newDiv.data_publicacao || new Date().toISOString().split('T')[0],
        observacoes: newDiv.observacoes
      };

      const { data, error } = await supabase.from('midias_divulgacoes').insert([payload]).select().single();
      
      if (error) {
        if (error.code === '42P01') throw new Error('A tabela no banco de dados não foi criada. Por favor, rode o script SQL.');
        throw new Error(error.message);
      }
      
      toast.success('Divulgação cadastrada com sucesso!');
      if (data) setDivulgacoes(prev => [data, ...prev].sort((a,b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime()));
      
      setIsOpen(false);
      setNewDiv({ espetaculo: '', link: '', rede_social: '', data_publicacao: new Date().toISOString().split('T')[0], observacoes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDiv = async (id: string) => {
    if (!confirm('Excluir esta divulgação?')) return;
    await supabase.from('midias_divulgacoes').delete().eq('id', id);
    setDivulgacoes(divulgacoes.filter(m => m.id !== id));
  };

  const formatDate = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '';

  const getEmbedHtml = (rede: string, link: string) => {
    try {
      if (rede === 'Instagram') {
        if (!link) return null;
        const cleanLink = link.split('?')[0].replace(/\/$/, '');
        return <iframe src={`${cleanLink}/embed`} className="w-full h-[400px] border-0 rounded-lg shadow-sm" scrolling="no" />;
      }
      if (rede === 'Facebook') {
        return <iframe src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(link)}&show_text=false&width=auto`} className="w-full h-[400px] border-0 overflow-hidden" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" />;
      }
      if (rede === 'YouTube') {
        let videoId = '';
        if (link.includes('youtu.be/')) videoId = link.split('youtu.be/')[1].split('?')[0];
        else if (link.includes('v=')) videoId = link.split('v=')[1].split('&')[0];
        if (videoId) return <iframe className="w-full h-[250px] rounded-lg shadow-sm" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
      }
    } catch (e) {
      // Falha ao fazer parse do embed
    }
    
    // Fallback genérico se não for um embed suportado
    return (
      <div className="w-full h-[250px] bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-3">
        <ExternalLink className="size-12 opacity-50" />
        <span className="text-sm font-medium">Link Externo (Sem visualização direta)</span>
      </div>
    );
  };

  const getNetworkIcon = (rede: string) => {
    switch (rede) {
      case 'Instagram': return <Instagram className="size-4 text-pink-600" />;
      case 'Facebook': return <Facebook className="size-4 text-blue-600" />;
      case 'YouTube': return <Youtube className="size-4 text-red-600" />;
      default: return <Globe className="size-4 text-slate-600" />;
    }
  };

  if (!isAllowed) return <div className="p-8 text-center text-red-500 font-medium">Acesso negado.</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Megaphone className="size-8 text-orange-500" /> Divulgações Redes Sociais
          </h1>
          <p className="text-slate-500 mt-1">Posts publicados no Instagram, Facebook e outras redes</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"><Plus className="w-4 h-4 mr-2" /> Cadastrar Divulgação</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Post Publicado</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Espetáculo / Turnê <span className="text-red-500">*</span></Label>
                <Select value={newDiv.espetaculo} onValueChange={v => setNewDiv({...newDiv, espetaculo: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o espetáculo..." /></SelectTrigger>
                  <SelectContent>
                    {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    {espetaculos.length === 0 && <SelectItem value="Nenhum espetáculo" disabled>Nenhum espetáculo cadastrado</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link do Post (Insta, Face, etc) <span className="text-red-500">*</span></Label>
                <Input value={newDiv.link} onChange={handleLinkChange} placeholder="https://www.instagram.com/p/..." />
                <p className="text-[11px] text-slate-400">O sistema tentará exibir uma prévia automaticamente.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rede Social</Label>
                  <Select value={newDiv.rede_social} onValueChange={v => setNewDiv({...newDiv, rede_social: v})}>
                    <SelectTrigger><SelectValue placeholder="Auto-detectado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data da Publicação</Label>
                  <Input type="date" value={newDiv.data_publicacao} onChange={e => setNewDiv({...newDiv, data_publicacao: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações (Métricas, Engajamento, etc)</Label>
                <Textarea value={newDiv.observacoes} onChange={e => setNewDiv({...newDiv, observacoes: e.target.value})} placeholder="Opcional..." className="h-20" />
              </div>

              <Button disabled={isSaving} onClick={saveDiv} className="w-full bg-orange-500 hover:bg-orange-600 mt-2">
                {isSaving ? 'Salvando...' : 'Salvar Divulgação'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {divulgacoes.map(item => (
              <Card key={item.id} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all group flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getNetworkIcon(item.rede_social)}
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.rede_social}</span>
                    </div>
                    <CardTitle className="text-[14px] text-orange-600 font-bold leading-tight">
                      {item.espetaculo}
                    </CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full shrink-0" onClick={() => deleteDiv(item.id)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>

                <div className="p-0 bg-white">
                  {getEmbedHtml(item.rede_social, item.link)}
                </div>

                <div className="p-4 flex flex-col gap-2 bg-white flex-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Calendar className="size-3" /> {formatDate(item.data_publicacao)}
                  </div>
                  {item.observacoes && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3">{item.observacoes}</p>
                  )}
                  <a href={item.link} target="_blank" rel="noreferrer" className="mt-auto pt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wider">
                    Ver Link Original <ExternalLink className="size-3" />
                  </a>
                </div>
              </Card>
            ))}
            {divulgacoes.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhuma divulgação cadastrada.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
