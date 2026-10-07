import { createFileRoute } from "@tanstack/react-router";
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
import { File, Download, Printer } from "lucide-react";

const saveAs = fileSaverPkg.saveAs || fileSaverPkg.default?.saveAs || fileSaverPkg.default;

export const Route = createFileRoute("/_authenticated/emissao-relatorios")({
  component: EmissaoRelatoriosPage,
});

const REPORT_GROUPS = [
  {
    name: "Gestão e Logística",
    options: [
      { id: "rooming_list", label: "Rooming List (Hotéis)" }
    ]
  },
  {
    name: "Backstage",
    options: [
      { id: "camarins", label: "Camarins - Distribuição" },
      { id: "catering_cardapio", label: "Catering - Cardápio" },
      { id: "catering_restricoes", label: "Catering - Restrições Alimentares" },
      { id: "palco_props", label: "Montagem de Palco - Props e Cenários" },
      { id: "figurinos", label: "Figurinos - Listagem" }
    ]
  },
  {
    name: "Produção Executiva",
    options: [
      { id: "publico", label: "Público - Geral" },
      { id: "vendas", label: "Vendas - Geral" }
    ]
  },
  {
    name: "Equipe e RH",
    options: [
      { id: "dados_pessoais", label: "Equipe - Dados Pessoais" },
      { id: "contatos_turne", label: "Equipe - Contatos Turnê" }
    ]
  },
  {
    name: "Comunicação e Mídia",
    options: [
      { id: "imprensa_mailing", label: "Imprensa - Mailing" },
      { id: "imprensa_clipping", label: "Imprensa - Clipping" },
      { id: "midias_cronograma", label: "Mídias - Cronograma" },
      { id: "midias_divulgacoes", label: "Divulgações Redes Sociais" }
    ]
  }
];

const REPORT_OPTIONS = REPORT_GROUPS.flatMap(g => g.options);

function applyExcelStyles(worksheet: any, headerRowNumber: number) {
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.eachCell((cell: any) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber > headerRowNumber) {
      row.eachCell((cell: any) => {
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
      doc.text(`Espetáculo: ${eventoFull.espetaculo || '-'}`, textX, y + 15);
      doc.text(`Data: ${eventoFull.data ? new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`, textX, y + 21);
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
          const rows = (data || []).map((c: any, idx: number) => [(idx + 1).toString(), c.produto, c.quantidade ? `${c.quantidade} ${c.unidade}` : '-', c.camarins?.length ? c.camarins.join(', ') : 'Geral']);
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
          const rows = (data || []).map((m: any) => [m.veiculo || '-', m.nome || '-', m.tipo_midia || '-', m.email || '-', m.telefone || '-']);
          autoTable(doc, { startY: y, head: [['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "imprensa_clipping") {
          let y = drawHeaderPDF(doc, "Imprensa - Clipping", logoData);
          const { data } = await supabase.from('imprensa_clipping').select('*');
          
          (data || []).forEach((clip: any) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42); 
            doc.text(clip.espetaculo || '-', 14, y);
            y += 6;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Veículo: ${clip.veiculo}`, 14, y);
            y += 5;
            doc.text(`Matéria: ${clip.titulo_materia || '-'}`, 14, y);
            y += 5;
            doc.text(`Data: ${clip.data_publicacao ? new Date(clip.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} | Sentimento: ${(clip.sentimento || '').toUpperCase()}`, 14, y);
            y += 5;
            
            if (clip.link_materia) {
              doc.text('Link da Matéria: ', 14, y);
              doc.setTextColor(37, 99, 235);
              const textWidth = doc.getTextWidth('Link da Matéria: ');
              doc.textWithLink(clip.link_materia.substring(0, 70) + (clip.link_materia.length > 70 ? '...' : ''), 14 + textWidth, y, { url: clip.link_materia });
              doc.setTextColor(0, 0, 0);
              y += 5;
            }
            
            if (clip.relevancia_tier) {
              doc.text(`Relevância: Geo ${clip.relevancia_geo}/5 | Público ${clip.relevancia_publico}/5 | Autoridade ${clip.relevancia_autoridade}/5 | CTA ${clip.relevancia_cta}/5`, 14, y);
              y += 5;
              doc.setFont("helvetica", "bold");
              doc.text(`Score: ${clip.relevancia_score} - ${clip.relevancia_tier}`, 14, y);
              doc.setFont("helvetica", "normal");
              y += 5;
            } else {
              doc.setTextColor(148, 163, 184);
              doc.text('Relevância: não avaliada', 14, y);
              doc.setTextColor(0, 0, 0);
              y += 5;
            }
            if (clip.tags && clip.tags.length > 0) {
              doc.text(`Tags: ${clip.tags.join(', ')}`, 14, y);
              y += 5;
            }
            
            y += 8; 
          });
        }
        else if (repId === "rooming_list") {
            let y = drawHeaderPDF(doc, "Gestão - Rooming List", logoData);
            const { data } = await supabase.from('rooming_list').select('*, evento:eventos(cidade, local, espetaculo)');
            const rows = (data || []).map((r: any) => [
              r.evento ? `${r.evento.cidade} (${r.evento.espetaculo})` : "-",
              r.numero_quarto || "S/N",
              r.tipo_quarto || "-",
              r.hospede_1 || "-",
              r.hospede_2 || "-",
              r.hospede_3 || "-"
            ]);
            autoTable(doc, { startY: y, head: [['Evento', 'Quarto', 'Tipo', 'Hóspede 1', 'Hóspede 2', 'Hóspede 3']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
          }
          else if (repId === "publico") {
          let y = drawHeaderPDF(doc, "Público Geral", logoData);
          const { data } = await supabase.from('relatorio_publico').select('*, roadbooks(cidade, estado, espetaculo)');
          const rows = (data || []).map((r: any, index: number) => [
            (index + 1).toString(),
            `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
            r.roadbooks?.espetaculo || "",
            r.data ? new Date(r.data + "T12:00:00").toLocaleDateString('pt-BR') : "-",
            r.horario ? r.horario.substring(0, 5) + "h" : "-",
            r.atividade || "-",
            r.publico_presente || "",
            r.publico_majoritario?.join(", ") || ""
          ]);
          autoTable(doc, { startY: y, head: [['#', 'Cidade', 'Espetáculo', 'Data', 'Horário', 'Atividade', 'Público', 'Tipo']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "vendas") {
          let y = drawHeaderPDF(doc, "Vendas Gerais", logoData);
          const { data } = await supabase.from('vendas_registros').select('*, produto:vendas_produtos(nome), evento:eventos(cidade, local, data)');
          const rows = (data || []).map((v: any) => [
            v.data_venda ? new Date(v.data_venda.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : (v.evento?.data ? new Date(v.evento.data.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Geral'),
            v.produto?.nome || '-',
            v.evento ? `${v.evento.cidade} (${v.evento.local})` : "-",
            v.quantidade?.toString() || '0',
            v.valor_total ? `R$ ${v.valor_total.toFixed(2)}` : '-'
          ]);
          autoTable(doc, { startY: y, head: [['Data', 'Produto', 'Evento/Cidade', 'Quantidade', 'Total']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "midias_cronograma") {
          let y = drawHeaderPDF(doc, "Mídias - Cronograma de Postagens", logoData);
          const { data } = await supabase.from('midias_cronograma').select('*').order('data_postagem', { ascending: true });
          const rows = (data || []).map((m: any) => [
            m.data_postagem ? new Date(m.data_postagem + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
            m.espetaculo || '-',
            m.rede_social || '-',
            m.formato || '-',
            m.status || '-',
            (m.descricao || '').substring(0, 50) + ((m.descricao || '').length > 50 ? '...' : '')
          ]);
          autoTable(doc, { startY: y, head: [['Data', 'Espetáculo', 'Rede', 'Formato', 'Status', 'Legenda']], body: rows, theme: 'striped', headStyles: { fillColor: [15, 23, 42] } });
        }
        else if (repId === "midias_divulgacoes") {
          let y = drawHeaderPDF(doc, "Mídias - Divulgações Publicadas", logoData);
          const { data } = await supabase.from('midias_divulgacoes').select('*').order('data_publicacao', { ascending: false });
          
          if (!data || data.length === 0) {
            doc.text("Nenhuma divulgação registrada.", 14, y);
          } else {
            (data || []).forEach((div: any) => {
              if (y > 250) {
                doc.addPage();
                y = 20;
              }
              
              doc.setFont("helvetica", "bold");
              doc.setFontSize(14);
              doc.setTextColor(15, 23, 42); 
              doc.text(`${div.espetaculo || 'Sem Evento Associado'}`, 14, y);
              y += 6;
              
              doc.setFontSize(10);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(249, 115, 22); // orange-500
              doc.text(`${div.rede_social || 'Link Publicado'}`, 14, y);
              doc.setTextColor(0, 0, 0);
              doc.setFont("helvetica", "normal");
              const dateTxt = `  •  Data: ${div.data_publicacao ? new Date(div.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}`;
              doc.text(dateTxt, 14 + doc.getTextWidth(`${div.rede_social || 'Link Publicado'}`), y);
              y += 5;
              
              if (div.link) {
                doc.text('Visualizar Post: ', 14, y);
                doc.setTextColor(37, 99, 235);
                const textWidth = doc.getTextWidth('Visualizar Post: ');
                doc.textWithLink(div.link.substring(0, 70) + (div.link.length > 70 ? '...' : ''), 14 + textWidth, y, { url: div.link });
                doc.setTextColor(0, 0, 0);
                y += 5;
              }
              
              if (div.observacoes) {
                doc.setTextColor(71, 85, 105);
                const lines = doc.splitTextToSize(`Notas / Engajamento: ${div.observacoes}`, 180);
                doc.text(lines, 14, y);
                y += (lines.length * 5);
                doc.setTextColor(0, 0, 0);
              }
              
              y += 8; 
            });
          }
        }
      }

      const safeName = `Relatorios_Consolidados`.replace(/[/?%*:|"<>']/g, '-').trim();
      doc.save(`${safeName}.pdf`);
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
          ws.columns = [{ width: 22 }, { width: 40 }, { width: 20 }, { width: 30 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Catering Cardápio - ${eventoFull?.espetaculo || ''}`;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Item', 'Produto', 'Qtd', 'Destino'];
          
          const { data } = await supabase.from('catering_eventos').select('*').eq('evento_id', selectedEventoId).order('ordem');
          (data || []).forEach((c: any, idx: number) => ws.addRow([(idx + 1).toString(), c.produto, c.quantidade ? `${c.quantidade} ${c.unidade}` : '-', c.camarins?.length ? c.camarins.join(', ') : 'Geral']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "catering_restricoes") {
          const ws = workbook.addWorksheet('Catering - Restrições');
          ws.columns = [{ width: 22 }, { width: 40 }, { width: 30 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Catering Restrições - ${eventoFull?.espetaculo || ''}`;
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
          ws.columns = [{ width: 22 }, { width: 40 }, { width: 30 }, { width: 30 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Palco Props - ${eventoFull?.espetaculo || ''}`;
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
          ws.columns = [{ width: 22 }, { width: 30 }, { width: 50 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Camarins - ${eventoFull?.espetaculo || ''}`;
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
          ws.columns = [{ width: 22 }, { width: 30 }, { width: 30 }, { width: 40 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Figurinos - ${eventoFull?.espetaculo || ''}`;
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
          ws.getCell('B1').value = `Contatos Turnê `;
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
          ws.getCell('B1').value = `Dados Pessoais `;
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
          ws.columns = [{ width: 30 }, { width: 30 }, { width: 35 }, { width: 20 }, { width: 20 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Imprensa - Mailing `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Veículo', 'Nome do Contato', 'Tipo de Mídia', 'Email', 'Telefone'];
          const { data } = await supabase.from('imprensa_mailing').select('*');
          (data || []).forEach((m: any) => ws.addRow([m.veiculo || '-', m.nome || '-', m.tipo_midia || '-', m.email || '-', m.telefone || '-']));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "imprensa_clipping") {
          const ws = workbook.addWorksheet('Clipping');
          ws.columns = [{ width: 25 }, { width: 25 }, { width: 40 }, { width: 15 }, { width: 15 }, { width: 40 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 10 }, { width: 12 }, { width: 10 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Imprensa - Clipping `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Espetáculo', 'Veículo', 'Matéria', 'Data', 'Sentimento', 'Link', 'Geo', 'Público', 'Autoridade', 'CTA', 'Score Total', 'Tier'];
          const { data } = await supabase.from('imprensa_clipping').select('*');
          (data || []).forEach((c: any) => {
            const num = (v: any) => (v === null || v === undefined || v === '' ? '-' : Number(v));
            const avaliada = !!c.relevancia_tier;
            ws.addRow([
              c.espetaculo || '-', c.veiculo, c.titulo_materia || '-', 
              c.data_publicacao ? new Date(c.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
              (c.sentimento || '').toUpperCase(), c.link_materia || '-',
              num(c.relevancia_geo), num(c.relevancia_publico), num(c.relevancia_autoridade), num(c.relevancia_cta),
              avaliada ? c.relevancia_score : '-', c.relevancia_tier || 'Não avaliada'
            ]);
          });
          applyExcelStyles(ws, 3);
        }
        else if (repId === "rooming_list") {
            const ws = workbook.addWorksheet('Rooming List');
            ws.columns = [{ width: 35 }, { width: 15 }, { width: 20 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 35 }];
            drawLogoExcel(ws);
            ws.getCell('B1').value = `Rooming List `;
            ws.getCell('B1').font = { size: 16, bold: true };
            ws.getCell('B1').alignment = { vertical: 'middle' };
            
            const header = ws.getRow(3);
            header.values = ['Evento', 'Quarto', 'Tipo', 'Hóspede 1', 'Hóspede 2', 'Hóspede 3', 'Obs'];
            const { data } = await supabase.from('rooming_list').select('*, evento:eventos(cidade, local, espetaculo)');
            (data || []).forEach((r: any) => ws.addRow([
              r.evento ? `${r.evento.cidade} (${r.evento.espetaculo})` : "-",
              r.numero_quarto || "S/N",
              r.tipo_quarto || "-",
              r.hospede_1 || "-",
              r.hospede_2 || "-",
              r.hospede_3 || "-",
              r.observacoes || "-"
            ]));
            applyExcelStyles(ws, 3);
          }
          else if (repId === "publico") {
          const ws = workbook.addWorksheet('Público');
          ws.columns = [{ width: 22 }, { width: 25 }, { width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Público `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['#', 'Cidade', 'Espetáculo', 'Data', 'Horário', 'Atividade', 'Público', 'Tipo'];
          const { data } = await supabase.from('relatorio_publico').select('*, roadbooks(cidade, estado, espetaculo)');
          (data || []).forEach((r: any, index: number) => ws.addRow([
            index + 1,
            `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
            r.roadbooks?.espetaculo || "",
            r.data ? new Date(r.data + "T12:00:00").toLocaleDateString('pt-BR') : "-",
            r.horario ? r.horario.substring(0, 5) + "h" : "-",
            r.atividade || "-",
            r.publico_presente || "",
            r.publico_majoritario?.join(", ") || ""
          ]));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "vendas") {
          const ws = workbook.addWorksheet('Vendas');
          ws.columns = [{ width: 22 }, { width: 35 }, { width: 35 }, { width: 15 }, { width: 20 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Vendas `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Data', 'Produto', 'Evento/Cidade', 'Quantidade', 'Total'];
          const { data } = await supabase.from('vendas_registros').select('*, produto:vendas_produtos(nome), evento:eventos(cidade, local, data)');
          (data || []).forEach((v: any) => ws.addRow([
            v.data_venda ? new Date(v.data_venda.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : (v.evento?.data ? new Date(v.evento.data.substring(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Geral'),
            v.produto?.nome || '-',
            v.evento ? `${v.evento.cidade} (${v.evento.local})` : "-",
            v.quantidade?.toString() || '0',
            v.valor_total ? `R$ ${v.valor_total.toFixed(2)}` : '-'
          ]));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "midias_cronograma") {
          const ws = workbook.addWorksheet('Mídias - Cronograma');
          ws.columns = [{ width: 22 }, { width: 35 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 50 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Mídias - Cronograma de Postagens `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Data', 'Espetáculo', 'Rede Social', 'Formato', 'Status', 'Briefing/Legenda'];
          const { data } = await supabase.from('midias_cronograma').select('*').order('data_postagem', { ascending: true });
          (data || []).forEach((m: any) => ws.addRow([
            m.data_postagem ? new Date(m.data_postagem + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
            m.espetaculo || '-',
            m.rede_social || '-',
            m.formato || '-',
            m.status || '-',
            m.descricao || '-'
          ]));
          applyExcelStyles(ws, 3);
        }
        else if (repId === "midias_divulgacoes") {
          const ws = workbook.addWorksheet('Mídias - Divulgações');
          ws.columns = [{ width: 22 }, { width: 35 }, { width: 20 }, { width: 40 }, { width: 50 }];
          drawLogoExcel(ws);
          ws.getCell('B1').value = `Mídias - Divulgações Publicadas `;
          ws.getCell('B1').font = { size: 16, bold: true };
          ws.getCell('B1').alignment = { vertical: 'middle' };
          
          const header = ws.getRow(3);
          header.values = ['Data', 'Espetáculo', 'Rede Social', 'Link', 'Observações'];
          const { data } = await supabase.from('midias_divulgacoes').select('*').order('data_publicacao', { ascending: false });
          (data || []).forEach((m: any) => ws.addRow([
            m.data_publicacao ? new Date(m.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
            m.espetaculo || '-',
            m.rede_social || '-',
            m.link || '-',
            m.observacoes || '-'
          ]));
          applyExcelStyles(ws, 3);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Relatorios_Consolidados`.replace(/[/?%*:|"<>']/g, '-').trim();
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
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
        <Printer className="size-8 text-blue-600" />
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
                {eventoFull?.data && <p className="text-sm text-slate-500">{new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR')} {eventoFull?.cidade ? `- ${eventoFull.cidade}` : ''}</p>}
              </div>
              <Button variant="outline" onClick={() => setSelectedEventoId("")}>&larr; Trocar Evento</Button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700">Selecione os Relatórios</h3>
                <Button variant="secondary" onClick={selectAll}>Marcar Todos</Button>
              </div>

              <div className="space-y-6 mb-8">
                {REPORT_GROUPS.map(group => (
                  <div key={group.name} className="bg-transparent">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">{group.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
                      {group.options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 py-1 cursor-pointer text-slate-700 hover:text-primary transition-colors">
                          <Checkbox checked={!!selectedReports[opt.id]} onCheckedChange={() => toggleReport(opt.id)} />
                          <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
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

