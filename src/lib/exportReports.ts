import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { IngressoItem } from "@/routes/_authenticated/ingressos.emissao";

async function carregarLogoSevenBase64(): Promise<{ base64: string; width: number; height: number } | null> {
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
    return { base64, width: img.naturalWidth || 140, height: img.naturalHeight || 70 };
  } catch {
    return null;
  }
}

// ==========================================
// 1. EXPORTAÇÃO DE INGRESSOS EM EXCEL
// ==========================================
export async function exportarIngressosExcel(ingressos: IngressoItem[], espetaculoNome: string, cidade: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Ingressos Emitidos");

  // Definir larguras de colunas
  worksheet.getColumn(1).width = 22; // Código
  worksheet.getColumn(2).width = 32; // Titular
  worksheet.getColumn(3).width = 18; // CPF
  worksheet.getColumn(4).width = 20; // Telefone
  worksheet.getColumn(5).width = 28; // E-mail
  worksheet.getColumn(6).width = 22; // Tipo
  worksheet.getColumn(7).width = 26; // Setor
  worksheet.getColumn(8).width = 10; // Fila
  worksheet.getColumn(9).width = 12; // Poltrona
  worksheet.getColumn(10).width = 24; // Porta
  worksheet.getColumn(11).width = 16; // Data Emissão
  worksheet.getColumn(12).width = 16; // Status

  let headerRowNumber = 1;

  // Carregar e estampar Logo da Produtora
  const logoData = await carregarLogoSevenBase64();
  if (logoData) {
    try {
      const imgWidthExcel = 140;
      const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
      const imageId = workbook.addImage({
        base64: logoData.base64,
        extension: "png"
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: imgWidthExcel, height: imgHeightExcel }
      });

      // Bloco de Título e Metadados
      worksheet.mergeCells("D1:L2");
      const titleCell = worksheet.getCell("D1");
      titleCell.value = "RELATÓRIO OFICIAL DE INGRESSOS E CORTESIAS";
      titleCell.font = { size: 15, bold: true, color: { argb: "FF1E1B4B" } }; // Indigo 950
      titleCell.alignment = { vertical: "middle", horizontal: "left" };

      worksheet.mergeCells("D3:L4");
      const infoCell = worksheet.getCell("D3");
      const agoraStr = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      infoCell.value = `Espetáculo: ${(espetaculoNome || "Não informado").toUpperCase()}   |   Praça: ${(cidade || "Geral").toUpperCase()}\nEmitido em: ${agoraStr}   |   Total de bilhetes: ${ingressos.length}`;
      infoCell.font = { size: 9.5, color: { argb: "FF475569" }, italic: true }; // Slate 600
      infoCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

      headerRowNumber = 6;
    } catch (e) {
      console.warn("Logo no excel aviso:", e);
      headerRowNumber = 1;
    }
  }

  // Linha do Cabeçalho da Tabela
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = [
    "Código",
    "Titular / Convidado",
    "CPF",
    "Telefone / WhatsApp",
    "E-mail",
    "Tipo de Ingresso",
    "Setor",
    "Fila",
    "Poltrona",
    "Porta de Acesso",
    "Data Emissão",
    "Status"
  ];

  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF312E81" } // Indigo 900
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E1B4B" } },
      left: { style: "thin", color: { argb: "FF1E1B4B" } },
      bottom: { style: "medium", color: { argb: "FF1E1B4B" } },
      right: { style: "thin", color: { argb: "FF1E1B4B" } }
    };
  });

  // Linhas de dados
  ingressos.forEach((ing, index) => {
    const row = worksheet.addRow([
      ing.codigoIngresso,
      ing.titularNome,
      ing.titularCpf || "-",
      ing.telefone || "-",
      ing.email || "-",
      ing.tipoIngresso,
      ing.setor,
      ing.fileira,
      ing.assento,
      ing.portaAcesso || "Geral",
      ing.dataEmissao,
      ing.status ? ing.status.toUpperCase() : "EMITIDO"
    ]);

    row.height = 20;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? "FFFFFFFF" : "FFF8FAFC"; // Branco vs Slate 50

    row.eachCell((cell, colNumber) => {
      cell.font = { size: 9, color: { argb: "FF0F172A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgArgb }
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      // Alinhamentos específicos
      if (colNumber === 1 || colNumber === 8 || colNumber === 9 || colNumber === 11 || colNumber === 12) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }

      if (colNumber === 1) {
        cell.font = { bold: true, size: 9, color: { argb: "FF312E81" } };
      }
      if (colNumber === 2) {
        cell.font = { bold: true, size: 9, color: { argb: "FF0F172A" } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const nomeEspetaculoLimpo = (espetaculoNome || "Espetaculo").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cidadeLimpa = (cidade || "Praca").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dataHoje = new Date().toISOString().split("T")[0];
  
  saveAs(blob, `Relatorio_Ingressos_${nomeEspetaculoLimpo}_${cidadeLimpa}_${dataHoje}.xlsx`);
}

// ==========================================
// 2. EXPORTAÇÃO DE INGRESSOS EM PDF
// ==========================================
export async function exportarIngressosRelatorioPDF(ingressos: IngressoItem[], espetaculoNome: string, cidade: string, teatro: string) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const bannerH = 26;
  // Cabeçalho Oficial Azul/Indigo 950
  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, 297, bannerH, "F");

  // Logo da Produtora Seven
  const logoData = await carregarLogoSevenBase64();
  let textStartX = 14;
  if (logoData) {
    try {
      const imgW = 32;
      const imgH = (logoData.height / logoData.width) * imgW;
      const posY = (bannerH - imgH) / 2;
      doc.addImage(logoData.base64, "PNG", 14, posY, imgW, imgH);
      textStartX = 14 + imgW + 8;
    } catch (e) {
      console.warn("Logo fallback:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RELATÓRIO DE INGRESSOS E CORTESIAS EMITIDAS", textStartX, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(224, 231, 255); // Indigo 100
  const subTexto = `${(espetaculoNome || "ESPETÁCULO").toUpperCase()} • ${(cidade || "CIDADE").toUpperCase()} • ${(teatro || "TEATRO").toUpperCase()}`;
  doc.text(subTexto, textStartX, 18);

  const agora = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  doc.setFontSize(7.5);
  doc.setTextColor(199, 210, 254); // Indigo 200
  doc.text(`Emitido em: ${agora} | Total: ${ingressos.length} bilhetes`, 297 - 14, 18, { align: "right" });

  // Tabela
  const body = ingressos.map((ing) => [
    ing.codigoIngresso,
    ing.titularNome,
    ing.titularCpf || "-",
    ing.telefone || "-",
    ing.tipoIngresso,
    ing.setor,
    ing.fileira,
    ing.assento,
    ing.portaAcesso || "Geral",
    ing.dataEmissao
  ]);

  autoTable(doc, {
    startY: bannerH + 5,
    head: [["Código", "Titular", "CPF", "Telefone", "Tipo", "Setor", "Fila", "Poltrona", "Porta", "Emissão"]],
    body,
    theme: "striped",
    headStyles: {
      fillColor: [67, 56, 202], // Indigo 700
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 32 },
      1: { fontStyle: "bold", cellWidth: 46 },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "center", cellWidth: 26 },
      5: { cellWidth: 40 },
      6: { halign: "center", cellWidth: 12 },
      7: { halign: "center", fontStyle: "bold", cellWidth: 16 },
      8: { cellWidth: 28 },
      9: { halign: "center", cellWidth: 20 }
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Rodapé
      const str = `Página ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 297 / 2, 205, { align: "center" });
      doc.text("WILLIAM SEVEN PRODUÇÕES • SISTEMA ÁXIS", 14, 205);
    }
  });

  const nomeEspetaculoLimpo = (espetaculoNome || "Espetaculo").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cidadeLimpa = (cidade || "Praca").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dataHoje = new Date().toISOString().split("T")[0];

  doc.save(`Lista_Ingressos_${nomeEspetaculoLimpo}_${cidadeLimpa}_${dataHoje}.pdf`);
}

// ==========================================
// 3. EXPORTAÇÃO DE CONTRATOS EM EXCEL
// ==========================================
export async function exportarContratosExcel(contratos: any[], espetaculoNome?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Contratos Emitidos");

  worksheet.columns = [
    { header: "Número / Código", key: "numero", width: 22 },
    { header: "Contratado / Nome", key: "contratado", width: 32 },
    { header: "CPF / CNPJ", key: "documento", width: 20 },
    { header: "Função / Cargo", key: "funcao", width: 24 },
    { header: "Espetáculo / Turnê", key: "espetaculo", width: 30 },
    { header: "Praça / Cidade", key: "cidade", width: 20 },
    { header: "Valor Total (R$)", key: "valor", width: 18 },
    { header: "Data Início", key: "dataInicio", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Assinatura", key: "assinatura", width: 16 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" } // Slate 900
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 28;

  contratos.forEach((c, index) => {
    const row = worksheet.addRow({
      numero: c.numero_contrato || c.codigo || c.id?.slice(0, 8),
      contratado: c.contratado_nome || c.nome || "Não informado",
      documento: c.contratado_documento || c.cpf || c.cnpj || "-",
      funcao: c.funcao || c.cargo || "Equipe",
      espetaculo: c.espetaculo || c.turne || espetaculoNome || "Geral",
      cidade: c.cidade || c.praca || "-",
      valor: typeof c.valor === "number" ? c.valor : Number(c.valor_total) || 0,
      dataInicio: c.data_inicio || c.data || "-",
      status: (c.status || "Ativo").toUpperCase(),
      assinatura: c.assinado ? "ASSINADO" : "PENDENTE"
    });

    if (index % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" }
      };
    }
    row.height = 20;
    row.alignment = { vertical: "middle" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const nomeEspetaculoLimpo = (espetaculoNome || "Geral").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dataHoje = new Date().toISOString().split("T")[0];
  
  saveAs(blob, `Relatorio_Contratos_${nomeEspetaculoLimpo}_${dataHoje}.xlsx`);
}

// ==========================================
export async function exportarContratosRelatorioPDF(contratos: any[], espetaculoNome?: string) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const bannerH = 26;
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 297, bannerH, "F");

  // Logo da Produtora Seven
  const logoData = await carregarLogoSevenBase64();
  let textStartX = 14;
  if (logoData) {
    try {
      const imgW = 32;
      const imgH = (logoData.height / logoData.width) * imgW;
      const posY = (bannerH - imgH) / 2;
      doc.addImage(logoData.base64, "PNG", 14, posY, imgW, imgH);
      textStartX = 14 + imgW + 8;
    } catch (e) {
      console.warn("Logo fallback:", e);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("LISTAGEM DE CONTRATOS EMITIDOS", textStartX, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`ESPETÁCULO / TURNÊ: ${(espetaculoNome || "TODOS OS CONTRATOS").toUpperCase()}`, textStartX, 18);

  const agora = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Emitido em: ${agora} | Total: ${contratos.length} contratos`, 297 - 14, 18, { align: "right" });

  const body = contratos.map((c) => [
    c.numero_contrato || c.codigo || c.id?.slice(0, 8),
    c.contratado_nome || c.nome || "Não informado",
    c.contratado_documento || c.cpf || c.cnpj || "-",
    c.funcao || c.cargo || "Equipe",
    c.espetaculo || c.turne || espetaculoNome || "Geral",
    c.cidade || "-",
    `R$ ${(Number(c.valor || c.valor_total) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    c.data_inicio || c.data || "-",
    (c.status || "Ativo").toUpperCase()
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["Número", "Contratado", "Documento", "Função", "Espetáculo", "Praça", "Valor", "Data", "Status"]],
    body,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "center", cellWidth: 26 },
      1: { fontStyle: "bold", cellWidth: 48 },
      2: { halign: "center", cellWidth: 30 },
      3: { cellWidth: 34 },
      4: { cellWidth: 40 },
      5: { cellWidth: 28 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 28 },
      7: { halign: "center", cellWidth: 22 },
      8: { halign: "center", cellWidth: 20 }
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      const str = `Página ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 297 / 2, 205, { align: "center" });
      doc.text("WILLIAM SEVEN PRODUÇÕES • SISTEMA ÁXIS", 14, 205);
    }
  });

  const nomeEspetaculoLimpo = (espetaculoNome || "Geral").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dataHoje = new Date().toISOString().split("T")[0];

  doc.save(`Lista_Contratos_${nomeEspetaculoLimpo}_${dataHoje}.pdf`);
}
