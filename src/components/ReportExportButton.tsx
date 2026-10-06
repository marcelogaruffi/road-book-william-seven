import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, FileText, FileSpreadsheet } from "lucide-react";

export function ReportExportButton({ 
  onExportPdf, 
  onExportExcel 
}: { 
  onExportPdf: () => void, 
  onExportExcel: () => void 
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="mr-2 border-slate-200 text-slate-700">
          <Printer className="w-4 h-4 mr-2" /> Gerar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2 text-red-500" /> Exportar em PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Exportar em Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
