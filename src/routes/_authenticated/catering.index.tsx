import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GridEventos } from "@/components/GridEventos";
import { supabase } from "@/integrations/supabase/client";
import { ReportExportButton } from "@/components/ReportExportButton";
import { CateringPadraoTab } from "@/components/CateringPadraoTab";
import { Utensils, AlertCircle, Plus, Trash2, Edit2, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import pkg from "file-saver";
const { saveAs } = pkg;

type Restricao = {
  id: string;
  evento_id: string;
  nome_pessoa: string;
  restricoes: string;
  observacoes?: string;
};

type PedidoCatering = {
  id: string;
  evento_id: string;
  item: string;
  quantidade: string;
  status: 'Pendente' | 'Concluído';
  observacoes?: string;
};

type ItemCompras = {
  id: string;
  evento_id: string;
  item: string;
  quantidade: string;
  status: 'Pendente' | 'Comprado';
  observacoes?: string;
};


export const Route = createFileRoute("/_authenticated/catering/")({
  component: CateringPage,
});

type ProfileData = {
  id: string;
  nome: string;
  role: string;
  restricao_alimentar: string | null;
};

type CateringItem = {
  id: string;
  evento_id: string;
  produto: string;
  quantidade: number | null;
  unidade: string;
  camarins: string[];
  ordem?: number;
};

function CateringPage() {
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [eventoFull, setEventoFull] = useState<any>(null);
  const [equipePerfis, setEquipePerfis] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cardapio');
  
  const [cateringItens, setCateringItens] = useState<CateringItem[]>([]);
  const [availableCamarins, setAvailableCamarins] = useState<string[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ produto: string; quantidade: string; unidade: string; camarins: string[] }>({
    produto: '',
    quantidade: '',
    unidade: 'itens',
    camarins: []
  });

  useEffect(() => {
    async function fetchEquipe() {
      if (!eventoFull || !eventoFull.equipe || eventoFull.equipe.length === 0) {
        setEquipePerfis([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, role, restricao_alimentar')
        .in('id', eventoFull.equipe)
        .order('nome');
      
      if (data) setEquipePerfis(data as ProfileData[]);
      setLoading(false);
    }
    
    if (selectedEventoId && eventoFull) {
      fetchEquipe();
    }
  }, [selectedEventoId, eventoFull]);

  const fetchCatering = async (evId: string) => {
    const { data } = await supabase.from('catering_eventos').select('*').eq('evento_id', evId).order('created_at', { ascending: true });
    if (data) setCateringItens(data as CateringItem[]);
    
    // Fetch camarins criados
    const { data: camData } = await supabase.from('camarins_eventos').select('camarim').eq('evento_id', evId);
    if (camData) {
       const uniqueNames = Array.from(new Set(camData.map(c => c.camarim).filter(Boolean))) as string[];
       setAvailableCamarins(uniqueNames);
    }
  };

  const handleSelect = async (id: string, rbId: any, fullEvent: any) => {
    setSelectedEventoId(id);
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (data) {
      setEventoFull(data);
    } else {
      setEventoFull(fullEvent);
    }
    fetchCatering(id);
  };

  const handleSaveItem = async () => {
    if (!newItem.produto) return toast.error("Digite o produto");
    
    const payload = {
      evento_id: selectedEventoId,
      produto: newItem.produto,
      quantidade: newItem.quantidade ? parseFloat(newItem.quantidade) : null,
      unidade: newItem.unidade,
      camarins: newItem.camarins
    };

    if (editingId) {
      const { data, error } = await supabase.from('catering_eventos').update(payload).eq('id', editingId).select().single();
      if (error) return toast.error("Erro ao atualizar item.");
      
      const newItems = cateringItens.map(c => c.id === editingId ? data : c);
      setCateringItens(newItems);
      toast.success("Item atualizado!");
      cancelEdit();
    } else {
      const { data, error } = await supabase.from('catering_eventos').insert(payload).select().single();
      if (error) {
         toast.error("Erro ao salvar item.");
         console.error(error);
         return;
      }
      setCateringItens([...cateringItens, data]);
      setNewItem({ produto: '', quantidade: '', unidade: 'itens', camarins: [] });
      toast.success("Item adicionado!");
    }
  };

  const startEdit = (item: CateringItem) => {
    setEditingId(item.id);
    setNewItem({
      produto: item.produto || '',
      quantidade: item.quantidade ? item.quantidade.toString() : '',
      unidade: item.unidade || 'itens',
      camarins: item.camarins || []
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItem({
      produto: '',
      quantidade: '',
      unidade: 'itens',
      camarins: []
    });
  };

  const handleDeleteItem = async (id: string) => {
    await supabase.from('catering_eventos').delete().eq('id', id);
    setCateringItens(cateringItens.filter(c => c.id !== id));
  };

  const toggleCamarim = (cam: string) => {
    setNewItem(prev => ({
      ...prev,
      camarins: prev.camarins.includes(cam) ? prev.camarins.filter(c => c !== cam) : [...prev.camarins, cam]
    }));
  };

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
      img.src = base64;
      await new Promise((res) => { img.onload = res; });
      return { base64, img, width: img.naturalWidth, height: img.naturalHeight };
    } catch (e) {
      console.warn('Logo da produtora não carregado', e);
      return null;
    }
  };

  
  const handleImportarPadrao = async () => {
    if (!eventoFull?.espetaculo) {
       toast.error("Espetáculo não definido neste evento.");
       return;
    }
    const { data: padraoData, error: errPadrao } = await supabase.from('catering_padrao').select('*').eq('espetaculo_nome', eventoFull.espetaculo).order('ordem', { ascending: true });
    if (errPadrao) return toast.error("Erro ao buscar padrão.");
    if (!padraoData || padraoData.length === 0) return toast.info("Nenhum item padrão encontrado para " + eventoFull.espetaculo);

    const payloads = padraoData.map(p => ({
       evento_id: selectedEventoId,
       produto: p.produto,
       quantidade: p.quantidade,
       unidade: p.unidade,
       camarins: [],
       ordem: p.ordem
    }));
    
    const { data: inserted, error: insertErr } = await supabase.from('catering_eventos').insert(payloads).select();
    if (insertErr) return toast.error("Erro ao importar itens.");
    
    setCateringItens([...cateringItens, ...inserted]);
    toast.success(inserted.length + " itens importados!");
  };

  const exportRestricoesExcel = async () => {
    toast.info("Gerando Excel das Restrições...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Restrições Alimentares');

      worksheet.columns = [
        { key: 'nome', width: 30 },
        { key: 'funcao', width: 20 },
        { key: 'restricao', width: 50 }
      ];

      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        
          const imgWidthExcel = 120;
          const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
          worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
          worksheet.getRow(1).height = 60;
        worksheet.getCell('B1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
          worksheet.getRow(1).height = 60;
        worksheet.getCell('B1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }

      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Integrante', 'Função', 'Restrição Alimentar'];
          headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

      let currentRow = headerRowNumber + 1;
      equipePerfis.forEach(p => {
        const row = worksheet.getRow(currentRow);
        row.values = [p.nome, p.role, p.restricao_alimentar || 'Nenhuma restrição'];
        currentRow++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Restricoes - ${eventoFull?.espetaculo || 'Evento'} - ${eventoFull?.cidade || ''}`.replace(/[\\/\\?%*:|\"<>]/g, '-').replace(/\s+/g, ' ').trim();
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao exportar Excel");
      console.error(e);
    }
  };

  const exportCardapioExcel = async () => {
    toast.info("Gerando Excel do Cardápio...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cardápio Catering');

      worksheet.columns = [
        { key: 'ordem', width: 18 },
        { key: 'produto', width: 40 },
        { key: 'quantidade', width: 20 },
        { key: 'destino', width: 40 }
      ];

      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        
          const imgWidthExcel = 120;
          const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
          worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
          worksheet.getRow(1).height = 60;
        worksheet.getCell('B1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
          worksheet.getRow(1).height = 60;
        worksheet.getCell('B1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }

      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Item', 'Produto', 'Qtd / Unidade', 'Destino (Camarins)'];
          headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

      let currentRow = headerRowNumber + 1;
      cateringItens.forEach((c, idx) => {
        const row = worksheet.getRow(currentRow);
        row.values = [
          idx + 1,
          c.produto,
          c.quantidade ? `${c.quantidade} ${c.unidade}` : `-`,
          c.camarins?.length > 0 ? c.camarins.join(', ') : 'Geral'
        ];
        currentRow++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Cardapio - ${eventoFull?.espetaculo || 'Evento'} - ${eventoFull?.cidade || ''}`.replace(/[\\/\\?%*:|\"<>]/g, '-').replace(/\s+/g, ' ').trim();
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no Excel");
      console.error(err);
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
    doc.text(`Espetáculo: ${eventoFull?.espetaculo || '-'}`, textX, y + 11);
    doc.text(`Data: ${eventoFull?.data ? new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, textX, y + 16);
    doc.text(`Local: ${eventoFull?.local || '-'} - ${eventoFull?.cidade || '-'}`, textX, y + 21);
    
    return finalY;
  };

  const exportRestricoesPDF = async () => {
    toast.info("Gerando PDF das Restrições...");
    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let y = drawHeaderPDF(doc, "Restrições Alimentares da Equipe", logoData);

      const restricoesData = equipePerfis.map(p => [
        p.nome,
        p.role.toUpperCase(),
        p.restricao_alimentar || 'Nenhuma restrição'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Integrante', 'Função', 'Restrição Alimentar']],
        body: restricoesData,
        theme: 'striped',
        headStyles: { fillColor: [217, 119, 6], textColor: 255 },
        
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } }
      });

      const safeName = `Restricoes - ${eventoFull?.espetaculo || 'Evento'} - ${eventoFull?.cidade || ''}`.replace(/[\\/\\?%*:|\"<>]/g, '-').replace(/\s+/g, ' ').trim();
      doc.save(`${safeName}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
      console.error(err);
    }
  };

  const exportCardapioPDF = async () => {
    toast.info("Gerando PDF do Cardápio...");
    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let y = drawHeaderPDF(doc, "Cardápio de Catering", logoData);

      const cardapioData = cateringItens.map((c, idx) => [
        (idx + 1).toString(),
        c.produto,
        c.quantidade ? `${c.quantidade} ${c.unidade}` : `-`,
        c.camarins?.length > 0 ? c.camarins.join(', ') : 'Geral'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Item', 'Produto', 'Qtd', 'Destino (Camarins)']],
        body: cardapioData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 }, 3: { cellWidth: 60 } }
      });

      const safeName = `Cardapio - ${eventoFull?.espetaculo || 'Evento'} - ${eventoFull?.cidade || ''}`.replace(/[\\/\\?%*:|\"<>]/g, '-').replace(/\s+/g, ' ').trim();
      doc.save(`${safeName}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <Utensils className="size-8 text-amber-500" />
          Catering e restrições alimentares
        </h1>
        <p className="text-slate-500 text-lg max-w-3xl">Monte o cardápio e verifique as restrições alimentares da equipe escalada para o evento.</p>
      </div>

      {!selectedEventoId ? (
        <div className="mt-6">
          <GridEventos onSelect={handleSelect} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
            <div className="space-y-1">
               <h2 className="font-semibold text-lg">{eventoFull?.espetaculo || 'Evento Selecionado'}</h2>
               {eventoFull?.data && <p className="text-sm text-slate-500">{new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR')} {eventoFull?.cidade ? `- ${eventoFull.cidade}` : ''}</p>}
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setSelectedEventoId("")}>&larr; Voltar</Button>
            </div>
          </div>
          
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <TabsList className="grid grid-cols-3 lg:w-[600px]">
                  <TabsTrigger value="cardapio" className="flex gap-2"><ShoppingBag className="size-4" /> Cardápio / Itens</TabsTrigger>
                  <TabsTrigger value="restricoes" className="flex gap-2"><AlertCircle className="size-4" /> Restrições</TabsTrigger>
                    <TabsTrigger value="padrao" className="flex gap-2"><Utensils className="size-4" /> Padrão</TabsTrigger>
                </TabsList>

                {/* BOTÕES DE EXPORTAÇÁO SEPARADOS POR ABA */}
                <div>
                  {activeTab === 'cardapio' && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleImportarPadrao}><Utensils className="size-4 mr-2"/> Importar Padrão</Button>
                      <ReportExportButton onExportPdf={exportCardapioPDF} onExportExcel={exportCardapioExcel} />
                    </div>
                  )}
                  {activeTab === 'restricoes' && (
                    <ReportExportButton onExportPdf={exportRestricoesPDF} onExportExcel={exportRestricoesExcel} />
                  )}
                </div>
              </div>

              <TabsContent value="cardapio" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* FORMULARIO DE CADASTRO */}
                  <div className="md:col-span-1 space-y-4 bg-slate-50 p-5 rounded-xl border">
                    <h3 className="font-semibold flex items-center gap-2">
                      {editingId ? <><Edit2 className="size-4 text-primary"/> Editando Item</> : <><Plus className="size-4"/> Adicionar Item</>}
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Produto</Label>
                        <Input value={newItem.produto} onChange={e => setNewItem({...newItem, produto: e.target.value})} placeholder="Ex: Água Mineral, Frutas..." />
                      </div>

                      <div className="flex gap-4">
                        <div className="space-y-2 w-1/2">
                          <Label>Quantidade</Label>
                          <Input value={newItem.quantidade} onChange={e => setNewItem({...newItem, quantidade: e.target.value})} type="number" placeholder="Ex: 2" />
                        </div>
                        <div className="space-y-2 w-1/2">
                          <Label>Unidade</Label>
                          <Select value={newItem.unidade} onValueChange={v => setNewItem({...newItem, unidade: v})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="itens">Itens</SelectItem>
                              <SelectItem value="pacotes">Pacotes</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="gramas">Gramas</SelectItem>
                              <SelectItem value="litros">Litros</SelectItem>
                              <SelectItem value="garrafas">Garrafas</SelectItem>
                              <SelectItem value="latas">Latas</SelectItem>
                              <SelectItem value="caixas">Caixas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label>Destino (Camarins)</Label>
                        {availableCamarins.length === 0 ? (
                           <p className="text-xs text-slate-500 italic">Nenhum camarim criado na aba de Camarins.</p>
                        ) : (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto bg-white p-2 rounded-md border">
                            {availableCamarins.map(cam => (
                              <label key={cam} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox checked={newItem.camarins.includes(cam)} onCheckedChange={() => toggleCamarim(cam)} />
                                {cam}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 space-y-2">
                        <Button onClick={handleSaveItem} className="w-full gap-2">
                           {editingId ? <><Check className="size-4"/> Atualizar Item</> : <><Plus className="size-4"/> Salvar Item</>}
                        </Button>
                        {editingId && (
                           <Button onClick={cancelEdit} variant="outline" className="w-full">Cancelar Edição</Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LISTAGEM DE ITENS */}
                  <div className="md:col-span-2">
                    {cateringItens.length === 0 ? (
                      <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-slate-50">
                        <ShoppingBag className="size-12 mb-4 opacity-30 mx-auto text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum item no cardápio</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Adicione itens no formulário ao lado para montar o cardápio deste evento.</p>
                      </div>
                    ) : (
                      <div className="bg-white border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 border-b">
                            <tr>
                              <th className="px-4 py-3 w-16 text-center">Item</th>
                              <th className="px-4 py-3">Qtd</th>
                              <th className="px-4 py-3">Produto</th>
                              <th className="px-4 py-3">Camarins</th>
                              <th className="px-4 py-3 w-20"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {cateringItens.map((item, index) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-center font-bold text-slate-400">{index + 1}</td>
                                <td className="px-4 py-3">{item.quantidade} <span className="text-xs text-slate-500 uppercase">{item.unidade}</span></td>
                                <td className="px-4 py-3 font-semibold">{item.produto}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {item.camarins?.length > 0 ? item.camarins.map(c => <span key={c} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{c}</span>) : <span className="text-slate-400 italic text-xs">Geral</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="text-slate-500 h-8 w-8 hover:text-primary" onClick={() => startEdit(item)}><Edit2 className="size-4"/></Button>
                                  <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => handleDeleteItem(item.id)}><Trash2 className="size-4"/></Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="restricoes">
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
                      {loading ? (
                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Carregando...</td></tr>
                      ) : equipePerfis.length === 0 ? (
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
                                <span className="text-slate-400 italic">Nenhuma restrição informada</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="padrao">
                <div className="bg-white p-6 border rounded-2xl shadow-sm">
                  <CateringPadraoTab />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
