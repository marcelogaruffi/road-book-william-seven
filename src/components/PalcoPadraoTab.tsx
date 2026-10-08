import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Plus, Trash2, GripVertical, Image as ImageIcon, Loader2, Edit, Map as MapIcon, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ArquivoPadrao = { id: string; espetaculo_nome: string; nome: string; arquivo_url: string; tipo: string; ordem: number; };
type PropPadrao = { id: string; espetaculo_nome: string; item: string; ato: string | null; cena: string | null; preset_location: string | null; descricao: string | null; personagem: string | null; termino_uso: string | null; arquivo_url: string | null; ordem: number; };

export function PalcoPadraoTab({ espetaculoNome }: { espetaculoNome?: string }) {
  const [arquivosPadrao, setArquivosPadrao] = useState<ArquivoPadrao[]>([]);
  const [propsPadrao, setPropsPadrao] = useState<PropPadrao[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState("mapas");

  // Form states Map
  const [novoNomeMapa, setNovoNomeMapa] = useState("");
  const [novoArquivoMapa, setNovoArquivoMapa] = useState<globalThis.File | null>(null);

  // Form states Prop
  const [novoPropItem, setNovoPropItem] = useState("");
  const [novoPropAto, setNovoPropAto] = useState("");
  const [novoPropCena, setNovoPropCena] = useState("");
  const [novoPropPreset, setNovoPropPreset] = useState("");
  const [novoPropDescricao, setNovoPropDescricao] = useState("");
  const [novoPropPersonagem, setNovoPropPersonagem] = useState("");
  const [novoPropTermino, setNovoPropTermino] = useState("");
  const [novoPropArquivo, setNovoPropArquivo] = useState<globalThis.File | null>(null);

  const fileInputRefMapa = useRef<HTMLInputElement>(null);
  const fileInputRefProp = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingProp, setEditingProp] = useState<PropPadrao | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (espetaculoNome) {
      fetchArquivosPadrao(espetaculoNome);
      fetchPropsPadrao(espetaculoNome);
    } else {
      setArquivosPadrao([]);
      setPropsPadrao([]);
    }
  }, [espetaculoNome]);

  async function fetchArquivosPadrao(espetaculo: string) {
    setLoading(true);
    const { data } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", espetaculo).eq("tipo", "mapa_palco").order("ordem", { ascending: true });
    setArquivosPadrao(data as ArquivoPadrao[] || []);
    setLoading(false);
  }

  async function fetchPropsPadrao(espetaculo: string) {
    const { data } = await supabase.from("props_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    setPropsPadrao(data as PropPadrao[] || []);
  }

  async function handleFileUpload(file: globalThis.File, folder: string = "mapa_palco") {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}s/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleAddMapa(e: React.FormEvent) {
    e.preventDefault();
    if (!espetaculoNome) return toast.error("Selecione um espetáculo");
    if (!novoNomeMapa.trim() || !novoArquivoMapa) return toast.error("Nome e arquivo obrigatórios");

    setUploading(true);
    try {
      const publicUrl = await handleFileUpload(novoArquivoMapa, "mapa_palco");
      const novaOrdem = arquivosPadrao.length;
      const { data, error } = await supabase.from("arquivos_padrao").insert({
        espetaculo_nome: espetaculoNome, nome: novoNomeMapa, arquivo_url: publicUrl, tipo: "mapa_palco", ordem: novaOrdem
      }).select().single();
      
      if (error) throw error;
      setArquivosPadrao([...arquivosPadrao, data as ArquivoPadrao]);
      
      setNovoNomeMapa("");
      setNovoArquivoMapa(null);
      if (fileInputRefMapa.current) fileInputRefMapa.current.value = "";
      toast.success("Mapa adicionado ao padrão");
    } catch (error) {
      toast.error("Erro ao salvar mapa");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddProp(e: React.FormEvent) {
    e.preventDefault();
    if (!espetaculoNome) return toast.error("Selecione um espetáculo");
    if (!novoPropItem.trim()) return toast.error("Item obrigatório");

    setUploading(true);
    try {
      let publicUrl = null;
      if (novoPropArquivo) publicUrl = await handleFileUpload(novoPropArquivo, "item_palco");

      const propData = {
        item: novoPropItem, ato: novoPropAto || null, cena: novoPropCena || null, preset_location: novoPropPreset || null,
        descricao: novoPropDescricao || null, personagem: novoPropPersonagem || null, termino_uso: novoPropTermino || null, arquivo_url: publicUrl,
        espetaculo_nome: espetaculoNome, ordem: propsPadrao.length
      };

      const { data, error } = await supabase.from("props_padrao").insert(propData).select().single();
      if (error) throw error;
      setPropsPadrao([...propsPadrao, data as PropPadrao]);

      setNovoPropItem(""); setNovoPropAto(""); setNovoPropCena(""); setNovoPropPreset("");
      setNovoPropDescricao(""); setNovoPropPersonagem(""); setNovoPropTermino(""); setNovoPropArquivo(null);
      if (fileInputRefProp.current) fileInputRefProp.current.value = "";
      toast.success("Prop adicionado ao padrão");
    } catch (error) {
      toast.error("Erro ao salvar prop");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditProp(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProp) return;

    setUploading(true);
    try {
      let publicUrl = editingProp.arquivo_url;
      if (novoPropArquivo) publicUrl = await handleFileUpload(novoPropArquivo, "item_palco");

      const propData = {
        item: novoPropItem, ato: novoPropAto || null, cena: novoPropCena || null, preset_location: novoPropPreset || null,
        descricao: novoPropDescricao || null, personagem: novoPropPersonagem || null, termino_uso: novoPropTermino || null, arquivo_url: publicUrl
      };

      const { data, error } = await supabase.from("props_padrao").update(propData).eq("id", editingProp.id).select().single();
      if (error) throw error;
      setPropsPadrao(propsPadrao.map(p => p.id === editingProp.id ? data as PropPadrao : p));
      
      setEditDialogOpen(false);
      setNovoPropArquivo(null);
      toast.success("Prop editado");
    } catch (error) {
      toast.error("Erro ao editar prop");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(prop: PropPadrao) {
    setEditingProp(prop);
    setNovoPropItem(prop.item); setNovoPropAto(prop.ato || ""); setNovoPropCena(prop.cena || "");
    setNovoPropPreset(prop.preset_location || ""); setNovoPropDescricao(prop.descricao || "");
    setNovoPropPersonagem(prop.personagem || ""); setNovoPropTermino(prop.termino_uso || "");
    setNovoPropArquivo(null);
    setEditDialogOpen(true);
  }

  async function handleDeleteMapa(id: string) {
    if (!confirm("Excluir este mapa?")) return;
    try {
      const { error } = await supabase.from("arquivos_padrao").delete().eq("id", id);
      if (error) throw error;
      setArquivosPadrao(arquivosPadrao.filter(a => a.id !== id));
      toast.success("Mapa excluído");
    } catch (e) { toast.error("Erro ao excluir"); }
  }

  async function handleDeleteProp(id: string) {
    if (!confirm("Excluir este prop?")) return;
    try {
      const { error } = await supabase.from("props_padrao").delete().eq("id", id);
      if (error) throw error;
      setPropsPadrao(propsPadrao.filter(a => a.id !== id));
      toast.success("Prop excluído");
    } catch (e) { toast.error("Erro ao excluir"); }
  }

  async function handleSortMapa() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    let items = [...arquivosPadrao];
    const draggedItemContent = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null; dragOverItem.current = null;
    const updatedItems = items.map((item, idx) => ({ ...item, ordem: idx }));
    setArquivosPadrao(updatedItems);
    for (const item of updatedItems) await supabase.from("arquivos_padrao").update({ ordem: item.ordem }).eq("id", item.id);
  }

  async function handleSortProp() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    let items = [...propsPadrao];
    const draggedItemContent = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null; dragOverItem.current = null;
    const updatedItems = items.map((item, idx) => ({ ...item, ordem: idx }));
    setPropsPadrao(updatedItems);
    for (const item of updatedItems) await supabase.from("props_padrao").update({ ordem: item.ordem }).eq("id", item.id);
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-90">
            <CheckSquare className="size-6" />
            <h2 className="text-xl font-bold">Palco e Props Padrão</h2>
          </div>
        </div>

        <CardContent className="p-6">
          <Tabs value={selectedSubTab} onValueChange={setSelectedSubTab} className="w-full">
            <TabsList className="mb-6 bg-slate-100 dark:bg-white/5">
              <TabsTrigger value="mapas" className="flex gap-2"><MapIcon className="size-4" /> Mapas de Palco</TabsTrigger>
              <TabsTrigger value="props" className="flex gap-2"><ArchiveRestore className="size-4" /> Itens / Props</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mapas" className="mt-0">
              <form onSubmit={handleAddMapa} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 mb-8">
                <div className="w-full md:w-1/3">
                  <Label>Nome do Mapa / Cenografia</Label>
                  <Input value={novoNomeMapa} onChange={e => setNovoNomeMapa(e.target.value)} placeholder="Ex: Mapa de Palco V1" className="mt-2" />
                </div>
                <div className="w-full md:w-1/2">
                  <Label>Arquivo (PDF, Imagem)</Label>
                  <Input type="file" ref={fileInputRefMapa} onChange={e => setNovoArquivoMapa(e.target.files?.[0] || null)} className="mt-2" />
                </div>
                <Button type="submit" disabled={uploading || !espetaculoNome} className="w-full md:w-auto h-10 mt-6 shrink-0 bg-orange-600 hover:bg-orange-700 text-white">
                  {uploading ? "Enviando..." : <><Plus className="size-4 mr-2" /> Adicionar</>}
                </Button>
              </form>

              {arquivosPadrao.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <MapIcon className="size-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum mapa padrão</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2">Mapas adicionados aqui serão clonados em todos os eventos do espetáculo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arquivosPadrao.map((arq, idx) => (
                    <div key={arq.id} draggable onDragStart={() => dragItem.current = idx} onDragEnter={() => dragOverItem.current = idx} onDragEnd={handleSortMapa} className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm group">
                      <GripVertical className="size-5 text-slate-300 cursor-grab active:cursor-grabbing" />
                      <p className="font-bold text-slate-800 dark:text-slate-200 flex-1">{arq.nome}</p>
                      <Button variant="outline" size="sm" asChild><a href={arq.arquivo_url} target="_blank" rel="noreferrer">Ver</a></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMapa(arq.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="props" className="mt-0">
              <form onSubmit={handleAddProp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 mb-8">
                <div className="col-span-1 lg:col-span-2"><Label>Item / Prop</Label><Input value={novoPropItem} onChange={e => setNovoPropItem(e.target.value)} placeholder="Ex: Espada" className="mt-2" /></div>
                <div><Label>Ato</Label><Input value={novoPropAto} onChange={e => setNovoPropAto(e.target.value)} placeholder="Ex: 1" className="mt-2" /></div>
                <div><Label>Cena</Label><Input value={novoPropCena} onChange={e => setNovoPropCena(e.target.value)} placeholder="Ex: 3" className="mt-2" /></div>
                <div className="col-span-1 lg:col-span-2"><Label>Local (Preset)</Label><Input value={novoPropPreset} onChange={e => setNovoPropPreset(e.target.value)} placeholder="Ex: Coxia Direita" className="mt-2" /></div>
                <div className="col-span-1 lg:col-span-2"><Label>Personagem (Uso)</Label><Input value={novoPropPersonagem} onChange={e => setNovoPropPersonagem(e.target.value)} placeholder="Ex: Rei" className="mt-2" /></div>
                <div className="col-span-1 lg:col-span-2"><Label>Término de Uso</Label><Input value={novoPropTermino} onChange={e => setNovoPropTermino(e.target.value)} placeholder="Ex: Fim do Ato 1" className="mt-2" /></div>
                <div className="col-span-1 lg:col-span-2"><Label>Foto Referência</Label><Input type="file" accept="image/*" ref={fileInputRefProp} onChange={e => setNovoPropArquivo(e.target.files?.[0] || null)} className="mt-2" /></div>
                <div className="col-span-1 lg:col-span-4 xl:col-span-5"><Label>Observações / Ação</Label><Input value={novoPropDescricao} onChange={e => setNovoPropDescricao(e.target.value)} placeholder="Detalhes" className="mt-2" /></div>
                <Button type="submit" disabled={uploading || !espetaculoNome} className="w-full h-10 shrink-0 bg-orange-600 hover:bg-orange-700 text-white"><Plus className="size-4 mr-2" /> Add</Button>
              </form>

              {propsPadrao.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ArchiveRestore className="size-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum prop padrão</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2">Cadastre a lista de objetos e props do espetáculo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {propsPadrao.map((prop, idx) => (
                    <div key={prop.id} draggable onDragStart={() => dragItem.current = idx} onDragEnter={() => dragOverItem.current = idx} onDragEnd={handleSortProp} className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm group">
                      <GripVertical className="size-5 text-slate-300 cursor-grab active:cursor-grabbing hidden sm:block" />
                      {prop.arquivo_url ? <img src={prop.arquivo_url} className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0" alt="prop" /> : <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><ImageIcon className="size-6 text-slate-300" /></div>}
                      <div className="flex-1 w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          {prop.ato && <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg">Ato {prop.ato}</span>}
                          {prop.cena && <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg">Cena {prop.cena}</span>}
                          {prop.preset_location && <span className="text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-lg">{prop.preset_location}</span>}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{prop.item}</p>
                        {(prop.personagem || prop.termino_uso) && <p className="text-sm text-slate-500">Uso: {prop.personagem} • Término: {prop.termino_uso}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(prop)}><Edit className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProp(prop.id)} className="text-red-500"><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Editar Prop</DialogTitle></DialogHeader>
          <form onSubmit={handleEditProp} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="col-span-1 md:col-span-2"><Label>Item / Prop</Label><Input value={novoPropItem} onChange={e => setNovoPropItem(e.target.value)} className="mt-2" /></div>
            <div><Label>Ato</Label><Input value={novoPropAto} onChange={e => setNovoPropAto(e.target.value)} className="mt-2" /></div>
            <div><Label>Cena</Label><Input value={novoPropCena} onChange={e => setNovoPropCena(e.target.value)} className="mt-2" /></div>
            <div className="col-span-1 md:col-span-2"><Label>Local (Preset)</Label><Input value={novoPropPreset} onChange={e => setNovoPropPreset(e.target.value)} className="mt-2" /></div>
            <div><Label>Personagem (Uso)</Label><Input value={novoPropPersonagem} onChange={e => setNovoPropPersonagem(e.target.value)} className="mt-2" /></div>
            <div><Label>Término de Uso</Label><Input value={novoPropTermino} onChange={e => setNovoPropTermino(e.target.value)} className="mt-2" /></div>
            <div className="col-span-1 md:col-span-2"><Label>Atualizar Foto</Label><Input type="file" accept="image/*" onChange={e => setNovoPropArquivo(e.target.files?.[0] || null)} className="mt-2" /></div>
            <div className="col-span-1 md:col-span-2"><Label>Observações</Label><Input value={novoPropDescricao} onChange={e => setNovoPropDescricao(e.target.value)} className="mt-2" /></div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploading} className="bg-orange-600 text-white">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
