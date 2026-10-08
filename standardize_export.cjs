const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

// Inject utils
const utilsBlock = `
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
    doc.text(\`Espetáculo: \${eventoData?.espetaculo || '-'}\`, textX, y + 11);
    doc.text(\`Data: \${eventoData?.data ? new Date(eventoData.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}\`, textX, y + 16);
    doc.text(\`Local: \${eventoData?.local || '-'} - \${eventoData?.cidade || '-'}\`, textX, y + 21);
    
    return finalY;
  };
`;

content = content.replace('const exportToExcel = async () => {', utilsBlock + '\n\n  const exportToExcel = async () => {');

// Rewrite exportToExcel
const excelRegex = /const exportToExcel = async \(\) => \{[\s\S]*?saveAs[^\n]*\n  \};/;
const newExcel = `const exportToExcel = async () => {
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
      worksheet.mergeCells('B1:F1');
      worksheet.getCell('B1').value = \`Rooming List - \${eventoData?.espetaculo || ''}\`;
      worksheet.getCell('B1').font = { size: 16, bold: true };
      worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
      headerRowNumber = 3;
    } else {
      worksheet.getRow(1).height = 60;
      worksheet.mergeCells('A1:F1');
      worksheet.getCell('A1').value = \`Rooming List - \${eventoData?.espetaculo || ''}\`;
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
    const safeName = \`RoomingList - \${eventoData?.espetaculo || 'Evento'} - \${eventoData?.cidade || ''}\`.replace(/[\\/\\\\?%*:|"<>]/g, '-').replace(/\\s+/g, ' ').trim();
    saveAs(new Blob([buffer]), \`\${safeName}.xlsx\`);
    toast.success("Excel gerado com sucesso!");
  };`;

content = content.replace(excelRegex, newExcel);

// Rewrite exportToPDF
const pdfRegex = /const exportToPDF = async \(\) => \{[\s\S]*?doc\.save[^\n]*\n  \};/;
const newPdf = `const exportToPDF = async () => {
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
    
    const safeName = \`RoomingList - \${eventoData?.espetaculo || 'Evento'} - \${eventoData?.cidade || ''}\`.replace(/[\\/\\\\?%*:|"<>]/g, '-').replace(/\\s+/g, ' ').trim();
    doc.save(\`\${safeName}.pdf\`);
    toast.success("PDF gerado com sucesso!");
  };`;

content = content.replace(pdfRegex, newPdf);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
