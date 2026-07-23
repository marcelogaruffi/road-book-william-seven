import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users } from "lucide-react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/_authenticated/dados-pessoais")({
  head: () => ({ meta: [{ title: "Dados Pessoais - Seven Produções Artísticas" }] }),
  component: DadosPessoaisPage,
});

function DadosPessoaisPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('profiles').select('*').order('nome');
      if (data) setProfiles(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Dados Pessoais");

    let logoBase64;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) {
      console.warn("Logo não carregado", e);
    }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64 as string;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    worksheet.getColumn(1).width = 30; // Nome
    worksheet.getColumn(2).width = 15; // Função
    worksheet.getColumn(3).width = 18; // CPF
    worksheet.getColumn(4).width = 25; // E-mail
    worksheet.getColumn(5).width = 15; // Telefone
    worksheet.getColumn(6).width = 60; // Endereço

    const headerRowNumber = logoBase64 ? 6 : 1;

    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64 as string, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.mergeCells('D1:F4');
      worksheet.getCell('D1').value = 'Diretório de Dados Pessoais da Equipe';
      worksheet.getCell('D1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["Nome", "Função", "CPF", "E-mail", "Telefone", "Endereço Completo"];
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf1f5f9' } };
      cell.font = { bold: true, color: { argb: 'FF334155' } };
      cell.border = { top: { style: 'thin', color: { argb: 'FFcbd5e1' } }, bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } } };
    });

    profiles.forEach((p, index) => {
      const row = worksheet.getRow(headerRowNumber + 1 + index);
      const enderecoStr = [p.endereco_logradouro, p.endereco_numero, p.endereco_complemento, p.endereco_cidade, p.endereco_estado, p.endereco_cep].filter(Boolean).join(', ');

      row.values = [
        p.nome || '',
        p.role ? p.role.toUpperCase() : '',
        p.cpf || '',
        p.email || '',
        p.telefone || '',
        enderecoStr
      ];
      
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFe2e8f0' } } };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Dados_Pessoais_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const filteredProfiles = profiles.filter(p => 
    (p.nome || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.cpf || '').includes(search) || 
    (p.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Dados Pessoais
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Diretório geral com os dados pessoais e endereço de toda a equipe.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, CPF, cargo..." 
              className="pl-9 bg-white dark:bg-black"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={exportExcel} className="shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
            <Download className="size-4 mr-2" /> Exportar Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Nome & CPF</th>
                  <th className="px-6 py-4 font-bold">Cargo</th>
                  <th className="px-6 py-4 font-bold">Contato</th>
                  <th className="px-6 py-4 font-bold">Endereço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center">Carregando...</td></tr>
                ) : (
                  filteredProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{p.nome}</div>
                        <div className="text-xs text-slate-500">{p.cpf || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="uppercase text-[10px]">{p.role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{p.telefone || '-'}</div>
                        <div className="text-xs text-slate-500">{p.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {[p.endereco_logradouro, p.endereco_numero, p.endereco_complemento, p.endereco_cidade, p.endereco_estado, p.endereco_cep].filter(Boolean).join(', ') || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
