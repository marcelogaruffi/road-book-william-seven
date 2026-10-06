const fs = require('fs');
const f = 'src/routes/_authenticated/camarins.index.tsx';
let t = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!t.includes(a)) console.log('NOT FOUND:', a.slice(0, 60)); t = t.replace(a, b); };

rep('pdfDoc.text("Camarins", 55, 18);', "pdfDoc.text(\"Camarins\", pdfDoc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });");
rep("{timeZone:'UTC'})})`, 55, 24);", "{timeZone:'UTC'})})`, pdfDoc.internal.pageSize.getWidth() / 2, 24, { align: 'center' });");
rep('doc.text(camarim, 14, 38);', "doc.text(camarim, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });");
rep('<Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>', '<ReportExportButton onExportPdf={exportToPDF} onExportExcel={exportToExcel} />');
rep('<Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>', '');

fs.writeFileSync(f, t, 'utf8');
console.log('done');
