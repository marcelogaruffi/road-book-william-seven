// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Calendar, Mail, Phone, User as UserIcon, AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge";

type ProfileData = {
  id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string | null;
  cpf: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  data_nascimento: string | null;
};

export const Route = createFileRoute("/_authenticated/dados-equipe")({
  head: () => ({ meta: [{ title: "Dados da Equipe - Seven Produções Artísticas" }] }),
  component: DadosEquipePage,
});

function getRoleColor(role: string) {
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
    case 'dev': return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
    case 'produtor': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    case 'assistente_producao': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
    case 'tour_manager': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
  }
}

function formatPhone(val: string) {
  if (!val) return "-";
  let v = val.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (m, p1, p2, p3) => p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : "");
  return v.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (m, p1, p2, p3) => p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : p1 ? `(${p1}` : "");
}

function formatCPF(cpf: string) {
  if (!cpf) return "-";
  const v = cpf.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function getNextBirthday(dateStr: string) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let bday = new Date(today.getFullYear(), parseInt(m) - 1, parseInt(d));
  if (bday < today) {
    bday = new Date(today.getFullYear() + 1, parseInt(m) - 1, parseInt(d));
  }
  return bday;
}

import { usePermissions } from "@/hooks/usePermissions";

function DadosEquipePage() {
  const { profile } = Route.useRouteContext();
  const [equipe, setEquipe] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pessoais");

  const { canAccessDadosEquipe: isAllowed } = usePermissions(profile);

  useEffect(() => {
    if (isAllowed) loadData();
    else setLoading(false);
  }, [isAllowed]);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, role, telefone, cpf, endereco_cidade, endereco_estado, data_nascimento')
      .order('nome');
      
    if (error) {
      toast.error("Erro ao carregar dados da equipe");
    } else {
      setEquipe(data || []);
    }
    setLoading(false);
  }

  const filteredEquipe = useMemo(() => {
    return equipe.filter(p => {
      const term = searchTerm.toLowerCase();
      return (p.nome || "").toLowerCase().includes(term) ||
             (p.role || "").toLowerCase().includes(term) ||
             (p.email || "").toLowerCase().includes(term) ||
             (p.cpf || "").includes(term);
    });
  }, [equipe, searchTerm]);

  const aniversarios = useMemo(() => {
    const list = equipe.filter(p => p.data_nascimento);
    list.sort((a, b) => {
      const dateA = getNextBirthday(a.data_nascimento!);
      const dateB = getNextBirthday(b.data_nascimento!);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    return list.filter(p => {
      const term = searchTerm.toLowerCase();
      return (p.nome || "").toLowerCase().includes(term) || (p.role || "").toLowerCase().includes(term);
    });
  }, [equipe, searchTerm]);

  const exportPDF = async () => {
    const isBdays = activeTab === "aniversarios";
    const doc = new jsPDF();
    let startY = 38;

    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      });
      doc.addImage(logoBase64, "PNG", 14, 10, 35, (35 * 38) / 100);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(isBdays ? "Lista de Aniversários da Equipe" : "Dados Pessoais da Equipe", 55, 18);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Seven Produções Artísticas", 55, 25);
    } catch (e) {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(isBdays ? "Lista de Aniversários da Equipe" : "Dados Pessoais da Equipe", 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Seven Produções Artísticas", 14, 28);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32);
    }

    if (isBdays) {
      const tableData = aniversarios.map(p => [
        p.nome || "Sem nome",
        formatDateBR(p.data_nascimento!),
        p.role.toUpperCase()
      ]);

      autoTable(doc, {
        startY,
        head: [['Nome', 'Data de Nascimento', 'Função']],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 10, cellPadding: 5, textColor: [51, 65, 85], font: "helvetica" },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
    } else {
      const tableData = filteredEquipe.map(p => [
        p.nome || "-",
        p.role.toUpperCase(),
        formatPhone(p.telefone || ""),
        p.email || "-",
        formatCPF(p.cpf || ""),
        p.endereco_cidade ? `${p.endereco_cidade}/${p.endereco_estado || "-"}` : "-"
      ]);

      autoTable(doc, {
        startY,
        head: [['Nome', 'Função', 'Telefone', 'E-mail', 'CPF', 'Cidade']],
        body: tableData,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 4, textColor: [51, 65, 85], font: "helvetica" },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
    }

    doc.save(isBdays ? "aniversarios_seven.pdf" : "dados_equipe_seven.pdf");
  };

  const exportExcel = async () => {
    const isBdays = activeTab === "aniversarios";
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(isBdays ? "Aniversários" : "Dados Pessoais");

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
      const imgWidthExcel = 150;
      const imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;

      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      
      worksheet.mergeCells('B1:D4');
      worksheet.getCell('B1').value = isBdays ? "Lista de Aniversários da Equipe" : "Dados Pessoais da Equipe";
      worksheet.getCell('B1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const headerRowNumber = 6;
    const headerRow = worksheet.getRow(headerRowNumber);
    
    if (isBdays) {
      worksheet.columns = [
        { key: 'nome', width: 25 },
        { key: 'nascimento', width: 20 },
        { key: 'funcao', width: 20 }
      ];
      headerRow.values = ['Nome', 'Data de Nascimento', 'Função'];
      
      aniversarios.forEach(p => {
        worksheet.addRow({
          nome: p.nome || "Sem nome",
          nascimento: formatDateBR(p.data_nascimento!),
          funcao: p.role.toUpperCase()
        });
      });
    } else {
      worksheet.columns = [
        { key: 'nome', width: 25 },
        { key: 'funcao', width: 20 },
        { key: 'telefone', width: 20 },
        { key: 'email', width: 30 },
        { key: 'cpf', width: 20 },
        { key: 'cidade', width: 25 }
      ];
      headerRow.values = ['Nome', 'Função', 'Telefone', 'E-mail', 'CPF', 'Cidade'];
      
      filteredEquipe.forEach(p => {
        worksheet.addRow({
          nome: p.nome || "-",
          funcao: p.role.toUpperCase(),
          telefone: formatPhone(p.telefone || ""),
          email: p.email || "-",
          cpf: formatCPF(p.cpf || ""),
          cidade: p.endereco_cidade ? `${p.endereco_cidade}/${p.endereco_estado || "-"}` : "-"
        });
      });
    }

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), isBdays ? "aniversarios_seven.xlsx" : "dados_equipe_seven.xlsx");
  };

  if (!isAllowed) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6">
          <ShieldAlert className="size-16" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-3">Acesso Negado</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
          Você não tem permissão para visualizar os dados pessoais da equipe. Apenas administradores e produtores podem acessar esta página.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-3 border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400">Acesso Restrito</Badge>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-snug pb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Dados da Equipe
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Informações pessoais e de contato de toda a equipe.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportExcel} variant="outline" className="h-12 px-6 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 shadow-sm transition-all font-semibold">
              <Download className="size-4 mr-2" />
              Baixar Excel
            </Button>
            <Button onClick={exportPDF} variant="outline" className="h-12 px-6 rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md hover:bg-slate-50 transition-all font-semibold text-slate-700">
              <Download className="size-4 mr-2 text-slate-500" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </section>

      <section>
        <Tabs defaultValue="pessoais" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/80 dark:bg-card/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-1.5 h-auto rounded-2xl w-full sm:w-auto inline-flex overflow-x-auto shadow-sm">
            <TabsTrigger value="pessoais" className="px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap">
              <UserIcon className="size-4 mr-2" />
              Dados Cadastrais
            </TabsTrigger>
            <TabsTrigger value="aniversarios" className="px-6 py-3 rounded-xl font-semibold data-[state=active]:bg-white data-[state=active]:text-fuchsia-600 data-[state=active]:shadow-sm transition-all whitespace-nowrap">
              <Calendar className="size-4 mr-2" />
              Aniversários
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 flex gap-3 max-w-md relative">
            <Search className="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, e-mail ou função..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-card/50 shadow-sm focus-visible:ring-primary/20"
            />
          </div>

          <TabsContent value="pessoais" className="mt-6">
            <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nome & Contato</th>
                      <th className="px-6 py-4">Função</th>
                      <th className="px-6 py-4">CPF</th>
                      <th className="px-6 py-4">Localidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredEquipe.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Nenhum resultado encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredEquipe.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white text-base">{p.nome || "-"}</div>
                            <div className="text-slate-500 flex items-center gap-2 mt-1 text-xs">
                              <span className="flex items-center"><Phone className="size-3 mr-1" /> {formatPhone(p.telefone || "")}</span>
                              <span className="flex items-center"><Mail className="size-3 mr-1" /> {p.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${getRoleColor(p.role)} border-none shadow-sm uppercase tracking-wider text-[10px]`}>
                              {p.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                            {formatCPF(p.cpf || "")}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {p.endereco_cidade ? `${p.endereco_cidade} - ${p.endereco_estado || ""}` : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="aniversarios" className="mt-6">
            <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-b border-fuchsia-100 dark:border-fuchsia-500/20 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Data de Nascimento</th>
                      <th className="px-6 py-4">Próximo Aniversário</th>
                      <th className="px-6 py-4">Nome do Integrante</th>
                      <th className="px-6 py-4">Função</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {aniversarios.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Nenhum aniversariante encontrado.
                        </td>
                      </tr>
                    ) : (
                      aniversarios.map(p => {
                        const nextBday = getNextBirthday(p.data_nascimento!);
                        const isToday = nextBday && nextBday.getTime() === (new Date().setHours(0,0,0,0));
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${isToday ? 'bg-fuchsia-50/50 dark:bg-fuchsia-500/5' : ''}`}>
                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-fuchsia-500" />
                                {formatDateBR(p.data_nascimento!)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isToday ? (
                                <Badge className="bg-fuchsia-500 text-white hover:bg-fuchsia-600 border-none shadow-sm animate-pulse">HOJE! 🎉</Badge>
                              ) : (
                                <span className="font-medium text-slate-500">{nextBday?.toLocaleDateString('pt-BR')}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white text-base">{p.nome || "-"}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${getRoleColor(p.role)} border-none shadow-sm uppercase tracking-wider text-[10px]`}>
                                {p.role}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

        </Tabs>
      </section>
    </div>
  );
}
