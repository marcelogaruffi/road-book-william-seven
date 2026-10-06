const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/dados-equipe.tsx', 'utf8');

if (!code.includes('ReportExportButton')) {
  code = code.replace(/import { Button } from "@/components/ui/button";/, `import { Button } from "@/components/ui/button";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}

const oldButtons = /<Button onClick=\{exportExcel\}[\s\S]*?<\/Button>\s*<Button onClick=\{exportPDF\}[\s\S]*?<\/Button>/;
code = code.replace(oldButtons, `<ReportExportButton onExportPdf={exportPDF} onExportExcel={exportExcel} />`);

fs.writeFileSync('src/routes/_authenticated/dados-equipe.tsx', code, 'utf8');
