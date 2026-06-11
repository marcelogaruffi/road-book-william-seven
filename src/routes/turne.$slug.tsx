import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, ExternalLink, Route as RouteIcon } from "lucide-react";

type Tour = { id: string; slug: string; nome: string; espetaculo: string | null; producao: string | null };
type City = {
  id: string; slug: string; espetaculo: string; cidade: string; estado: string | null;
  data_inicial: string | null; data_final: string | null; festival: string | null;
};

export const Route = createFileRoute("/turne/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data: tour, error } = await supabase.from("tours").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!tour) throw notFound();
    const { data: cities } = await supabase
      .from("roadbooks")
      .select("id,slug,espetaculo,cidade,estado,data_inicial,data_final,festival")
      .eq("tour_id", tour.id)
      .order("data_inicial", { ascending: true, nullsFirst: false });
    return { tour: tour as Tour, cities: (cities as City[]) ?? [] };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.tour.nome} — Turnê` : "Turnê";
    return { meta: [
      { title }, { name: "description", content: `Road Book Geral da Turnê ${loaderData?.tour.nome ?? ""}` },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ]};
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-semibold">Turnê não encontrada</h1>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <p className="text-muted-foreground">Erro ao carregar.</p>
    </div>
  ),
  component: Page,
});

function fmtDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function Page() {
  const { tour, cities } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-b from-card to-background">
        <div className="max-w-3xl mx-auto px-5 py-10">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2 flex items-center gap-1.5"><RouteIcon className="size-3.5" />Turnê</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">{tour.nome}</h1>
          {tour.espetaculo && <p className="mt-2 text-muted-foreground">{tour.espetaculo}</p>}
          {tour.producao && <p className="text-sm text-muted-foreground mt-1">Produção: {tour.producao}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        <h2 className="text-lg font-semibold">Cidades</h2>
        {cities.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma cidade adicionada à turnê.</p>
        ) : (
          <div className="grid gap-3">
            {cities.map((c) => (
              <a key={c.id} href={`/rb/${c.slug}`} className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold">{c.cidade}{c.estado ? `/${c.estado}` : ""}</h3>
                    {c.festival && <span className="text-xs text-muted-foreground">{c.festival}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <MapPin className="size-3.5" />{c.espetaculo}
                  </p>
                  {(c.data_inicial || c.data_final) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {fmtDate(c.data_inicial)}{c.data_final && c.data_final !== c.data_inicial ? ` — ${fmtDate(c.data_final)}` : ""}
                    </p>
                  )}
                </div>
                <ExternalLink className="size-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        )}

        <footer className="pt-8 pb-12 text-center text-xs text-muted-foreground">
          Road Book · William Seven
        </footer>
      </main>
    </div>
  );
}
