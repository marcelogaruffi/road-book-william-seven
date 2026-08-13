import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Layers, Plus, Trash2, MapPin, GripVertical, UploadCloud, Eye, Download, File, CheckCircle2, Circle, FileSpreadsheet, FileText, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// Funções de exportação
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/_authenticated/palco/")({
  head: () => ({ meta: [{ title: "Montagem de Palco - Seven Produções Artísticas" }] }),
  component: PalcoPage,
});

type ArquivoPadrao = { id: string; espetaculo_nome: string; nome: string; arquivo_url: string; tipo: "mapa_palco" | "item_palco"; ordem: number; };
type ArquivoEvento = { id: string; evento_id: string; nome: string; arquivo_url: string; tipo: "mapa_palco" | "item_palco"; ordem: number; };

type PropBase = {
  item: string;
  ato: string | null;
  cena: string | null;
  preset_location: string | null;
  descricao: string | null;
  personagem: string | null;
  termino_uso: string | null;
  arquivo_url: string | null;
  ordem: number;
};
type PropPadrao = PropBase & { id: string; espetaculo_nome: string; };
type PropEvento = PropBase & { id: string; evento_id: string; concluido: boolean; };
type Evento = { 
  id: string; 
  cidade: string; 
  local: string; 
  data: string; 
  espetaculo: string; 
  boca_cena?: string;
  profundidade?: string;
  pe_direito?: string;
  energia?: string;
  rider_luz_local?: string;
  rider_som_local?: string;
  rider_video_local?: string;
};

function PalcoPage() {
  const [activeTab, setActiveTab] = useState("evento");
  const [selectedTipo, setSelectedTipo] = useState<"mapa_palco" | "props" | "conferencia" | "infra">("mapa_palco");
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  
  const [arquivosPadrao, setArquivosPadrao] = useState<ArquivoPadrao[]>([]);
  const [arquivosEvento, setArquivosEvento] = useState<ArquivoEvento[]>([]);
  
  const [propsPadrao, setPropsPadrao] = useState<PropPadrao[]>([]);
  const [propsEvento, setPropsEvento] = useState<PropEvento[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Evento
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [selectedShowImport, setSelectedShowImport] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // States for Padrão
  const [selectedEspetaculoPadrao, setSelectedEspetaculoPadrao] = useState("");

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
  const [editingProp, setEditingProp] = useState<PropPadrao | PropEvento | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRefEditProp = useRef<HTMLInputElement>(null);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  useEffect(() => {
    if (selectedEventoId) {
      fetchArquivosEvento(selectedEventoId);
      fetchPropsEvento(selectedEventoId);
      const evt = eventos.find(e => e.id === selectedEventoId);
      if (evt) setSelectedShowImport(evt.espetaculo);
    } else {
      setArquivosEvento([]);
      setPropsEvento([]);
      setSelectedShowImport("");
    }
  }, [selectedEventoId]);

  useEffect(() => {
    if (selectedEspetaculoPadrao) {
      fetchArquivosPadrao(selectedEspetaculoPadrao);
      fetchPropsPadrao(selectedEspetaculoPadrao);
    } else {
      setArquivosPadrao([]);
      setPropsPadrao([]);
    }
  }, [selectedEspetaculoPadrao]);

  // useEffect(() => {
  //   if (activeTab === 'configuracao' && selectedTipo === 'conferencia') {
  //     setSelectedTipo('props'); 
  //   }
  // }, [activeTab]);

  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      const [evtRes, espRes] = await Promise.all([
        supabase.from("eventos").select("*").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo", { ascending: true })
      ]);
      if (evtRes.data) setEventos(evtRes.data);
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

  async function fetchArquivosEvento(eventoId: string) {
    const { data } = await supabase.from("arquivos_eventos").select("*").eq("evento_id", eventoId).eq("tipo", "mapa_palco").order("ordem", { ascending: true });
    setArquivosEvento(data as ArquivoEvento[] || []);
  }

  async function fetchArquivosPadrao(espetaculo: string) {
    const { data } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", espetaculo).eq("tipo", "mapa_palco").order("ordem", { ascending: true });
    setArquivosPadrao(data as ArquivoPadrao[] || []);
  }

  async function fetchPropsEvento(eventoId: string) {
    const { data } = await supabase.from("props_eventos").select("*").eq("evento_id", eventoId).order("ordem", { ascending: true });
    setPropsEvento(data as PropEvento[] || []);
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
    if (activeTab === "evento" && !selectedEventoId) return toast.error("Selecione um evento");
    if (activeTab === "configuracao" && !selectedEspetaculoPadrao) return toast.error("Selecione um espetáculo");
    if (!novoNomeMapa.trim() || !novoArquivoMapa) return toast.error("Nome e arquivo obrigatórios");

    setUploading(true);
    try {
      const publicUrl = await handleFileUpload(novoArquivoMapa, "mapa_palco");
      if (activeTab === "configuracao") {
        const novaOrdem = arquivosPadrao.length;
        const { data, error } = await supabase.from("arquivos_padrao").insert({
          espetaculo_nome: selectedEspetaculoPadrao, nome: novoNomeMapa, arquivo_url: publicUrl, tipo: "mapa_palco", ordem: novaOrdem
        }).select().single();
        if (error) throw error;
        setArquivosPadrao([...arquivosPadrao, data as ArquivoPadrao]);
      } else {
        const novaOrdem = arquivosEvento.length;
        const { data, error } = await supabase.from("arquivos_eventos").insert({
          evento_id: selectedEventoId, nome: novoNomeMapa, arquivo_url: publicUrl, tipo: "mapa_palco", ordem: novaOrdem
        }).select().single();
        if (error) throw error;
        setArquivosEvento([...arquivosEvento, data as ArquivoEvento]);
      }
      setNovoNomeMapa("");
      setNovoArquivoMapa(null);
      if (fileInputRefMapa.current) fileInputRefMapa.current.value = "";
      toast.success("Mapa adicionado");
    } catch (error) {
      toast.error("Erro ao salvar mapa");
    } finally {
      setUploading(false);
    }
  }

  async function handleAddProp(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab === "evento" && !selectedEventoId) return toast.error("Selecione um evento");
    if (activeTab === "configuracao" && !selectedEspetaculoPadrao) return toast.error("Selecione um espetáculo");
    if (!novoPropItem.trim()) return toast.error("Item obrigatório");

    setUploading(true);
    try {
      let publicUrl = null;
      if (novoPropArquivo) publicUrl = await handleFileUpload(novoPropArquivo, "item_palco");

      const propData = {
        item: novoPropItem, ato: novoPropAto || null, cena: novoPropCena || null, preset_location: novoPropPreset || null,
        descricao: novoPropDescricao || null, personagem: novoPropPersonagem || null, termino_uso: novoPropTermino || null, arquivo_url: publicUrl
      };

      if (activeTab === "configuracao") {
        const { data, error } = await supabase.from("props_padrao").insert({ ...propData, espetaculo_nome: selectedEspetaculoPadrao, ordem: propsPadrao.length }).select().single();
        if (error) throw error;
        setPropsPadrao([...propsPadrao, data as PropPadrao]);
      } else {
        const { data, error } = await supabase.from("props_eventos").insert({ ...propData, evento_id: selectedEventoId, ordem: propsEvento.length, concluido: false }).select().single();
        if (error) throw error;
        setPropsEvento([...propsEvento, data as PropEvento]);
      }
      setNovoPropItem(""); setNovoPropAto(""); setNovoPropCena(""); setNovoPropPreset(""); setNovoPropDescricao(""); setNovoPropPersonagem(""); setNovoPropTermino(""); setNovoPropArquivo(null);
      if (fileInputRefProp.current) fileInputRefProp.current.value = "";
      toast.success("Prop adicionado");
    } catch (error) {
      toast.error("Erro ao salvar");
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
      if (fileInputRefEditProp.current?.files?.[0]) {
        publicUrl = await handleFileUpload(fileInputRefEditProp.current.files[0], "item_palco");
      }
      
      const propData = {
        item: novoPropItem, ato: novoPropAto || null, cena: novoPropCena || null, preset_location: novoPropPreset || null,
        descricao: novoPropDescricao || null, personagem: novoPropPersonagem || null, termino_uso: novoPropTermino || null, arquivo_url: publicUrl
      };

      if (activeTab === "configuracao") {
        await supabase.from("props_padrao").update(propData).eq("id", editingProp.id);
        setPropsPadrao(propsPadrao.map(p => p.id === editingProp.id ? { ...p, ...propData } : p));
      } else {
        await supabase.from("props_eventos").update(propData).eq("id", editingProp.id);
        setPropsEvento(propsEvento.map(p => p.id === editingProp.id ? { ...p, ...propData } : p));
      }
      setEditDialogOpen(false);
      setEditingProp(null);
      toast.success("Prop atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar prop");
    } finally {
      setUploading(false);
    }
  }

  const updateInfra = async (field: keyof Evento, value: string) => {
    if (!selectedEventoId) return;
    setEventos(eventos.map(e => e.id === selectedEventoId ? { ...e, [field]: value } : e));
    await supabase.from("eventos").update({ [field]: value }).eq("id", selectedEventoId);
  };

  const uploadRiderLocal = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'rider_luz_local' | 'rider_som_local') => {
    if (!e.target.files || e.target.files.length === 0 || !selectedEventoId) return;
    setUploading(true);
    try {
      const publicUrl = await handleFileUpload(e.target.files[0], "riders_locais");
      await updateInfra(tipo, publicUrl);
      toast.success("Rider anexado com sucesso");
    } catch (error) {
      toast.error("Erro ao anexar rider");
    } finally {
      setUploading(false);
    }
  };

  function openEditModal(prop: PropPadrao | PropEvento) {
    setEditingProp(prop);
    setNovoPropItem(prop.item);
    setNovoPropAto(prop.ato || "");
    setNovoPropCena(prop.cena || "");
    setNovoPropPreset(prop.preset_location || "");
    setNovoPropDescricao(prop.descricao || "");
    setNovoPropPersonagem(prop.personagem || "");
    setNovoPropTermino(prop.termino_uso || "");
    setNovoPropArquivo(null);
    setEditDialogOpen(true);
  }

  async function handleImportarPadrao() {
    if (!selectedEventoId || !selectedShowImport) return;
    setLoading(true);
    try {
      const { data: mPadrao } = await supabase.from("arquivos_padrao").select("*").eq("espetaculo_nome", selectedShowImport).eq("tipo", "mapa_palco");
      const mapasParaInserir = (mPadrao || []).filter(mp => !arquivosEvento.some(me => me.arquivo_url === mp.arquivo_url)).map(item => ({ evento_id: selectedEventoId, nome: item.nome, arquivo_url: item.arquivo_url, tipo: item.tipo, ordem: item.ordem }));
      if (mapasParaInserir.length > 0) {
        const { data } = await supabase.from("arquivos_eventos").insert(mapasParaInserir).select();
        setArquivosEvento([...arquivosEvento, ...(data as ArquivoEvento[])]);
      }

      const { data: pPadrao } = await supabase.from("props_padrao").select("*").eq("espetaculo_nome", selectedShowImport);
      const propsParaInserir = (pPadrao || []).filter(pp => !propsEvento.some(pe => pe.item === pp.item)).map(item => ({ evento_id: selectedEventoId, item: item.item, ato: item.ato, cena: item.cena, preset_location: item.preset_location, descricao: item.descricao, personagem: item.personagem, termino_uso: item.termino_uso, arquivo_url: item.arquivo_url, ordem: item.ordem, concluido: false }));
      if (propsParaInserir.length > 0) {
        const { data } = await supabase.from("props_eventos").insert(propsParaInserir).select();
        setPropsEvento([...propsEvento, ...(data as PropEvento[])]);
      }
      toast.success("Importação concluída");
      setImportDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao importar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, table: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (!error) {
      if (table === "arquivos_padrao") setArquivosPadrao(arquivosPadrao.filter(a => a.id !== id));
      if (table === "arquivos_eventos") setArquivosEvento(arquivosEvento.filter(a => a.id !== id));
      if (table === "props_padrao") setPropsPadrao(propsPadrao.filter(p => p.id !== id));
      if (table === "props_eventos") setPropsEvento(propsEvento.filter(p => p.id !== id));
      toast.success("Excluído");
    }
  }

  async function togglePropConcluido(id: string, atual: boolean) {
    await supabase.from("props_eventos").update({ concluido: !atual }).eq("id", id);
    setPropsEvento(propsEvento.map(p => p.id === id ? { ...p, concluido: !atual } : p));
  }

  async function handleSortMapaPadrao() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    let _itens = [...arquivosPadrao];
    const draggedItem = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null; dragOverItem.current = null;
    _itens = _itens.map((item, index) => ({ ...item, ordem: index }));
    setArquivosPadrao(_itens);
    await supabase.from('arquivos_padrao').upsert(_itens.map(i => ({ id: i.id, espetaculo_nome: i.espetaculo_nome, nome: i.nome, arquivo_url: i.arquivo_url, tipo: i.tipo, ordem: i.ordem })));
  }

  async function handleSortMapaEvento() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    let _itens = [...arquivosEvento];
    const draggedItem = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null; dragOverItem.current = null;
    _itens = _itens.map((item, index) => ({ ...item, ordem: index }));
    setArquivosEvento(_itens);
    await supabase.from('arquivos_eventos').upsert(_itens.map(i => ({ id: i.id, evento_id: i.evento_id, nome: i.nome, arquivo_url: i.arquivo_url, tipo: i.tipo, ordem: i.ordem })));
  }

  async function handleSortPropPadrao() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    let _itens = [...propsPadrao];
    const draggedItem = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null; dragOverItem.current = null;
    _itens = _itens.map((item, index) => ({ ...item, ordem: index }));
    setPropsPadrao(_itens);
    await supabase.from('props_padrao').upsert(_itens.map(i => ({ ...i })));
  }

  async function handleSortPropEvento() {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    let _itens = [...propsEvento];
    const draggedItem = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItem);
    dragItem.current = null; dragOverItem.current = null;
    _itens = _itens.map((item, index) => ({ ...item, ordem: index }));
    setPropsEvento(_itens);
    await supabase.from('props_eventos').upsert(_itens.map(({concluido, ...rest}) => rest));
  }

  const exportToExcel = async () => {
    const list = activeTab === 'evento' ? propsEvento : propsPadrao;
    const evt = eventos.find(e => e.id === selectedEventoId);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista de Props');

    worksheet.columns = [
      { key: 'ordem', width: 8 },
      { key: 'item', width: 25 },
      { key: 'ato', width: 10 },
      { key: 'cena', width: 15 },
      { key: 'preset', width: 25 },
      { key: 'personagem', width: 20 },
      { key: 'descricao', width: 45 },
      { key: 'termino', width: 20 }
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
      
      worksheet.mergeCells('D1:H1');
      worksheet.getCell('D1').value = activeTab === 'evento' && evt ? `Lista de Props - ${evt.cidade} - ${evt.local}` : "Lista de Props - Padrão";
      worksheet.getCell('D1').font = { size: 18, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      headerRowNumber = 3;
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ['Ordem', 'Item', 'Ato', 'Cena', 'Pre Set Location', 'Personagem', 'Descrição', 'Término de Uso'];
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    list.forEach((p, idx) => {
      const row = worksheet.addRow({
        ordem: idx + 1,
        item: p.item,
        ato: p.ato || '-',
        cena: p.cena || '-',
        preset: p.preset_location || '-',
        personagem: p.personagem || '-',
        descricao: p.descricao || '-',
        termino: p.termino_uso || '-'
      });
      
      row.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), activeTab === 'evento' ? `Lista_Props_${evt?.espetaculo}_${evt?.cidade}.xlsx` : `Lista_Props_Padrao.xlsx`);
  };

  const exportToPDF = async () => {
    const list = activeTab === 'evento' ? propsEvento : propsPadrao;
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
      doc.text("Lista de Props", pageWidth / 2, 10 + imgHeight + 10, { align: 'center' });
      
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
      doc.text("Lista de Props", 14, 20);
      doc.setFontSize(12);
      if (activeTab === 'evento' && evt) {
        doc.text(`Espetáculo: ${evt.espetaculo} | Evento: ${evt.cidade} - ${evt.local}`, 14, 28);
      }
      startY = 35;
    }

    const tableColumn = ["#", "Item", "Ato", "Cena", "Preset Location", "Personagem", "Descrição", "Término"];
    const tableRows = list.map((p, i) => [
      i + 1, p.item, p.ato || "-", p.cena || "-", p.preset_location || "-", p.personagem || "-", p.descricao || "-", p.termino_uso || "-"
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

    doc.save(activeTab === 'evento' ? `Lista_Props_${evt?.espetaculo}_${evt?.cidade}.pdf` : `Lista_Props_Padrao.pdf`);
  };

  const concluidosCount = propsEvento.filter(p => p.concluido).length;
  const progresso = propsEvento.length > 0 ? Math.round((concluidosCount / propsEvento.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Map className="size-8 text-primary" />
            Montagem de Palco
          </h1>
          <p className="text-slate-500 mt-1">Gerencie mapas de palco e a lista completa de props.</p>
        </div>
      </div>

      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar w-fit">
        <button onClick={() => setSelectedTipo("mapa_palco")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "mapa_palco" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <Map className="size-5" /> Mapas de Palco
        </button>
        <button onClick={() => setSelectedTipo("props")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "props" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <Layers className="size-5" /> Lista de Props
        </button>
        <button onClick={() => setSelectedTipo("conferencia")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "conferencia" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <CheckCircle2 className="size-5" /> Conferência (Props)
        </button>
        <button onClick={() => setSelectedTipo("infra")} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 transition-all font-semibold text-sm ${selectedTipo === "infra" ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md" : "text-slate-600 hover:text-slate-900"}`}>
          <MapPin className="size-5" /> Infraestrutura do Local
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="evento" className="flex items-center gap-2"><MapPin className="size-4" /> Evento Atual</TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2"><File className="size-4" /> Configuração Padrão</TabsTrigger>
        </TabsList>

        {/* ================= EVENTO ================= */}
        <TabsContent value="evento" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Selecione o Evento</Label>
                  <select value={selectedEventoId} onChange={e => setSelectedEventoId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-primary/50">
                    <option value="">Selecione um evento...</option>
                    {eventos.map(evt => <option key={evt.id} value={evt.id}>{evt.cidade} - {evt.local} ({new Date(evt.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})</option>)}
                  </select>
                </div>
                {(selectedTipo === 'mapa_palco' || selectedTipo === 'props') && (
                  <div className="shrink-0 flex gap-2">
                    {selectedTipo === 'props' && selectedEventoId && (
                      <>
                        <Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                        <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>
                      </>
                    )}
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger asChild><Button disabled={loading || !selectedEventoId} variant="outline" className="gap-2"><Download className="size-4" /> Importar Padrão</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Importar Padrão</DialogTitle></DialogHeader>
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
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedEventoId ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center"><MapPin className="size-12 mb-4 opacity-50" /><p>Selecione um evento acima para gerenciar os mapas e props.</p></div>
              ) : (
                <div className="space-y-6">
                  {selectedTipo === 'infra' && (
                    <div className="w-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                      <div className="flex flex-col mb-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                          <MapPin className="size-5 text-amber-500" /> Infraestrutura do Local (Dimensões e Riders)
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Estas informações são compartilhadas com Iluminação e Som para este evento.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Boca de Cena (m)</Label>
                          <Input 
                            value={eventos.find(e => e.id === selectedEventoId)?.boca_cena || ''} 
                            onChange={e => updateInfra('boca_cena', e.target.value)} 
                            placeholder="Ex: 12m" 
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Profundidade (m)</Label>
                          <Input 
                            value={eventos.find(e => e.id === selectedEventoId)?.profundidade || ''} 
                            onChange={e => updateInfra('profundidade', e.target.value)} 
                            placeholder="Ex: 10m" 
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pé-direito (m)</Label>
                          <Input 
                            value={eventos.find(e => e.id === selectedEventoId)?.pe_direito || ''} 
                            onChange={e => updateInfra('pe_direito', e.target.value)} 
                            placeholder="Ex: 8m" 
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Energia / Voltagem</Label>
                          <Input 
                            value={eventos.find(e => e.id === selectedEventoId)?.energia || ''} 
                            onChange={e => updateInfra('energia', e.target.value)} 
                            placeholder="Ex: 220V Trifásico" 
                            className="bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-3">
                          <Label className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <File className="size-4 text-blue-500" /> Rider de Luz do Local
                          </Label>
                          {eventos.find(e => e.id === selectedEventoId)?.rider_luz_local ? (
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-lg">
                              <span className="text-sm font-medium text-emerald-600 flex items-center gap-2"><CheckCircle2 className="size-4" /> Anexado</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild><a href={eventos.find(e => e.id === selectedEventoId)?.rider_luz_local} target="_blank" rel="noreferrer">Ver</a></Button>
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateInfra('rider_luz_local', '')}><Trash2 className="size-4" /></Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input type="file" onChange={(e) => uploadRiderLocal(e, 'rider_luz_local')} className="cursor-pointer" accept=".pdf,image/*" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <File className="size-4 text-purple-500" /> Rider de Som do Local
                          </Label>
                          {eventos.find(e => e.id === selectedEventoId)?.rider_som_local ? (
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-lg">
                              <span className="text-sm font-medium text-emerald-600 flex items-center gap-2"><CheckCircle2 className="size-4" /> Anexado</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild><a href={eventos.find(e => e.id === selectedEventoId)?.rider_som_local} target="_blank" rel="noreferrer">Ver</a></Button>
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateInfra('rider_som_local', '')}><Trash2 className="size-4" /></Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input type="file" onChange={(e) => uploadRiderLocal(e, 'rider_som_local')} className="cursor-pointer" accept=".pdf,image/*" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <File className="size-4 text-emerald-500" /> Rider de Vídeo do Local
                          </Label>
                          {eventos.find(e => e.id === selectedEventoId)?.rider_video_local ? (
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-lg">
                              <span className="text-sm font-medium text-emerald-600 flex items-center gap-2"><CheckCircle2 className="size-4" /> Anexado</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild><a href={eventos.find(e => e.id === selectedEventoId)?.rider_video_local} target="_blank" rel="noreferrer">Ver</a></Button>
                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => updateInfra('rider_video_local', '')}><Trash2 className="size-4" /></Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input type="file" onChange={(e) => uploadRiderLocal(e, 'rider_video_local')} className="cursor-pointer" accept=".pdf,image/*" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTipo === 'mapa_palco' && (
                    <>
                      <form onSubmit={handleAddMapa} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200">
                        <div className="flex-1 space-y-2"><Label>Nome do Mapa</Label><Input required placeholder="Ex: Mapa Palco Oficial" value={novoNomeMapa} onChange={e => setNovoNomeMapa(e.target.value)} /></div>
                        <div className="flex-1 space-y-2"><Label>Arquivo (PDF/Img)</Label><Input ref={fileInputRefMapa} required type="file" accept="application/pdf,image/*" onChange={e => setNovoArquivoMapa(e.target.files?.[0] || null)} /></div>
                        <Button type="submit" disabled={uploading} className="gap-2 shrink-0">{uploading ? 'Enviando...' : 'Adicionar'}</Button>
                      </form>
                      <div className="flex flex-col gap-3">
                        {arquivosEvento.map((arquivo, index) => (
                          <div key={arquivo.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSortMapaEvento} onDragOver={(e) => e.preventDefault()} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm cursor-move">
                            <GripVertical className="size-5 text-slate-400 shrink-0" /><span className="font-mono text-sm font-bold text-slate-500">{index + 1}.</span>
                            <div className="flex-1 font-semibold">{arquivo.nome}</div>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild><Button variant="secondary" size="sm" className="gap-2 h-9"><Eye className="size-4" /> Visualizar</Button></DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-2"><DialogHeader className="px-4 py-2"><DialogTitle>{arquivo.nome}</DialogTitle></DialogHeader><div className="flex-1 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">{arquivo.arquivo_url.toLowerCase().endsWith('.pdf') ? <iframe src={arquivo.arquivo_url} className="w-full h-full border-0" /> : <img src={arquivo.arquivo_url} className="max-w-full max-h-full object-contain" />}</div></DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(arquivo.id, "arquivos_eventos")} className="text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedTipo === 'props' && (
                    <>
                      <form onSubmit={handleAddProp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200">
                        <div className="space-y-2 lg:col-span-2"><Label>Item (Prop) *</Label><Input required value={novoPropItem} onChange={e => setNovoPropItem(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Ato</Label><Input value={novoPropAto} onChange={e => setNovoPropAto(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Cena</Label><Input value={novoPropCena} onChange={e => setNovoPropCena(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Pre Set Location</Label><Input value={novoPropPreset} onChange={e => setNovoPropPreset(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Personagem que utiliza</Label><Input value={novoPropPersonagem} onChange={e => setNovoPropPersonagem(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Término de Uso</Label><Input value={novoPropTermino} onChange={e => setNovoPropTermino(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Descrição / Notas</Label><Input value={novoPropDescricao} onChange={e => setNovoPropDescricao(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-3"><Label>Anexo (Opcional - Foto do Prop)</Label><Input ref={fileInputRefProp} type="file" accept="image/*" onChange={e => setNovoPropArquivo(e.target.files?.[0] || null)} /></div>
                        <div className="flex items-end lg:col-span-1"><Button type="submit" disabled={uploading} className="w-full gap-2">{uploading ? 'Salvando...' : 'Adicionar Prop'}</Button></div>
                      </form>

                      <div className="flex flex-col gap-3">
                        {propsEvento.map((prop, index) => (
                          <div key={prop.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSortPropEvento} onDragOver={(e) => e.preventDefault()} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-200 bg-white shadow-sm cursor-move">
                            <div className="flex items-center gap-4">
                              <GripVertical className="size-5 text-slate-400 shrink-0" /><span className="font-mono text-sm font-bold text-slate-500">{index + 1}.</span>
                              <div className="flex-1 font-bold text-slate-800 text-lg">{prop.item}</div>
                              <div className="flex items-center gap-2">
                                {prop.arquivo_url && (
                                  <Dialog>
                                    <DialogTrigger asChild><Button variant="secondary" size="sm" className="gap-2 h-9"><Eye className="size-4" /> Foto</Button></DialogTrigger>
                                    <DialogContent className="max-w-2xl p-2"><img src={prop.arquivo_url} alt={prop.item} className="w-full rounded-lg" /></DialogContent>
                                  </Dialog>
                                )}
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditModal(prop)}><Edit2 className="size-4" /> Editar</Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(prop.id, "props_eventos")} className="text-red-500"><Trash2 className="size-4" /></Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 ml-14 text-sm text-slate-600">
                              {prop.ato && <div><span className="font-semibold block text-xs uppercase opacity-70">Ato</span>{prop.ato}</div>}
                              {prop.cena && <div><span className="font-semibold block text-xs uppercase opacity-70">Cena</span>{prop.cena}</div>}
                              {prop.preset_location && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Pre Set</span>{prop.preset_location}</div>}
                              {prop.personagem && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Personagem</span>{prop.personagem}</div>}
                              {prop.termino_uso && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Término de Uso</span>{prop.termino_uso}</div>}
                              {prop.descricao && <div className="col-span-4"><span className="font-semibold block text-xs uppercase opacity-70">Descrição</span>{prop.descricao}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedTipo === 'conferencia' && (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100 rounded-xl p-4">
                        <div><h4 className="font-bold">Progresso da Montagem (Props)</h4><p className="text-sm">{concluidosCount} de {propsEvento.length} itens no lugar</p></div>
                        <span className={`text-3xl font-black ${progresso === 100 ? 'text-emerald-500' : 'text-primary'}`}>{progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6"><div className={`h-full ${progresso === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progresso}%` }}></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {propsEvento.map((prop, index) => (
                          <div key={prop.id} onClick={() => togglePropConcluido(prop.id, prop.concluido)} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer ${prop.concluido ? 'border-emerald-500/20 bg-emerald-50 opacity-70' : 'border-slate-200 bg-white hover:border-primary/50'}`}>
                            <button className="flex-shrink-0 mt-1">{prop.concluido ? <CheckCircle2 className="size-6 text-emerald-500" /> : <Circle className="size-6 text-slate-300" />}</button>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${prop.concluido ? 'line-through text-slate-500' : ''}`}>{index + 1}. {prop.item}</h4>
                              {prop.preset_location && <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="size-3" /> {prop.preset_location}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= PADRÃO ================= */}
        <TabsContent value="configuracao" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div><CardTitle>Configuração Padrão</CardTitle></div>
                <div className="shrink-0 flex gap-2 w-full sm:w-auto">
                  {selectedTipo === 'props' && selectedEspetaculoPadrao && (
                    <>
                      <Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                      <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>
                    </>
                  )}
                  <select value={selectedEspetaculoPadrao} onChange={e => setSelectedEspetaculoPadrao(e.target.value)} className="flex h-10 w-full sm:w-64 rounded-md border px-3">
                    <option value="">Selecione um show...</option>
                    {espetaculosList.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedEspetaculoPadrao ? (
                <div className="text-center py-12 text-slate-400"><File className="size-12 mb-4 opacity-50 mx-auto" /><p>Selecione um Tipo de Show acima.</p></div>
              ) : (
                <>
                  {selectedTipo === 'mapa_palco' && (
                    <>
                      <form onSubmit={handleAddMapa} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-100 p-4 rounded-xl">
                        <div className="flex-1 space-y-2"><Label>Nome do Mapa Padrão</Label><Input required value={novoNomeMapa} onChange={e => setNovoNomeMapa(e.target.value)} /></div>
                        <div className="flex-1 space-y-2"><Label>Arquivo (PDF/Img)</Label><Input ref={fileInputRefMapa} required type="file" onChange={e => setNovoArquivoMapa(e.target.files?.[0] || null)} /></div>
                        <Button type="submit" disabled={uploading}>{uploading ? 'Enviando...' : 'Adicionar'}</Button>
                      </form>
                      <div className="flex flex-col gap-3 mt-6">
                        {arquivosPadrao.map((arquivo, index) => (
                          <div key={arquivo.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSortMapaPadrao} className="flex items-center gap-4 p-4 rounded-xl border bg-slate-50 cursor-move">
                            <GripVertical className="size-5 text-slate-400 shrink-0" /><span className="font-mono text-sm font-bold">{index + 1}.</span>
                            <div className="flex-1 font-semibold">{arquivo.nome}</div>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Eye className="size-4" /> Visualizar</Button></DialogTrigger>
                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-2"><iframe src={arquivo.arquivo_url} className="w-full h-full border-0" /></DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(arquivo.id, "arquivos_padrao")} className="text-red-500"><Trash2 className="size-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedTipo === 'props' && (
                    <>
                      <form onSubmit={handleAddProp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-100 p-4 rounded-xl border">
                        <div className="space-y-2 lg:col-span-2"><Label>Item (Prop) *</Label><Input required value={novoPropItem} onChange={e => setNovoPropItem(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Ato</Label><Input value={novoPropAto} onChange={e => setNovoPropAto(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Cena</Label><Input value={novoPropCena} onChange={e => setNovoPropCena(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Pre Set Location</Label><Input value={novoPropPreset} onChange={e => setNovoPropPreset(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Personagem que utiliza</Label><Input value={novoPropPersonagem} onChange={e => setNovoPropPersonagem(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Término de Uso</Label><Input value={novoPropTermino} onChange={e => setNovoPropTermino(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-2"><Label>Descrição / Notas</Label><Input value={novoPropDescricao} onChange={e => setNovoPropDescricao(e.target.value)} /></div>
                        <div className="space-y-2 lg:col-span-3"><Label>Anexo (Opcional - Foto do Prop)</Label><Input ref={fileInputRefProp} type="file" accept="image/*" onChange={e => setNovoPropArquivo(e.target.files?.[0] || null)} /></div>
                        <div className="flex items-end lg:col-span-1"><Button type="submit" disabled={uploading} className="w-full">{uploading ? 'Salvando...' : 'Adicionar ao Padrão'}</Button></div>
                      </form>

                      <div className="flex flex-col gap-3 mt-6">
                        {propsPadrao.map((prop, index) => (
                          <div key={prop.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSortPropPadrao} className="flex flex-col gap-2 p-4 rounded-xl border bg-slate-50 cursor-move">
                            <div className="flex items-center gap-4">
                              <GripVertical className="size-5 text-slate-400 shrink-0" /><span className="font-mono text-sm font-bold">{index + 1}.</span>
                              <div className="flex-1 font-bold text-lg">{prop.item}</div>
                              <div className="flex items-center gap-2">
                                {prop.arquivo_url && (
                                  <Dialog>
                                    <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2"><Eye className="size-4" /> Foto</Button></DialogTrigger>
                                    <DialogContent className="max-w-2xl p-2"><img src={prop.arquivo_url} alt={prop.item} className="w-full rounded-lg" /></DialogContent>
                                  </Dialog>
                                )}
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditModal(prop)}><Edit2 className="size-4" /> Editar</Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(prop.id, "props_padrao")} className="text-red-500"><Trash2 className="size-4" /></Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 ml-14 text-sm text-slate-600">
                              {prop.ato && <div><span className="font-semibold block text-xs uppercase opacity-70">Ato</span>{prop.ato}</div>}
                              {prop.cena && <div><span className="font-semibold block text-xs uppercase opacity-70">Cena</span>{prop.cena}</div>}
                              {prop.preset_location && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Pre Set</span>{prop.preset_location}</div>}
                              {prop.personagem && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Personagem</span>{prop.personagem}</div>}
                              {prop.termino_uso && <div className="col-span-2"><span className="font-semibold block text-xs uppercase opacity-70">Término de Uso</span>{prop.termino_uso}</div>}
                              {prop.descricao && <div className="col-span-4"><span className="font-semibold block text-xs uppercase opacity-70">Descrição</span>{prop.descricao}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedTipo === 'conferencia' && (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50">
                      <CheckCircle2 className="size-12 mb-4 opacity-30 mx-auto text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Modo de Visualização (Padrão)</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
                        A conferência oficial e o preenchimento dos checklists são feitos apenas na aba <strong>"Evento Atual"</strong>.
                        Nesta tela de Configuração Padrão você define apenas quais são os itens base.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE EDIÇÃO DE PROP */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Editar Prop</DialogTitle></DialogHeader>
          <form onSubmit={handleEditProp} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2"><Label>Item (Prop) *</Label><Input required value={novoPropItem} onChange={e => setNovoPropItem(e.target.value)} /></div>
            <div className="space-y-2"><Label>Ato</Label><Input value={novoPropAto} onChange={e => setNovoPropAto(e.target.value)} /></div>
            <div className="space-y-2"><Label>Cena</Label><Input value={novoPropCena} onChange={e => setNovoPropCena(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Pre Set Location</Label><Input value={novoPropPreset} onChange={e => setNovoPropPreset(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Personagem que utiliza</Label><Input value={novoPropPersonagem} onChange={e => setNovoPropPersonagem(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Término de Uso</Label><Input value={novoPropTermino} onChange={e => setNovoPropTermino(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Descrição / Notas</Label><Input value={novoPropDescricao} onChange={e => setNovoPropDescricao(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Novo Anexo (Deixe em branco para manter atual)</Label><Input ref={fileInputRefEditProp} type="file" accept="image/*" onChange={e => setNovoPropArquivo(e.target.files?.[0] || null)} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar Alterações'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
