const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/publico.tsx', 'utf8');

// Ensure import ReportExportButton
if (!code.includes('ReportExportButton')) {
  code = code.replace(/import autoTable from "jspdf-autotable";/, `import autoTable from "jspdf-autotable";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}

// Replace the two buttons with ReportExportButton
const oldButtons = /<Button onClick=\{exportExcel\}[^>]*>[\s\S]*?<\/Button>\s*<Button onClick=\{exportPDF\}[^>]*>[\s\S]*?<\/Button>/;
code = code.replace(oldButtons, `<ReportExportButton onExportPdf={exportPDF} onExportExcel={exportExcel} />`);

fs.writeFileSync('src/routes/_authenticated/publico.tsx', code, 'utf8');
