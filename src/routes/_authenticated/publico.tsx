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
import { FileDown, FileSpreadsheet, Plus, Trash2, ChevronDown, Users, Pencil, Check } from "lucide-react";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/publico")({
  component: PublicoPage,
});

const ATIVIDADES = ["Apresentação", "Intercâmbio", "Oficina", "Pensamento Giratório"].sort((a, b) => a.localeCompare(b));
const PUBLICO_OPCOES = [
  "1º Ano", "1º Ano Ensino Médio", "2º Ano", "2º Ano Ensino Médio", "3º Ano", "3º Ano Ensino Médio",
  "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano",
  "Adulto", "Infanto Juvenil", "Juvenil", "Livre"
].sort((a, b) => a.localeCompare(b));

function PublicoPage() {
  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roadbookId, setRoadbookId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [atividade, setAtividade] = useState("");
  const [publicoPresente, setPublicoPresente] = useState("");
  const [publicoMajoritario, setPublicoMajoritario] = useState<string[]>([]);

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
      .select("*, roadbooks(cidade, estado)")
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

    const payload = {
      roadbook_id: roadbookId,
      data,
      horario,
      atividade,
      publico_presente: publicoPresente ? parseInt(publicoPresente) : null,
      publico_majoritario: publicoMajoritario
    };

    if (editingId) {
      const { data: updated, error } = await supabase
        .from("relatorio_publico")
        .update(payload)
        .eq("id", editingId)
        .select("*, roadbooks(cidade, estado)")
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
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("relatorio_publico")
        .insert(payload)
        .select("*, roadbooks(cidade, estado)")
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
      }
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
    setRoadbookId(r.roadbook_id);
    setData(r.data);
    setHorario(r.horario.substring(0, 5));
    setAtividade(r.atividade);
    setPublicoPresente(r.publico_presente ? r.publico_presente.toString() : "");
    setPublicoMajoritario(r.publico_majoritario || []);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
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

    // Columns
    worksheet.columns = [
      { header: "#", key: "id", width: 5 },
      { header: "Cidade", key: "cidade", width: 25 },
      { header: "Data", key: "data", width: 12 },
      { header: "Horário", key: "horario", width: 10 },
      { header: "Atividade", key: "atividade", width: 20 },
      { header: "Público presente", key: "presente", width: 18 },
      { header: "Público Majoritário", key: "majoritario", width: 35 }
    ];

    // Header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      };
    });

    // Rows
    registros.forEach((r, i) => {
      const row = worksheet.addRow({
        id: i + 1,
        cidade: `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
        data: format(new Date(r.data + "T12:00:00"), "dd/MM/yyyy"),
        horario: r.horario.substring(0, 5) + "h",
        atividade: r.atividade,
        presente: r.publico_presente || "",
        majoritario: r.publico_majoritario?.join(", ") || ""
      });
      
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: "middle", horizontal: colNumber === 6 || colNumber === 1 ? "center" : "left", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFEEEEEE" } }, left: { style: "thin", color: { argb: "FFEEEEEE" } },
          bottom: { style: "thin", color: { argb: "FFEEEEEE" } }, right: { style: "thin", color: { argb: "FFEEEEEE" } }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Relatorio_Publico.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Relatório de Público", 14, 15);
    
    const tableData = registros.map((r, i) => [
      i + 1,
      `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
      format(new Date(r.data + "T12:00:00"), "dd/MM/yyyy"),
      r.horario.substring(0, 5) + "h",
      r.atividade,
      r.publico_presente || "",
      r.publico_majoritario?.join(", ") || ""
    ]);

    autoTable(doc, {
      startY: 20,
      head: [["#", "Cidade", "Data", "Horário", "Atividade", "Público presente", "Público Majoritário"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] }, // Primary color
      columnStyles: {
        0: { halign: 'center' },
        5: { halign: 'center' }
      }
    });

    doc.save("Relatorio_Publico.pdf");
  }

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100/50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-2xl shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800 hidden sm:flex">
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
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5 items-end">
            <div className="space-y-2 xl:col-span-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Cidade*</Label>
              <Select value={roadbookId} onValueChange={setRoadbookId}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                  <SelectValue placeholder="Selecione a cidade..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {roadbooks.map(rb => (
                    <SelectItem key={rb.id} value={rb.id} className="rounded-xl py-2.5">
                      {rb.cidade} {rb.estado ? `(${rb.estado})` : ""} - {rb.espetaculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Data*</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} required className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 px-3 w-full" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Horário*</Label>
              <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} required className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 w-full" />
            </div>

            <div className="space-y-2 xl:col-span-1">
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

            <div className="space-y-2 xl:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Público Presente</Label>
              <Input type="number" min="0" placeholder="Qtd" value={publicoPresente} onChange={e => setPublicoPresente(e.target.value)} className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 w-full" />
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Público Majoritário</Label>
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

            <div className="xl:col-span-7 flex justify-end mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
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
                <TableHead className="font-bold text-slate-500 py-4">Data</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Horário</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Atividade</TableHead>
                <TableHead className="text-center font-bold text-slate-500 py-4">Presente</TableHead>
                <TableHead className="font-bold text-slate-500 py-4">Público Majoritário</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium border-0">Nenhum registro encontrado. Adicione o primeiro acima.</TableCell>
                </TableRow>
              ) : (
                registros.map((r, i) => (
                  <TableRow key={r.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <TableCell className="text-center font-bold text-slate-400">{i + 1}</TableCell>
                    <TableCell className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {r.roadbooks?.cidade} {r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}
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
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
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
    </div>
  );
}
