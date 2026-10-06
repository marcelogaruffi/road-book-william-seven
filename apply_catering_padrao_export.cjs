const fs = require('fs');

const filePath = 'src/components/CateringPadraoTab.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add required imports
const imports = `import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import pkg from "file-saver";
const { saveAs } = pkg;
import { ReportExportButton } from "@/components/ReportExportButton";
`;
content = content.replace('import { Select,', imports + '\nimport { Select,');

// 2. Add Export Logic
const exportLogic = `
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
    doc.text(\`Espetáculo: \${selectedEspetaculo}\`, textX, y + 11);
    
    return finalY;
  };

  const exportPadraoExcel = async () => {
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo.");
    toast.info("Gerando Excel do Padrão...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Catering Padrão');

      worksheet.columns = [
        { key: 'ordem', width: 10 },
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
        worksheet.getCell('B1').value = \`Catering Padrão - \${selectedEspetaculo}\`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = \`Catering Padrão - \${selectedEspetaculo}\`;
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
          quantidade: c.quantidade ? \`\${c.quantidade} \${c.unidade}\` : '-'
        });
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = \`Catering_Padrao_\${selectedEspetaculo}\`.replace(/[\\\\/\\\\?%*:|"<>\']/g, '-').replace(/\\s+/g, ' ').trim();
      saveAs(new Blob([buffer]), \`\${safeName}.xlsx\`);
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
        c.quantidade ? \`\${c.quantidade} \${c.unidade}\` : \`-\`
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

      const safeName = \`Catering_Padrao_\${selectedEspetaculo}\`.replace(/[\\\\/\\\\?%*:|"<>\']/g, '-').replace(/\\s+/g, ' ').trim();
      doc.save(\`\${safeName}.pdf\`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
    }
  };
`;

content = content.replace('const handleSaveItem = async () => {', exportLogic + '\n  const handleSaveItem = async () => {');

// 3. Inject the ReportExportButton near the SelectEspetaculo
content = content.replace(
  '</SelectContent>\n        </Select>\n      </div>',
  '</SelectContent>\n        </Select>\n\n        {selectedEspetaculo && itens.length > 0 && (\n          <div className="ml-auto">\n            <ReportExportButton onExportPdf={exportPadraoPDF} onExportExcel={exportPadraoExcel} />\n          </div>\n        )}\n      </div>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated CateringPadraoTab.tsx");
