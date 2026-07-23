import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Loader2, DollarSign } from "lucide-react";
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
        <Button onClick={salvarTodos} disabled={saving} className="bg-green-600 hover:bg-green-700">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Salvar Todos
        </Button>
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
