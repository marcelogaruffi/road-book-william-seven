const fs = require('fs');

const content = import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GridEventos } from "@/components/GridEventos";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import * as fileSaverPkg from "file-saver";
import { File, Download } from "lucide-react";

const saveAs = fileSaverPkg.saveAs || fileSaverPkg.default?.saveAs || fileSaverPkg.default;

export const Route = createFileRoute("/_authenticated/emissao-relatorios")({
  component: EmissaoRelatoriosPage,
});

const REPORT_OPTIONS = [
  { id: "catering_cardapio", label: "Catering - Cardápio" },
  { id: "catering_restricoes", label: "Catering - Restrições Alimentares" },
  { id: "palco_props", label: "Palco - Props e Cenários" },
  { id: "camarins", label: "Camarins - Distribuição" },
  { id: "figurinos", label: "Figurinos - Listagem" },
  { id: "contatos_turne", label: "Equipe - Contatos Turnê (Global)" },
  { id: "dados_pessoais", label: "Equipe - Dados Pessoais (Global)" },
  { id: "imprensa_mailing", label: "Imprensa - Mailing (Global)" },
  { id: "imprensa_clipping", label: "Imprensa - Clipping (Global)" },
  { id: "publico", label: "Público - Geral (Global)" },
  { id: "vendas", label: "Vendas - Geral (Global)" },
];

function applyExcelStyles(worksheet, headerRowNumber) {
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > headerRowNumber) {
      row.eachCell((cell) => {
        cell.border = {
          top: {style:'thin', color: {argb:'FFDDDDDD'}},
          left: {style:'thin', color: {argb:'FFDDDDDD'}},
          bottom: {style:'thin', color: {argb:'FFDDDDDD'}},
          right: {style:'thin', color: {argb:'FFDDDDDD'}}
        };
      });
    }
  });
}

function EmissaoRelatoriosPage() {
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [eventoFull, setEventoFull] = useState<any>(null);
  const [selectedReports, setSelectedReports] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleReport = (id: string) => setSelectedReports(prev => ({ ...prev, [id]: !prev[id] }));
  const selectAll = () => {
    const all: Record<string, boolean> = {};
    REPORT_OPTIONS.forEach(r => all[r.id] = true);
    setSelectedReports(all);
  };

  const handleSelectEvento = async (id: string, rbId: any, fullEvent: any) => {
    setSelectedEventoId(id);
    const { data } = await supabase.from('eventos').select('*').eq('id', id).single();
    if (data) setEventoFull(data);
    else setEventoFull(fullEvent);
  };

  const getLogoBase64AndImg = async () => {
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      img.src = base64;
      await new Promise((res) => { img.onload = res; });
      return { base64, width: img.naturalWidth, height: img.naturalHeight };
    } catch (e) {
      return null;
    }
  };

  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: any) => {
    let y = 14;
    let textX = 14;
    let finalY = y + 25;
    if (logoData && logoData.width && logoData.height) {
      const imgWidth = 35;
      const imgHeight = (logoData.height / logoData.width) * imgWidth;
      doc.addImage(logoData.base64, 'PNG', 14, y, imgWidth, imgHeight);
      textX = 14 + imgWidth + 8;
      if (y + imgHeight + 8 > finalY) finalY = y + imgHeight + 8;
    }
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(title, textX, y + 8);
    
    if (eventoFull) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(\Espetáculo: \\, textX, y + 15);
      doc.text(\Data: \\, textX, y + 21);
    }
    return finalY;
  };

  const exportConsolidatedPDF = async () => {
    const selectedKeys = Object.keys(selectedReports).filter(k => selectedReports[k]);
    if (selectedKeys.length === 0) return toast.warning("Selecione pelo menos um relatório.");
    setLoading(true);

    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let isFirstPage = true;

      for (const repId of selectedKeys) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        if (repId === "catering_cardapio") {
          let y = drawHeaderPDF(doc, "Catering - Cardápio", logoData);
          const { data } = await supabase.from('catering_eventos').select('*').eq('evento_id', selectedEventoId).order('ordem');
          const rows = (data || []).map((c: any, idx: number) => [(idx + 1).toString(), c.produto, c.quantidade ? \\ \\ : '-', c.camarins?.length ? c.camarins.join(', ') : 'Geral']);
          autoTable(doc, { startY: y, head: [['Item', 'Produto', 'Qtd', 'Destino']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "catering_restricoes") {
          let y = drawHeaderPDF(doc, "Catering - Restrições", logoData);
          const { data } = await supabase.from('profiles').select('nome, role, restricao_alimentar').in('id', eventoFull?.equipe || []);
          const rows = (data || []).map((p: any) => [p.nome, p.role || '', p.restricao_alimentar || 'Nenhuma']);
          autoTable(doc, { startY: y, head: [['Nome', 'Função', 'Restrição']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "palco_props") {
          let y = drawHeaderPDF(doc, "Palco - Props e Cenários", logoData);
          const { data } = await supabase.from('props_eventos').select('*').eq('evento_id', selectedEventoId).order('ordem');
          const rows = (data || []).map((p: any, idx: number) => [(idx + 1).toString(), p.item, p.preset_location || '-', p.status || '-']);
          autoTable(doc, { startY: y, head: [['#', 'Item', 'Pre Set Location', 'Status']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "camarins") {
          let y = drawHeaderPDF(doc, "Camarins", logoData);
          const { data } = await supabase.from('camarins_eventos').select('*').eq('evento_id', selectedEventoId).order('created_at');
          const rows = (data || []).map((c: any, idx: number) => [(idx + 1).toString(), c.camarim, c.pessoas?.join(', ') || '-', c.observacoes || '-']);
          autoTable(doc, { startY: y, head: [['#', 'Camarim', 'Pessoas', 'Obs']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "figurinos") {
          let y = drawHeaderPDF(doc, "Figurinos", logoData);
          const { data } = await supabase.from('figurinos_eventos').select('*').eq('evento_id', selectedEventoId).order('personagem');
          const rows = (data || []).map((f: any, idx: number) => [(idx + 1).toString(), f.personagem, f.ator_nome || '-', f.pecas?.join(', ') || '-']);
          autoTable(doc, { startY: y, head: [['#', 'Personagem', 'Ator', 'Peças']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "contatos_turne") {
          let y = drawHeaderPDF(doc, "Contatos Turnê", logoData);
          const { data } = await supabase.from('profiles').select('*');
          const rows = (data || []).map((p: any) => [p.nome, p.role || '', p.telefone || '-', p.email || '-']);
          autoTable(doc, { startY: y, head: [['Nome', 'Função', 'Telefone', 'Email']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "dados_pessoais") {
          let y = drawHeaderPDF(doc, "Dados Pessoais", logoData);
          const { data } = await supabase.from('profiles').select('*');
          const rows = (data || []).map((p: any) => [p.nome, p.cpf || '-', p.data_nascimento || '-', p.endereco_cidade || '-']);
          autoTable(doc, { startY: y, head: [['Nome', 'CPF', 'Nascimento', 'Cidade']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "imprensa_mailing") {
          let y = drawHeaderPDF(doc, "Imprensa - Mailing", logoData);
          const { data } = await supabase.from('imprensa_mailing').select('*');
          const rows = (data || []).map((m: any) => [m.veiculo, m.contato_nome || '-', m.email || '-', m.telefone || '-']);
          autoTable(doc, { startY: y, head: [['Veículo', 'Contato', 'Email', 'Telefone']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "imprensa_clipping") {
          let y = drawHeaderPDF(doc, "Imprensa - Clipping", logoData);
          const { data } = await supabase.from('imprensa_clipping').select('*, eventos(espetaculo_nome)');
          const rows = (data || []).map((c: any) => [c.veiculo, c.titulo || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link || '-']);
          autoTable(doc, { startY: y, head: [['Veículo', 'Título', 'Data', 'Link']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "publico") {
          let y = drawHeaderPDF(doc, "Público Geral", logoData);
          const { data } = await supabase.from('registro_publico').select('*, eventos(espetaculo_nome)');
          const rows = (data || []).map((p: any) => [p.eventos?.espetaculo_nome || '-', p.quantidade_pagantes?.toString() || '0', p.quantidade_cortesias?.toString() || '0', p.quantidade_total?.toString() || '0']);
          autoTable(doc, { startY: y, head: [['Espetáculo', 'Pagantes', 'Cortesias', 'Total']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "vendas") {
          let y = drawHeaderPDF(doc, "Vendas Gerais", logoData);
          const { data } = await supabase.from('registro_vendas').select('*, eventos(espetaculo_nome), produtos(nome)');
          const rows = (data || []).map((v: any) => [v.eventos?.espetaculo_nome || '-', v.produtos?.nome || '-', v.quantidade?.toString() || '0', v.valor_total ? \R$ \\ : '-']);
          autoTable(doc, { startY: y, head: [['Espetáculo', 'Produto', 'Qtd', 'Total (R$)']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
      }

      const safeName = \Relatorios_Consolidados\.replace(/[/?%*:|"<>']/g, '-').trim();
      doc.save(\\.pdf\);
      toast.success("PDF gerado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF.");
      console.error(e);
    }
    setLoading(false);
  };

  const exportConsolidatedExcel = async () => {
    const selectedKeys = Object.keys(selectedReports).filter(k => selectedReports[k]);
    if (selectedKeys.length === 0) return toast.warning("Selecione pelo menos um relatório.");
    setLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const logoData = await getLogoBase64AndImg();

      const drawLogoExcel = (ws: any) => {
        if (logoData && logoData.width && logoData.height) {
          const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
          const imgWidthExcel = 120;
          const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
          ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
        }
        ws.getRow(1).height = 60;
        ws.mergeCells('B1:D1');
      };

      for (const repId of selectedKeys) {
        if (repId === "catering_cardapio") {
          const ws = workbook.addWorksheet('Catering - Cardápio');
          ws.columns = [{ width: 15 }, { width: 40 }, { width: 20 }, { width: 30 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Catering Cardápio - \\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Item', 'Produto', 'Qtd', 'Destino'];
          
          const { data } = await supabase.from('catering_eventos').select('*').eq('evento_id', selectedEventoId).order('ordem');
          (data || []).forEach((c: any, idx: number) => ws.addRow([(idx + 1).toString(), c.produto, c.quantidade ? \\ \\ : '-', c.camarins?.length ? c.camarins.join(', ') : 'Geral']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "catering_restricoes") {
          const ws = workbook.addWorksheet('Catering - Restrições');
          ws.columns = [{ width: 15 }, { width: 40 }, { width: 30 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Catering Restrições - \\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['#', 'Nome', 'Função', 'Restrição'];

          const { data } = await supabase.from('profiles').select('nome, role, restricao_alimentar').in('id', eventoFull?.equipe || []);
          (data || []).forEach((p: any, idx: number) => ws.addRow([idx + 1, p.nome, p.role || '', p.restricao_alimentar || 'Nenhuma']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "palco_props") {
          const ws = workbook.addWorksheet('Palco - Props');
          ws.columns = [{ width: 15 }, { width: 40 }, { width: 30 }, { width: 30 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Palco Props - \\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['#', 'Item', 'Pre Set', 'Status'];

          const { data } = await supabase.from('props_eventos').select('*').eq('evento_id', selectedEventoId).order('ordem');
          (data || []).forEach((p: any, idx: number) => ws.addRow([idx + 1, p.item, p.preset_location || '-', p.status || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "camarins") {
          const ws = workbook.addWorksheet('Camarins');
          ws.columns = [{ width: 15 }, { width: 30 }, { width: 50 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Camarins - \\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['#', 'Camarim', 'Pessoas', 'Obs'];

          const { data } = await supabase.from('camarins_eventos').select('*').eq('evento_id', selectedEventoId).order('created_at');
          (data || []).forEach((c: any, idx: number) => ws.addRow([idx + 1, c.camarim, c.pessoas?.join(', ') || '-', c.observacoes || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "figurinos") {
          const ws = workbook.addWorksheet('Figurinos');
          ws.columns = [{ width: 15 }, { width: 30 }, { width: 30 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Figurinos - \\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['#', 'Personagem', 'Ator', 'Peças'];

          const { data } = await supabase.from('figurinos_eventos').select('*').eq('evento_id', selectedEventoId).order('personagem');
          (data || []).forEach((f: any, idx: number) => ws.addRow([idx + 1, f.personagem, f.ator_nome || '-', f.pecas?.join(', ') || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "contatos_turne") {
          const ws = workbook.addWorksheet('Contatos Turnê');
          ws.columns = [{ width: 35 }, { width: 25 }, { width: 25 }, { width: 35 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Contatos Turnê (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Nome', 'Função', 'Telefone', 'Email'];
          const { data } = await supabase.from('profiles').select('*');
          (data || []).forEach((p: any) => ws.addRow([p.nome, p.role || '', p.telefone || '-', p.email || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "dados_pessoais") {
          const ws = workbook.addWorksheet('Dados Pessoais');
          ws.columns = [{ width: 35 }, { width: 20 }, { width: 20 }, { width: 30 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Dados Pessoais (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Nome', 'CPF', 'Nascimento', 'Cidade'];
          const { data } = await supabase.from('profiles').select('*');
          (data || []).forEach((p: any) => ws.addRow([p.nome, p.cpf || '-', p.data_nascimento || '-', p.endereco_cidade || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "imprensa_mailing") {
          const ws = workbook.addWorksheet('Mailing');
          ws.columns = [{ width: 30 }, { width: 30 }, { width: 35 }, { width: 20 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Imprensa - Mailing (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Veículo', 'Contato', 'Email', 'Telefone'];
          const { data } = await supabase.from('imprensa_mailing').select('*');
          (data || []).forEach((m: any) => ws.addRow([m.veiculo, m.contato_nome || '-', m.email || '-', m.telefone || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "imprensa_clipping") {
          const ws = workbook.addWorksheet('Clipping');
          ws.columns = [{ width: 30 }, { width: 40 }, { width: 20 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Imprensa - Clipping (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Veículo', 'Título', 'Data', 'Link'];
          const { data } = await supabase.from('imprensa_clipping').select('*, eventos(espetaculo_nome)');
          (data || []).forEach((c: any) => ws.addRow([c.veiculo, c.titulo || '-', c.data_publicacao ? new Date(c.data_publicacao).toLocaleDateString('pt-BR') : '-', c.link || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "publico") {
          const ws = workbook.addWorksheet('Público');
          ws.columns = [{ width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Público (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Espetáculo', 'Pagantes', 'Cortesias', 'Total'];
          const { data } = await supabase.from('registro_publico').select('*, eventos(espetaculo_nome)');
          (data || []).forEach((p: any) => ws.addRow([p.eventos?.espetaculo_nome || '-', p.quantidade_pagantes || 0, p.quantidade_cortesias || 0, p.quantidade_total || 0]));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "vendas") {
          const ws = workbook.addWorksheet('Vendas');
          ws.columns = [{ width: 35 }, { width: 30 }, { width: 15 }, { width: 20 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = \Vendas (Global)\;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Espetáculo', 'Produto', 'Qtd', 'Total (R$)'];
          const { data } = await supabase.from('registro_vendas').select('*, eventos(espetaculo_nome), produtos(nome)');
          (data || []).forEach((v: any) => ws.addRow([v.eventos?.espetaculo_nome || '-', v.produtos?.nome || '-', v.quantidade || 0, v.valor_total || 0]));
          applyExcelStyles(ws, 3);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = \Relatorios_Consolidados\.replace(/[/?%*:|"<>']/g, '-').trim();
      saveAs(new Blob([buffer]), \\.xlsx\);
      toast.success("Excel gerado!");
    } catch (e: any) {
      toast.error("Erro ao gerar Excel.");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <File className="size-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Emissão de Relatórios</h1>
          <p className="text-slate-500">Selecione os relatórios desejados. Para relatórios por evento, selecione um evento primeiro.</p>
        </div>
      </div>

      {!selectedEventoId ? (
        <GridEventos onSelect={handleSelectEvento} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">{eventoFull?.espetaculo || 'Evento Selecionado'}</h2>
                {eventoFull?.data && <p className="text-sm text-slate-500">{new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR')} {eventoFull?.cidade ? \- \\ : ''}</p>}
              </div>
              <Button variant="outline" onClick={() => setSelectedEventoId("")}>&larr; Trocar Evento</Button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">Selecione os Relatórios</h3>
                <Button variant="secondary" onClick={selectAll}>Marcar Todos</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {REPORT_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                    <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <Button onClick={exportConsolidatedPDF} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                  <Download className="size-4 mr-2" /> Extrair PDF Único
                </Button>
                <Button onClick={exportConsolidatedExcel} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="size-4 mr-2" /> Extrair Excel Único
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
;
fs.writeFileSync('src/routes/_authenticated/emissao-relatorios.tsx', content);
