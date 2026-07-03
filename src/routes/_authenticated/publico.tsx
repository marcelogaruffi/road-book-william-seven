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
import { FileDown, FileSpreadsheet, Plus, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/publico")({
  component: PublicoPage,
});

const ATIVIDADES = ["Apresentação", "Oficina", "Intercâmbio", "Pensamento Giratório"];
const PUBLICO_OPCOES = [
  "Adulto", "Infanto Juvenil", "Juvenil", "Livre",
  "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano",
  "1º Ano Ensino Médio", "2º Ano Ensino Médio", "3º Ano Ensino Médio"
];

function PublicoPage() {
  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
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
    // Fetch Roadbooks for the dropdown
    const { data: rbData } = await supabase
      .from("roadbooks")
      .select("id, cidade, estado, espetaculo")
      .order("created_at", { ascending: false });
    
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

    const { data: inserted, error } = await supabase
      .from("relatorio_publico")
      .insert({
        roadbook_id: roadbookId,
        data,
        horario,
        atividade,
        publico_presente: publicoPresente ? parseInt(publicoPresente) : null,
        publico_majoritario: publicoMajoritario
      })
      .select("*, roadbooks(cidade, estado)")
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar registro.");
    } else if (inserted) {
      toast.success("Registro adicionado com sucesso!");
      setRegistros([...registros, inserted].sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)));
      // Reset form but keep roadbook and date
      setHorario("");
      setPublicoPresente("");
      setPublicoMajoritario([]);
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

  function togglePublico(opcao: string) {
    setPublicoMajoritario(prev => 
      prev.includes(opcao) ? prev.filter(p => p !== opcao) : [...prev, opcao]
    );
  }

  function exportExcel() {
    const wsData = registros.map((r, i) => ({
      "#": i + 1,
      "Cidade": `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
      "Data": format(new Date(r.data), "dd/MM/yyyy"),
      "Horário": r.horario.substring(0, 5) + "h",
      "Atividade": r.atividade,
      "Público presente": r.publico_presente || "",
      "Público Majoritário": r.publico_majoritario?.join(", ") || ""
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Público");
    XLSX.writeFile(wb, "Relatorio_Publico.xlsx");
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("Relatório de Público", 14, 15);
    
    const tableData = registros.map((r, i) => [
      i + 1,
      `${r.roadbooks?.cidade || ""} ${r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}`.trim(),
      format(new Date(r.data), "dd/MM/yyyy"),
      r.horario.substring(0, 5) + "h",
      r.atividade,
      r.publico_presente || "",
      r.publico_majoritario?.join(", ") || ""
    ]);

    (doc as any).autoTable({
      startY: 20,
      head: [["#", "Cidade", "Data", "Horário", "Atividade", "Público presente", "Público Majoritário"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("Relatorio_Publico.pdf");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Relatório de Público</h1>
          <p className="text-muted-foreground mt-1">Acompanhe e exporte os dados de público de todas as atividades.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportExcel} variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
            <FileSpreadsheet className="size-4 mr-2" /> Excel
          </Button>
          <Button onClick={exportPDF} variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <FileDown className="size-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
            <div className="space-y-2 xl:col-span-2">
              <Label>Cidade (Roadbook)*</Label>
              <Select value={roadbookId} onValueChange={setRoadbookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade..." />
                </SelectTrigger>
                <SelectContent>
                  {roadbooks.map(rb => (
                    <SelectItem key={rb.id} value={rb.id}>
                      {rb.cidade} {rb.estado ? `(${rb.estado})` : ""} - {rb.espetaculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data*</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label>Horário*</Label>
              <Input type="time" value={horario} onChange={e => setHorario(e.target.value)} required />
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label>Atividade*</Label>
              <Select value={atividade} onValueChange={setAtividade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ATIVIDADES.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label>Público Presente</Label>
              <Input type="number" min="0" placeholder="Qtd" value={publicoPresente} onChange={e => setPublicoPresente(e.target.value)} />
            </div>

            <div className="space-y-2 xl:col-span-1">
              <Label>Público Majoritário</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {publicoMajoritario.length > 0 
                      ? `${publicoMajoritario.length} selecionado(s)` 
                      : "Selecionar..."}
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 max-h-64 overflow-y-auto" align="start">
                  <div className="space-y-2">
                    {PUBLICO_OPCOES.map(op => (
                      <div key={op} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`pub-${op}`} 
                          checked={publicoMajoritario.includes(op)}
                          onCheckedChange={() => togglePublico(op)}
                        />
                        <Label htmlFor={`pub-${op}`} className="font-normal cursor-pointer text-sm leading-none flex-1">
                          {op}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="xl:col-span-7 flex justify-end mt-2">
              <Button type="submit" className="w-full sm:w-auto">
                <Plus className="size-4 mr-2" /> Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="rounded-xl overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead className="text-center">Público Presente</TableHead>
                <TableHead>Público Majoritário</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell>
                </TableRow>
              ) : (
                registros.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {r.roadbooks?.cidade} {r.roadbooks?.estado ? `(${r.roadbooks.estado})` : ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(r.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{r.horario.substring(0, 5)}h</TableCell>
                    <TableCell>{r.atividade}</TableCell>
                    <TableCell className="text-center font-semibold">{r.publico_presente || "-"}</TableCell>
                    <TableCell>
                      {r.publico_majoritario && r.publico_majoritario.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.publico_majoritario.map((p: string) => (
                            <span key={p} className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="size-4" />
                      </Button>
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
