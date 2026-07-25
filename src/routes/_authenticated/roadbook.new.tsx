import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { RoadbookForm } from "@/components/RoadbookForm";
import { emptyRoadbook } from "@/lib/roadbook-types";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/roadbook/new")({
  head: () => ({ meta: [{ title: "Novo Guia de Viagem" }] }),
  loader: async () => {
    const [{ data: eventos }, { data: roadbooks }] = await Promise.all([
      supabase.from('eventos').select('id'),
      supabase.from('roadbooks').select('evento_id').not('evento_id', 'is', null)
    ]);
    const usedIds = new Set((roadbooks || []).map(r => r.evento_id));
    const available = (eventos || []).filter(e => !usedIds.has(e.id));
    return { hasEventos: available.length > 0 };
  },
  component: () => {
    const { profile } = AuthedRoute.useRouteContext();
    const { hasEventos } = Route.useLoaderData();
    
    const userRole = profile?.role || "elenco";
    const userFuncoes = profile?.funcoes || [];
    const hasRole = (r: string) => userRole === r || userFuncoes.includes(r);
    const canManageRoadbooks = ['dev', 'admin', 'produtor', 'assistente_producao', 'tour_manager'].some(r => hasRole(r));

    if (!canManageRoadbooks) {
      return <Navigate to="/dashboard" />;
    }

    if (!hasEventos) {
      return (
        <div className="flex flex-col items-center justify-center p-12 mt-10 text-center bg-white dark:bg-card/40 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm max-w-2xl mx-auto">
          <div className="bg-sky-50 dark:bg-sky-500/10 p-6 rounded-full mb-6">
            <Calendar className="size-12 text-sky-500" />
          </div>
          <h2 className="text-3xl font-black mb-3 text-slate-800 dark:text-white">Nenhum evento disponível</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-lg">Todos os seus eventos já possuem um Guia de Viagem vinculado, ou você ainda não possui eventos cadastrados. Crie um novo evento primeiro.</p>
          <Button asChild className="rounded-xl h-12 px-8 font-bold text-base bg-sky-500 hover:bg-sky-600 text-white">
            <Link to="/eventos"><Plus className="size-5 mr-2" /> Cadastrar Evento</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Novo Guia de Viagem</h1>
        <RoadbookForm initial={emptyRoadbook} />
      </div>
    );
  },
});
