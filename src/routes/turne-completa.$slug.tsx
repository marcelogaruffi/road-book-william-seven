import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rowToRoadbook } from "@/lib/roadbook-types";
import { PublicRoadbookView } from "./rb.$slug";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/turne-completa/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data: tour, error } = await supabase.from("tours").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!tour) throw notFound();

    const { data: roadbooks } = await supabase
      .from("roadbooks")
      .select("*")
      .eq("tour_id", tour.id)
      .order("data_inicial", { ascending: true, nullsFirst: false });

    const getUrl = (path: string) => {
      if (!path) return "";
      return supabase.storage.from("roadbook-docs").getPublicUrl(path).data.publicUrl;
    };

    const formattedRbs = (roadbooks || []).map(data => {
      const rb = rowToRoadbook(data);
      rb.teatro_fotos = rb.teatro_fotos.map((f) => ({ ...f, url: f.url || getUrl(f.path) }));
      rb.hotel_fotos = rb.hotel_fotos.map((f) => ({ ...f, url: f.url || getUrl(f.path) }));
      rb.documentos = rb.documentos.map((d) => ({ ...d, url: d.url || getUrl(d.path) }));
      rb.voo_ida.cartoes_embarque = (rb.voo_ida.cartoes_embarque ?? []).map((c) => ({ ...c, url: c.url || getUrl(c.path) }));
      rb.voo_volta.cartoes_embarque = (rb.voo_volta.cartoes_embarque ?? []).map((c) => ({ ...c, url: c.url || getUrl(c.path) }));
      return rb;
    });

    return { tour, roadbooks: formattedRbs };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.tour.nome} — Turnê Completa` : "Turnê Completa";
    return { meta: [
      { title }, { name: "description", content: title },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ] };
  },
  component: TurneCompleta,
});

function TurneCompleta() {
  const { tour, roadbooks } = Route.useLoaderData();

  if (roadbooks.length === 0) {
    return <div className="p-8 text-center">Nenhum roadbook nesta turnê.</div>;
  }

  return (
    <div className="bg-background">

      <div className="flex flex-col">
        {roadbooks.map((rb, idx) => (
          <div key={rb.id} className="relative">
             {idx > 0 && <div className="h-8 bg-slate-100 dark:bg-slate-900 border-y no-print" />}
             <PublicRoadbookView r={rb} isFirst={idx === 0} isConcatenated={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
