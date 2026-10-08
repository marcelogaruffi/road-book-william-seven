import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, Trash2, GripVertical, Download, Loader2, Music, FileAudio } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ArquivoPadrao = {
  id: string;
  espetaculo_nome: string;
  nome: string;
  arquivo_url: string;
  tipo: "partitura" | "musica";
  ordem: number;
};

export function PartiturasPadraoTab({ espetaculoNome }: { espetaculoNome?: string }) {
  const [arquivosPadrao, setArquivosPadrao] = useState<ArquivoPadrao[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<"partitura" | "musica">("partitura");
  
  const [novoNome, setNovoNome] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<globalThis.File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (espetaculoNome) {
      fetchArquivosPadrao(espetaculoNome);
    } else {
      setArquivosPadrao([]);
    }
  }, [espetaculoNome]);

  async function fetchArquivosPadrao(espetaculo: string) {
    setLoading(true);
    const { data, error } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar arquivos padrão");
    } else {
      setArquivosPadrao(data || []);
    }
    setLoading(false);
  }

  async function handleFileUpload(file: globalThis.File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${selectedTipo}s/${fileName}`;

    const { error: uploadError, data } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleAddArquivo(e: React.FormEvent) {
    e.preventDefault();
    if (!espetaculoNome) return toast.error("Selecione um espetáculo");
    if (!novoNome.trim()) return toast.error("Digite o nome do arquivo");
    if (!novoArquivo) return toast.error("Selecione um arquivo para upload");

    setUploading(true);
    try {
      const publicUrl = await handleFileUpload(novoArquivo);
      const novaOrdem = arquivosPadrao.filter(a => a.tipo === selectedTipo).length;
      const { data, error } = await supabase.from("arquivos_padrao").insert({
        espetaculo_nome: espetaculoNome,
        nome: novoNome,
        arquivo_url: publicUrl,
        tipo: selectedTipo,
        ordem: novaOrdem
      }).select().single();

      if (error) throw error;
      setArquivosPadrao([...arquivosPadrao, data as ArquivoPadrao]);
      toast.success("Arquivo adicionado ao padrão");
      
      setNovoNome("");
      setNovoArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;
    try {
      const { error } = await supabase.from("arquivos_padrao").delete().eq("id", id);
      if (error) throw error;
      setArquivosPadrao(arquivosPadrao.filter(a => a.id !== id));
      toast.success("Arquivo excluído");
    } catch (error) {
      toast.error("Erro ao excluir arquivo");
    }
  }

  async function handleSortPadrao() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    let _itensFiltrados = [...arquivosPadrao.filter(i => i.tipo === selectedTipo)];
    const draggedItem = _itensFiltrados.splice(dragItem.current, 1)[0];
    _itensFiltrados.splice(dragOverItem.current, 0, draggedItem);
    
    dragItem.current = null;
    dragOverItem.current = null;

    const idsToUpdate = new Set(_itensFiltrados.map(i => i.id));
    const otherItems = arquivosPadrao.filter(i => !idsToUpdate.has(i.id));
    
    const updatedItens = _itensFiltrados.map((item, idx) => ({ ...item, ordem: idx }));
    setArquivosPadrao([...otherItems, ...updatedItens]);

    for (const item of updatedItens) {
      await supabase.from("arquivos_padrao").update({ ordem: item.ordem }).eq("id", item.id);
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary size-8" /></div>;

  const displayedArquivosPadrao = arquivosPadrao.filter(a => a.tipo === selectedTipo).sort((a,b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-90">
            <Music className="size-6" />
            <h2 className="text-xl font-bold">Partituras e Músicas Padrão</h2>
          </div>
        </div>

        <CardContent className="p-6">
          <Tabs value={selectedTipo} onValueChange={(v: any) => setSelectedTipo(v)} className="w-full">
            <TabsList className="mb-6 bg-slate-100 dark:bg-white/5">
              <TabsTrigger value="partitura" className="flex gap-2">
                <FileText className="size-4" /> Partituras
              </TabsTrigger>
              <TabsTrigger value="musica" className="flex gap-2">
                <FileAudio className="size-4" /> Áudios / Músicas
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleAddArquivo} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 mb-8">
              <div className="w-full md:w-1/3">
                <Label>Nome {selectedTipo === 'partitura' ? '/ Instrumento' : 'da Música'}</Label>
                <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder={selectedTipo === 'partitura' ? "Ex: Baixo - Ato 1" : "Ex: Guia Ato 1"} className="mt-2" />
              </div>
              <div className="w-full md:w-1/2">
                <Label>Arquivo ({selectedTipo === 'partitura' ? 'PDF, etc' : 'MP3, WAV, etc'})</Label>
                <Input type="file" accept={selectedTipo === 'partitura' ? 'application/pdf,image/*' : 'audio/*'} ref={fileInputRef} onChange={e => setNovoArquivo(e.target.files?.[0] || null)} className="mt-2" />
              </div>
              <Button type="submit" disabled={uploading || !espetaculoNome} className="w-full md:w-auto h-10 mt-6 shrink-0 bg-teal-600 hover:bg-teal-700 text-white">
                {uploading ? "Enviando..." : <><Plus className="size-4 mr-2" /> Adicionar</>}
              </Button>
            </form>

            {displayedArquivosPadrao.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                {selectedTipo === 'partitura' ? <FileText className="size-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" /> : <FileAudio className="size-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />}
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum(a) {selectedTipo} padrão</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                  Adicione arquivos aqui para que eles sejam automaticamente importados ao criar novos eventos para {espetaculoNome || "este espetáculo"}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedArquivosPadrao.map((arq, idx) => (
                  <div 
                    key={arq.id} 
                    draggable 
                    onDragStart={() => dragItem.current = idx}
                    onDragEnter={() => dragOverItem.current = idx}
                    onDragEnd={handleSortPadrao}
                    className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <GripVertical className="size-5 text-slate-300 cursor-grab active:cursor-grabbing" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{arq.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild className="rounded-xl border-dashed">
                        <a href={arq.arquivo_url} target="_blank" rel="noreferrer"><Download className="size-4 mr-2" /> Baixar</a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(arq.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
