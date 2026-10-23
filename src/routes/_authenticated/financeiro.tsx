import { AccessDenied } from "@/components/AccessDenied";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet, Info } from "lucide-react";
import { Route as AuthedRoute } from "./route";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro - Áxis - Gestão de Teatros e Shows" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  // --- SEGURANÇA E CONTROLE DE ACESSO OFICIAL AXIS ---
  const routeCtx = AuthedRoute.useRouteContext ? AuthedRoute.useRouteContext() : null;
  const allowedRolesList = ["dev","produtor","contador"];
  const profileRoles = routeCtx?.profile ? [routeCtx.profile.role, ...(Array.isArray(routeCtx.profile.funcoes) ? routeCtx.profile.funcoes : [])] : [];
  const hasAccess = profileRoles.some(r => allowedRolesList.includes(r));
  if (routeCtx?.profile && !hasAccess) {
    return <AccessDenied message="Você não possui permissão para acessar esta área com o seu perfil atual." />;
  }
  // ----------------------------------------------------

  const [roadbooks, setRoadbooks] = useState<any[]>([]);
  const [selectedRoadbook, setSelectedRoadbook] = useState<string>("");
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [selectedEventoData, setSelectedEventoData] = useState<{ espetaculo?: string; cidade?: string; local?: string; data?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessFinanceiro: isAllowed } = usePermissions(profile);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("roadbooks").select("id, evento_id, espetaculo, cidade, estado, teatro_nome, data_inicial").order("data_inicial", { ascending: false });
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

  const handleSelectEvent = async (eventoId: string, roadbookId?: string | null) => {
    setSelectedEventoId(eventoId);
    setSelectedRoadbook(roadbookId || "");

    // Fetch details of selected event for header display
    const { data: ev } = await supabase.from("eventos").select("id, espetaculo, cidade, local, data").eq("id", eventoId).maybeSingle();
    if (ev) {
      setSelectedEventoData(ev);
    } else {
      setSelectedEventoData(null);
    }
  };

  const handleClearSelection = () => {
    setSelectedEventoId("");
    setSelectedRoadbook("");
    setSelectedEventoData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Wallet className="size-8 text-primary" />
            Gestão Financeira
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as finanças dos eventos, cachês da equipe e valores padrão.</p>
        </div>
      </div>

      <Tabs defaultValue="eventos" className="w-full mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1 h-14">
          <TabsTrigger value="eventos" className="rounded-lg h-full font-bold text-xs sm:text-sm">Financeiro Eventos</TabsTrigger>
          <TabsTrigger value="caches_padrao" className="rounded-lg h-full font-bold text-xs sm:text-sm">Cachês Padrão</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-0">
          {!selectedEventoId && !selectedRoadbook ? (
            <div className="mt-4">
              <GridEventos onSelect={handleSelectEvent} />
            </div>
          ) : (
            <div className="bg-white dark:bg-card/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleClearSelection} className="shrink-0 gap-1.5 font-bold">
                    ← Voltar para Grade
                  </Button>
                  {(() => {
                    const activeRb = roadbooks.find((r) => r.id === selectedRoadbook);
                    const title = activeRb?.espetaculo || selectedEventoData?.espetaculo || "Espetáculo";
                    const cidade = activeRb?.cidade || selectedEventoData?.cidade || "";
                    const estado = activeRb?.estado ? `/${activeRb.estado}` : "";
                    const local = activeRb?.teatro_nome || selectedEventoData?.local || "";
                    const dataStr = activeRb?.data_inicial || selectedEventoData?.data;

                    return (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-slate-800 dark:text-white">
                            {title}
                          </span>
                          {cidade && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase">
                              {cidade}{estado}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {local ? `${local} • ` : ""}
                          {dataStr ? new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR") : "Data a definir"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {selectedRoadbook ? (
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-6">
                  <Tabs defaultValue="caches" className="w-full">
                    <TabsList className="grid w-full max-w-xl grid-cols-3 bg-slate-100 dark:bg-white/10 rounded-xl mb-6 p-1">
                      <TabsTrigger value="caches" className="rounded-lg font-bold text-xs sm:text-sm">Cachês da Equipe</TabsTrigger>
                      <TabsTrigger value="geral" className="rounded-lg font-bold text-xs sm:text-sm">Receitas e Despesas</TabsTrigger>
                      <TabsTrigger value="notas" className="rounded-lg font-bold text-xs sm:text-sm">Notas e Boletos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="caches" className="mt-0">
                      <CachesEquipeTab roadbookId={selectedRoadbook} eventoId={selectedEventoId} />
                    </TabsContent>

                    <TabsContent value="geral" className="mt-0">
                      <FinanceiroTab roadbookId={selectedRoadbook} />
                    </TabsContent>

                    <TabsContent value="notas" className="mt-0">
                      <NotasBoletosTab roadbookId={selectedRoadbook} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : selectedEventoId ? (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs">
                    <Info className="size-4 shrink-0 text-amber-600" />
                    <span>
                      Este evento não possui Guia de Viagem (Roadbook). Os <strong>Cachês da Equipe</strong> podem ser gerenciados diretamente aqui. Para gerenciar receitas gerais e despesas da viagem, crie o Roadbook correspondente.
                    </span>
                  </div>

                  <CachesEquipeTab eventoId={selectedEventoId} />
                </div>
              ) : null}
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
