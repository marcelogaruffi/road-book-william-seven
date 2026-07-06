import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinanceiroTab } from "@/components/FinanceiroTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [selectedRoadbook, setSelectedRoadbook] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { profile } = AuthedRoute.useRouteContext();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      if (profile && (profile.role === 'admin' || profile.role === 'dev')) {
        setIsAdmin(true);
      }
      
      const { data, error } = await supabase.from("roadbooks").select("id, espetaculo, cidade, data_inicial").order("data_inicial", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar roadbooks: " + error.message);
      } else {
        setRoadbooks(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (!loading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Wallet className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">O painel financeiro é restrito a Administradores e Desenvolvedores.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Wallet className="size-8 text-primary" />
            Gestão Financeira
          </h1>
          <p className="text-slate-500 mt-1">Selecione um Roadbook/Evento para gerenciar suas receitas e despesas.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
        <div className="max-w-md space-y-2">
          <Label className="font-bold text-slate-700 dark:text-slate-300">Escolha o Evento (Roadbook)</Label>
          <Select value={selectedRoadbook} onValueChange={setSelectedRoadbook}>
            <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900">
              <SelectValue placeholder="Selecione um evento..." />
            </SelectTrigger>
            <SelectContent>
              {roadbooks.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.cidade} - {r.espetaculo} {r.data_inicial ? `(${r.data_inicial})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRoadbook ? (
          <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
            <FinanceiroTab roadbookId={selectedRoadbook} />
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
            <Wallet className="size-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold">Nenhum evento selecionado</h3>
            <p>Selecione um evento acima para carregar o painel financeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
