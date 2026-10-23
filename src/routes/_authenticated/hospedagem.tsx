import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { BedDouble, Plus, MapPin, Users, Trash2, Edit2, Calendar, Hotel, Phone, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportExportButton } from "@/components/ReportExportButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GridEventos } from "@/components/GridEventos";
import { makeRoadbookSlug } from "@/lib/slug";

export const Route = createFileRoute('/_authenticated/hospedagem')({
  component: RoomingListPage
});

type RoomingList = {
  id: string;
  evento_id: string;
  numero_quarto: string;
  tipo_quarto: string;
  hospede_1: string;
  hospede_2: string;
  hospede_3: string;
  observacoes: string;
};

const tiposQuarto = ["Single", "Double (Casal)", "Twin (Solteiros)", "Triplo", "Outro"];

import { Route as AuthedRoute } from "./route";
import { AccessDenied } from "@/components/AccessDenied";

function RoomingListPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const isProdutor = profile?.role === 'admin' || profile?.role === 'dev' || profile?.role === 'produtor' || profile?.role === 'assistente_producao';

  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [quartos, setQuartos] = useState<RoomingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventoData, setEventoData] = useState<any>(null);
  const [roadbookData, setRoadbookData] = useState<any>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RoomingList>>({});

  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [hotelForm, setHotelForm] = useState({
    hotel_nome: "",
    hotel_endereco: "",
    hotel_telefone: "",
    hotel_site: "",
    hotel_checkin: "",
    hotel_checkout: "",
    hotel_checkin_hora: "",
    hotel_checkout_hora: "",
    hotel_observacoes: ""
  });
  const [savingHotel, setSavingHotel] = useState(false);

  if (profile && !isProdutor) {
    return <AccessDenied message="A gestão de Hospedagem (Rooming List) é exclusiva para Administradores e Produtores." />;
  }

  useEffect(() => {
    if (selectedEventoId) {
      fetchQuartos(selectedEventoId);
      fetchEvento(selectedEventoId);
      fetchRoadbook(selectedEventoId);
    }
  }, [selectedEventoId]);

  async function fetchEvento(id: string) {
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (data) setEventoData(data);
  }

  async function fetchRoadbook(evento_id: string) {
    const { data } = await supabase.from('roadbooks').select('*').eq('evento_id', evento_id).maybeSingle();
    if (data) {
      setRoadbookData(data);
      const obs = (data.automacoes as any)?.info_hotel?.observacoes || (data as any).hotel_observacoes || "";
      setHotelForm({
        hotel_nome: data.hotel_nome || "",
        hotel_endereco: data.hotel_endereco || "",
        hotel_telefone: data.hotel_telefone || "",
        hotel_site: data.hotel_site || "",
        hotel_checkin: data.hotel_checkin || "",
        hotel_checkout: data.hotel_checkout || "",
        hotel_checkin_hora: data.hotel_checkin_hora || "",
        hotel_checkout_hora: data.hotel_checkout_hora || "",
        hotel_observacoes: obs
      });
    } else {
      setRoadbookData(null);
    }
  }

  async function handleSaveHotel(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventoId) return;
    setSavingHotel(true);
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      const currentUserId = userAuth?.user?.id;

      if (roadbookData?.id) {
        // Atualiza roadbook existente
        const currentAutomacoes = typeof roadbookData.automacoes === 'object' && roadbookData.automacoes ? roadbookData.automacoes : {};
        const updatedAutomacoes = {
          ...currentAutomacoes,
          info_hotel: {
            ...(currentAutomacoes.info_hotel || {}),
            observacoes: hotelForm.hotel_observacoes
          }
        };

        const { error } = await supabase.from('roadbooks').update({
          hotel_nome: hotelForm.hotel_nome,
          hotel_endereco: hotelForm.hotel_endereco,
          hotel_telefone: hotelForm.hotel_telefone,
          hotel_site: hotelForm.hotel_site,
          hotel_checkin: hotelForm.hotel_checkin || null,
          hotel_checkout: hotelForm.hotel_checkout || null,
          hotel_checkin_hora: hotelForm.hotel_checkin_hora || null,
          hotel_checkout_hora: hotelForm.hotel_checkout_hora || null,
          automacoes: updatedAutomacoes
        }).eq('id', roadbookData.id);

        if (error) throw error;
      } else {
        // Cria roadbook com vinculação ao evento usando padrão espetaculo-cidade
        const baseSlug = makeRoadbookSlug(eventoData?.espetaculo || "evento", eventoData?.cidade || "cidade");
        
        for (let attempt = 0; attempt < 5; attempt++) {
          const trySlug = attempt === 0 
            ? baseSlug 
            : attempt === 1 && eventoData?.data
            ? `${baseSlug}-${eventoData.data}`
            : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

          const { error } = await supabase.from('roadbooks').insert({
            evento_id: selectedEventoId,
            user_id: currentUserId,
            espetaculo: eventoData?.espetaculo || "",
            cidade: eventoData?.cidade || "",
            teatro_nome: eventoData?.local || "",
            data_inicial: eventoData?.data || null,
            data_final: eventoData?.data || null,
            slug: trySlug,
            hotel_nome: hotelForm.hotel_nome,
            hotel_endereco: hotelForm.hotel_endereco,
            hotel_telefone: hotelForm.hotel_telefone,
            hotel_site: hotelForm.hotel_site,
            hotel_checkin: hotelForm.hotel_checkin || null,
            hotel_checkout: hotelForm.hotel_checkout || null,
            hotel_checkin_hora: hotelForm.hotel_checkin_hora || null,
            hotel_checkout_hora: hotelForm.hotel_checkout_hora || null,
            automacoes: {
              info_hotel: {
                observacoes: hotelForm.hotel_observacoes
              }
            }
          });

          if (!error) break;
          if (error && !`${error.message}`.toLowerCase().includes("duplicate") && !`${error.message}`.toLowerCase().includes("unique")) {
            throw error;
          }
        }
      }

      toast.success("Informações do hotel sincronizadas com sucesso com o Guia de Viagem (Roadbook)!");
      setHotelModalOpen(false);
      fetchRoadbook(selectedEventoId);
    } catch (err: any) {
      toast.error("Erro ao salvar hotel: " + err.message);
    } finally {
      setSavingHotel(false);
    }
  }

  async function fetchQuartos(evento_id: string) {
    setLoading(true);
    const { data, error } = await supabase.from('rooming_list').select('*').eq('evento_id', evento_id).order('numero_quarto');
    if (error) {
      if (error.code === '42P01') {
         toast.error("Tabela 'rooming_list' não existe no banco de dados.");
      }
    } else {
      setQuartos(data || []);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.tipo_quarto) return toast.error("Tipo de quarto é obrigatório");
    
    const { error } = await supabase.from('rooming_list').upsert({
      id: editId || undefined,
      evento_id: selectedEventoId,
      ...formData
    });

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Quarto salvo!");
      setModalOpen(false);
      fetchQuartos(selectedEventoId);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este quarto?")) return;
    const { error } = await supabase.from('rooming_list').delete().eq('id', id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Excluído!");
      fetchQuartos(selectedEventoId);
    }
  }

  function openNew() {
    setEditId(null);
    setFormData({ tipo_quarto: 'Single' });
    setModalOpen(true);
  }

  
  
  const getLogoBase64AndImg = async () => {
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      img.src = base64 as string;
      await new Promise((res) => { img.onload = res; });
      return { base64: base64 as string, img, width: img.naturalWidth, height: img.naturalHeight };
    } catch (e) {
      console.warn('Logo não carregado', e);
      return null;
    }
  };

  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
    let y = 14;
    let textX = 14;
    let finalY = y + 30;
    if (logoData) {
      const imgWidth = 35;
      const imgHeight = (logoData.height / logoData.width) * imgWidth;
      doc.addImage(logoData.base64, 'PNG', 14, y, imgWidth, imgHeight);
      textX = 14 + imgWidth + 8;
      if (y + imgHeight + 8 > finalY) finalY = y + imgHeight + 8;
    }
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(title, textX, y + 5);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Espetáculo: ${eventoData?.espetaculo || '-'}`, textX, y + 11);
    doc.text(`Data: ${eventoData?.data ? new Date(eventoData.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, textX, y + 16);
    doc.text(`Local: ${eventoData?.local || '-'} - ${eventoData?.cidade || '-'}`, textX, y + 21);
    
    return finalY;
  };


  const exportToExcel = async () => {
    if (!quartos.length) return toast.error("Nenhum quarto para exportar.");
    toast.info("Gerando Excel da Rooming List...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rooming List");
    
    worksheet.columns = [
      { width: 15 }, { width: 20 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 30 }
    ];

    let headerRowNumber = 1;
    const logoData = await getLogoBase64AndImg();
    if (logoData) {
      const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
      const imgWidthExcel = 120;
      const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.getRow(1).height = 60;
      worksheet.mergeCells('C1:F1');
      worksheet.getCell('C1').value = `Rooming List - ${eventoData?.espetaculo || ''}`;
      worksheet.getCell('C1').font = { size: 16, bold: true };
      worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'left' };
      headerRowNumber = 3;
    } else {
      worksheet.getRow(1).height = 60;
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = `Rooming List - ${eventoData?.espetaculo || ''}`;
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
      headerRowNumber = 3;
    }
    
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["Quarto", "Tipo", "Hóspede 1", "Hóspede 2", "Hóspede 3", "Observações"];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    
    quartos.forEach(q => {
      worksheet.addRow([
        q.numero_quarto || "S/N",
        q.tipo_quarto,
        q.hospede_1 || "",
        q.hospede_2 || "",
        q.hospede_3 || "",
        q.observacoes || ""
      ]);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const safeName = `RoomingList - ${eventoData?.espetaculo || 'Evento'} - ${eventoData?.cidade || ''}`.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
    saveAs(new Blob([buffer]), `${safeName}.xlsx`);
    toast.success("Excel gerado com sucesso!");
  };

  const exportToPDF = async () => {
    if (!quartos.length) return toast.error("Nenhum quarto para exportar.");
    toast.info("Gerando PDF da Rooming List...");
    const doc = new jsPDF("portrait");
    
    const logoData = await getLogoBase64AndImg();
    let y = drawHeaderPDF(doc, "Rooming List de Equipe", logoData);
    
    const tableData = quartos.map(q => [
      q.numero_quarto || "S/N",
      q.tipo_quarto,
      q.hospede_1 || "",
      q.hospede_2 || "",
      q.hospede_3 || "",
      q.observacoes || ""
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [["Quarto", "Tipo", "Hóspede 1", "Hóspede 2", "Hóspede 3", "Obs"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },
    });
    
    const safeName = `RoomingList - ${eventoData?.espetaculo || 'Evento'} - ${eventoData?.cidade || ''}`.replace(/[\/\\?%*:|"<>]/g, '-').replace(/\s+/g, ' ').trim();
    doc.save(`${safeName}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  function openEdit(r: RoomingList) {
    setEditId(r.id);
    setFormData(r);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Hotel className="size-8 text-primary" />
            Hospedagem
          </h1>
          <p className="text-slate-500 mt-1">Gestão de hotelaria, rooming list e acomodação da equipe por evento.</p>
        </div>
      </div>

      {!selectedEventoId ? (
        <GridEventos onSelect={setSelectedEventoId} />
      ) : (
        <div className="space-y-6">
          {/* Card de Informações da Hospedagem / Hotel (Sincronizado com Roadbook) */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-sm bg-white dark:bg-card rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 py-4 px-6 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Hotel className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-800 dark:text-white">
                      {roadbookData?.hotel_nome || "Hotel não informado"}
                    </h2>
                    {roadbookData?.slug && (
                      <a
                        href={`/rb/${roadbookData.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Ver no Guia de Viagem <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Sincronizado em tempo real com o Guia de Viagem (Roadbook).
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHotelModalOpen(true)}
                className="rounded-xl font-bold gap-1.5 h-9 shrink-0"
              >
                <Edit2 className="size-3.5" /> Editar Dados do Hotel
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="size-3" /> Endereço
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {roadbookData?.hotel_endereco || "Não informado"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="size-3" /> Telefone / Contato
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {roadbookData?.hotel_telefone || "Não informado"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="size-3" /> Check-in
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {roadbookData?.hotel_checkin ? new Date(roadbookData.hotel_checkin + "T00:00:00").toLocaleDateString("pt-BR") : "A definir"}
                    {roadbookData?.hotel_checkin_hora ? ` às ${roadbookData.hotel_checkin_hora}` : ""}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="size-3" /> Check-out
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {roadbookData?.hotel_checkout ? new Date(roadbookData.hotel_checkout + "T00:00:00").toLocaleDateString("pt-BR") : "A definir"}
                    {roadbookData?.hotel_checkout_hora ? ` às ${roadbookData.hotel_checkout_hora}` : ""}
                  </p>
                </div>
              </div>

              {(() => {
                const obs = (roadbookData?.automacoes as any)?.info_hotel?.observacoes || (roadbookData as any)?.hotel_observacoes;
                if (!obs) return null;
                return (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-bold">Observações de Hospedagem: </span>
                    {obs}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[2rem] overflow-hidden relative">
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-white/5 pb-5 flex flex-col sm:flex-row justify-between gap-4 items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedEventoId("")} className="shrink-0 font-bold">
                  &larr; Voltar para Grade
                </Button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-800 dark:text-white">
                      {eventoData?.espetaculo || "Espetáculo"}
                    </span>
                    {eventoData?.cidade && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">
                        {eventoData.cidade}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {eventoData?.local ? `${eventoData.local} • ` : ""}{eventoData?.data ? new Date(eventoData.data + "T00:00:00").toLocaleDateString("pt-BR") : "Data a definir"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <ReportExportButton onExportPdf={exportToPDF} onExportExcel={exportToExcel} />
                <Button onClick={openNew} className="gap-2"><Plus className="size-4" /> Adicionar Quarto</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {quartos.length === 0 && !loading && (
                  <div className="col-span-full py-12 text-center text-slate-400">Nenhum quarto adicionado para este evento.</div>
                )}
                {quartos.map(q => (
                  <div key={q.id} className="border rounded-xl p-4 bg-white hover:border-primary/50 transition-colors relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-slate-700" onClick={() => openEdit(q)}><Edit2 className="size-3" /></Button>
                      <Button variant="ghost" size="icon" className="size-6 text-slate-400 hover:text-red-500" onClick={() => handleDelete(q.id)}><Trash2 className="size-3" /></Button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <BedDouble className="size-5 text-indigo-500" />
                      <span className="font-bold text-slate-800">Quarto {q.numero_quarto || 'S/N'}</span>
                      <span className="ml-auto text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{q.tipo_quarto}</span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {q.hospede_1 && <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-1.5 rounded"><Users className="size-3.5 text-slate-400" /> {q.hospede_1}</div>}
                      {q.hospede_2 && <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-1.5 rounded"><Users className="size-3.5 text-slate-400" /> {q.hospede_2}</div>}
                      {q.hospede_3 && <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-1.5 rounded"><Users className="size-3.5 text-slate-400" /> {q.hospede_3}</div>}
                    </div>
                    {q.observacoes && <p className="text-xs text-amber-600 mt-3 font-medium bg-amber-50 p-2 rounded">{q.observacoes}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edição de Hotel (2-Way Sync com Roadbook) */}
      <Dialog open={hotelModalOpen} onOpenChange={setHotelModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hotel className="size-5 text-primary" />
              Editar Dados da Hospedagem
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveHotel} className="space-y-4 py-2">
            <p className="text-xs text-slate-500">
              As alterações feitas aqui atualizam imediatamente o <strong>Guia de Viagem (Roadbook)</strong> deste evento.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Nome do Hotel</Label>
              <Input
                value={hotelForm.hotel_nome}
                onChange={e => setHotelForm({ ...hotelForm, hotel_nome: e.target.value })}
                placeholder="Ex: Ibis Curitiba Centro"
                className="h-10 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Endereço Completo</Label>
                <Input
                  value={hotelForm.hotel_endereco}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Telefone / Recepção</Label>
                <Input
                  value={hotelForm.hotel_telefone}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_telefone: e.target.value })}
                  placeholder="(00) 0000-0000"
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data Check-in</Label>
                <Input
                  type="date"
                  value={hotelForm.hotel_checkin}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_checkin: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Horário Check-in</Label>
                <Input
                  type="time"
                  value={hotelForm.hotel_checkin_hora}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_checkin_hora: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data Check-out</Label>
                <Input
                  type="date"
                  value={hotelForm.hotel_checkout}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_checkout: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Horário Check-out</Label>
                <Input
                  type="time"
                  value={hotelForm.hotel_checkout_hora}
                  onChange={e => setHotelForm({ ...hotelForm, hotel_checkout_hora: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observações de Hospedagem (Café da manhã, Wi-Fi, etc.)</Label>
              <Input
                value={hotelForm.hotel_observacoes}
                onChange={e => setHotelForm({ ...hotelForm, hotel_observacoes: e.target.value })}
                placeholder="Ex: Café incluso das 06h às 10h. Estacionamento gratuito."
                className="h-10 text-xs"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setHotelModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingHotel} className="font-bold">
                {savingHotel ? "Salvando..." : "Salvar e Sincronizar Hotel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Quarto</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Número do Quarto</Label><Input value={formData.numero_quarto || ''} onChange={e => setFormData({...formData, numero_quarto: e.target.value})} placeholder="Ex: 101" /></div>
              <div className="space-y-2">
                <Label>Tipo de Quarto</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3" value={formData.tipo_quarto || ''} onChange={e => setFormData({...formData, tipo_quarto: e.target.value})}>
                  {tiposQuarto.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Hóspede 1</Label><Input value={formData.hospede_1 || ''} onChange={e => setFormData({...formData, hospede_1: e.target.value})} /></div>
            <div className="space-y-2"><Label>Hóspede 2</Label><Input value={formData.hospede_2 || ''} onChange={e => setFormData({...formData, hospede_2: e.target.value})} /></div>
            {(formData.tipo_quarto === 'Triplo' || formData.hospede_3) && (
              <div className="space-y-2"><Label>Hóspede 3</Label><Input value={formData.hospede_3 || ''} onChange={e => setFormData({...formData, hospede_3: e.target.value})} /></div>
            )}
            <div className="space-y-2"><Label>Observações Especiais (Ex: Berço, Acessibilidade)</Label><Input value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
            <div className="pt-4 flex justify-end"><Button type="submit">Salvar Quarto</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
