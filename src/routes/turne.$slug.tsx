import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, ExternalLink, Route as RouteIcon, FileText, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

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
    const title = loaderData ? `${loaderData.tour.nome} — Turnê - Seven Produções Artísticas` : "Turnê - Seven Produções Artísticas";
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
  errorComponent: ({ error }: { error: any }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <p className="text-muted-foreground font-semibold">Erro ao carregar.</p>
        <p className="text-xs text-red-500 mt-2 font-mono">{error?.message || String(error)}</p>
      </div>
    </div>
  ),
  component: Page,
});

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("rb-theme");
    if (saved === "dark" || (!saved && document.documentElement.classList.contains("dark"))) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("rb-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("rb-theme", "light");
    }
  };

  return (
    <button 
      onClick={toggle}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-all no-print"
    >
      {theme === "light" ? (
        <><Moon className="size-4" /> Modo Escuro</>
      ) : (
        <><Sun className="size-4" /> Modo Claro</>
      )}
    </button>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function Page() {
  const { tour, cities } = Route.useLoaderData() as { tour: Tour; cities: City[] };
  
  useEffect(() => {
    let wasDark = false;
    const beforePrint = () => {
      wasDark = document.documentElement.classList.contains("dark");
      if (wasDark) document.documentElement.classList.remove("dark");
    };
    const afterPrint = () => {
      if (wasDark) document.documentElement.classList.add("dark");
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  let currentCity: City | undefined;
  let nextCity: City | undefined;

  const today = new Date();
  today.setHours(0,0,0,0);

  for (const c of cities) {
    if (!c.data_inicial && !c.data_final) continue;
    
    let cStart: Date | null = null;
    let cEnd: Date | null = null;

    if (c.data_inicial) {
      const [y, m, d] = c.data_inicial.split('-');
      cStart = new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (c.data_final) {
      const [y, m, d] = c.data_final.split('-');
      cEnd = new Date(Number(y), Number(m) - 1, Number(d));
    }

    const start = cStart || cEnd;
    const end = cEnd || cStart;

    if (start && end) {
      if (today >= start && today <= end) {
        currentCity = c;
      } else if (start > today) {
        if (!nextCity) nextCity = c;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col transition-colors duration-500 overflow-hidden relative">
      <ThemeToggle />

      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px]"></div>
      </div>

      <header className="pt-16 pb-12 relative z-10 px-5 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold flex items-center justify-center gap-1.5">
            <RouteIcon className="size-4" /> Resumo da Turnê
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-800 dark:text-white bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            {tour.nome}
          </h1>
          {tour.espetaculo && <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{tour.espetaculo}</p>}
          {tour.producao && <p className="text-sm font-semibold text-slate-400">Produção: {tour.producao}</p>}
          
          {(currentCity || nextCity) && (
            <div className="mt-8 pt-4 flex flex-wrap justify-center gap-6">
              {currentCity && (
                <div className="inline-flex flex-col items-center">
                  <span className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-3 tracking-widest bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1"><span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> Parada Atual</span>
                  <a href={`/rb/${currentCity.slug}`} className="inline-flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                    <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <MapPin className="size-6" />
                    </div>
                    <div className="text-left pr-2">
                      <div className="text-base font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{currentCity.cidade}{currentCity.estado ? ` / ${currentCity.estado}` : ""}</div>
                      {currentCity.data_inicial && (
                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {fmtDate(currentCity.data_inicial)}{currentCity.data_final && currentCity.data_final !== currentCity.data_inicial ? ` a ${fmtDate(currentCity.data_final)}` : ""}
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              )}
              {nextCity && (
                <div className="inline-flex flex-col items-center">
                  <span className="text-xs uppercase font-bold text-primary mb-3 tracking-widest bg-primary/10 px-3 py-1 rounded-full">Próxima Parada</span>
                  <a href={`/rb/${nextCity.slug}`} className="inline-flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <MapPin className="size-6" />
                    </div>
                    <div className="text-left pr-2">
                      <div className="text-base font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">{nextCity.cidade}{nextCity.estado ? ` / ${nextCity.estado}` : ""}</div>
                      {nextCity.data_inicial && (
                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {fmtDate(nextCity.data_inicial)}{nextCity.data_final && nextCity.data_final !== nextCity.data_inicial ? ` a ${fmtDate(nextCity.data_final)}` : ""}
                        </div>
                      )}
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 pb-12 relative z-10 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Roteiros</h2>
          {cities.length > 0 && (
            <a href={`/turne-completa/${tour.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-sm font-bold px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5">
              <FileText className="size-4" />
              Ver Resumo Completo
            </a>
          )}
        </div>
        
        {cities.length === 0 ? (
          <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 backdrop-blur-md">
            <p className="text-slate-500 font-medium">Nenhuma cidade adicionada à turnê.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cities.map((c) => (
              <a key={c.id} href={`/rb/${c.slug}`} className="group relative rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-card/40 backdrop-blur-xl p-5 md:p-6 hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="min-w-0 flex-1 relative z-10">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-xl text-slate-800 dark:text-white">{c.cidade}{c.estado ? ` / ${c.estado}` : ""}</h3>
                    {c.festival && <span className="text-xs font-bold px-2 py-1 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 rounded-md">{c.festival}</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="size-4 text-slate-400" />{c.espetaculo}
                  </p>
                  {(c.data_inicial || c.data_final) && (
                    <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 w-fit px-2.5 py-1 rounded-md">
                      <CalendarDays className="size-3.5" />
                      {fmtDate(c.data_inicial)}{c.data_final && c.data_final !== c.data_inicial ? ` — ${fmtDate(c.data_final)}` : ""}
                    </p>
                  )}
                </div>
                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors shrink-0 relative z-10 shadow-sm">
                  <ExternalLink className="size-5" />
                </div>
              </a>
            ))}
          </div>
        )}

        <footer className="pt-12 pb-8 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 flex flex-col gap-1">
          <span className="font-bold tracking-widest uppercase text-slate-500 text-[10px]">Gestão de Viagens e Turnês</span>
          <span className="text-[10px]">Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos</span>
        </footer>
      </main>
    </div>
  );
}
