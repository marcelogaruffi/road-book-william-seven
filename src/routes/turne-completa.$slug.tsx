import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rowToRoadbook } from "@/lib/roadbook-types";
import { PublicRoadbookView } from "./rb.$slug";
import { Printer } from "lucide-react";
import { useState } from "react";

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
  const [selectedIds, setSelectedIds] = useState<string[]>(roadbooks.map(r => r.id));

  if (roadbooks.length === 0) {
    return <div className="p-8 text-center">Nenhum roadbook nesta turnê.</div>;
  }

  const selectedRoadbooks = roadbooks.filter(r => selectedIds.includes(r.id));

  return (
    <div className="bg-background">
      <div className="no-print max-w-3xl mx-auto px-5 pt-8 pb-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Selecione as cidades que deseja incluir no PDF:</h3>
          <div className="flex flex-wrap gap-3">
            {roadbooks.map(r => (
              <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1.5 rounded pr-3">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                  checked={selectedIds.includes(r.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds([...selectedIds, r.id]);
                    } else {
                      setSelectedIds(selectedIds.filter(id => id !== r.id));
                    }
                  }}
                />
                {r.cidade}{r.estado ? `/${r.estado}` : ""}
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => setSelectedIds(roadbooks.map(r => r.id))}
              className="text-xs text-primary underline"
            >
              Selecionar todas
            </button>
            <span className="text-muted-foreground text-xs">|</span>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-xs text-primary underline"
            >
              Desmarcar todas
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {selectedRoadbooks.map((rb, idx) => (
          <div key={rb.id} className="relative">
             {idx > 0 && <div className="h-8 bg-slate-100 dark:bg-slate-900 border-y no-print" />}
             <PublicRoadbookView r={rb} isFirst={idx === 0} isConcatenated={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
