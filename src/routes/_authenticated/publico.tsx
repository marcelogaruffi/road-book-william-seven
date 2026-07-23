import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, Plus, Trash2, ChevronDown, Users, Pencil, Check, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/publico")({
  component: PublicoPage,
});

const ATIVIDADES = ["Apresentação", "Intercâmbio", "Oficina", "Pensamento Giratório", "Outra..."].sort((a, b) => a.localeCompare(b));
const PUBLICO_OPCOES = [
  "1º Ano", "1º Ano Ensino Médio", "2º Ano", "2º Ano Ensino Médio", "3º Ano", "3º Ano Ensino Médio",
  "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano",
  "Adulto", "Infanto Juvenil", "Juvenil", "Livre"
].sort((a, b) => a.localeCompare(b));

function PublicoPage() {
  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function checkRole() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
        if (p) setProfile(p);
      }
    }
    checkRole();
  }, []);


  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [roadbookId, setRoadbookId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [atividade, setAtividade] = useState("");
  const [outraAtividade, setOutraAtividade] = useState("");
  const [publicoPresente, setPublicoPresente] = useState("");
  const [publicoMajoritario, setPublicoMajoritario] = useState<string[]>([]);

  const cidadesUnicas = Array.from(new Set(roadbooks.map(rb => rb.cidade))).sort((a, b) => a.localeCompare(b));
  const espetaculosDaCidade = roadbooks.filter(rb => rb.cidade === cidadeSelecionada);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch Roadbooks for the dropdown - Ordenado alfabeticamente pela cidade
    const { data: rbData } = await supabase
      .from("roadbooks")
      .select("id, cidade, estado, espetaculo")
      .order("cidade", { ascending: true });
    
    if (rbData) setRoadbooks(rbData);

    // Fetch existing reports
    const { data: relData } = await supabase
      .from("relatorio_publico")
      .select("*, roadbooks(cidade, estado, espetaculo)")
      .order("data", { ascending: true })
      .order("horario", { ascending: true });
    
    if (relData) setRegistros(relData);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!roadbookId || !data || !horario || !atividade) {
      toast.error("Preencha os campos obrigatórios (Cidade, Data, Horário e Atividade).");
      return;
    }

    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localToday = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    if (data > localToday) {
      toast.error("Não é possível registrar relatórios de datas futuras.");
      return;
    }

    const finalAtividade = atividade === "Outra..." ? outraAtividade.trim() : atividade;
    if (atividade === "Outra..." && !finalAtividade) {
      toast.error("Por favor, digite o nome da outra atividade.");
      return;
    }

    const payload = {
      roadbook_id: roadbookId,
      data,
      horario,
      atividade: finalAtividade,
      publico_presente: publicoPresente ? parseInt(publicoPresente) : null,
      publico_majoritario: publicoMajoritario
    };

    if (editingId) {
      const { data: updated, error } = await supabase
        .from("relatorio_publico")
        .update(payload)
        .eq("id", editingId)
        .select("*, roadbooks(cidade, estado, espetaculo)")
        .single();

      if (error) {
        console.error(error);
        toast.error("Erro ao atualizar registro.");
      } else if (updated) {
        toast.success("Registro atualizado com sucesso!");
        setRegistros(registros.map(r => r.id === editingId ? updated : r).sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)));
        setEditingId(null);
        setHorario("");
        setPublicoPresente("");
        setPublicoMajoritario([]);
        setOutraAtividade("");
        setOutraAtividade("");
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("relatorio_publico")
        .insert(payload)
        .select("*, roadbooks(cidade, estado, espetaculo)")
        .single();

      if (error) {
        console.error(error);
        toast.error("Erro ao salvar registro.");
      } else if (inserted) {
        toast.success("Registro adicionado com sucesso!");
        setRegistros([...registros, inserted].sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)));
        setHorario("");
        setPublicoPresente("");
        setPublicoMajoritario([]);
        setOutraAtividade("");
      }
    }
  }

  function handleCidadeChange(cidade: string) {
    setCidadeSelecionada(cidade);
    const esp = roadbooks.filter(rb => rb.cidade === cidade);
    if (esp.length === 1) {
      setRoadbookId(esp[0].id);
    } else {
      setRoadbookId("");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const { error } = await supabase.from("relatorio_publico").delete().eq("id", id);
    if (!error) {
      setRegistros(registros.filter((r) => r.id !== id));
      toast.success("Excluído com sucesso!");
    } else {
      toast.error("Erro ao excluir.");
    }
  }

  function handleEdit(r: any) {
    setEditingId(r.id);
    setCidadeSelecionada(r.roadbooks?.cidade || "");
    setRoadbookId(r.roadbook_id);
    setData(r.data);
    setHorario(r.horario.substring(0, 5));
    if (ATIVIDADES.includes(r.atividade)) {
      setAtividade(r.atividade);
      setOutraAtividade("");
    } else {
      setAtividade("Outra...");
      setOutraAtividade(r.atividade);
    }
    setPublicoPresente(r.publico_presente ? r.publico_presente.toString() : "");
    setPublicoMajoritario(r.publico_majoritario || []);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setCidadeSelecionada("");
    setRoadbookId("");
    setHorario("");
    setPublicoPresente("");
    setPublicoMajoritario([]);
  }

  function togglePublico(opcao: string) {
    setPublicoMajoritario(prev => 
      prev.includes(opcao) ? prev.filter(p => p !== opcao) : [...prev, opcao]
    );
  }

  async function exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Público");

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

    // Calculate image dimensions first
    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    // Manual columns width
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 35;

    // Se houver logo, colocar no topo
    const headerRowNumber = logoBase64 ? 6 : 1;
    
    if (logoBase64) {
      const imageId = workbook.addImage({
        base64: logoBase64,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: imgWidthExcel, height: imgHeightExcel }
      });
      
      // Mesclar e preencher o título na parte vazia superior
      worksheet.mergeCells('D1:H4');
      worksheet.getCell('D1').value = 'Relatório de Público';
      worksheet.getCell('D1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } }; // text-slate-900
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left' };
    }

    // Cabeçalho da tabela
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["#", "Cidade", "Espetáculo", "Data", "Horário", "Atividade", "Público", "Tipo"];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF334155" } }; // text-slate-700
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // bg-slate-100
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    });

    // Rows
    registros.forEach((r, index) => {
      const rowData = [
        index + 1,
        `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
        r.roadbooks?.espetaculo || "",
        format(new Date(r.data + "T12:00:00"), "dd/MM/yyyy"),
        r.horario.substring(0, 5) + "h",
        r.atividade,
        r.publico_presente || "",
        r.publico_majoritario?.join(", ") || ""
      ];
      
      const newRow = worksheet.addRow(rowData);
      newRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Relatorio_Publico.xlsx");
  }

  async function exportPDF() {
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
      doc.text("Relatório de Público", pageWidth / 2, 10 + imgHeight + 8, { align: 'center' });
      startY = 10 + imgHeight + 15;
    } catch (e) {
      console.warn("Logo não carregado", e);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(16);
      doc.text("Relatório de Público", pageWidth / 2, 15, { align: 'center' });
    }
    
    const tableData = registros.map((r, i) => [
      i + 1,
      `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
      r.roadbooks?.espetaculo || "",
      format(new Date(r.data + "T12:00:00"), "dd/MM/yyyy"),
      r.horario.substring(0, 5) + "h",
      r.atividade,
      r.publico_presente || "",
      r.publico_majoritario?.join(", ") || ""
    ]);

    autoTable(doc, {
      startY: startY,
      head: [["#", "Cidade", "Espetáculo", "Data", "Horário", "Atividade", "Público", "Tipo"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85], lineColor: [226, 232, 240] }, // text-slate-700, border-slate-200
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }, // bg-slate-100, text-slate-900
      columnStyles: {
        0: { halign: 'center', cellWidth: 'wrap' },
        6: { halign: 'center', cellWidth: 'wrap' }
      }
    });

    doc.save("Relatorio_Publico.pdf");
  }


  if (profile && !['dev', 'admin', 'produtor'].includes(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <ShieldAlert className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Esta tela é restrita a Produtores, Administradores e Desenvolvedores.</p>
      </div>
    );
  }


  // Calculations for charts and summary
  const totalsByActivity = registros.reduce((acc, r) => {
    if (!r.atividade) return acc;
    if (!acc[r.atividade]) acc[r.atividade] = 0;
    acc[r.atividade] += (r.publico_presente || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieActivityData = Object.keys(totalsByActivity).map(key => ({
    name: key,
    value: totalsByActivity[key]
  })).filter(item => item.value > 0);

  const ageDataMap = registros.reduce((acc, r) => {
    if (r.publico_majoritario && r.publico_majoritario.length > 0) {
      r.publico_majoritario.forEach((idade: string) => {
        if (!acc[idade]) acc[idade] = 0;
        acc[idade] += 1; // Frequency of events with this age group
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const pieAgeData = Object.keys(ageDataMap).map(key => ({
    name: key,
    value: ageDataMap[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#6366f1'];

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-sm ring-1 ring-primary/20 hidden sm:flex">
             <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Relatório de Público</h1>
            <p className="text-muted-foreground mt-1 font-medium">Acompanhe e exporte os dados de público das cidades.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={exportExcel} variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 transition-colors shadow-sm">
            <FileSpreadsheet className="size-4 mr-2" /> Excel
          </Button>
          <Button onClick={exportPDF} variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 transition-colors shadow-sm">
            <FileDown className="size-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[2rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
        <CardHeader className="relative z-10 border-b border-slate-100 dark:border-white/5 pb-5 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {editingId ? "Editar Registro" : "Adicionar Registro"}
          </CardTitle>
          {editingId && (
            <Button type="button" variant="ghost" onClick={handleCancelEdit} className="h-8 px-3 text-slate-500 hover:text-slate-800">
              Cancelar edição
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            <div className="space-y-2 lg:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Cidade*</Label>
              <Select value={cidadeSelecionada} onValueChange={handleCidadeChange}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                  <SelectValue placeholder="Selecione a cidade..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {cidadesUnicas.map(cid => (
                    <SelectItem key={cid} value={cid} className="rounded-xl py-2.5">
                      {cid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Espetáculo*</Label>
              <Select value={roadbookId} onValueChange={setRoadbookId} disabled={!cidadeSelecionada}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                  <SelectValue placeholder="Espetáculo..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {espetaculosDaCidade.map(rb => (
                    <SelectItem key={rb.id} value={rb.id} className="rounded-xl py-2.5">
                      {rb.espetaculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 lg:col-span-1 relative">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data*</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} required className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 px-4 w-full block appearance-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
            </div>
            
            <div className="space-y-2 lg:col-span-1 relative">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Horário*</Label>
              <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} required className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 px-4 w-full block appearance-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
            </div>

            <div className="space-y-2 lg:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Atividade*</Label>
              <Select value={atividade} onValueChange={setAtividade}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {ATIVIDADES.map(a => (
                    <SelectItem key={a} value={a} className="rounded-xl py-2.5">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {atividade === "Outra..." && (
              <div className="space-y-2 lg:col-span-1">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Qual atividade?</Label>
                <Input value={outraAtividade} onChange={e => setOutraAtividade(e.target.value)} required className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 px-4 w-full" placeholder="Digite a atividade..." />
              </div>
            )}
            <div className="space-y-2 lg:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Público</Label>
              <Input type="number" min="0" placeholder="Qtd" value={publicoPresente} onChange={e => setPublicoPresente(e.target.value)} className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 w-full" />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Tipo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                    <span className="truncate pr-2">
                      {publicoMajoritario.length > 0 
                        ? `${publicoMajoritario.length} selecionado(s)` 
                        : "Selecionar..."}
                    </span>
                    <ChevronDown className="size-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 max-h-80 overflow-y-auto rounded-2xl shadow-xl dark:border-white/10" align="end">
                  <div className="space-y-3">
                    {PUBLICO_OPCOES.map(op => (
                      <div key={op} className="flex items-start space-x-3">
                        <Checkbox 
                          id={`pub-${op}`} 
                          checked={publicoMajoritario.includes(op)}
                          onCheckedChange={() => togglePublico(op)}
                          className="mt-0.5 rounded border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`pub-${op}`} className="font-medium cursor-pointer text-sm leading-tight flex-1">
                          {op}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="lg:col-span-4 flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <Button type="submit" className={`w-full sm:w-auto h-11 rounded-xl font-bold shadow-lg px-8 ${editingId ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 'shadow-primary/20'}`}>
                {editingId ? <><Check className="size-4 mr-2" /> Salvar Alterações</> : <><Plus className="size-4 mr-2" /> Adicionar Registro</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[0_4px_25px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white dark:bg-card/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[800px] border-collapse">
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                <TableHead className="w-16 text-center font-bold text-slate-500 py-4 rounded-tl-[2rem]">#</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Cidade</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Espetáculo</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Data</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Horário</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Atividade</TableHead>
                <TableHead className="text-center font-bold text-slate-500 py-4">Público</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Tipo</TableHead>
                <TableHead className="w-16 rounded-tr-[2rem]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">Carregando registros...</TableCell>
                </TableRow>
              ) : registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400 font-medium border-0">Nenhum registro encontrado. Adicione o primeiro acima.</TableCell>
                </TableRow>
              ) : (
                registros.map((r, i) => (
                  <TableRow key={r.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <TableCell className="text-center font-bold text-slate-400">{i + 1}</TableCell>
                    <TableCell className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {r.roadbooks?.cidade} {r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600 dark:text-slate-300">
                      {r.roadbooks?.espetaculo || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">{format(new Date(r.data + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium text-slate-600 dark:text-slate-300">{r.horario.substring(0, 5)}h</TableCell>
                    <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{r.atividade}</TableCell>
                    <TableCell className="text-center font-black text-slate-800 dark:text-white text-lg">{r.publico_presente || "-"}</TableCell>
                    <TableCell>
                      {r.publico_majoritario && r.publico_majoritario.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {r.publico_majoritario.map((p: string) => (
                            <span key={p} className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-bold px-2 py-1 rounded-lg">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1 transition-opacity focus-within:opacity-100">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 rounded-xl transition-colors">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {registros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Total por Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {Object.entries(totalsByActivity).sort((a, b) => b[1] - a[1]).map(([ativ, total], idx) => (
                <div key={ativ} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{ativ}</span>
                  </div>
                  <span className="font-black text-xl text-slate-900 dark:text-white">{total.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Público por Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {pieActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieActivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieActivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Sem dados numéricos suficientes</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Frequência por Idade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {pieAgeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieAgeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieAgeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value + ' vezes'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Sem faixas etárias selecionadas</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

