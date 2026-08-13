import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, File, Trash2, Eye, Download, CheckCircle2, Circle, FileSpreadsheet, FileText, Edit2, DoorOpen, Coffee, Plus, Utensils, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/_authenticated/camarins/")({
  head: () => ({ meta: [{ title: "Camarins & Catering - Seven Produções Artísticas" }] }),
  component: CamarinsPage,
});

type Evento = { id: string; cidade: string; local: string; data: string; espetaculo: string; equipe: string[]; };

type CamarimBase = {
  camarim: string;
  item: string;
  quantidade: string | null;
  observacao: string | null;
  arquivo_url: string | null;
  ordem: number;
};

type CamarimPadrao = CamarimBase & { id: string; espetaculo_nome: string; };
type CamarimEvento = CamarimBase & { id: string; evento_id: string; concluido: boolean; };

type CamarimOcupante = {
  id?: string;
  evento_id?: string;
  espetaculo_nome?: string;
  camarim_nome: string;
  ocupantes: string;
};

type ProfileData = {
  id: string;
  nome: string;
  role: string;
  restricao_alimentar: string | null;
};

function CamarinsPage() {
  const [activeTab, setActiveTab] = useState("evento");
  const [selectedTipo, setSelectedTipo] = useState<"lista" | "conferencia" | "catering">("lista");
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  
  const [itensPadrao, setItensPadrao] = useState<CamarimPadrao[]>([]);
  const [itensEvento, setItensEvento] = useState<CamarimEvento[]>([]);
  
  // Array para guardar camarins criados localmente antes de terem itens
  const [emptyCamarins, setEmptyCamarins] = useState<string[]>([]);

  const [equipePerfis, setEquipePerfis] = useState<ProfileData[]>([]);
  const [ocupantes, setOcupantes] = useState<CamarimOcupante[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Evento
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [selectedShowImport, setSelectedShowImport] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // States for Padrão
  const [selectedEspetaculoPadrao, setSelectedEspetaculoPadrao] = useState("");

  // States para "Placa de Porta"
  const [placaModalOpen, setPlacaModalOpen] = useState(false);
  const [activeCamarimParaPlaca, setActiveCamarimParaPlaca] = useState("");
  const [nomesPlaca, setNomesPlaca] = useState("");

  // States para "Novo Camarim"
  const [novoCamarimModalOpen, setNovoCamarimModalOpen] = useState(false);
  const [novoCamarimNome, setNovoCamarimNome] = useState("");

  // Form states for adding Item
  const [activeCamarimParaItem, setActiveCamarimParaItem] = useState("");
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [novoItem, setNovoItem] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaObservacao, setNovaObservacao] = useState("");
  const [novoArquivo, setNovoArquivo] = useState<globalThis.File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingItem, setEditingItem] = useState<CamarimPadrao | CamarimEvento | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  useEffect(() => {
    if (activeTab === 'configuracao' && selectedTipo !== 'lista') {
      setSelectedTipo('lista'); 
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEventoId && activeTab === 'evento') {
      fetchItensEvento(selectedEventoId);
      fetchOcupantes(selectedEventoId, null);
      const evt = eventos.find(e => e.id === selectedEventoId);
      if (evt) {
        setSelectedShowImport(evt.espetaculo);
        fetchEquipe(evt.equipe || []);
      }
    } else {
      setItensEvento([]);
      setSelectedShowImport("");
      setEquipePerfis([]);
      if (activeTab === 'evento') setOcupantes([]);
    }
  }, [selectedEventoId, activeTab, eventos]);

  useEffect(() => {
    if (selectedEspetaculoPadrao && activeTab === 'configuracao') {
      fetchItensPadrao(selectedEspetaculoPadrao);
      fetchOcupantes(null, selectedEspetaculoPadrao);
    } else {
      setItensPadrao([]);
      if (activeTab === 'configuracao') setOcupantes([]);
    }
  }, [selectedEspetaculoPadrao, activeTab]);

  async function fetchOcupantes(eventoId: string | null, espetaculoNome: string | null) {
    let query = supabase.from("camarins_ocupantes").select("*");
    if (eventoId) query = query.eq("evento_id", eventoId);
    else if (espetaculoNome) query = query.eq("espetaculo_nome", espetaculoNome);
    const { data } = await query;
    setOcupantes(data as CamarimOcupante[] || []);
  }

  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      const [evtRes, espRes] = await Promise.all([
        supabase.from("eventos").select("id, cidade, local, data, espetaculo, equipe").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo", { ascending: true })
      ]);
      if (evtRes.data) setEventos(evtRes.data as Evento[]);
      if (espRes.data) {
        const esps = espRes.data.map(e => e.nome_espetaculo);
        setEspetaculosList(esps);
        if (esps.length > 0 && !selectedEspetaculoPadrao) {
          setSelectedEspetaculoPadrao(esps[0]);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEquipe(equipeIds: string[]) {
    if (!equipeIds || equipeIds.length === 0) {
      setEquipePerfis([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, role, restricao_alimentar')
      .in('id', equipeIds)
      .order('nome');
    
    if (data) setEquipePerfis(data as ProfileData[]);
  }

  async function fetchItensEvento(eventoId: string) {
    const { data } = await supabase.from("camarins_eventos").select("*").eq("evento_id", eventoId).order("ordem", { ascending: true });
    setItensEvento(data as CamarimEvento[] || []);
  }

  async function fetchItensPadrao(espetaculo: string) {
    const { data } = await supabase.from("camarins_padrao").select("*").eq("espetaculo_nome", espetaculo).order("ordem", { ascending: true });
    setItensPadrao(data as CamarimPadrao[] || []);
  }

  async function handleFileUpload(file: globalThis.File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `camarins/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
    return publicUrl;
  }

  function handleCriarCamarim(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCamarimNome.trim()) return;
    setEmptyCamarins(prev => [...prev, novoCamarimNome.trim()]);
    setNovoCamarimNome("");
    setNovoCamarimModalOpen(false);
    toast.success("Camarim adicionado. Agora você pode adicionar itens a ele.");
  }

  function openAddItemModal(camarimName: string) {
    setActiveCamarimParaItem(camarimName);
    setNovoItem(""); setNovaQuantidade(""); setNovaObservacao(""); setNovoArquivo(null);
    setAddItemModalOpen(true);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === "evento" && !selectedEventoId) return toast.error("Selecione um evento");
    if (activeTab === "configuracao" && !selectedEspetaculoPadrao) return toast.error("Selecione um espetáculo");
    if (!novoItem.trim()) return toast.error("Item é obrigatório");

    setUploading(true);
    try {
      let publicUrl = null;
      if (novoArquivo) publicUrl = await handleFileUpload(novoArquivo);

      const itemData = {
        camarim: activeCamarimParaItem,
        item: novoItem.trim(),
        quantidade: novaQuantidade.trim() || null,
        observacao: novaObservacao.trim() || null,
        arquivo_url: publicUrl
      };

      if (activeTab === "configuracao") {
        const { data, error } = await supabase.from("camarins_padrao").insert({ ...itemData, espetaculo_nome: selectedEspetaculoPadrao, ordem: itensPadrao.length }).select().single();
        if (error) throw error;
        setItensPadrao([...itensPadrao, data as CamarimPadrao]);
      } else {
        const { data, error } = await supabase.from("camarins_eventos").insert({ ...itemData, evento_id: selectedEventoId, ordem: itensEvento.length, concluido: false }).select().single();
        if (error) throw error;
        setItensEvento([...itensEvento, data as CamarimEvento]);
      }
      
      setAddItemModalOpen(false);
      toast.success("Item adicionado");
    } catch (error) {
      toast.error("Erro ao salvar");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    setUploading(true);
    try {
      let publicUrl = editingItem.arquivo_url;
      if (novoArquivo) {
        publicUrl = await handleFileUpload(novoArquivo);
      }

      const itemData = {
        item: novoItem.trim(),
        quantidade: novaQuantidade.trim() || null,
        observacao: novaObservacao.trim() || null,
        arquivo_url: publicUrl
      };

      if (activeTab === "configuracao") {
        const { data, error } = await supabase.from("camarins_padrao").update(itemData).eq("id", editingItem.id).select().single();
        if (error) throw error;
        setItensPadrao(itensPadrao.map(p => p.id === editingItem.id ? data as CamarimPadrao : p));
      } else {
        const { data, error } = await supabase.from("camarins_eventos").update(itemData).eq("id", editingItem.id).select().single();
        if (error) throw error;
        setItensEvento(itensEvento.map(p => p.id === editingItem.id ? data as CamarimEvento : p));
      }
      setEditDialogOpen(false);
      setNovoArquivo(null);
      toast.success("Item editado");
    } catch (error) {
      toast.error("Erro ao editar");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(item: CamarimPadrao | CamarimEvento) {
    setEditingItem(item);
    setNovoItem(item.item);
    setNovaQuantidade(item.quantidade || "");
    setNovaObservacao(item.observacao || "");
    setNovoArquivo(null);
    setEditDialogOpen(true);
  }

  async function handleDelete(id: string, table: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (!error) {
      if (table === "camarins_padrao") setItensPadrao(itensPadrao.filter(f => f.id !== id));
      if (table === "camarins_eventos") setItensEvento(itensEvento.filter(f => f.id !== id));
      toast.success("Excluído");
    }
  }

  async function handleDeleteCamarim(camarimName: string) {
    if (!confirm(`Tem certeza que deseja excluir O CAMARIM INTEIRO "${camarimName}" e todos os seus itens?`)) return;
    
    // Remove if it's only in empty state
    if (emptyCamarins.includes(camarimName)) {
      setEmptyCamarins(emptyCamarins.filter(c => c !== camarimName));
    }

    const table = activeTab === "configuracao" ? "camarins_padrao" : "camarins_eventos";
    let query = supabase.from(table).delete().eq("camarim", camarimName);
    if (activeTab === "configuracao") {
      query = query.eq("espetaculo_nome", selectedEspetaculoPadrao);
    } else {
      query = query.eq("evento_id", selectedEventoId);
    }
    
    const { error } = await query;
    if (!error) {
      if (activeTab === "configuracao") {
        setItensPadrao(itensPadrao.filter(f => f.camarim !== camarimName));
      } else {
        setItensEvento(itensEvento.filter(f => f.camarim !== camarimName));
      }
      toast.success("Camarim excluído");
    }
  }

  async function handleImportarPadrao() {
    if (!selectedEventoId || !selectedShowImport) return;
    setLoading(true);
    try {
      const { data: padrao } = await supabase.from("camarins_padrao").select("*").eq("espetaculo_nome", selectedShowImport);
      const itemsParaInserir = (padrao || []).filter(p => !itensEvento.some(fe => fe.camarim === p.camarim && fe.item === p.item)).map(item => ({ 
        evento_id: selectedEventoId, camarim: item.camarim, item: item.item, quantidade: item.quantidade, 
        observacao: item.observacao, arquivo_url: item.arquivo_url, ordem: item.ordem, concluido: false 
      }));
      if (itemsParaInserir.length > 0) {
        const { data } = await supabase.from("camarins_eventos").insert(itemsParaInserir).select();
        setItensEvento([...itensEvento, ...(data as CamarimEvento[])]);
      }

      // Importar placas do padrao
      const { data: ocupantesPadrao } = await supabase.from("camarins_ocupantes").select("*").eq("espetaculo_nome", selectedShowImport);
      if (ocupantesPadrao && ocupantesPadrao.length > 0) {
        const ocupantesParaInserir = ocupantesPadrao
          .filter(p => !ocupantes.some(o => o.camarim_nome === p.camarim_nome))
          .map(p => ({
            evento_id: selectedEventoId,
            camarim_nome: p.camarim_nome,
            ocupantes: p.ocupantes
          }));
        if (ocupantesParaInserir.length > 0) {
          const { data } = await supabase.from("camarins_ocupantes").insert(ocupantesParaInserir).select();
          setOcupantes([...ocupantes, ...(data as CamarimOcupante[])]);
        }
      }

      toast.success("Importação concluída");
      setImportDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao importar");
    } finally {
      setLoading(false);
    }
  }

  function openPlacaModal(camarimName: string) {
    setActiveCamarimParaPlaca(camarimName);
    const exist = ocupantes.find(o => o.camarim_nome === camarimName);
    setNomesPlaca(exist ? exist.ocupantes : "");
    setPlacaModalOpen(true);
  }

  async function handleSalvarPlaca(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const payload: CamarimOcupante = { camarim_nome: activeCamarimParaPlaca, ocupantes: nomesPlaca.trim() };
      if (activeTab === "configuracao") payload.espetaculo_nome = selectedEspetaculoPadrao;
      else payload.evento_id = selectedEventoId;

      const existing = ocupantes.find(o => o.camarim_nome === activeCamarimParaPlaca);
      
      if (existing && existing.id) {
        if (!nomesPlaca.trim()) {
          await supabase.from("camarins_ocupantes").delete().eq("id", existing.id);
          setOcupantes(ocupantes.filter(o => o.id !== existing.id));
        } else {
          const { data, error } = await supabase.from("camarins_ocupantes").update({ ocupantes: nomesPlaca.trim() }).eq("id", existing.id).select().single();
          if (error) throw error;
          setOcupantes(ocupantes.map(o => o.id === existing.id ? (data as CamarimOcupante) : o));
        }
      } else if (nomesPlaca.trim()) {
        const { data, error } = await supabase.from("camarins_ocupantes").insert(payload).select().single();
        if (error) throw error;
        setOcupantes([...ocupantes, data as CamarimOcupante]);
      }
      
      toast.success("Placa salva");
      setPlacaModalOpen(false);
    } catch (e) {
      toast.error("Erro ao salvar placa");
    } finally {
      setUploading(false);
    }
  }

  const exportPlacasPDF = async () => {
    const doc = new jsPDF("portrait");
    const evt = eventos.find(e => e.id === selectedEventoId);
    
    let starBase64 = "";
    try {
      const response = await fetch('/star.png');
      const blob = await response.blob();
      starBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
    } catch (e) {
      console.warn("Estrela não carregada", e);
    }

    const camarinsParaImprimir = Object.keys(groupedItens);
    if (camarinsParaImprimir.length === 0) {
      return toast.error("Nenhum camarim criado");
    }

    camarinsParaImprimir.forEach((camarim, index) => {
      if (index > 0) doc.addPage();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      const occupantData = ocupantes.find(o => o.camarim_nome === camarim);
      const textOcupante = occupantData?.ocupantes || "";
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      
      let tituloSize = 55;
      if (camarim.length > 15) tituloSize = 42;
      if (camarim.length > 25) tituloSize = 32;
      doc.setFontSize(tituloSize);
      doc.text(camarim.toUpperCase(), pageWidth / 2, pageHeight * 0.18, { align: 'center' });

      if (starBase64) {
        const starWidth = 190;
        const starHeight = 190;
        doc.addImage(starBase64, 'PNG', (pageWidth - starWidth) / 2, pageHeight * 0.22, starWidth, starHeight);
      }
      
      if (textOcupante) {
        doc.setFontSize(36);
        doc.setFont("helvetica", "bold");
        const lines = doc.splitTextToSize(textOcupante.toUpperCase(), pageWidth - 40);
        doc.text(lines, pageWidth / 2, pageHeight * 0.88, { align: 'center' });
      }
      
      if (activeTab === 'evento' && evt) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`${evt.cidade} - ${new Date(evt.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
      }
    });

    doc.save(activeTab === 'evento' ? `Placas_Camarins_${evt?.cidade}.pdf` : `Placas_Camarins_Padrao.pdf`);
  };

  async function toggleConcluido(id: string, atual: boolean) {
    await supabase.from("camarins_eventos").update({ concluido: !atual }).eq("id", id);
    setItensEvento(itensEvento.map(p => p.id === id ? { ...p, concluido: !atual } : p));
  }

  // Group items by camarim for display
  const currentList = activeTab === 'evento' ? itensEvento : itensPadrao;
  const groupedItens = useMemo(() => {
    const groups: Record<string, typeof currentList> = {};
    // Add empty camarins first
    emptyCamarins.forEach(c => { groups[c] = []; });
    // Add populated ones
    currentList.forEach(item => {
      if (!groups[item.camarim]) groups[item.camarim] = [];
      groups[item.camarim].push(item);
    });
    return groups;
  }, [currentList, emptyCamarins]);

  const exportCateringExcel = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Catering');

    worksheet.columns = [
      { key: 'nome', width: 30 },
      { key: 'funcao', width: 20 },
      { key: 'restricao', width: 50 }
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
      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
      worksheet.getRow(1).height = 60;
      worksheet.mergeCells('B1:C1');
      worksheet.getCell('B1').value = evt ? `Catering - Restrições Alimentares (${evt.cidade})` : "Catering";
      worksheet.getCell('B1').font = { size: 16, bold: true };
      worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
      headerRowNumber = 3;
    } catch (e) {
      console.warn(e);
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Nome do Integrante', 'Função', 'Restrição Alimentar / Observações'];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    equipePerfis.forEach((p) => {
      worksheet.addRow({
        nome: p.nome || '-',
        funcao: p.role?.toUpperCase() || '-',
        restricao: p.restricao_alimentar || 'Nenhuma'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Catering_${evt?.cidade || 'Evento'}.xlsx`);
  };

  const exportCateringPDF = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const doc = new jsPDF("portrait");
    
    let logoBase64 = "";
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const drawHeader = (pdfDoc: jsPDF) => {
      if (logoBase64) {
        pdfDoc.addImage(logoBase64, 'PNG', 14, 10, 35, (35 * 38) / 100);
      }
      pdfDoc.setFontSize(16);
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setTextColor(15, 23, 42);
      pdfDoc.text("Catering - Restrições Alimentares", 55, 18);
      if (evt) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.text(`Evento: ${evt.cidade} - ${evt.local} (${new Date(evt.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})})`, 55, 24);
      }
    };

    drawHeader(doc);

    const tableColumn = ["Nome", "Função", "Restrição Alimentar"];
    const tableRows = equipePerfis.map(p => [
      p.nome, p.role.toUpperCase(), p.restricao_alimentar || "Nenhuma"
    ]);

    autoTable(doc, {
      startY: 38,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42] },
      margin: { top: 38 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(doc);
        }
      }
    });

    doc.save(`Catering_${evt?.cidade || 'Evento'}.pdf`);
  };

  const exportToExcel = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const workbook = new ExcelJS.Workbook();
    
    let logoBase64 = "";
    let imgWidthExcel = 120;
    let imgHeightExcel = 40;

    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    Object.entries(groupedItens).forEach(([camarim, items]) => {
      const safeSheetName = camarim.replace(/[\\/?*[\]]/g, '').substring(0, 31);
      const worksheet = workbook.addWorksheet(safeSheetName);

      worksheet.columns = [
        { key: 'item', width: 35 },
        { key: 'quantidade', width: 15 },
        { key: 'observacao', width: 45 }
      ];

      let headerRowNumber = 1;

      if (logoBase64) {
        const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
        worksheet.getRow(1).height = 80;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = `${camarim} ${activeTab === 'evento' && evt ? `- ${evt.cidade}` : ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 40;
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = `${camarim} ${activeTab === 'evento' && evt ? `- ${evt.cidade}` : ''}`;
        worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
        worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        headerRowNumber = 2;
      }
      
      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Item', 'Quantidade', 'Observação'];
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: logoBase64 ? { argb: 'FFFFFFFF' } : { argb: 'FF000000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: logoBase64 ? { argb: 'FF0F172A' } : { argb: 'FFF1F5F9' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });

      items.forEach((p) => {
        const row = worksheet.addRow({
          item: p.item,
          quantidade: p.quantidade || '-',
          observacao: p.observacao || '-'
        });
        row.eachCell((cell) => {
          cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), activeTab === 'evento' ? `Camarins_${evt?.espetaculo}_${evt?.cidade}.xlsx` : `Camarins_Padrao.xlsx`);
  };

  const exportToPDF = async () => {
    const evt = eventos.find(e => e.id === selectedEventoId);
    const doc = new jsPDF("portrait");
    
    let logoBase64 = "";
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
    } catch (e) {
      console.warn(e);
    }

    const drawHeader = (pdfDoc: jsPDF) => {
      if (logoBase64) {
        pdfDoc.addImage(logoBase64, 'PNG', 14, 10, 35, (35 * 38) / 100);
      }
      pdfDoc.setFontSize(16);
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setTextColor(15, 23, 42);
      pdfDoc.text("Camarins", 55, 18);
      
      if (activeTab === 'evento' && evt) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.text(`Espetáculo: ${evt.espetaculo} | Evento: ${evt.cidade} - ${evt.local} (${new Date(evt.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})})`, 55, 24);
      }
    };

    Object.entries(groupedItens).forEach(([camarim, items], index) => {
      if (index > 0) {
        doc.addPage();
      }
      
      drawHeader(doc);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(camarim, 14, 38);
      
      const tableColumn = ["Item", "Quantidade", "Observação"];
      const tableRows = items.map(p => [ p.item, p.quantidade || "-", p.observacao || "-" ]);

      autoTable(doc, {
        startY: 42,
        head: [tableColumn],
        body: tableRows,
        theme: "striped",
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42] },
        margin: { top: 40 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawHeader(doc);
          }
        }
      });
    });

    doc.save(activeTab === 'evento' ? `Camarins_${evt?.espetaculo}_${evt?.cidade}.pdf` : `Camarins_Padrao.pdf`);
  };

  const concluidosCount = itensEvento.filter(p => p.concluido).length;
  const progresso = itensEvento.length > 0 ? Math.round((concluidosCount / itensEvento.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <DoorOpen className="size-8 text-primary" />
            Camarins & Catering
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os espaços, pedidos de camarim e restrições alimentares.</p>
        </div>
      </div>

      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">
        <button onClick={() => setSelectedTipo("lista")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "lista" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <DoorOpen className="size-5" /> Camarins (Itens)
        </button>
        <button onClick={() => setSelectedTipo("conferencia")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <CheckCircle2 className="size-5" /> Check-list de Montagem
        </button>
        {activeTab === 'evento' && (
          <button onClick={() => setSelectedTipo("catering")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "catering" ? "bg-amber-100 text-amber-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
            <Utensils className="size-5" /> Catering / Restrições
          </button>
        )}
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
                    {espetaculosList.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                  </select>
                )}
              </div>
              
              {/* Botões de Ação Dinâmicos por Tipo */}
              <div className="shrink-0 flex gap-2">
                {((activeTab === 'evento' && selectedEventoId) || (activeTab === 'configuracao' && selectedEspetaculoPadrao)) && (
                  <>
                    {selectedTipo === 'lista' && (
                      <>
                        <Button onClick={() => setNovoCamarimModalOpen(true)} className="gap-2 bg-primary"><Plus className="size-4" /> Novo Camarim</Button>
                        <Button onClick={exportPlacasPDF} variant="secondary" className="gap-2 bg-amber-100 text-amber-800 hover:bg-amber-200"><Star className="size-4" /> Placas (PDF)</Button>
                        <Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                        <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>
                        {activeTab === 'evento' && selectedEventoId && (
                          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                            <DialogTrigger asChild><Button disabled={loading} variant="outline" className="gap-2"><Download className="size-4" /> Importar Padrão</Button></DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Importar Camarins</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Qual Show deseja importar?</Label>
                                  <select value={selectedShowImport} onChange={e => setSelectedShowImport(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Selecione...</option>
                                    {espetaculosList.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                                  </select>
                                </div>
                                <Button onClick={handleImportarPadrao} disabled={loading || !selectedShowImport} className="w-full">Confirmar Importação</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </>
                    )}
                    {selectedTipo === 'catering' && activeTab === 'evento' && selectedEventoId && (
                      <>
                        <Button onClick={exportCateringPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF Catering</Button>
                        <Button onClick={exportCateringExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel Catering</Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {((activeTab === 'evento' && !selectedEventoId) || (activeTab === 'configuracao' && !selectedEspetaculoPadrao)) ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                <DoorOpen className="size-12 mb-4 opacity-50" />
                <p>Selecione um {activeTab === 'evento' ? 'evento' : 'show'} acima para gerenciar.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* TAB: LISTA DE CAMARINS E ITENS */}
                {selectedTipo === 'lista' && (
                  <div className="flex flex-col gap-8">
                    {Object.keys(groupedItens).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 border-2 border-dashed rounded-xl flex flex-col items-center justify-center">
                        <DoorOpen className="size-10 mb-4 opacity-30" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Nenhum Camarim</h3>
                        <p className="mb-4">Comece criando um novo camarim para adicionar os itens.</p>
                        <Button onClick={() => setNovoCamarimModalOpen(true)} className="gap-2"><Plus className="size-4" /> Criar Primeiro Camarim</Button>
                      </div>
                    ) : (
                      Object.entries(groupedItens).map(([camarim, items]) => (
                        <div key={camarim} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                          {/* Header do Camarim */}
                          <div className="bg-white dark:bg-slate-800 border-b p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary"><DoorOpen className="size-5" /></div>
                                {camarim}
                              </h3>
                              {ocupantes.find(o => o.camarim_nome === camarim)?.ocupantes && (
                                <p className="text-sm text-slate-500 italic ml-12 flex items-center gap-1"><Star className="size-3 text-amber-500" /> {ocupantes.find(o => o.camarim_nome === camarim)?.ocupantes}</p>
                              )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button variant="ghost" className="text-amber-600 hover:bg-amber-50 shrink-0 gap-2" onClick={() => openPlacaModal(camarim)} title="Editar Placa de Porta">
                                <Star className="size-4" /> <span className="hidden sm:inline">Placa</span>
                              </Button>
                              <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0" onClick={() => handleDeleteCamarim(camarim)} title="Excluir Camarim">
                                <Trash2 className="size-4" />
                              </Button>
                              <Button onClick={() => openAddItemModal(camarim)} className="w-full sm:w-auto gap-2" variant="outline">
                                <Plus className="size-4" /> Adicionar Item
                              </Button>
                            </div>
                          </div>
                          
                          {/* Itens do Camarim */}
                          <div className="p-4">
                            {items.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-sm italic border border-dashed rounded-lg">Camarim vazio. Adicione os itens necessários.</div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item) => (
                                  <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-slate-200 bg-white shadow-sm relative group overflow-hidden items-center">
                                    {item.arquivo_url ? (
                                      <Dialog>
                                        <DialogTrigger asChild><div className="cursor-pointer shrink-0 border rounded-lg overflow-hidden w-16 h-16 hover:opacity-80 transition-opacity"><img src={item.arquivo_url} className="w-full h-full object-cover" /></div></DialogTrigger>
                                        <DialogContent className="max-w-2xl p-2"><img src={item.arquivo_url} className="w-full rounded-lg" /></DialogContent>
                                      </Dialog>
                                    ) : (
                                      <div className="shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300"><Coffee className="size-6" /></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-slate-800 text-sm truncate">{item.item}</h4>
                                      {item.quantidade && <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">Qtd: {item.quantidade}</span>}
                                      {item.observacao && <p className="text-xs text-slate-500 italic mt-1 truncate">{item.observacao}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(item)}><Edit2 className="size-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id, activeTab === 'evento' ? "camarins_eventos" : "camarins_padrao")}><Trash2 className="size-3" /></Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: CATERING (Apenas Evento) */}
                {selectedTipo === 'catering' && activeTab === 'evento' && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                      <div className="bg-amber-100 p-3 rounded-full text-amber-600 mt-1"><Utensils className="size-6" /></div>
                      <div>
                        <h3 className="text-xl font-bold text-amber-900 dark:text-amber-500">Relatório de Catering</h3>
                        <p className="text-amber-700/80 mt-1 max-w-2xl text-sm">Lista de restrições alimentares da equipe escalada para este evento. As informações são puxadas diretamente do perfil de cada usuário.</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                          <tr>
                            <th className="px-6 py-4">Integrante</th>
                            <th className="px-6 py-4">Função</th>
                            <th className="px-6 py-4">Restrição Alimentar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {equipePerfis.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Nenhum membro escalado para este evento ou erro ao carregar.</td></tr>
                          ) : (
                            equipePerfis.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-bold text-slate-800">{p.nome}</td>
                                <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase font-medium">{p.role}</span></td>
                                <td className="px-6 py-4">
                                  {p.restricao_alimentar ? (
                                    <span className="text-amber-700 font-medium flex items-center gap-2"><AlertCircle className="size-4" /> {p.restricao_alimentar}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Nenhuma registrada</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB: CONFERÊNCIA */}
                {selectedTipo === 'conferencia' && (
                  activeTab === 'configuracao' ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50">
                      <CheckCircle2 className="size-12 mb-4 opacity-30 mx-auto text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Modo de Visualização (Padrão)</h3>
                      <p className="text-slate-500 max-w-md mx-auto">O check list da montagem dos camarins é feito apenas na aba <strong>"Evento Atual"</strong>.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 rounded-xl p-4">
                        <div><h4 className="font-bold">Conferência de Camarins</h4><p className="text-sm">{concluidosCount} de {itensEvento.length} itens finalizados</p></div>
                        <span className={`text-3xl font-black ${progresso === 100 ? 'text-emerald-500' : 'text-primary'}`}>{progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6"><div className={`h-full ${progresso === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progresso}%` }}></div></div>
                      
                      <div className="space-y-6">
                        {Object.entries(groupedItens).filter(([_, items]) => items.length > 0).map(([camarim, items]) => (
                          <div key={camarim} className="bg-white border rounded-xl p-4 shadow-sm">
                            <h4 className="font-bold text-slate-700 border-b pb-2 mb-3 flex items-center gap-2"><DoorOpen className="size-4" /> {camarim}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {items.map((item) => {
                                const fig = item as CamarimEvento;
                                return (
                                  <div key={fig.id} onClick={() => toggleConcluido(fig.id, fig.concluido)} className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${fig.concluido ? 'border-emerald-500/20 bg-emerald-50 opacity-80' : 'border-slate-200 bg-white hover:border-primary/30'}`}>
                                    <button className="flex-shrink-0 mt-0.5">{fig.concluido ? <CheckCircle2 className="size-5 text-emerald-500" /> : <Circle className="size-5 text-slate-300" />}</button>
                                    <div>
                                      <h5 className={`font-semibold text-sm ${fig.concluido ? 'line-through text-slate-500' : 'text-slate-800'}`}>{fig.item}</h5>
                                      {(fig.quantidade || fig.observacao) && <p className="text-xs text-slate-500">{fig.quantidade && `${fig.quantidade} |`} {fig.observacao}</p>}
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

      {/* MODAL: NOVO CAMARIM */}
      <Dialog open={novoCamarimModalOpen} onOpenChange={setNovoCamarimModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Novo Camarim</DialogTitle></DialogHeader>
          <form onSubmit={handleCriarCamarim} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Camarim</Label>
              <Input required placeholder="Ex: Camarim da Banda, Camarim Principal" value={novoCamarimNome} onChange={e => setNovoCamarimNome(e.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full">Adicionar Camarim</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: PLACA DE PORTA */}
      <Dialog open={placaModalOpen} onOpenChange={setPlacaModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Placa de Porta: {activeCamarimParaPlaca}</DialogTitle></DialogHeader>
          <form onSubmit={handleSalvarPlaca} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomes para a Placa</Label>
              <Input placeholder="Ex: Marcelo Garuffi, Equipe Técnica" value={nomesPlaca} onChange={e => setNomesPlaca(e.target.value)} autoFocus />
              <p className="text-xs text-slate-500">Deixe em branco para limpar a placa. Os nomes aparecerão grandes no PDF impresso logo abaixo de "{activeCamarimParaPlaca}".</p>
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600">Salvar Placa</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADICIONAR ITEM */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Item em "{activeCamarimParaItem}"</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2"><Label>Item Necessário *</Label><Input required placeholder="Ex: Espelho de Corpo, Frutas" value={novoItem} onChange={e => setNovoItem(e.target.value)} autoFocus /></div>
            <div className="space-y-2"><Label>Quantidade</Label><Input placeholder="Ex: 2, 12 garrafas" value={novaQuantidade} onChange={e => setNovaQuantidade(e.target.value)} /></div>
            <div className="space-y-2"><Label>Observações</Label><Input placeholder="Ex: Água sem gás gelada" value={novaObservacao} onChange={e => setNovaObservacao(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Foto de Referência (Opcional)</Label><Input ref={fileInputRef} type="file" accept="image/*" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={uploading} className="w-full sm:w-auto px-8">{uploading ? 'Salvando...' : 'Adicionar Item'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ITEM */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Item do Camarim</DialogTitle></DialogHeader>
          <form onSubmit={handleEditItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2"><Label>Item *</Label><Input required value={novoItem} onChange={e => setNovoItem(e.target.value)} /></div>
            <div className="space-y-2"><Label>Quantidade</Label><Input value={novaQuantidade} onChange={e => setNovaQuantidade(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Observações</Label><Input value={novaObservacao} onChange={e => setNovaObservacao(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Nova Foto (Deixe em branco para manter)</Label><Input ref={fileInputRefEdit} type="file" accept="image/*" onChange={e => setNovoArquivo(e.target.files?.[0] || null)} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar Alterações'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
