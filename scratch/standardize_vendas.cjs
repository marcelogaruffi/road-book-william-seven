const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');

// Ensure import ReportExportButton
if (!code.includes('ReportExportButton')) {
  code = code.replace(/import { Button } from "@/components/ui/button";/, `import { Button } from "@/components/ui/button";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}

// Replace the two buttons with ReportExportButton
const oldButtons = /<Button variant="outline" onClick=\{exportExcel\}>[\s\S]*?<\/Button>\s*<Button variant="outline" onClick=\{exportPDF\}>[\s\S]*?<\/Button>/;
code = code.replace(oldButtons, `<ReportExportButton onExportPdf={exportPDF} onExportExcel={exportExcel} />`);

fs.writeFileSync('src/routes/_authenticated/vendas.tsx', code, 'utf8');
