import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, File, Trash2, Eye, Download, CheckCircle2, Circle, FileSpreadsheet, FileText, Edit2, Shirt, Users } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/_authenticated/figurinos/")({
  head: () => ({ meta: [{ title: "Figurinos - Seven Produções Artísticas" }] }),
  component: FigurinosPage,
});

type Evento = { id: string; cidade: string; local: string; data: string; espetaculo: string; };

type FigurinoBase = {
  personagem: string;
  tipo_item: string;
  tamanho: string | null;
  tipo_tecido: string | null;
  descricao: string | null;
  arquivo_url: string | null;
  ordem: number;
};

type FigurinoPadrao = FigurinoBase & { id: string; espetaculo_nome: string; };
type FigurinoEvento = FigurinoBase & { id: string; evento_id: string; concluido: boolean; };

function FigurinosPage() {
  const [activeTab, setActiveTab] = useState("evento");
  const [selectedTipo, setSelectedTipo] = useState<"lista" | "conferencia">("lista");
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [espetaculosList, setEspetaculosList] = useState<{nome: string, personagens: string[]}[]>([]);
  
  const [figurinosPadrao, setFigurinosPadrao] = useState<FigurinoPadrao[]>([]);
  const [figurinosEvento, setFigurinosEvento] = useState<FigurinoEvento[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Evento
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [selectedShowImport, setSelectedShowImport] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // States for Padrão
  const [selectedEspetaculoPadrao, setSelectedEspetaculoPadrao] = useState("");

  // Personagens do show selecionado
  const [personagensAtuais, setPersonagensAtuais] = useState<string[]>([]);

  // Form states
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoTipoItem, setNovoTipoItem] = useState("");
  const [novoTamanho, setNovoTamanho] = useState("");
  const [novoTipoTecido, setNovoTipoTecido] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<globalThis.File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingFigurino, setEditingFigurino] = useState<FigurinoPadrao | FigurinoEvento | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  useEffect(() => {
    if (activeTab === 'configuracao' && selectedTipo === 'conferencia') {
      setSelectedTipo('lista'); 
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEventoId && activeTab === 'evento') {
      fetchFigurinosEvento(selectedEventoId);
      const evt = eventos.find(e => e.id === selectedEventoId);
      if (evt) {
        setSelectedShowImport(evt.espetaculo);
        const esp = espetaculosList.find(e => e.nome === evt.espetaculo);
        setPersonagensAtuais(esp?.personagens || []);
      }
    } else {
      setFigurinosEvento([]);
      setSelectedShowImport("");
      if (activeTab === 'evento') setPersonagensAtuais([]);
    }
  }, [selectedEventoId, activeTab, espetaculosList]);

  useEffect(() => {
    if (selectedEspetaculoPadrao && activeTab === 'configuracao') {
      fetchFigurinosPadrao(selectedEspetaculoPadrao);
      const esp = espetaculosList.find(e => e.nome === selectedEspetaculoPadrao);
      setPersonagensAtuais(esp?.personagens || []);
    } else {
      setFigurinosPadrao([]);
      if (activeTab === 'configuracao') setPersonagensAtuais([]);
    }
  }, [selectedEspetaculoPadrao, activeTab, espetaculosList]);

  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      const [evtRes, espRes] = await Promise.all([
        supabase.from("eventos").select("id, cidade, local, data, espetaculo").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo, personagens").order("nome_espetaculo", { ascending: true })
      ]);
      if (evtRes.data) setEventos(evtRes.data);
      if (espRes.data) {
        const esps = espRes.data.map(e => ({ nome: e.nome_espetaculo, personagens: (e.personagens as string[]) || [] }));
        setEspetaculosList(esps);
        if (esps.length > 0 && !selectedEspetaculoPadrao) {
          setSelectedEspetaculoPadrao(esps[0].nome);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFigurinosEvento(eventoId: string) {
    const { data } = await supabase.from("figurinos_eventos").select("*").eq("evento_id", eventoId).order("ordem", { ascending: true });
    setFigurinosEvento(data as FigurinoEvento[] || []);
  }

  async function fetchFigurinosPadrao(espetaculo: string) {
    const { data } = await supabase.from("figurinos_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    setFigurinosPadrao(data as FigurinoPadrao[] || []);
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
    if (activeTab === "evento" && !selectedEventoId) return toast.error("Selecione um evento");
    if (activeTab === "configuracao" && !selectedEspetaculoPadrao) return toast.error("Selecione um espetáculo");
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
        arquivo_url: publicUrl
      };

      if (activeTab === "configuracao") {
        const { data, error } = await supabase.from("figurinos_padrao").insert({ ...figData, espetaculo_nome: selectedEspetaculoPadrao, ordem: figurinosPadrao.length }).select().single();
        if (error) throw error;
        setFigurinosPadrao([...figurinosPadrao, data as FigurinoPadrao]);
      } else {
        const { data, error } = await supabase.from("figurinos_eventos").insert({ ...figData, evento_id: selectedEventoId, ordem: figurinosEvento.length, concluido: false }).select().single();
        if (error) throw error;
        setFigurinosEvento([...figurinosEvento, data as FigurinoEvento]);
      }
      
      setNovoTipoItem(""); setNovoTamanho(""); setNovoTipoTecido(""); setNovaDescricao(""); setNovoArquivo(null);
      // Mantemos o personagem selecionado para facilitar adição em massa
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

      if (activeTab === "configuracao") {
        const { data, error } = await supabase.from("figurinos_padrao").update(figData).eq("id", editingFigurino.id).select().single();
        if (error) throw error;
        setFigurinosPadrao(figurinosPadrao.map(p => p.id === editingFigurino.id ? data as FigurinoPadrao : p));
      } else {
        const { data, error } = await supabase.from("figurinos_eventos").update(figData).eq("id", editingFigurino.id).select().single();
        if (error) throw error;
        setFigurinosEvento(figurinosEvento.map(p => p.id === editingFigurino.id ? data as FigurinoEvento : p));
      }
      setEditDialogOpen(false);
      setNovoArquivo(null);
      toast.success("Peça editada");
    } catch (error) {
      toast.error("Erro ao editar");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(fig: FigurinoPadrao | FigurinoEvento) {
    setEditingFigurino(fig);
    setNovoPersonagem(fig.personagem);
    setNovoTipoItem(fig.tipo_item);
    setNovoTamanho(fig.tamanho || "");
    setNovoTipoTecido(fig.tipo_tecido || "");
    setNovaDescricao(fig.descricao || "");
    setNovoArquivo(null);
    setEditDialogOpen(true);
  }

  async function handleDelete(id: string, table: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (!error) {
      if (table === "figurinos_padrao") setFigurinosPadrao(figurinosPadrao.filter(f => f.id !== id));
      if (table === "figurinos_eventos") setFigurinosEvento(figurinosEvento.filter(f => f.id !== id));
      toast.success("Excluído");
    }
  }

  async function handleImportarPadrao() {
    if (!selectedEventoId || !selectedShowImport) return;
    setLoading(true);
    try {
      const { data: padrao } = await supabase.from("figurinos_padrao").select("*").eq("espetaculo_nome", selectedShowImport);
      const itemsParaInserir = (padrao || []).filter(p => !figurinosEvento.some(fe => fe.personagem === p.personagem && fe.tipo_item === p.tipo_item)).map(item => ({ 
        evento_id: selectedEventoId, personagem: item.personagem, tipo_item: item.tipo_item, tamanho: item.tamanho, 
        tipo_tecido: item.tipo_tecido, descricao: item.descricao, arquivo_url: item.arquivo_url, ordem: item.ordem, concluido: false 
      }));
      if (itemsParaInserir.length > 0) {
        const { data } = await supabase.from("figurinos_eventos").insert(itemsParaInserir).select();
        setFigurinosEvento([...figurinosEvento, ...(data as FigurinoEvento[])]);
      }
      toast.success("Importação concluída");
      setImportDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao importar");
    } finally {
      setLoading(false);
    }
  }

  async function toggleConcluido(id: string, atual: boolean) {
    await supabase.from("figurinos_eventos").update({ concluido: !atual }).eq("id", id);
    setFigurinosEvento(figurinosEvento.map(p => p.id === id ? { ...p, concluido: !atual } : p));
  }

  // Group items by character for display
  const currentList = activeTab === 'evento' ? figurinosEvento : figurinosPadrao;
  const groupedFigurinos = useMemo(() => {
    const groups: Record<string, typeof currentList> = {};
    currentList.forEach(item => {
      if (!groups[item.personagem]) groups[item.personagem] = [];
      groups[item.personagem].push(item);
    });
    return groups;
  }, [currentList]);

  const exportToExcel = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Figurinos');

    worksheet.columns = [
      { key: 'personagem', width: 25 },
      { key: 'tipo', width: 25 },
      { key: 'tamanho', width: 15 },
      { key: 'tecido', width: 20 },
      { key: 'descricao', width: 45 }
    ];

    let headerRowNumber = 1;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });

      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      const imgWidthExcel = 120;
      const imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;

      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      
      worksheet.getRow(1).height = 80;
      worksheet.mergeCells('D1:F1');
      worksheet.getCell('D1').value = activeTab === 'evento' && evt ? `Figurinos - ${evt.cidade} - ${evt.local}` : "Figurinos - Padrão";
      worksheet.getCell('D1').font = { size: 18, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      headerRowNumber = 3;
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Personagem', 'Peça', 'Tamanho', 'Tipo de Tecido', 'Descrição'];
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    Object.entries(groupedFigurinos).forEach(([personagem, items]) => {
      items.forEach((p) => {
        const row = worksheet.addRow({
          personagem: p.personagem,
          tipo: p.tipo_item,
          tamanho: p.tamanho || '-',
          tecido: p.tipo_tecido || '-',
          descricao: p.descricao || '-'
        });
        row.eachCell((cell) => {
          cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), activeTab === 'evento' ? `Figurinos_${evt?.espetaculo}_${evt?.cidade}.xlsx` : `Figurinos_Padrao.xlsx`);
  };

  const exportToPDF = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const doc = new jsPDF("landscape");
    let startY = 38;
    
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      
      const imgWidth = 40;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      
      doc.addImage(logoBase64, 'PNG', x, 10, imgWidth, imgHeight);
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Figurinos", pageWidth / 2, 10 + imgHeight + 10, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240); 
      doc.line(14, 10 + imgHeight + 15, pageWidth - 14, 10 + imgHeight + 15);
      
      if (activeTab === 'evento' && evt) {
        doc.setFontSize(10);
        doc.text(`Espetáculo: ${evt.espetaculo} | Evento: ${evt.cidade} - ${evt.local} (${new Date(evt.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})})`, pageWidth / 2, 10 + imgHeight + 20, { align: 'center' });
        startY = 10 + imgHeight + 25;
      } else {
        startY = 10 + imgHeight + 20;
      }
    } catch (e) {
      doc.setFontSize(18);
      doc.text("Figurinos", 14, 20);
      doc.setFontSize(12);
      if (activeTab === 'evento' && evt) {
        doc.text(`Espetáculo: ${evt.espetaculo} | Evento: ${evt.cidade} - ${evt.local}`, 14, 28);
      }
      startY = 35;
    }

    const tableColumn = ["Personagem", "Peça", "Tamanho", "Tipo de Tecido", "Descrição"];
    const tableRows = currentList.map(p => [
      p.personagem, p.tipo_item, p.tamanho || "-", p.tipo_tecido || "-", p.descricao || "-"
    ]);

    autoTable(doc, {
      startY: startY,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(activeTab === 'evento' ? `Figurinos_${evt?.espetaculo}_${evt?.cidade}.pdf` : `Figurinos_Padrao.pdf`);
  };

  const concluidosCount = figurinosEvento.filter(p => p.concluido).length;
  const progresso = figurinosEvento.length > 0 ? Math.round((concluidosCount / figurinosEvento.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Shirt className="size-8 text-primary" />
            Figurinos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie o guarda-roupa dos personagens e as peças do show.</p>
        </div>
      </div>

      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">
        <button onClick={() => setSelectedTipo("lista")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "lista" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <Shirt className="size-5" /> Lista de Roupas
        </button>
        <button onClick={() => setSelectedTipo("conferencia")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <CheckCircle2 className="size-5" /> Conferência
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="evento" className="flex items-center gap-2"><MapPin className="size-4" /> Evento Atual</TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2"><File className="size-4" /> Configuração Padrão</TabsTrigger>
        </TabsList>

        <Card className="mt-6">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <Label>{activeTab === 'evento' ? 'Selecione o Evento' : 'Selecione o Show Padrão'}</Label>
                {activeTab === 'evento' ? (
                  <select value={selectedEventoId} onChange={e => setSelectedEventoId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Selecione um evento...</option>
                    {eventos.map(evt => <option key={evt.id} value={evt.id}>{evt.cidade} - {evt.local} ({new Date(evt.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})</option>)}
                  </select>
                ) : (
                  <select value={selectedEspetaculoPadrao} onChange={e => setSelectedEspetaculoPadrao(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Selecione um show...</option>
                    {espetaculosList.map(esp => <option key={esp.nome} value={esp.nome}>{esp.nome}</option>)}
                  </select>
                )}
              </div>
              {selectedTipo === 'lista' && (
                <div className="shrink-0 flex gap-2">
                  {((activeTab === 'evento' && selectedEventoId) || (activeTab === 'configuracao' && selectedEspetaculoPadrao)) && (
                    <>
                      <Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                      <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>
                    </>
                  )}
                  {activeTab === 'evento' && selectedEventoId && (
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger asChild><Button disabled={loading} variant="outline" className="gap-2"><Download className="size-4" /> Importar Padrão</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Importar Figurinos</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Qual Show deseja importar?</Label>
                            <select value={selectedShowImport} onChange={e => setSelectedShowImport(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="">Selecione...</option>
                              {espetaculosList.map(esp => <option key={esp.nome} value={esp.nome}>{esp.nome}</option>)}
                            </select>
                          </div>
                          <Button onClick={handleImportarPadrao} disabled={loading || !selectedShowImport} className="w-full">Confirmar Importação</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {((activeTab === 'evento' && !selectedEventoId) || (activeTab === 'configuracao' && !selectedEspetaculoPadrao)) ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                <Shirt className="size-12 mb-4 opacity-50" />
                <p>Selecione um {activeTab === 'evento' ? 'evento' : 'show'} acima para gerenciar os figurinos.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedTipo === 'lista' && (
                  <>
                    <form onSubmit={handleAddFigurino} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200">
                      <div className="space-y-2 lg:col-span-1">
                        <Label>Personagem *</Label>
                        <select required value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Selecione...</option>
                          {personagensAtuais.map(p => <option key={p} value={p}>{p}</option>)}
                          <option value="Equipe/Staff">Equipe/Staff</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div className="space-y-2 lg:col-span-1"><Label>Peça / Item *</Label><Input required placeholder="Ex: Camiseta, Jaqueta" value={novoTipoItem} onChange={e => setNovoTipoItem(e.target.value)} /></div>
                      <div className="space-y-2 lg:col-span-1"><Label>Tamanho</Label><Input placeholder="Ex: M, 42" value={novoTamanho} onChange={e => setNovoTamanho(e.target.value)} /></div>
                      <div className="space-y-2 lg:col-span-1"><Label>Tecido</Label><Input placeholder="Ex: Algodão" value={novoTipoTecido} onChange={e => setNovoTipoTecido(e.target.value)} /></div>
                      <div className="space-y-2 lg:col-span-2"><Label>Descrição / Notas</Label><Input placeholder="Detalhes da peça" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} /></div>
                      <div className="space-y-2 lg:col-span-1"><Label>Foto da Peça</Label><Input ref={fileInputRef} type="file" accept="image/*" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} /></div>
                      <div className="flex items-end lg:col-span-1"><Button type="submit" disabled={uploading} className="w-full gap-2">{uploading ? 'Salvando...' : 'Adicionar Peça'}</Button></div>
                    </form>

                    <div className="flex flex-col gap-8 mt-8">
                      {Object.keys(groupedFigurinos).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">Nenhuma peça cadastrada.</div>
                      ) : (
                        Object.entries(groupedFigurinos).map(([personagem, items]) => (
                          <div key={personagem} className="space-y-4">
                            <h3 className="font-bold text-xl text-slate-800 border-b pb-2 flex items-center gap-2"><Users className="size-5 text-primary" /> {personagem}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {items.map((item) => (
                                <div key={item.id} className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm relative group overflow-hidden">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-lg text-slate-800">{item.tipo_item}</h4>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {item.tamanho && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">Tamanho: {item.tamanho}</span>}
                                        {item.tipo_tecido && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-semibold">Tecido: {item.tipo_tecido}</span>}
                                      </div>
                                    </div>
                                    {item.arquivo_url && (
                                      <Dialog>
                                        <DialogTrigger asChild><div className="cursor-pointer shrink-0 border rounded-lg overflow-hidden w-16 h-16 hover:opacity-80 transition-opacity"><img src={item.arquivo_url} className="w-full h-full object-cover" /></div></DialogTrigger>
                                        <DialogContent className="max-w-2xl p-2"><img src={item.arquivo_url} className="w-full rounded-lg" /></DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                  {item.descricao && <p className="text-sm text-slate-500 italic mt-1">{item.descricao}</p>}
                                  
                                  {/* Botões Overlay */}
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm backdrop-blur-sm">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditModal(item)}><Edit2 className="size-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id, activeTab === 'evento' ? "figurinos_eventos" : "figurinos_padrao")}><Trash2 className="size-3" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {selectedTipo === 'conferencia' && (
                  activeTab === 'configuracao' ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50">
                      <CheckCircle2 className="size-12 mb-4 opacity-30 mx-auto text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Modo de Visualização (Padrão)</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        O check list das roupas e araras é feito apenas na aba <strong>"Evento Atual"</strong>.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 rounded-xl p-4">
                        <div><h4 className="font-bold">Conferência de Figurino</h4><p className="text-sm">{concluidosCount} de {figurinosEvento.length} peças prontas</p></div>
                        <span className={`text-3xl font-black ${progresso === 100 ? 'text-emerald-500' : 'text-primary'}`}>{progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6"><div className={`h-full ${progresso === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progresso}%` }}></div></div>
                      
                      <div className="space-y-6">
                        {Object.entries(groupedFigurinos).map(([personagem, items]) => (
                          <div key={personagem}>
                            <h4 className="font-bold text-slate-700 border-b pb-2 mb-3">{personagem}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {items.map((item) => {
                                const fig = item as FigurinoEvento;
                                return (
                                  <div key={fig.id} onClick={() => toggleConcluido(fig.id, fig.concluido)} className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${fig.concluido ? 'border-emerald-500/20 bg-emerald-50 opacity-80' : 'border-slate-200 bg-white hover:border-primary/30'}`}>
                                    <button className="flex-shrink-0 mt-0.5">{fig.concluido ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-slate-300" />}</button>
                                    <div>
                                      <h5 className={`font-semibold text-sm ${fig.concluido ? 'line-through text-slate-500' : 'text-slate-800'}`}>{fig.tipo_item}</h5>
                                      {(fig.tamanho || fig.tipo_tecido) && <p className="text-xs text-slate-500">{fig.tamanho} {fig.tipo_tecido}</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Peça</DialogTitle></DialogHeader>
          <form onSubmit={handleEditFigurino} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Personagem *</Label>
              <select required value={novoPersonagem} onChange={e => setNovoPersonagem(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {personagensAtuais.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="Equipe/Staff">Equipe/Staff</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Peça / Item *</Label><Input required value={novoTipoItem} onChange={e => setNovoTipoItem(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tamanho</Label><Input value={novoTamanho} onChange={e => setNovoTamanho(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tecido</Label><Input value={novoTipoTecido} onChange={e => setNovoTipoTecido(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Descrição / Notas</Label><Input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Nova Foto (Deixe em branco para manter a atual)</Label><Input ref={fileInputRefEdit} type="file" accept="image/*" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar Alterações'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
