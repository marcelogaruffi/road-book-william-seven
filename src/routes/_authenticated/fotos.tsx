import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Image as ImageIcon, Trash2, FolderUp, Link as LinkIcon, UploadCloud, X, Calendar, ArrowLeft, ImagePlus, FolderOpen, Edit2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/fotos")({
  head: () => ({ meta: [{ title: "Fotos - Seven Produções Artísticas" }] }),
  component: FotosPage,
});

export default function FotosPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessMidias: isAllowed } = usePermissions(profile);

  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [eventosRaw, setEventosRaw] = useState<any[]>([]);
  const [midiasHd, setMidiasHd] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isHdOpen, setIsHdOpen] = useState(false);
  const [newHd, setNewHd] = useState({ espetaculo: '', evento_id: 'none', titulo: '', tipo: 'upload', url: '', provedor: 'drive' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // NOVO: Estado para editar um link existente
  const [editingLink, setEditingLink] = useState<any>(null);

  const [activeAlbumKey, setActiveAlbumKey] = useState<string | null>(null);

  useEffect(() => {
    if (isAllowed) fetchData();
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: espData } = await supabase.from('templates_espetaculos').select('nome_espetaculo');
      const { data: eventData } = await supabase.from('eventos').select('id, espetaculo, cidade, local, data').order('data', { ascending: false });
      
      let names = new Set<string>();
      if (espData) espData.forEach(e => e.nome_espetaculo && names.add(e.nome_espetaculo));
      if (eventData) {
        eventData.forEach(e => e.espetaculo && names.add(e.espetaculo));
        setEventosRaw(eventData);
      }
      
      setEspetaculos(Array.from(names).sort());

      const hdRes = await supabase.from('midias_hd').select('*, eventos(cidade, local, data)').order('created_at', { ascending: false });
      if (hdRes.data) {
        setMidiasHd(hdRes.data);
      } else if (hdRes.error) {
        console.warn('midias_hd fetch error', hdRes.error);
        if (hdRes.error.code === '42P01') {
          toast.error('A tabela do banco não foi criada! Rode o SQL no Supabase.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const albuns = useMemo(() => {
    const groups: Record<string, any> = {};
    midiasHd.forEach(m => {
      const key = m.evento_id ? m.evento_id : `esp_${m.espetaculo}`;
      if (!groups[key]) {
        groups[key] = {
           id: key,
           espetaculo: m.espetaculo,
           evento: m.eventos,
           fotos: []
        };
      }
      groups[key].fotos.push(m);
    });
    return Object.values(groups);
  }, [midiasHd]);

  const removeFile = (index: number) => {
    const newFiles = [...uploadFiles];
    newFiles.splice(index, 1);
    setUploadFiles(newFiles);
  };

  const formatData = (d: string) => {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const parseProvider = (link: string) => {
    if (link.includes('drive.google')) return 'drive';
    if (link.includes('dropbox')) return 'dropbox';
    if (link.includes('icloud') || link.includes('apple')) return 'icloud';
    return 'link';
  };

  const saveEdit = async () => {
    if (!editingLink.titulo || !editingLink.url) return toast.error('Preencha título e link.');
    setIsUploading(true);

    try {
      let finalUrl = editingLink.url;
      if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
      const provedor = parseProvider(finalUrl);

      const payload = {
        titulo: editingLink.titulo,
        url: finalUrl,
        provedor
      };

      const { data, error } = await supabase.from('midias_hd').update(payload).eq('id', editingLink.id).select('*, eventos(cidade, local, data)').single();
      if (error) throw new Error(error.message);

      toast.success('Link atualizado!');
      setMidiasHd(midiasHd.map(m => m.id === editingLink.id ? data : m));
      setEditingLink(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao editar.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveHd = async () => {
    if (!newHd.espetaculo || !newHd.titulo) return toast.error('Preencha o espetáculo e o título');
    if (newHd.tipo === 'link' && !newHd.url) return toast.error('Preencha o link da nuvem');
    if (newHd.tipo === 'upload' && uploadFiles.length === 0) return toast.error('Selecione pelo menos uma foto');
    
    setIsUploading(true);

    const evento_id = newHd.evento_id === 'none' ? null : newHd.evento_id;

    try {
      if (newHd.tipo === 'upload') {
        const novosItems = [];
        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${newHd.espetaculo.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage.from('midias').upload(filePath, file);
          
          if (uploadError) {
            throw new Error(`Erro ao subir arquivo ${file.name}. (Storage configurado?)`);
          }

          const { data: publicUrlData } = supabase.storage.from('midias').getPublicUrl(filePath);
          
          const tituloComIndice = uploadFiles.length > 1 ? `${newHd.titulo} (${i+1})` : newHd.titulo;
          const payload = {
            espetaculo: newHd.espetaculo,
            evento_id: evento_id,
            titulo: tituloComIndice,
            tipo: 'upload',
            url: publicUrlData.publicUrl,
            provedor: 'supabase'
          };
          
          const { data, error } = await supabase.from('midias_hd').insert([payload]).select('*, eventos(cidade, local, data)').single();
          if (error) {
            if (error.code === '42703') throw new Error('O banco de dados precisa ser atualizado (coluna evento_id). Rode o novo script SQL!');
            throw new Error('Erro ao salvar no banco: ' + error.message);
          }
          
          if (data) novosItems.push(data);
        }
        
        toast.success(`${novosItems.length} foto(s) salva(s) com sucesso!`);
        setMidiasHd(prev => [...novosItems, ...prev]);

        setActiveAlbumKey(evento_id ? evento_id : `esp_${newHd.espetaculo}`);

      } else {
        let finalUrl = newHd.url;
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
        
        const payload = {
          espetaculo: newHd.espetaculo,
          evento_id: evento_id,
          titulo: newHd.titulo,
          tipo: 'link',
          url: finalUrl,
          provedor: parseProvider(finalUrl)
        };

        const { data, error } = await supabase.from('midias_hd').insert([payload]).select('*, eventos(cidade, local, data)').single();
        if (error) {
          if (error.code === '42703') throw new Error('O banco de dados precisa ser atualizado (coluna evento_id). Rode o novo script SQL!');
          throw new Error('Erro ao salvar link no banco.');
        }
        
        toast.success('Link salvo com sucesso!');
        if (data) setMidiasHd(prev => [data, ...prev]);
        
        setActiveAlbumKey(evento_id ? evento_id : `esp_${newHd.espetaculo}`);
      }

      setIsHdOpen(false);
      setNewHd({ espetaculo: '', evento_id: 'none', titulo: '', tipo: 'upload', url: '', provedor: 'drive' });
      setUploadFiles([]);
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteHd = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    await supabase.from('midias_hd').delete().eq('id', id);
    setMidiasHd(midiasHd.filter(m => m.id !== id));
  };

  if (!isAllowed) return <div className="p-8 text-center text-red-500 font-medium">Acesso negado.</div>;

  const getEventosFiltrados = () => {
    return eventosRaw.filter(e => e.espetaculo === newHd.espetaculo);
  };

  const activeAlbumData = activeAlbumKey ? albuns.find(a => a.id === activeAlbumKey) : null;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <ImageIcon className="size-8 text-blue-600" /> Fotos e Mídias
          </h1>
          <p className="text-slate-500 mt-1">
            {activeAlbumKey ? (
               <span className="flex items-center gap-2">
                 <button onClick={() => setActiveAlbumKey(null)} className="hover:text-blue-600 hover:underline flex items-center gap-1">
                   <ArrowLeft className="size-3" /> Voltar para Álbuns
                 </button>
                 / {activeAlbumData?.espetaculo} {activeAlbumData?.evento ? ` - ${activeAlbumData.evento.cidade + (activeAlbumData.evento.local ? ' - ' + activeAlbumData.evento.local : '')}` : ' (Geral)'}
               </span>
            ) : (
               "Repositório virtual organizado por espetáculos e apresentações"
            )}
          </p>
        </div>
        
        <Dialog open={isHdOpen} onOpenChange={setIsHdOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"><FolderUp className="w-4 h-4 mr-2" /> Novo Cadastro / Álbum</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Criar Cadastro de Fotos / Mídia</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Espetáculo / Turnê <span className="text-red-500">*</span></Label>
                <Select value={newHd.espetaculo} onValueChange={v => setNewHd({...newHd, espetaculo: v, evento_id: 'none'})}>
                  <SelectTrigger><SelectValue placeholder="Ex: A Maçã" /></SelectTrigger>
                  <SelectContent>
                    {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    {espetaculos.length === 0 && <SelectItem value="Nenhum espetáculo" disabled>Nenhum espetáculo cadastrado</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {newHd.espetaculo && (
                <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                  <Label>Apresentação Vinculada</Label>
                  <Select value={newHd.evento_id} onValueChange={v => setNewHd({...newHd, evento_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione a data/local..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Material Geral (Sem data específica)</SelectItem>
                      {getEventosFiltrados().map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.cidade + (e.local ? ' - ' + e.local : '')} - {formatData(e.data)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Título / Descrição da Mídia <span className="text-red-500">*</span></Label>
                <Input value={newHd.titulo} onChange={e => setNewHd({...newHd, titulo: e.target.value})} placeholder="Ex: Ensaio Geral, Fotos Sesc, etc" />
              </div>

              <div className="space-y-3 pt-2">
                <Label>Forma de Inserção</Label>
                <div className="flex gap-4">
                  <div onClick={() => setNewHd({...newHd, tipo: 'upload'})} className={`flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${newHd.tipo === 'upload' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <UploadCloud className="size-6 text-emerald-500 mb-2" />
                    <span className="text-xs font-medium text-slate-600">Fazer Upload (Fotos)</span>
                  </div>
                  <div onClick={() => setNewHd({...newHd, tipo: 'link'})} className={`flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${newHd.tipo === 'link' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <LinkIcon className="size-6 text-blue-500 mb-2" />
                    <span className="text-xs font-medium text-slate-600">Link Externo (Nuvem)</span>
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
                  <Label>Selecionar Fotos (Várias)</Label>
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={e => {
                      if (e.target.files) {
                        setUploadFiles(Array.from(e.target.files));
                      }
                    }} 
                    className="file:bg-slate-100 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-sm file:font-medium" 
                  />
                  {uploadFiles.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
                      {uploadFiles.map((file, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded-md shadow-sm">
                          <span className="truncate flex-1 font-medium">{file.name}</span>
                          <span className="text-slate-400 px-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" onClick={() => removeFile(i)}>
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button disabled={isUploading} onClick={saveHd} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                {isUploading ? 'Salvando e Criando...' : 'Salvar no Repositório'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Link */}
        <Dialog open={!!editingLink} onOpenChange={(o) => !o && setEditingLink(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Link</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={editingLink?.titulo || ''} onChange={e => setEditingLink({...editingLink, titulo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Link (URL)</Label>
                <Input value={editingLink?.url || ''} onChange={e => setEditingLink({...editingLink, url: e.target.value})} />
              </div>
              <Button disabled={isUploading} onClick={saveEdit} className="w-full bg-blue-600 hover:bg-blue-700">
                {isUploading ? 'Salvando...' : 'Atualizar Link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <>
            {!activeAlbumKey ? (
              // MODO GRID DE ÁLBUNS
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albuns.map(album => {
                  const thumbnail = album.fotos.find((f: any) => f.tipo === 'upload')?.url;
                  
                  return (
                    <Card 
                      key={album.id} 
                      onClick={() => setActiveAlbumKey(album.id)}
                      className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {thumbnail ? (
                          <img src={thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                            <FolderOpen className="size-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 left-3 text-white text-sm font-bold flex items-center gap-2">
                           <ImageIcon className="size-4" /> {album.fotos.length} mídias
                        </div>
                      </div>
                      <CardHeader className="p-4 bg-white">
                        <CardTitle className="text-base text-blue-700 uppercase tracking-wider text-[11px] mb-1 font-bold">
                          {album.espetaculo}
                        </CardTitle>
                        <h3 className="font-bold text-slate-800 leading-tight">
                          {album.evento ? `${album.evento.cidade + (album.evento.local ? ' - ' + album.evento.local : '')} (${formatData(album.evento.data)})` : 'Mídia Geral do Espetáculo'}
                        </h3>
                      </CardHeader>
                    </Card>
                  )
                })}
                {albuns.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhum álbum criado. Adicione mídias para começar.</div>}
              </div>
            ) : (
              // MODO VISUALIZADOR DE FOTOS (Dentro do Álbum)
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-blue-500 pl-3">
                    {activeAlbumData?.espetaculo} {activeAlbumData?.evento ? ` / ${activeAlbumData.evento.cidade + (activeAlbumData.evento.local ? ' - ' + activeAlbumData.evento.local : '')}` : ''}
                  </h2>
                  <Button variant="outline" onClick={() => setActiveAlbumKey(null)} className="text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="size-4 mr-2" /> Voltar
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {activeAlbumData?.fotos.map((item: any) => {
                    const isImage = item.tipo === 'upload' || item.url.match(/\\.(jpeg|jpg|gif|png|webp)$/i) != null;
                    return (
                      <Card key={item.id} className="border-0 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900 group relative flex flex-col">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                          {item.tipo === 'link' && (
                            <Button variant="ghost" size="icon" className="size-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full" onClick={(e) => { e.stopPropagation(); setEditingLink(item); }}>
                              <Edit2 className="size-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full" onClick={(e) => { e.stopPropagation(); deleteHd(item.id); }}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>

                        <a href={item.url} target="_blank" rel="noreferrer" className="flex-1 flex flex-col">
                          <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
                            {isImage ? (
                              <img src={item.url} alt={item.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                                {item.provedor === 'drive' && <div className="p-3 bg-white rounded-2xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="size-8" alt="Google Drive" /></div>}
                                {item.provedor === 'dropbox' && <div className="p-3 bg-white rounded-2xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Dropbox_logo_2017.svg" className="size-8" alt="Dropbox" /></div>}
                                {item.provedor === 'icloud' && <div className="p-3 bg-white rounded-2xl shadow-sm"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg" className="size-8" alt="iCloud" /></div>}
                                {item.provedor !== 'drive' && item.provedor !== 'dropbox' && item.provedor !== 'icloud' && <div className="p-3 bg-white rounded-2xl shadow-sm"><LinkIcon className="size-8 text-blue-500" /></div>}
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.provedor}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-1 flex flex-col">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-tight line-clamp-2">{item.titulo}</h4>
                          </div>
                        </a>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
