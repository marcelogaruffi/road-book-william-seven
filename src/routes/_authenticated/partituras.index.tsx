import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, FileText, Plus, Trash2, MapPin, Play, GripVertical, UploadCloud, Eye, Download, FileAudio, File } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/partituras/")({
  head: () => ({ meta: [{ title: "Partituras e Músicas - Seven Produções Artísticas" }] }),
  component: PartiturasPage,
});

type ArquivoPadrao = {
  id: string;
  espetaculo_nome: string;
  nome: string;
  arquivo_url: string;
  tipo: "partitura" | "musica";
  ordem: number;
};

type ArquivoEvento = {
  id: string;
  evento_id: string;
  nome: string;
  arquivo_url: string;
  tipo: "partitura" | "musica";
  ordem: number;
};

type Evento = {
  id: string;
  cidade: string;
  local: string;
  data: string;
  espetaculo: string;
};

function PartiturasPage() {
  const [activeTab, setActiveTab] = useState("evento");
  const [selectedTipo, setSelectedTipo] = useState<"partitura" | "musica">("partitura");
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  
  const [arquivosPadrao, setArquivosPadrao] = useState<ArquivoPadrao[]>([]);
  const [arquivosEvento, setArquivosEvento] = useState<ArquivoEvento[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Evento
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [selectedShowImport, setSelectedShowImport] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // States for Padrão
  const [selectedEspetaculoPadrao, setSelectedEspetaculoPadrao] = useState("");

  const [novoNome, setNovoNome] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<globalThis.File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  useEffect(() => {
    if (selectedEventoId) {
      fetchArquivosEvento(selectedEventoId);
      const evt = eventos.find(e => e.id === selectedEventoId);
      if (evt) setSelectedShowImport(evt.espetaculo);
    } else {
      setArquivosEvento([]);
      setSelectedShowImport("");
    }
  }, [selectedEventoId]);

  useEffect(() => {
    if (selectedEspetaculoPadrao) {
      fetchArquivosPadrao(selectedEspetaculoPadrao);
    } else {
      setArquivosPadrao([]);
    }
  }, [selectedEspetaculoPadrao]);

  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      const [evtRes, espRes] = await Promise.all([
        supabase.from("eventos").select("id, cidade, local, data, espetaculo").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo", { ascending: true })
      ]);

      if (evtRes.data) setEventos(evtRes.data);
      if (espRes.data) setEspetaculosList(espRes.data.map(e => e.nome_espetaculo));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados iniciais");
    } finally {
      setLoading(false);
    }
  }

  async function fetchArquivosEvento(eventoId: string) {
    const { data, error } = await supabase.from("arquivos_eventos").select("*").eq("evento_id", eventoId).order("ordem", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar arquivos do evento");
    } else {
      setArquivosEvento(data || []);
    }
  }

  async function fetchArquivosPadrao(espetaculo: string) {
    const { data, error } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar arquivos padrão");
    } else {
      setArquivosPadrao(data || []);
    }
  }

  async function handleFileUpload(file: globalThis.File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${selectedTipo}s/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('midias_eventos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('midias_eventos')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleAddArquivo(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === "evento" && !selectedEventoId) return toast.error("Selecione um evento");
    if (activeTab === "configuracao" && !selectedEspetaculoPadrao) return toast.error("Selecione um espetáculo");
    if (!novoNome.trim()) return toast.error("Digite o nome do arquivo");
    if (!novoArquivo) return toast.error("Selecione um arquivo para upload");

    setUploading(true);
    try {
      const publicUrl = await handleFileUpload(novoArquivo);

      if (activeTab === "configuracao") {
        const novaOrdem = arquivosPadrao.length;
        const { data, error } = await supabase.from("arquivos_padrao").insert({
          espetaculo_nome: selectedEspetaculoPadrao,
          nome: novoNome,
          arquivo_url: publicUrl,
          tipo: selectedTipo,
          ordem: novaOrdem
        }).select().single();

        if (error) throw error;
        setArquivosPadrao([...arquivosPadrao, data as ArquivoPadrao]);
        toast.success("Arquivo adicionado ao padrão");
      } else {
        const novaOrdem = arquivosEvento.length;
        const { data, error } = await supabase.from("arquivos_eventos").insert({
          evento_id: selectedEventoId,
          nome: novoNome,
          arquivo_url: publicUrl,
          tipo: selectedTipo,
          ordem: novaOrdem
        }).select().single();

        if (error) throw error;
        setArquivosEvento([...arquivosEvento, data as ArquivoEvento]);
        toast.success("Arquivo adicionado ao evento");
      }

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

  async function handleImportarPadrao() {
    if (!selectedEventoId) return;
    if (!selectedShowImport) return toast.error("Selecione um show para importar.");
    
    setLoading(true);
    try {
      const { data: padraoData, error: padraoError } = await supabase
        .from("arquivos_padrao")
        .select("*")
        .eq("espetaculo_nome", selectedShowImport);
        
      if (padraoError) throw padraoError;
      
      const itensDesteShow = (padraoData as ArquivoPadrao[]) || [];
      if (itensDesteShow.length === 0) {
        setLoading(false);
        return toast.warning(`Não há arquivos padrão para o show "${selectedShowImport}".`);
      }

      const existingUrls = new Set(arquivosEvento.map(i => i.arquivo_url));
      
      const itensParaInserir = itensDesteShow
        .filter(item => !existingUrls.has(item.arquivo_url))
        .map(item => ({
          evento_id: selectedEventoId,
          nome: item.nome,
          arquivo_url: item.arquivo_url,
          tipo: item.tipo,
          ordem: item.ordem
        }));

      if (itensParaInserir.length === 0) {
        setLoading(false);
        setImportDialogOpen(false);
        return toast.info("Todos os arquivos deste padrão já foram importados.");
      }

      const { data, error } = await supabase.from("arquivos_eventos").insert(itensParaInserir).select();
      if (error) throw error;
      
      setArquivosEvento([...arquivosEvento, ...(data as ArquivoEvento[])]);
      setImportDialogOpen(false);
      toast.success("Arquivos importados com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar arquivos padrão");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, table: "arquivos_padrao" | "arquivos_eventos") {
    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;
    
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir arquivo");
    } else {
      if (table === "arquivos_padrao") {
        setArquivosPadrao(arquivosPadrao.filter(a => a.id !== id));
      } else {
        setArquivosEvento(arquivosEvento.filter(a => a.id !== id));
      }
      toast.success("Arquivo excluído");
    }
  }

  // Ordenação Drag and Drop - Padrao
  async function handleSortPadrao() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    let _itensFiltrados = [...arquivosPadrao.filter(i => i.espetaculo_nome === selectedEspetaculoPadrao && i.tipo === selectedTipo)];
    const draggedItem = _itensFiltrados.splice(dragItem.current, 1)[0];
    _itensFiltrados.splice(dragOverItem.current, 0, draggedItem);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    _itensFiltrados = _itensFiltrados.map((item, index) => ({ ...item, ordem: index }));
    
    const idsToUpdate = new Set(_itensFiltrados.map(i => i.id));
    const otherItems = arquivosPadrao.filter(i => !idsToUpdate.has(i.id));
    setArquivosPadrao([...otherItems, ..._itensFiltrados]);
    
    const { error } = await supabase.from('arquivos_padrao').upsert(
      _itensFiltrados.map(i => ({ 
        id: i.id, 
        espetaculo_nome: i.espetaculo_nome,
        nome: i.nome,
        arquivo_url: i.arquivo_url,
        tipo: i.tipo,
        ordem: i.ordem
      }))
    );
    
    if (error) toast.error("Erro ao salvar nova ordem");
  }

  // Ordenação Drag and Drop - Evento
  async function handleSortEvento() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    let _itensFiltrados = [...arquivosEvento.filter(i => i.evento_id === selectedEventoId && i.tipo === selectedTipo)];
    const draggedItem = _itensFiltrados.splice(dragItem.current, 1)[0];
    _itensFiltrados.splice(dragOverItem.current, 0, draggedItem);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    _itensFiltrados = _itensFiltrados.map((item, index) => ({ ...item, ordem: index }));
    
    const idsToUpdate = new Set(_itensFiltrados.map(i => i.id));
    const otherItems = arquivosEvento.filter(i => !idsToUpdate.has(i.id));
    setArquivosEvento([...otherItems, ..._itensFiltrados]);
    
    const { error } = await supabase.from('arquivos_eventos').upsert(
      _itensFiltrados.map(i => ({ 
        id: i.id, 
        evento_id: i.evento_id,
        nome: i.nome,
        arquivo_url: i.arquivo_url,
        tipo: i.tipo,
        ordem: i.ordem
      }))
    );
    
    if (error) toast.error("Erro ao salvar nova ordem");
  }

  const displayedArquivosPadrao = arquivosPadrao.filter(a => a.tipo === selectedTipo).sort((a,b) => a.ordem - b.ordem);
  const displayedArquivosEvento = arquivosEvento.filter(a => a.tipo === selectedTipo).sort((a,b) => a.ordem - b.ordem);

  const getAcceptTypes = () => {
    return selectedTipo === "partitura" ? "application/pdf,image/*" : "audio/*";
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Music className="size-8 text-primary" />
            Partituras e Músicas
          </h1>
          <p className="text-slate-500 mt-1">Gerencie cifras, partituras e áudios de ensaio para os eventos.</p>
        </div>
      </div>

      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">
        <button
          onClick={() => setSelectedTipo("partitura")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${
            selectedTipo === "partitura"
              ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <FileText className="size-5" /> Partituras
        </button>
        <button
          onClick={() => setSelectedTipo("musica")}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${
            selectedTipo === "musica"
              ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <FileAudio className="size-5" /> Músicas (Áudio)
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="evento" className="flex items-center gap-2">
            <MapPin className="size-4" /> Evento Atual
          </TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2">
            <File className="size-4" /> Configuração Padrão
          </TabsTrigger>
        </TabsList>

        {/* ================= ABA EVENTO ================= */}
        <TabsContent value="evento" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Selecione o Evento</Label>
                  <select 
                    value={selectedEventoId} 
                    onChange={e => setSelectedEventoId(e.target.value)} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione um evento...</option>
                    {eventos.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.cidade} - {evt.local} ({new Date(evt.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="shrink-0">
                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={loading || !selectedEventoId} variant="outline" className="gap-2">
                        <Download className="size-4" /> Importar do Padrão
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Importar Padrão</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Qual Show Padrão deseja importar?</Label>
                          <select 
                            value={selectedShowImport}
                            onChange={e => setSelectedShowImport(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Selecione...</option>
                            {espetaculosList.map(esp => (
                              <option key={esp} value={esp}>{esp}</option>
                            ))}
                          </select>
                        </div>
                        <Button onClick={handleImportarPadrao} disabled={loading || !selectedShowImport} className="w-full">
                          Confirmar Importação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedEventoId ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                  <MapPin className="size-12 mb-4 opacity-50" />
                  <p>Selecione um evento acima para visualizar os arquivos.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Formulário de Adição */}
                  <form onSubmit={handleAddArquivo} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="flex-1 space-y-2">
                      <Label>Nome (Ex: Bateria - Música X)</Label>
                      <Input 
                        required
                        placeholder="Nome descritivo" 
                        value={novoNome}
                        onChange={e => setNovoNome(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Arquivo ({selectedTipo === 'partitura' ? 'PDF/Imagem' : 'Áudio'})</Label>
                      <Input 
                        ref={fileInputRef}
                        required
                        type="file" 
                        accept={getAcceptTypes()}
                        onChange={e => setNovoArquivo(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                    </div>
                    <Button type="submit" disabled={uploading} className="gap-2 shrink-0">
                      {uploading ? <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <UploadCloud className="size-4" />} 
                      {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </Button>
                  </form>

                  {/* Lista de Arquivos */}
                  <div className="flex flex-col gap-3">
                    {displayedArquivosEvento.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-xl">
                        Nenhum(a) {selectedTipo} cadastrado(a) para este evento.
                      </div>
                    ) : (
                      displayedArquivosEvento.map((arquivo, index) => (
                        <div 
                          key={arquivo.id}
                          draggable
                          onDragStart={() => dragItem.current = index}
                          onDragEnter={() => dragOverItem.current = index}
                          onDragEnd={handleSortEvento}
                          onDragOver={(e) => e.preventDefault()}
                          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 bg-white dark:bg-slate-900 transition-colors cursor-move"
                        >
                          <GripVertical className="size-5 text-slate-400 shrink-0" />
                          <span className="font-mono text-sm font-bold text-slate-500 min-w-[1.5rem]">{index + 1}.</span>
                          <div className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200 flex-1 line-clamp-1">
                            {selectedTipo === 'partitura' ? <FileText className="size-5 text-blue-500 shrink-0" /> : <Music className="size-5 text-emerald-500 shrink-0" />}
                            {arquivo.nome}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {selectedTipo === 'partitura' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm" className="gap-2 h-9">
                                    <Eye className="size-4" /> Visualizar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-2">
                                  <DialogHeader className="px-4 py-2">
                                    <DialogTitle>{arquivo.nome}</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                                    <iframe src={arquivo.arquivo_url} className="w-full h-full border-0" title={arquivo.nome} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm" className="gap-2 h-9 text-emerald-600 dark:text-emerald-400">
                                    <Play className="size-4" /> Ouvir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-6 flex flex-col gap-6 items-center rounded-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl">{arquivo.nome}</DialogTitle>
                                  </DialogHeader>
                                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                                    <audio controls className="w-full outline-none" autoPlay>
                                      <source src={arquivo.arquivo_url} />
                                      Seu navegador não suporta áudio.
                                    </audio>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(arquivo.id, "arquivos_eventos")} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= ABA PADRÃO ================= */}
        <TabsContent value="configuracao" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Configuração Padrão</CardTitle>
                  <CardDescription>Cadastre os modelos que serão puxados automaticamente para os novos eventos.</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <select 
                    value={selectedEspetaculoPadrao}
                    onChange={e => setSelectedEspetaculoPadrao(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-primary/50 font-semibold"
                  >
                    <option value="">Selecione um show...</option>
                    {espetaculosList.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {!selectedEspetaculoPadrao ? (
                <div className="text-center py-12 text-slate-400">
                  <File className="size-12 mb-4 opacity-50 mx-auto" />
                  <p>Selecione um Tipo de Show acima para configurar o acervo padrão.</p>
                </div>
              ) : (
                <>
                  {/* Formulário de Adição Padrão */}
                  <form onSubmit={handleAddArquivo} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="flex-1 space-y-2">
                      <Label>Nome (Padrão)</Label>
                      <Input 
                        required
                        placeholder="Ex: Teclado - Base completa" 
                        value={novoNome}
                        onChange={e => setNovoNome(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Arquivo ({selectedTipo === 'partitura' ? 'PDF/Imagem' : 'Áudio'})</Label>
                      <Input 
                        ref={fileInputRef}
                        required
                        type="file" 
                        accept={getAcceptTypes()}
                        onChange={e => setNovoArquivo(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                    </div>
                    <Button type="submit" disabled={uploading} className="gap-2 shrink-0">
                      {uploading ? <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <UploadCloud className="size-4" />} 
                      {uploading ? 'Enviando...' : 'Adicionar ao Padrão'}
                    </Button>
                  </form>

                  <div className="flex flex-col gap-3">
                    {displayedArquivosPadrao.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-xl">
                        Nenhum(a) {selectedTipo} padrão cadastrado(a) para este show.
                      </div>
                    ) : (
                      displayedArquivosPadrao.map((arquivo, index) => (
                        <div 
                          key={arquivo.id}
                          draggable
                          onDragStart={() => dragItem.current = index}
                          onDragEnter={() => dragOverItem.current = index}
                          onDragEnd={handleSortPadrao}
                          onDragOver={(e) => e.preventDefault()}
                          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-primary/30 transition-colors cursor-move"
                        >
                          <GripVertical className="size-5 text-slate-400 shrink-0" />
                          <span className="font-mono text-sm font-bold text-slate-500 min-w-[1.5rem]">{index + 1}.</span>
                          <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">
                            {selectedTipo === 'partitura' ? <FileText className="size-5 text-slate-400 shrink-0" /> : <Music className="size-5 text-slate-400 shrink-0" />}
                            {arquivo.nome}
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {selectedTipo === 'partitura' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Eye className="size-4" /> Visualizar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-2">
                                  <DialogHeader className="px-4 py-2">
                                    <DialogTitle>{arquivo.nome}</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                                    <iframe src={arquivo.arquivo_url} className="w-full h-full border-0" title={arquivo.nome} />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="gap-2 h-9">
                                    <Play className="size-4" /> Ouvir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl p-6 flex flex-col gap-6 items-center rounded-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-xl">{arquivo.nome}</DialogTitle>
                                  </DialogHeader>
                                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                                    <audio controls className="w-full outline-none" autoPlay>
                                      <source src={arquivo.arquivo_url} />
                                      Seu navegador não suporta áudio.
                                    </audio>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(arquivo.id, "arquivos_padrao")} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
