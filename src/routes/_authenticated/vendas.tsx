import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, Download, Plus, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/_authenticated/vendas")({
  component: VendasPage,
});

type Produto = {
  id: string;
  nome: string;
  preco_unitario: number;
};

type RegistroVenda = {
  id: string;
  produto_id: string;
  evento_id: string;
  quantidade: number;
  valor_total: number;
  data_venda: string;
  produto?: { nome: string };
  evento?: { cidade: string; local: string };
};

type Evento = {
  id: string;
  cidade: string;
  local: string;
  data: string;
};

function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<RegistroVenda[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [novoProdutoNome, setNovoProdutoNome] = useState("");
  const [novoProdutoPreco, setNovoProdutoPreco] = useState("");
  
  const [vendaProdutoId, setVendaProdutoId] = useState("");
  const [vendaEventoId, setVendaEventoId] = useState("");
  const [vendaQtd, setVendaQtd] = useState("1");
  const [vendaFiltroEvento, setVendaFiltroEvento] = useState("todos");

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    setLoading(true);
    try {
      const [prodRes, evtRes, vendRes] = await Promise.all([
        supabase.from("vendas_produtos").select("*").order("nome"),
        supabase.from("eventos").select("id, cidade, local, data").order("data", { ascending: false }),
        supabase.from("vendas_registros").select("*, produto:vendas_produtos(nome), evento:eventos(cidade, local)").order("data_venda", { ascending: false })
      ]);

      if (prodRes.data) setProdutos(prodRes.data);
      if (evtRes.data) setEventos(evtRes.data);
      if (vendRes.data) setVendas(vendRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAddProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!novoProdutoNome || !novoProdutoPreco) return;
    
    const preco = parseFloat(novoProdutoPreco.replace(",", "."));
    if (isNaN(preco)) return toast.error("Preço inválido");

    const { error } = await supabase.from("vendas_produtos").insert({
      nome: novoProdutoNome,
      preco_unitario: preco
    });

    if (error) {
      toast.error("Erro ao salvar produto");
    } else {
      toast.success("Produto cadastrado!");
      setNovoProdutoNome("");
      setNovoProdutoPreco("");
      fetchDados();
    }
  }

  async function handleAddVenda(e: React.FormEvent) {
    e.preventDefault();
    if (!vendaProdutoId || !vendaEventoId || !vendaQtd) return toast.error("Preencha todos os campos");

    const qtd = parseInt(vendaQtd);
    if (isNaN(qtd) || qtd <= 0) return toast.error("Quantidade inválida");

    const prod = produtos.find(p => p.id === vendaProdutoId);
    if (!prod) return;

    const valor_total = prod.preco_unitario * qtd;

    const { error, data } = await supabase.from("vendas_registros").insert({
      produto_id: vendaProdutoId,
      evento_id: vendaEventoId,
      quantidade: qtd,
      valor_total
    }).select().single();

    if (error) {
      toast.error("Erro ao registrar venda");
    } else {
      // Automatic financial integration
      // Try to find if this evento has a roadbook linked
      const { data: rbData } = await supabase.from("roadbooks").select("id").eq("evento_id", vendaEventoId).maybeSingle();
      
      if (rbData) {
        await supabase.from("financas_receitas").insert({
          roadbook_id: rbData.id,
          contratante: `Lojinha: ${qtd}x ${prod.nome}`,
          valor: valor_total,
          status: 'recebido'
        });
      }

      toast.success("Venda registrada com sucesso!");
      setVendaQtd("1");
      setVendaProdutoId("");
      fetchDados();
    }
  }

  async function handleDeleteVenda(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    const { error } = await supabase.from("vendas_registros").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else fetchDados();
  }

  async function exportPDF() {
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
      
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      
      const imgWidth = 35;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
      
      doc.addImage(logoBase64, "PNG", 14, 10, imgWidth, imgHeight);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Relatório de Vendas (Merchandising)", 55, 18);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text("Seven Produções Artísticas", 55, 25);
    } catch (e) {
      console.warn("Logo não carregado", e);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Relatório de Vendas (Merchandising)", 14, 22);
    }
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32);
    
    const tableData = vendasFiltradas.map(v => [
      new Date(v.data_venda).toLocaleDateString("pt-BR"),
      v.produto?.nome || "-",
      v.evento ? `${v.evento.cidade} (${v.evento.local})` : "-",
      v.quantidade.toString(),
      `R$ ${v.valor_total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: startY,
      head: [["Data", "Produto", "Evento/Cidade", "Qtd", "Total"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 5, textColor: [51, 65, 85], font: "helvetica" },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    
    doc.save("relatorio-vendas.pdf");
  }

  async function exportExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Vendas");
    
    sheet.columns = [
      { key: "data", width: 15 },
      { key: "prod", width: 35 },
      { key: "cidade", width: 40 },
      { key: "qtd", width: 12 },
      { key: "total", width: 20 }
    ];

    let headerRowNumber = 1;

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
      await new Promise(r => img.onload = r);

      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      
      const maxWidth = 120; // Reduzido para não invadir o texto
      const scale = maxWidth / img.width;
      const imgWidthExcel = img.width * scale;
      const imgHeightExcel = img.height * scale;

      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: imgWidthExcel, height: imgHeightExcel }
      });
      
      // Merge a partir da coluna C para deixar as colunas A e B para a logo respirar
      sheet.mergeCells('B1:E3');
      sheet.getCell('B1').value = "Relatório de Vendas (Merchandising)";
      sheet.getCell('B1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      sheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Ajustar altura das primeiras linhas
      sheet.getRow(1).height = 20;
      sheet.getRow(2).height = 20;
      sheet.getRow(3).height = 20;
      
      headerRowNumber = 5;
    } catch (e) {
      console.warn("Logo não carregado no excel", e);
    }

    const headerRow = sheet.getRow(headerRowNumber);
    headerRow.values = ["Data", "Produto", "Evento/Cidade", "Quantidade", "Total"];
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    vendasFiltradas.forEach(v => {
      sheet.addRow({
        data: new Date(v.data_venda).toLocaleDateString("pt-BR"),
        prod: v.produto?.nome,
        cidade: v.evento ? `${v.evento.cidade} - ${v.evento.local}` : "",
        qtd: v.quantidade,
        total: `R$ ${v.valor_total.toFixed(2)}`
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "relatorio-vendas.xlsx");
  }

  const vendasFiltradas = vendaFiltroEvento === "todos" ? vendas : vendas.filter(v => v.evento_id === vendaFiltroEvento);
  const totalGeral = vendasFiltradas.reduce((acc, curr) => acc + curr.valor_total, 0);
  const itensVendidos = vendasFiltradas.reduce((acc, curr) => acc + curr.quantidade, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="size-8 text-primary" />
            Controle de Vendas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a venda de merchandising (camisetas, chaveiros) nas turnês.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><Download className="size-4 mr-2" /> Excel</Button>
          <Button variant="outline" onClick={exportPDF}><Download className="size-4 mr-2" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Arrecadado (Filtro Atual)</p>
            <h2 className="text-4xl font-black text-primary mt-2">R$ {totalGeral.toFixed(2).replace(".", ",")}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Itens Vendidos</p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mt-2">{itensVendidos} un.</h2>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendas">
        <TabsList className="mb-4">
          <TabsTrigger value="vendas"><ShoppingCart className="size-4 mr-2"/> Registro de Vendas</TabsTrigger>
          <TabsTrigger value="produtos"><Package className="size-4 mr-2"/> Cadastro de Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nova Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddVenda} className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Evento / Cidade *</Label>
                  <select required value={vendaEventoId} onChange={e => setVendaEventoId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Selecione o evento...</option>
                    {eventos.map(evt => <option key={evt.id} value={evt.id}>{evt.cidade} ({new Date(evt.data).toLocaleDateString('pt-BR')})</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Produto *</Label>
                  <select required value={vendaProdutoId} onChange={e => setVendaProdutoId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Selecione o produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (R$ {p.preco_unitario.toFixed(2)})</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qtd *</Label>
                  <Input type="number" min="1" required value={vendaQtd} onChange={e => setVendaQtd(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading}><Plus className="size-4 mr-2" /> Lançar Venda</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>Histórico de Vendas</CardTitle>
                <CardDescription>Todas as saídas registradas no sistema.</CardDescription>
              </div>
              <div className="w-64">
                <select value={vendaFiltroEvento} onChange={e => setVendaFiltroEvento(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="todos">Todos os Eventos</option>
                  {eventos.map(evt => <option key={evt.id} value={evt.id}>Filtrar: {evt.cidade}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Cidade / Evento</th>
                      <th className="px-4 py-3 text-right">Qtd</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vendasFiltradas.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">{new Date(v.data_venda).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium">{v.produto?.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground"><MapPin className="size-3 inline mr-1"/>{v.evento?.cidade}</td>
                        <td className="px-4 py-3 text-right">{v.quantidade}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {v.valor_total.toFixed(2).replace('.', ',')}</td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteVenda(v.id)} className="text-red-500 hover:text-red-700">Excluir</Button>
                        </td>
                      </tr>
                    ))}
                    {vendasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhuma venda registrada para este filtro.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Produtos Disponíveis</CardTitle>
              <CardDescription>Cadastre camisetas, canecas, CDs e defina o preço padrão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddProduto} className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Nome do Produto (Tamanho, Modelo)</Label>
                  <Input required placeholder="Ex: Camiseta Preta G" value={novoProdutoNome} onChange={e => setNovoProdutoNome(e.target.value)} />
                </div>
                <div className="w-32 space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input required placeholder="45,00" value={novoProdutoPreco} onChange={e => setNovoProdutoPreco(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading}><Plus className="size-4" /></Button>
              </form>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3 text-right">Preço Un.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {produtos.map(p => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium">{p.nome}</td>
                        <td className="px-4 py-3 text-right">R$ {p.preco_unitario.toFixed(2).replace(".", ",")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
