const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/rooming-list.tsx', 'utf8');

// 1. Add DropdownMenu imports
if (!content.includes('DropdownMenu,')) {
    content = content.replace('import { Dialog,', 'import {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuTrigger,\n} from "@/components/ui/dropdown-menu";\nimport { Dialog,');
}
if (!content.includes('Download')) {
    content = content.replace('FileText, FileSpreadsheet }', 'FileText, FileSpreadsheet, Download }');
}

// 2. Change landscape to portrait
content = content.replace('new jsPDF("landscape")', 'new jsPDF("portrait")');

// 3. Replace the two buttons with a Dropdown
const buttonsBlock = `<Button onClick={exportToPDF} variant="secondary" className="gap-2"><FileText className="size-4" /> PDF</Button>
                <Button onClick={exportToExcel} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><FileSpreadsheet className="size-4" /> Excel</Button>`;

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

content = content.replace(buttonsBlock, dropdownBlock);

fs.writeFileSync('src/routes/_authenticated/rooming-list.tsx', content, 'utf8');
