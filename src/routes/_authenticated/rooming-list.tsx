import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { BedDouble, Plus, MapPin, Users, Trash2, Edit2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportExportButton } from "@/components/ReportExportButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GridEventos } from "@/components/GridEventos";

export const Route = createFileRoute('/_authenticated/rooming-list')({
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

function RoomingListPage() {
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [quartos, setQuartos] = useState<RoomingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventoData, setEventoData] = useState<any>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RoomingList>>({});

  useEffect(() => {
    if (selectedEventoId) {
      fetchQuartos(selectedEventoId);
      fetchEvento(selectedEventoId);
    }
  }, [selectedEventoId]);

  async function fetchEvento(id: string) {
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (data) setEventoData(data);
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
            <BedDouble className="size-8 text-primary" />
            Rooming List
          </h1>
          <p className="text-slate-500 mt-1">Gestão de hospedagem e divisão de quartos por evento.</p>
        </div>
      </div>

      {!selectedEventoId ? (
        <GridEventos onSelect={setSelectedEventoId} />
      ) : (
        <div className="space-y-6">
          <Card className="border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[2rem] overflow-hidden relative">
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-white/5 pb-5 flex flex-col sm:flex-row justify-between gap-4 items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <MapPin className="size-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{eventoData?.cidade} - {eventoData?.local}</h2>
                  <p className="text-sm text-slate-500 font-medium">Espetáculo: {eventoData?.espetaculo}</p>
                </div>
              </div>
              <div className="flex gap-2">
                
                <ReportExportButton onExportPdf={exportToPDF} onExportExcel={exportToExcel} />
                <Button variant="outline" onClick={() => setSelectedEventoId("")}>Voltar</Button>

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
