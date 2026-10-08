const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

const imports = `import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { FileText, FileSpreadsheet } from "lucide-react";
`;

content = content.replace('import { BedDouble', imports + 'import { BedDouble');

const exportFns = `
  const exportToExcel = async () => {
    if (!quartos.length) return toast.error("Nenhum quarto para exportar.");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rooming List");
    
    sheet.columns = [
      { header: "Quarto", key: "quarto", width: 15 },
      { header: "Tipo", key: "tipo", width: 20 },
      { header: "Hóspede 1", key: "h1", width: 25 },
      { header: "Hóspede 2", key: "h2", width: 25 },
      { header: "Hóspede 3", key: "h3", width: 25 },
      { header: "Observações", key: "obs", width: 30 },
    ];
    
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    quartos.forEach(q => {
      sheet.addRow({
        quarto: q.numero_quarto,
        tipo: q.tipo_quarto,
        h1: q.hospede_1 || "",
        h2: q.hospede_2 || "",
        h3: q.hospede_3 || "",
        obs: q.observacoes || ""
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), \`RoomingList_\${eventoData?.espetaculo}_\${eventoData?.cidade}.xlsx\`);
  };

  const exportToPDF = async () => {
    if (!quartos.length) return toast.error("Nenhum quarto para exportar.");
    const doc = new jsPDF("landscape");
    
    doc.setFontSize(20);
    doc.text("Rooming List", 14, 22);
    doc.setFontSize(11);
    doc.text(\`Espetáculo: \${eventoData?.espetaculo}\`, 14, 30);
    doc.text(\`Local: \${eventoData?.cidade} - \${eventoData?.local}\`, 14, 36);
    
    const tableData = quartos.map(q => [
      q.numero_quarto || "S/N",
      q.tipo_quarto,
      q.hospede_1 || "",
      q.hospede_2 || "",
      q.hospede_3 || "",
      q.observacoes || ""
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [["Quarto", "Tipo", "Hóspede 1", "Hóspede 2", "Hóspede 3", "Observações"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });
    
    doc.save(\`RoomingList_\${eventoData?.espetaculo}_\${eventoData?.cidade}.pdf\`);
  };
`;

content = content.replace('function openEdit(r: RoomingList) {', exportFns + '\n  function openEdit(r: RoomingList) {');

const buttons = `
                <Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>
                <Button variant="outline" onClick={() => setSelectedEventoId("")}>Voltar</Button>
`;

content = content.replace('<Button variant="outline" onClick={() => setSelectedEventoId("")}>Voltar</Button>', buttons);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
