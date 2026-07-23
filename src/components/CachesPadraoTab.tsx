import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Loader2, DollarSign, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CurrencyInput } from "@/components/CurrencyInput";

export function CachesPadraoTab() {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEquipe();
  }, []);

  async function loadEquipe() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, foto_url, funcoes, caches_padrao")
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar equipe: " + getErrorMessage(error));
    } else {
      setEquipe(data || []);
    }
    setLoading(false);
  }

  const handleCacheChange = (userId: string, funcao: string, valor: string) => {
    setEquipe(prev => prev.map(p => {
      if (p.id === userId) {
        const novosCaches = { ...(p.caches_padrao || {}) };
        novosCaches[funcao] = valor;
        return { ...p, caches_padrao: novosCaches };
      }
      return p;
    }));
  };

  const salvarTodos = async () => {
    setSaving(true);
    try {
      for (const p of equipe) {
        if (p.caches_padrao) {
          await supabase
            .from("profiles")
            .update({ caches_padrao: p.caches_padrao })
            .eq("id", p.id);
        }
      }
      toast.success("Cachês Padrão salvos com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    let startY = 20;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      
      const imgWidth = 40;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      
      doc.addImage(logoBase64, 'PNG', x, 10, imgWidth, imgHeight);
      doc.setFontSize(16);
      doc.text("Cachês Padrão (Base) - Seven Produções Artísticas", pageWidth / 2, 10 + imgHeight + 8, { align: 'center' });
      startY = 10 + imgHeight + 15;
    } catch (e) {
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text("Cachês Padrão (Base) - Seven Produções Artísticas", pageWidth / 2, 15, { align: 'center' });
    }
    
    const tableData: string[][] = [];
    equipe.forEach(p => {
      if (p.funcoes && p.funcoes.length > 0) {
        p.funcoes.forEach((f: string) => {
          const valor = p.caches_padrao?.[f] || "0";
          const numValor = parseFloat(valor.toString().replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
          const formattedValor = numValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          tableData.push([p.nome, f.replace('_', ' ').toUpperCase(), `R$ ${formattedValor}`]);
        });
      } else {
        tableData.push([p.nome, "Sem função", "R$ 0,00"]);
      }
    });

    autoTable(doc, {
      startY: startY,
      head: [['Nome', 'Função', 'Valor Base']],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85], lineColor: [226, 232, 240] },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    });
    
    doc.save("caches_padrao.pdf");
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cachês");

    let logoBase64: string | undefined;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
    } catch (e) {
      console.warn("Logo não carregado", e);
    }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    worksheet.getColumn(1).width = 30; // Nome
    worksheet.getColumn(2).width = 25; // Função
    worksheet.getColumn(3).width = 20; // Valor

    const headerRowNumber = logoBase64 ? 6 : 1;
    
    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      
      worksheet.mergeCells('B1:C4');
      worksheet.getCell('B1').value = 'Cachês Padrão (Base)';
      worksheet.getCell('B1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["Nome", "Função", "Valor Base"];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF334155" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    });

    equipe.forEach(p => {
      if (p.funcoes && p.funcoes.length > 0) {
        p.funcoes.forEach((f: string) => {
          const valor = p.caches_padrao?.[f] || "0";
          const numValor = parseFloat(valor.toString().replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;
          const formattedValor = numValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const newRow = worksheet.addRow([p.nome, f.replace('_', ' ').toUpperCase(), `R$ ${formattedValor}`]);
          newRow.eachCell(c => {
            c.alignment = { vertical: "middle" };
            c.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
          });
        });
      } else {
        const newRow = worksheet.addRow([p.nome, "Sem função", "R$ 0,00"]);
        newRow.eachCell(c => {
            c.alignment = { vertical: "middle" };
            c.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "caches_padrao.xlsx");
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
            Tabela de Cachês Padrão (Base)
          </h2>
          <p className="text-sm text-slate-500">Defina aqui o valor base para cada função de cada profissional.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportPDF} variant="outline" className="shadow-sm font-semibold">
            <FileText className="size-4 mr-2 text-red-500" />
            PDF
          </Button>
          <Button onClick={exportExcel} variant="outline" className="shadow-sm font-semibold">
            <Download className="size-4 mr-2 text-emerald-500" />
            Excel
          </Button>
          <Button onClick={salvarTodos} disabled={saving} className="bg-green-600 hover:bg-green-700 ml-2 shadow-sm font-bold">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Salvar Todos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipe.map(p => (
          <Card key={p.id} className="p-4 bg-white dark:bg-card/40 dark:backdrop-blur-md rounded-2xl shadow-sm border-0 border-b-2 border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="size-10 border-2 border-slate-100 dark:border-white/10">
                <AvatarImage src={p.foto_url} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{p.nome ? p.nome[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">{p.nome}</p>
                <p className="text-xs text-slate-500">{(p.funcoes || []).length} funções configuradas</p>
              </div>
            </div>

            <div className="space-y-3">
              {(!p.funcoes || p.funcoes.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">Nenhuma função definida.</p>
              ) : (
                p.funcoes.map((f: string) => (
                  <div key={f} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 border-none capitalize shadow-sm text-xs py-1">
                      {f.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <span className="text-slate-400 font-bold text-sm pl-1">R$</span>
                      <CurrencyInput
                        value={p.caches_padrao?.[f] || ""}
                        onChange={(val) => handleCacheChange(p.id, f, val)}
                        className="w-full sm:w-28 h-9 text-right font-bold focus-visible:ring-primary/20 bg-white dark:bg-slate-900 border-0 shadow-sm"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
