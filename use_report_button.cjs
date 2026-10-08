const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

// replace the manual DropdownMenu imports with ReportExportButton
content = content.replace(
`import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`,
`import { ReportExportButton } from "@/components/ReportExportButton";`
);

// replace the JSX
const dropdownBlock = `<DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-white"><Download className="size-4" /> Exportar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer py-2">
                      <FileText className="size-4 text-indigo-600" /> Baixar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer py-2">
                      <FileSpreadsheet className="size-4 text-emerald-600" /> Baixar Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>`;

content = content.replace(dropdownBlock, `<ReportExportButton onExportPdf={exportToPDF} onExportExcel={exportToExcel} />`);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
