const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/camarins.index.tsx', 'utf8');

// Ensure import ReportExportButton
if (!code.includes('ReportExportButton')) {
  code = code.replace(/import \{ Button \} from "@\/components\/ui\/button";/, `import { Button } from "@/components/ui/button";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}

// Replace Catering Buttons
const cateringRegex = /<Button onClick=\{exportCateringPDF\}[\s\S]*?<\/Button>\s*<Button onClick=\{exportCateringExcel\}[\s\S]*?<\/Button>/;
code = code.replace(cateringRegex, `<ReportExportButton onExportPdf={exportCateringPDF} onExportExcel={exportCateringExcel} />`);

// Replace Camarins Buttons
const camarinsRegex = /<Button onClick=\{imprimirCamarins\}[\s\S]*?<\/Button>\s*<Button onClick=\{exportCamarinsExcel\}[\s\S]*?<\/Button>/;
code = code.replace(camarinsRegex, `<ReportExportButton onExportPdf={imprimirCamarins} onExportExcel={exportCamarinsExcel} />`);

fs.writeFileSync('src/routes/_authenticated/camarins.index.tsx', code, 'utf8');
