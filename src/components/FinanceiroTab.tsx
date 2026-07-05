import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinancasReceita, FinancasDespesa } from "@/lib/roadbook-types";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, Plus, DollarSign, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export function FinanceiroTab({ roadbookId }: { roadbookId?: string }) {
  const [receitas, setReceitas] = useState<FinancasReceita[]>([]);
  const [despesas, setDespesas] = useState<FinancasDespesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!roadbookId) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [roadbookId]);

  async function fetchData() {
    setLoading(true);
    const { data: recData, error: recError } = await supabase.from("financas_receitas").select("*").eq("roadbook_id", roadbookId);
    const { data: despData, error: despError } = await supabase.from("financas_despesas").select("*").eq("roadbook_id", roadbookId);
    
    if (recError) toast.error("Erro ao carregar receitas: " + recError.message);
    else setReceitas((recData as FinancasReceita[]) || []);
    
    if (despError) toast.error("Erro ao carregar despesas: " + despError.message);
    else setDespesas((despData as FinancasDespesa[]) || []);
    
    setLoading(false);
  }

  const addReceita = async () => {
    if (!roadbookId) return;
    const nova: Partial<FinancasReceita> = { roadbook_id: roadbookId, contratante: "Novo Contratante", valor: 0, status: "pendente" };
    const { data, error } = await supabase.from("financas_receitas").insert(nova).select().single();
    if (error) { toast.error("Erro ao adicionar"); return; }
    setReceitas([...receitas, data as FinancasReceita]);
  };

  const updateReceita = async (id: string, updates: Partial<FinancasReceita>) => {
    const { error } = await supabase.from("financas_receitas").update(updates).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setReceitas(receitas.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeReceita = async (id: string) => {
    if (!confirm("Remover receita?")) return;
    const { error } = await supabase.from("financas_receitas").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setReceitas(receitas.filter(r => r.id !== id));
  };

  const addDespesa = async () => {
    if (!roadbookId) return;
    const nova: Partial<FinancasDespesa> = { roadbook_id: roadbookId, tipo: "cache_equipe", descricao: "Nova Despesa", valor: 0, status: "pendente" };
    const { data, error } = await supabase.from("financas_despesas").insert(nova).select().single();
    if (error) { toast.error("Erro ao adicionar"); return; }
    setDespesas([...despesas, data as FinancasDespesa]);
  };

  const updateDespesa = async (id: string, updates: Partial<FinancasDespesa>) => {
    const { error } = await supabase.from("financas_despesas").update(updates).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setDespesas(despesas.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDespesa = async (id: string) => {
    if (!confirm("Remover despesa?")) return;
    const { error } = await supabase.from("financas_despesas").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setDespesas(despesas.filter(d => d.id !== id));
  };

  const handleUpload = async (file: File, table: string, id: string, column: string) => {
    setUploading(true);
    const path = `finance/${roadbookId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("roadbook-docs").upload(path, file);
    if (uploadError) {
      toast.error("Erro ao subir arquivo");
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("roadbook-docs").getPublicUrl(path);
    
    if (table === "financas_receitas") await updateReceita(id, { [column]: publicUrl });
    else await updateDespesa(id, { [column]: publicUrl });
    
    toast.success("Arquivo anexado!");
    setUploading(false);
  };

  if (!roadbookId) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Wallet className="size-12 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Salve o Roadbook Primeiro</h3>
        <p className="text-slate-500">Você precisa salvar este Roadbook pela primeira vez antes de poder adicionar os dados financeiros.</p>
      </div>
    );
  }

  const totalReceitas = receitas.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="space-y-8">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <ArrowUpRight className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Receitas</p>
                <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">R$ {totalReceitas.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                <ArrowDownRight className="size-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Despesas</p>
                <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100">R$ {totalDespesas.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={saldo >= 0 ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${saldo >= 0 ? "bg-blue-100 dark:bg-blue-900/50" : "bg-amber-100 dark:bg-amber-900/50"}`}>
                <DollarSign className={`size-6 ${saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>Saldo Líquido</p>
                <h3 className={`text-2xl font-black ${saldo >= 0 ? "text-blue-900 dark:text-blue-100" : "text-amber-900 dark:text-amber-100"}`}>R$ {saldo.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowUpRight className="size-5 text-emerald-500" />
              Receitas (Entradas)
            </CardTitle>
            <CardDescription>Cachês, bilheteria ou valores a receber do contratante.</CardDescription>
          </div>
          <Button onClick={addReceita} size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"><Plus className="size-4 mr-2"/> Adicionar Receita</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {receitas.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhuma receita cadastrada.</p>}
          {receitas.map((r) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="md:col-span-4 space-y-1">
                <Label className="text-xs">Contratante / Origem</Label>
                <Input value={r.contratante} onChange={e => updateReceita(r.id!, { contratante: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Valor (R$)</Label>
                <Input type="number" step="0.01" value={r.valor} onChange={e => updateReceita(r.id!, { valor: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={r.status} onValueChange={(v: any) => updateReceita(r.id!, { status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                {r.comprovante_url ? (
                  <Button variant="outline" className="w-full" onClick={() => window.open(r.comprovante_url, "_blank")}>Ver Anexo</Button>
                ) : (
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                      <Upload className="size-4 mr-2" /> Anexar
                    </div>
                    <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "financas_receitas", r.id!, "comprovante_url")} disabled={uploading} />
                  </label>
                )}
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeReceita(r.id!)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowDownRight className="size-5 text-rose-500" />
              Despesas (Custos e Equipe)
            </CardTitle>
            <CardDescription>Cachês da equipe técnica, voos, transfers e notas fiscais.</CardDescription>
          </div>
          <Button onClick={addDespesa} size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50"><Plus className="size-4 mr-2"/> Adicionar Despesa</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {despesas.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Nenhuma despesa cadastrada.</p>}
          {despesas.map((d) => (
            <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={d.tipo} onValueChange={(v: any) => updateDespesa(d.id!, { tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cache_equipe">Cachê Equipe</SelectItem>
                    <SelectItem value="aereo">Voo / Aéreo</SelectItem>
                    <SelectItem value="van">Transfer / Van</SelectItem>
                    <SelectItem value="diaria">Diárias (Alim.)</SelectItem>
                    <SelectItem value="deslocamento_extra">Desloc. Extra</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={d.descricao} onChange={e => updateDespesa(d.id!, { descricao: e.target.value })} placeholder="Ex: Iluminador - João" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Valor (R$)</Label>
                <Input type="number" step="0.01" value={d.valor} onChange={e => updateDespesa(d.id!, { valor: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={d.status} onValueChange={(v: any) => updateDespesa(d.id!, { status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                {d.nota_fiscal_url ? (
                  <Button variant="outline" className="w-full" onClick={() => window.open(d.nota_fiscal_url, "_blank")}>Ver NF</Button>
                ) : (
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center h-10 px-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                      <Upload className="size-4 mr-1" /> NF / Recibo
                    </div>
                    <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "financas_despesas", d.id!, "nota_fiscal_url")} disabled={uploading} />
                  </label>
                )}
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => removeDespesa(d.id!)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
