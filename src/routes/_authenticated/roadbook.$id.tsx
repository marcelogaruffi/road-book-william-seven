import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RoadbookForm, type RoadbookData, type ProgItem, emptyRoadbook } from "@/components/RoadbookForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roadbook/$id")({
  head: () => ({ meta: [{ title: "Editar Road Book" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<RoadbookData | null>(null);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase.from("roadbooks").select("*").eq("id", id).maybeSingle();
      if (error) { toast.error(error.message); return; }
      if (!row) { toast.error("Não encontrado"); return; }
      setData({
        ...emptyRoadbook,
        id: row.id,
        slug: row.slug,
        espetaculo: row.espetaculo ?? "",
        cidade: row.cidade ?? "",
        estado: row.estado ?? "",
        festival: row.festival ?? "",
        data_inicial: row.data_inicial ?? "",
        data_final: row.data_final ?? "",
        hotel_nome: row.hotel_nome ?? "",
        hotel_endereco: row.hotel_endereco ?? "",
        teatro_nome: row.teatro_nome ?? "",
        teatro_endereco: row.teatro_endereco ?? "",
        producao_nome: row.producao_nome ?? "",
        producao_telefone: row.producao_telefone ?? "",
        receptivo_nome: row.receptivo_nome ?? "",
        receptivo_telefone: row.receptivo_telefone ?? "",
        programacao: (row.programacao as ProgItem[]) ?? [],
      });
    })();
  }, [id]);

  if (!data) return <p className="text-muted-foreground">Carregando...</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Editar Road Book</h1>
      <RoadbookForm initial={data} />
    </div>
  );
}
