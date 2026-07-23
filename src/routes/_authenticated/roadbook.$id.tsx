import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RoadbookForm } from "@/components/RoadbookForm";
import { type RoadbookData, rowToRoadbook } from "@/lib/roadbook-types";
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
      if (error) { toast.error(getErrorMessage(error)); return; }
      if (!row) { toast.error("Não encontrado"); return; }
      setData(rowToRoadbook(row));
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
