import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RoadbookForm } from "@/components/RoadbookForm";
import { type RoadbookData, rowToRoadbook } from "@/lib/roadbook-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roadbook/$id")({
  head: () => ({ meta: [{ title: "Editar Guia de Viagem" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<RoadbookData | null>(null);

  const { profile } = AuthedRoute.useRouteContext();
  const userRole = profile?.role || "elenco";
  const userFuncoes = profile?.funcoes || [];
  const hasRole = (r: string) => userRole === r || userFuncoes.includes(r);
  const canManageRoadbooks = ['dev', 'admin', 'produtor', 'assistente_producao', 'tour_manager'].some(r => hasRole(r));

  if (!canManageRoadbooks) {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase.from("roadbooks").select("*").eq("id", id).maybeSingle();
      if (error) { toast.error(getErrorMessage(error)); return; }
      if (!row) { toast.error("Não encontrado"); return; }
      setData(rowToRoadbook(row));
    })();
  }, [id]);

  if (!data) return <p className="text-muted-foreground">Carregando...</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Editar Guia de Viagem</h1>
      <RoadbookForm initial={data} />
    </div>
  );
}
