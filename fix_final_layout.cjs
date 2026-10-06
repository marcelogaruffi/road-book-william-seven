const fs = require('fs');
let lines = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');

const newPdfFunc = `  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
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
    doc.text(\`Espetáculo: \${eventoFull?.espetaculo || '-'}\`, textX, y + 11);
    doc.text(\`Data: \${eventoFull?.data ? new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}\`, textX, y + 16);
    doc.text(\`Local: \${eventoFull?.local || '-'} - \${eventoFull?.cidade || '-'}\`, textX, y + 21);
    
    return finalY;
  };`;

// We use string replacement to be extremely exact.
const startIdx = lines.indexOf('  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {');
const endStr = '      return y;\n    };\n';
const endIdx = lines.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    lines = lines.slice(0, startIdx) + newPdfFunc + '\n' + lines.slice(endIdx + endStr.length);
} else {
    console.error("Could not find drawHeaderPDF");
}

// Fix Excel Layouts back to B1:D1
lines = lines.replace(/worksheet\.mergeCells\('D1:F1'\);/g, "worksheet.mergeCells('B1:D1');");
lines = lines.replace(/worksheet\.getCell\('D1'\)/g, "worksheet.getCell('B1')");

lines = lines.replace(/worksheet\.mergeCells\('E1:G1'\);/g, "worksheet.mergeCells('B1:D1');");
lines = lines.replace(/worksheet\.getCell\('E1'\)/g, "worksheet.getCell('B1')");

fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', lines);
console.log("Layout fixed successfully");
