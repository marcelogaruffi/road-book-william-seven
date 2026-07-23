import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinanceiroTab } from "@/components/FinanceiroTab";
import { CachesEquipeTab } from "@/components/CachesEquipeTab";
import { CachesPadraoTab } from "@/components/CachesPadraoTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        toast.error("Erro ao carregar roadbooks: " + getErrorMessage(error));
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
          <p className="text-slate-500 mt-1">Gerencie as finanças dos eventos e as bases de cachês.</p>
        </div>
      </div>

      <Tabs defaultValue="eventos" className="w-full mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1 h-14">
          <TabsTrigger value="eventos" className="rounded-lg h-full font-bold text-xs sm:text-sm">Financeiro Eventos</TabsTrigger>
          <TabsTrigger value="caches_padrao" className="rounded-lg h-full font-bold text-xs sm:text-sm">Cachês Padrão</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-0">
          <div className="bg-white dark:bg-card/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="max-w-md space-y-2">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Escolha o Evento</Label>
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
                <Tabs defaultValue="geral" className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1">
                    <TabsTrigger value="geral" className="rounded-lg font-bold text-xs sm:text-sm">Receitas e Despesas</TabsTrigger>
                    <TabsTrigger value="caches" className="rounded-lg font-bold text-xs sm:text-sm">Cachês da Equipe</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="geral" className="mt-0">
                    <FinanceiroTab roadbookId={selectedRoadbook} />
                  </TabsContent>
                  
                  <TabsContent value="caches" className="mt-0">
                    <CachesEquipeTab roadbookId={selectedRoadbook} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
                <Wallet className="size-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold">Nenhum evento selecionado</h3>
                <p>Selecione um evento acima para carregar o painel financeiro.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="caches_padrao" className="mt-0">
          <CachesPadraoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
