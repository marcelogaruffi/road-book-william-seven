const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/vendas.tsx', 'utf8');
if (!code.includes('ReportExportButton')) {
  code = code.replace(/import \{ Button \} from "@\/components\/ui\/button";/, `import { Button } from "@/components/ui/button";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}
const oldButtons = /<Button variant="outline" onClick=\{exportExcel\}><Download className="size-4 mr-2" \/> Excel<\/Button>\s*<Button variant="outline" onClick=\{exportPDF\}><Download className="size-4 mr-2" \/> PDF<\/Button>/;
code = code.replace(oldButtons, `<ReportExportButton onExportPdf={exportPDF} onExportExcel={exportExcel} />`);
fs.writeFileSync('src/routes/_authenticated/vendas.tsx', code, 'utf8');

let code2 = fs.readFileSync('src/routes/_authenticated/dados-equipe.tsx', 'utf8');
if (!code2.includes('ReportExportButton')) {
  code2 = code2.replace(/import \{ Button \} from "@\/components\/ui\/button";/, `import { Button } from "@/components/ui/button";\nimport { ReportExportButton } from "@/components/ReportExportButton";`);
}
const oldButtons2 = /<Button onClick=\{exportExcel\}[\s\S]*?<\/Button>\s*<Button onClick=\{exportPDF\}[\s\S]*?<\/Button>/;
code2 = code2.replace(oldButtons2, `<ReportExportButton onExportPdf={exportPDF} onExportExcel={exportExcel} />`);
fs.writeFileSync('src/routes/_authenticated/dados-equipe.tsx', code2, 'utf8');
