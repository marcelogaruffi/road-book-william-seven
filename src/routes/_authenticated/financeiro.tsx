import { getErrorMessage } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GridEventos } from "@/components/GridEventos";
import { supabase } from "@/integrations/supabase/client";
import { FinanceiroTab } from "@/components/FinanceiroTab";
import { CachesEquipeTab } from "@/components/CachesEquipeTab";
import { CachesPadraoTab } from "@/components/CachesPadraoTab";
import { NotasBoletosTab } from "@/components/NotasBoletosTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Route as AuthedRoute } from "./route";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro - Áxis - Gestão de Teatros e Shows" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [selectedRoadbook, setSelectedRoadbook] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessFinanceiro: isAllowed } = usePermissions(profile);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("roadbooks").select("id, espetaculo, cidade, data_inicial").order("data_inicial", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar guias de viagem: " + getErrorMessage(error));
      } else {
        setRoadbooks(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (!loading && !isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Wallet className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Você não tem permissão para acessar o painel financeiro.</p>
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
            {!selectedRoadbook ? (
              <div className="mt-4"><GridEventos onSelect={(eId, rId) => { if (rId) setSelectedRoadbook(rId); else toast.info("Este evento ainda não possui um Guia de Viagem (Roadbook). Crie-o primeiro para acessar o financeiro."); }} /></div>
            ) : (
          <div className="bg-white dark:bg-card/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center justify-start mb-4"><Button variant="outline" onClick={() => setSelectedRoadbook("")}>← Voltar para Grade</Button></div>

            {selectedRoadbook ? (
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
                <Tabs defaultValue="geral" className="w-full">
                  <TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1">
                    <TabsTrigger value="geral" className="rounded-lg font-bold text-xs sm:text-sm">Receitas e Despesas</TabsTrigger>
                    <TabsTrigger value="caches" className="rounded-lg font-bold text-xs sm:text-sm">Cachês da Equipe</TabsTrigger>
                    <TabsTrigger value="notas" className="rounded-lg font-bold text-xs sm:text-sm">Notas e Boletos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="geral" className="mt-0">
                    <FinanceiroTab roadbookId={selectedRoadbook} />
                  </TabsContent>
                  
                  <TabsContent value="caches" className="mt-0">
                    <CachesEquipeTab roadbookId={selectedRoadbook} />
                  </TabsContent>

                    <TabsContent value="notas" className="mt-0">
                      <NotasBoletosTab roadbookId={selectedRoadbook} />
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
            )}
        </TabsContent>

        <TabsContent value="caches_padrao" className="mt-0">
          <CachesPadraoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

