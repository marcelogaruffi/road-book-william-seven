import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Music, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/espetaculos")({
  component: EspetaculosPage,
});

type Espetaculo = {
  nome_espetaculo: string;
  descricao: string | null;
  created_at: string;
};

function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [loading, setLoading] = useState(false);

  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescricao, setEditDescricao] = useState("");

  useEffect(() => {
    fetchEspetaculos();
  }, []);

  async function fetchEspetaculos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates_espetaculos")
      .select("nome_espetaculo, descricao, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar espetáculos");
    } else {
      setEspetaculos(data || []);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return toast.error("O nome do espetáculo é obrigatório");

    const nomeFormatado = novoNome.trim();

    // Check if exists
    if (espetaculos.some(e => e.nome_espetaculo.toLowerCase() === nomeFormatado.toLowerCase())) {
      return toast.error("Já existe um espetáculo com esse nome");
    }

    const { data, error } = await supabase.from("templates_espetaculos").insert({
      nome_espetaculo: nomeFormatado,
      descricao: novaDescricao.trim() || null
    }).select("nome_espetaculo, descricao, created_at").single();

    if (error) {
      toast.error("Erro ao cadastrar espetáculo");
    } else {
      setEspetaculos([data, ...espetaculos]);
      setNovoNome("");
      setNovaDescricao("");
      toast.success("Espetáculo cadastrado com sucesso!");
    }
  }

  async function handleDelete(nome: string) {
    if (!confirm(`ATENÇÃO: Deletar "${nome}" removerá também todos os checklists padrão atrelados a ele. Tem certeza?`)) return;
    
    const { error } = await supabase.from("templates_espetaculos").delete().eq("nome_espetaculo", nome);
    if (error) {
      toast.error("Erro ao deletar espetáculo");
    } else {
      setEspetaculos(espetaculos.filter(e => e.nome_espetaculo !== nome));
      toast.success("Espetáculo removido.");
    }
  }

  function startEditing(esp: Espetaculo) {
    setEditingId(esp.nome_espetaculo);
    setEditDescricao(esp.descricao || "");
  }

  async function handleSaveEdit(nome: string) {
    // We only allow editing description, not the PK name, because changing the name would break existing roadbooks linked by string
    const { error } = await supabase.from("templates_espetaculos").update({
      descricao: editDescricao.trim() || null
    }).eq("nome_espetaculo", nome);

    if (error) {
      toast.error("Erro ao salvar descrição");
    } else {
      setEspetaculos(espetaculos.map(e => e.nome_espetaculo === nome ? { ...e, descricao: editDescricao.trim() || null } : e));
      setEditingId(null);
      toast.success("Descrição atualizada!");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Music className="size-8 text-primary" />
            Central de Espetáculos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os modelos e tipos de shows da agência</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
          <CardTitle>Cadastrar Novo Show</CardTitle>
          <CardDescription>
            Esse nome ficará disponível nos dropdowns de criação de turnês, roadbooks, mapas de luz/som e checklists.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="w-full md:w-1/3 space-y-2">
              <Label>Nome do Espetáculo <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Ex: Turnê Acústico 2025" 
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input 
                placeholder="Ex: Show voz e violão com duração de 90min" 
                value={novaDescricao}
                onChange={e => setNovaDescricao(e.target.value)}
              />
            </div>
            <Button type="submit" className="gap-2 shrink-0 h-10 w-full md:w-auto">
              <Plus className="size-4" /> Cadastrar Show
            </Button>
          </form>

          <div className="mt-8 border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome do Espetáculo</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">Ação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Carregando espetáculos...
                    </td>
                  </tr>
                ) : espetaculos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Nenhum espetáculo cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  espetaculos.map((esp) => {
                    const isEditing = editingId === esp.nome_espetaculo;
                    return (
                      <tr key={esp.nome_espetaculo} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                          {esp.nome_espetaculo}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {isEditing ? (
                            <Input 
                              value={editDescricao}
                              onChange={e => setEditDescricao(e.target.value)}
                              className="h-8 max-w-sm"
                              placeholder="Descrição do show"
                              autoFocus
                            />
                          ) : (
                            esp.descricao || <span className="text-slate-400 italic">Sem descrição</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(esp.nome_espetaculo)}>
                                <Save className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700" onClick={() => setEditingId(null)}>
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => startEditing(esp)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(esp.nome_espetaculo)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
