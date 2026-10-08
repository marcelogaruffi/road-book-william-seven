import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Edit2, GripVertical, Check } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import pkg from "file-saver";
const { saveAs } = pkg;
import { ReportExportButton } from "@/components/ReportExportButton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CateringPadrao = {
  id: string;
  espetaculo_nome: string;
  produto: string;
  quantidade: number | null;
  unidade: string;
  ordem: number;
};

export function CateringPadraoTab({ espetaculoNome }: { espetaculoNome?: string }) {
  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [selectedEspetaculo, setSelectedEspetaculo] = useState(espetaculoNome || "");
  const [itens, setItens] = useState<CateringPadrao[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState({
    produto: '',
    quantidade: '',
    unidade: 'itens'
  });

  const dragItem = useRef<number>(0);
  const dragOverItem = useRef<number>(0);

  useEffect(() => { if (espetaculoNome) setSelectedEspetaculo(espetaculoNome); }, [espetaculoNome]);

  useEffect(() => {
    fetchEspetaculos();
  }, []);

  useEffect(() => {
    if (selectedEspetaculo) {
      fetchItens();
    } else {
      setItens([]);
    }
  }, [selectedEspetaculo]);

  async function fetchEspetaculos() {
    const { data, error } = await supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo");
    if (error) {
      toast.error("Erro ao carregar espetáculos");
      return;
    }
    setEspetaculos(data.map((e: any) => e.nome_espetaculo));
  }

  async function fetchItens() {
    setLoading(true);
    const { data, error } = await supabase
      .from("catering_padrao")
      .select("*")
      .eq("espetaculo_nome", selectedEspetaculo)
      .order("ordem", { ascending: true });
      
    if (error) {
      toast.error("Erro ao carregar itens padrão");
    } else {
      setItens(data || []);
    }
    setLoading(false);
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
      console.warn('Logo da produtora não carregado', e);
      return null;
    }
  };

  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
    let y = 14;
    let textX = 14;
    let finalY = y + 25;
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
    doc.text(`Espetáculo: ${selectedEspetaculo}`, textX, y + 11);
    
    return finalY;
  };

  const exportPadraoExcel = async () => {
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo.");
    toast.info("Gerando Excel do Padrão...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Catering Padrão');

      worksheet.columns = [
        { key: 'ordem', width: 18 },
        { key: 'produto', width: 50 },
        { key: 'quantidade', width: 30 }
      ];

      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        const imgWidthExcel = 120;
        const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
        
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = `Catering Padrão - ${selectedEspetaculo}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = `Catering Padrão - ${selectedEspetaculo}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }

      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Item', 'Produto', 'Quantidade'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      itens.forEach((c, idx) => {
        const row = worksheet.addRow({
          ordem: idx + 1,
          produto: c.produto,
          quantidade: c.quantidade ? `${c.quantidade} ${c.unidade}` : '-'
        });
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Catering_Padrao_${selectedEspetaculo}`.replace(/[\\/\\?%*:|"<>']/g, '-').replace(/\s+/g, ' ').trim();
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao exportar Excel");
    }
  };

  const exportPadraoPDF = async () => {
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo.");
    toast.info("Gerando PDF do Padrão...");
    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let y = drawHeaderPDF(doc, "Catering Padrão", logoData);

      const data = itens.map((c, idx) => [
        (idx + 1).toString(),
        c.produto,
        c.quantidade ? `${c.quantidade} ${c.unidade}` : `-`
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Item', 'Produto', 'Quantidade']],
        body: data,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40, halign: 'center' } }
      });

      const safeName = `Catering_Padrao_${selectedEspetaculo}`.replace(/[\\/\\?%*:|"<>']/g, '-').replace(/\s+/g, ' ').trim();
      doc.save(`${safeName}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
    }
  };

  const handleSaveItem = async () => {
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo primeiro");
    if (!newItem.produto) return toast.error("Digite o nome do produto");

    const payload = {
      espetaculo_nome: selectedEspetaculo,
      produto: newItem.produto,
      quantidade: newItem.quantidade ? parseFloat(newItem.quantidade) : null,
      unidade: newItem.unidade,
      ordem: itens.length
    };

    if (editingId) {
      const { data, error } = await supabase.from('catering_padrao').update(payload).eq('id', editingId).select().single();
      if (error) return toast.error("Erro ao atualizar item");
      
      setItens(itens.map(c => c.id === editingId ? data : c));
      toast.success("Item atualizado");
      cancelEdit();
    } else {
      const { data, error } = await supabase.from('catering_padrao').insert(payload).select().single();
      if (error) return toast.error("Erro ao salvar item");
      
      setItens([...itens, data]);
      setNewItem({ produto: '', quantidade: '', unidade: 'itens' });
      toast.success("Item adicionado");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('catering_padrao').delete().eq('id', id);
    if (error) return toast.error("Erro ao excluir item");
    setItens(itens.filter(i => i.id !== id));
    toast.success("Item excluído");
  };

  const startEdit = (item: CateringPadrao) => {
    setEditingId(item.id);
    setNewItem({
      produto: item.produto,
      quantidade: item.quantidade ? item.quantidade.toString() : '',
      unidade: item.unidade || 'itens'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItem({ produto: '', quantidade: '', unidade: 'itens' });
  };

  const handleSort = async () => {
    const _itens = [...itens];
    const draggedItemContent = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItemContent);
    
    const itemsWithNewOrder = _itens.map((item, index) => ({ ...item, ordem: index }));
    setItens(itemsWithNewOrder);

    const { error } = await supabase.from('catering_padrao').upsert(
      itemsWithNewOrder.map(item => ({
        id: item.id,
        espetaculo_nome: item.espetaculo_nome,
        produto: item.produto,
        quantidade: item.quantidade,
        unidade: item.unidade,
        ordem: item.ordem
      }))
    );

    if (error) {
      toast.error("Erro ao salvar a ordem");
    }
  };

  return (
    <div className="space-y-6">
      {!espetaculoNome && (
      <div className="flex gap-4 items-center">
        <Select value={selectedEspetaculo} onValueChange={setSelectedEspetaculo}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione o Espetáculo" />
          </SelectTrigger>
          <SelectContent>
            {espetaculos.map((esp) => (
              <SelectItem key={esp} value={esp}>{esp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      )}

      <div className="flex gap-4 items-center justify-end">
        {selectedEspetaculo && itens.length > 0 && (
          <div className="ml-auto">
            <ReportExportButton onExportPdf={exportPadraoPDF} onExportExcel={exportPadraoExcel} />
          </div>
        )}
      </div>

      {selectedEspetaculo && (
        <>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-sm text-slate-500 mb-4">{editingId ? 'Editar Item Padrão' : 'Adicionar Novo Item Padrão'}</h3>
            <div className="flex gap-4">
              <Input
                value={newItem.produto}
                onChange={e => setNewItem({ ...newItem, produto: e.target.value })}
                placeholder="Produto (ex: Água 500ml)"
                className="flex-1"
              />
              <Input
                value={newItem.quantidade}
                onChange={e => setNewItem({ ...newItem, quantidade: e.target.value })}
                placeholder="Qtd (ex: 20)"
                type="number"
                className="w-24"
              />
              <Select value={newItem.unidade} onValueChange={v => setNewItem({ ...newItem, unidade: v })}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="itens">Itens</SelectItem>
                  <SelectItem value="caixas">Caixas</SelectItem>
                  <SelectItem value="pct">Pacotes</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="L">Litros</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="garrafas">Garrafas</SelectItem>
                  <SelectItem value="latas">Latas</SelectItem>
                  <SelectItem value="bandejas">Bandejas</SelectItem>
                  <SelectItem value="porcoes">Porções</SelectItem>
                </SelectContent>
              </Select>
              
              {editingId ? (
                <>
                  <Button onClick={handleSaveItem} className="bg-blue-600 hover:bg-blue-700">
                    <Check className="size-4 mr-2" /> Salvar
                  </Button>
                  <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                </>
              ) : (
                <Button onClick={handleSaveItem}>Adicionar</Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : itens.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum item padrão cadastrado.</p>
            ) : (
              itens.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => dragItem.current = index}
                  onDragEnter={() => dragOverItem.current = index}
                  onDragEnd={handleSort}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm cursor-move hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="size-4 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-700">{item.produto}</p>
                      <p className="text-sm text-slate-500">
                        {item.quantidade ? `${item.quantidade} ` : ''}{item.unidade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                      <Edit2 className="size-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
