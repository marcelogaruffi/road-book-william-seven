const fs = require('fs');
let lines = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

const newPdfFunc = `  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;
    if (logoData) {
      const imgWidth = 40;
      const imgHeight = (logoData.height / logoData.width) * imgWidth;
      const x = (pageWidth - imgWidth) / 2;
      doc.addImage(logoData.base64, 'PNG', x, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    }
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const infoText = \`Espetáculo: \${eventoFull?.espetaculo || '-'} | Evento: \${eventoFull?.cidade || '-'} - \${eventoFull?.local || '-'} \${eventoFull?.data ? '(' + new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR') + ')' : ''}\`;
    doc.text(infoText, pageWidth / 2, y, { align: 'center' });
    return y + 8;
  };`;

// replace PDF header func
lines = lines.replace(/  const drawHeaderPDF = [\s\S]*?    return y;\n  };\n/g, newPdfFunc + '\n');

// fix EXCEL distorted image
// Before: ext: { width: 120, height: 40 }
// Now: calculate imgHeight Excel correctly
lines = lines.replace(/worksheet.addImage\(imageId, \{ tl: \{ col: 0, row: 0 \}, ext: \{ width: 120, height: 40 \} \}\);/g, `
          const imgWidthExcel = 120;
          const imgHeightExcel = (logoData.height / logoData.width) * imgWidthExcel;
          worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });`);


// In Excel, Palco merges cells and centers the title instead of putting it on B1!
// Let's do the same!
// Replace: worksheet.mergeCells('B1:C1'); worksheet.getCell('B1').value = ...
lines = lines.replace(/worksheet\.mergeCells\('B1:C1'\);/g, "worksheet.mergeCells('D1:F1');\n          worksheet.getRow(1).height = 60;");
lines = lines.replace(/worksheet\.getCell\('B1'\)/g, "worksheet.getCell('D1')");
lines = lines.replace(/worksheet\.getCell\('A1'\)/g, "worksheet.getCell('D1')");
lines = lines.replace(/worksheet\.mergeCells\('A1:C1'\);/g, "worksheet.mergeCells('D1:F1');\n          worksheet.getRow(1).height = 60;");

lines = lines.replace(/worksheet\.mergeCells\('B1:D1'\);/g, "worksheet.mergeCells('E1:G1');\n          worksheet.getRow(1).height = 60;");
lines = lines.replace(/worksheet\.getCell\('B1'\)/g, "worksheet.getCell('E1')");
lines = lines.replace(/worksheet\.getCell\('A1'\)/g, "worksheet.getCell('E1')");
lines = lines.replace(/worksheet\.mergeCells\('A1:D1'\);/g, "worksheet.mergeCells('E1:G1');\n          worksheet.getRow(1).height = 60;");


fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', lines);
console.log("Fixed PDF and EXCEL layouts");
