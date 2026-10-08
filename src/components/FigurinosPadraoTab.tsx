import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shirt, Plus, Trash2, GripVertical, Image as ImageIcon, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type FigurinoPadrao = {
  id: string;
  espetaculo_nome: string;
  personagem: string;
  tipo_item: string;
  tamanho: string | null;
  tipo_tecido: string | null;
  descricao: string | null;
  arquivo_url: string | null;
  ordem: number;
};

export function FigurinosPadraoTab({ espetaculoNome }: { espetaculoNome?: string }) {
  const [figurinosPadrao, setFigurinosPadrao] = useState<FigurinoPadrao[]>([]);
  const [personagensAtuais, setPersonagensAtuais] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoTipoItem, setNovoTipoItem] = useState("");
  const [novoTamanho, setNovoTamanho] = useState("");
  const [novoTipoTecido, setNovoTipoTecido] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<globalThis.File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingFigurino, setEditingFigurino] = useState<FigurinoPadrao | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Drag
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (espetaculoNome) {
      fetchDados(espetaculoNome);
    } else {
      setFigurinosPadrao([]);
      setPersonagensAtuais([]);
    }
  }, [espetaculoNome]);

  async function fetchDados(espetaculo: string) {
    setLoading(true);
    const { data: espData } = await supabase.from('templates_espetaculos').select('personagens').eq('nome_espetaculo', espetaculo).single();
    if (espData) {
      setPersonagensAtuais((espData.personagens as string[]) || []);
    }

    const { data: figData, error } = await supabase.from("figurinos_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    if (!error && figData) {
      setFigurinosPadrao(figData as FigurinoPadrao[]);
    }
    setLoading(false);
  }

  async function handleFileUpload(file: globalThis.File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `figurinos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleAddFigurino(e: React.FormEvent) {
    e.preventDefault();
    if (!espetaculoNome) return toast.error("Selecione um espetáculo");
    if (!novoPersonagem || !novoTipoItem.trim()) return toast.error("Personagem e Tipo do Item são obrigatórios");

    setUploading(true);
    try {
      let publicUrl = null;
      if (novoArquivo) publicUrl = await handleFileUpload(novoArquivo);

      const figData = {
        personagem: novoPersonagem,
        tipo_item: novoTipoItem,
        tamanho: novoTamanho || null,
        tipo_tecido: novoTipoTecido || null,
        descricao: novaDescricao || null,
        arquivo_url: publicUrl,
        espetaculo_nome: espetaculoNome,
        ordem: figurinosPadrao.length
      };

      const { data, error } = await supabase.from("figurinos_padrao").insert(figData).select().single();
      if (error) throw error;
      setFigurinosPadrao([...figurinosPadrao, data as FigurinoPadrao]);
      
      setNovoTipoItem(""); setNovoTamanho(""); setNovoTipoTecido(""); setNovaDescricao(""); setNovoArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Peça adicionada ao figurino");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditFigurino(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFigurino) return;

    setUploading(true);
    try {
      let publicUrl = editingFigurino.arquivo_url;
      if (novoArquivo) {
        publicUrl = await handleFileUpload(novoArquivo);
      }

      const figData = {
        personagem: novoPersonagem,
        tipo_item: novoTipoItem,
        tamanho: novoTamanho || null,
        tipo_tecido: novoTipoTecido || null,
        descricao: novaDescricao || null,
        arquivo_url: publicUrl
      };

      const { data, error } = await supabase.from("figurinos_padrao").update(figData).eq("id", editingFigurino.id).select().single();
      if (error) throw error;
      setFigurinosPadrao(figurinosPadrao.map(p => p.id === editingFigurino.id ? data as FigurinoPadrao : p));
      
      setEditDialogOpen(false);
      setNovoArquivo(null);
      toast.success("Peça editada");
    } catch (error) {
      toast.error("Erro ao editar");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(fig: FigurinoPadrao) {
    setEditingFigurino(fig);
    setNovoPersonagem(fig.personagem);
    setNovoTipoItem(fig.tipo_item);
    setNovoTamanho(fig.tamanho || "");
    setNovoTipoTecido(fig.tipo_tecido || "");
    setNovaDescricao(fig.descricao || "");
    setNovoArquivo(null);
    setEditDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta peça?")) return;
    try {
      const { error } = await supabase.from("figurinos_padrao").delete().eq("id", id);
      if (error) throw error;
      setFigurinosPadrao(figurinosPadrao.filter(a => a.id !== id));
      toast.success("Peça excluída");
    } catch (error) {
      toast.error("Erro ao excluir peça");
    }
  }

  async function handleSortPadrao() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    let items = [...figurinosPadrao];
    const draggedItemContent = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;

    const updatedItems = items.map((item, idx) => ({ ...item, ordem: idx }));
    setFigurinosPadrao(updatedItems);

    for (const item of updatedItems) {
      await supabase.from("figurinos_padrao").update({ ordem: item.ordem }).eq("id", item.id);
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-pink-600 to-pink-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-90">
            <Shirt className="size-6" />
            <h2 className="text-xl font-bold">Figurinos Padrão</h2>
          </div>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleAddFigurino} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 mb-8">
            <div className="col-span-1 lg:col-span-2">
              <Label>Personagem</Label>
              {personagensAtuais.length > 0 ? (
                <Select value={novoPersonagem} onValueChange={setNovoPersonagem}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {personagensAtuais.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} placeholder="Ex: Romeu" className="mt-2" />
              )}
            </div>
            <div className="col-span-1 lg:col-span-2">
              <Label>Tipo da Peça</Label>
              <Input value={novoTipoItem} onChange={e => setNovoTipoItem(e.target.value)} placeholder="Ex: Camisa, Calça, Sapato" className="mt-2" />
            </div>
            <div>
              <Label>Tamanho</Label>
              <Input value={novoTamanho} onChange={e => setNovoTamanho(e.target.value)} placeholder="Ex: M, 42" className="mt-2" />
            </div>
            <div>
              <Label>Tecido / Cor</Label>
              <Input value={novoTipoTecido} onChange={e => setNovoTipoTecido(e.target.value)} placeholder="Ex: Linho Branco" className="mt-2" />
            </div>
            <div className="col-span-1 lg:col-span-2 xl:col-span-3">
              <Label>Foto de Referência</Label>
              <Input type="file" accept="image/*" ref={fileInputRef} onChange={e => setNovoArquivo(e.target.files?.[0] || null)} className="mt-2" />
            </div>
            <div className="col-span-1 lg:col-span-4 xl:col-span-2">
              <Label>Observações</Label>
              <Input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} placeholder="Ex: Usar com cinto preto" className="mt-2" />
            </div>
            <Button type="submit" disabled={uploading || !espetaculoNome} className="w-full h-10 mt-6 shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
              {uploading ? "Enviando..." : <><Plus className="size-4 mr-2" /> Adicionar</>}
            </Button>
          </form>

          {figurinosPadrao.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Shirt className="size-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum figurino padrão</h3>
              <p className="text-slate-500 max-w-md mx-auto mt-2">
                Adicione peças de figurino para que elas sejam listadas automaticamente nos eventos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {figurinosPadrao.map((fig, idx) => (
                <div 
                  key={fig.id} 
                  draggable 
                  onDragStart={() => dragItem.current = idx}
                  onDragEnter={() => dragOverItem.current = idx}
                  onDragEnd={handleSortPadrao}
                  className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <GripVertical className="size-5 text-slate-300 cursor-grab active:cursor-grabbing hidden sm:block" />
                  
                  {fig.arquivo_url ? (
                    <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      <img src={fig.arquivo_url} className="w-full h-full object-cover" alt={fig.tipo_item} />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <ImageIcon className="size-6 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-1 bg-pink-100 text-pink-700 rounded-lg">{fig.personagem}</span>
                      {fig.tamanho && <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">Tam: {fig.tamanho}</span>}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{fig.tipo_item}</p>
                    {(fig.tipo_tecido || fig.descricao) && (
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {fig.tipo_tecido} {fig.tipo_tecido && fig.descricao ? '•' : ''} {fig.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(fig)} className="text-slate-500"><Edit className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(fig.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Editar Peça do Figurino</DialogTitle></DialogHeader>
          <form onSubmit={handleEditFigurino} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="col-span-1 md:col-span-2">
              <Label>Personagem</Label>
              {personagensAtuais.length > 0 ? (
                <Select value={novoPersonagem} onValueChange={setNovoPersonagem}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {personagensAtuais.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} className="mt-2" />
              )}
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Tipo da Peça</Label>
              <Input value={novoTipoItem} onChange={e => setNovoTipoItem(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Tamanho</Label>
              <Input value={novoTamanho} onChange={e => setNovoTamanho(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Tecido / Cor</Label>
              <Input value={novoTipoTecido} onChange={e => setNovoTipoTecido(e.target.value)} className="mt-2" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Atualizar Foto (opcional)</Label>
              <Input type="file" accept="image/*" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} className="mt-2" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Observações</Label>
              <Input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} className="mt-2" />
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploading} className="bg-pink-600 hover:bg-pink-700 text-white">
                {uploading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
