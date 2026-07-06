// @ts-nocheck
import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { rowToRoadbook } from "@/lib/roadbook-types";
import { Printer, Moon, Sun } from "lucide-react";
import { PublicRoadbookView } from "./rb.$slug";
import { useState, useEffect } from "react";

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
    const title = loaderData ? `${loaderData.tour.nome} — Turnê Completa - Seven Produções Artísticas` : "Turnê Completa - Seven Produções Artísticas";
    return { meta: [
      { title }, { name: "description", content: title },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ] };
  },
  component: TurneCompleta,
});

function FixedPrintFooter() {
  return (
    <div className="hidden print:flex fixed bottom-0 left-0 w-full flex-col items-center justify-center text-[9px] text-slate-400 pt-4 pb-6 bg-white z-50">
      <div className="w-full max-w-[21cm] mx-auto border-t border-slate-200/60 pt-4 flex flex-col items-center justify-center gap-1 text-center">
        <span className="font-sans font-bold tracking-widest uppercase text-slate-500">Gestão de Viagens e Turnês</span>
        <span className="font-sans font-medium text-slate-400">Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos</span>
      </div>
    </div>
  );
}

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
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("rb-theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
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

function TurneCompleta() {
  const { tour, roadbooks } = Route.useLoaderData();
  const [selectedIds, setSelectedIds] = useState<string[]>(roadbooks.map(r => r.id));

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

  if (roadbooks.length === 0) {
    return <div className="p-8 text-center">Nenhum roadbook nesta turnê.</div>;
  }

  const selectedRoadbooks = roadbooks.filter(r => selectedIds.includes(r.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-500 relative print:bg-white">
      <style>{`
        @media print {
          body, html, .min-h-screen { background-color: white !important; }
        }
      `}</style>
      <ThemeToggle />
      {/* Background Decorativo Contínuo */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 no-print">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[100px]"></div>
      </div>

      {/* FOOTER FIXO PARA IMPRESSÃO EM TODAS AS PÁGINAS */}
      <FixedPrintFooter />

      <div className="no-print max-w-3xl mx-auto px-5 pt-8 pb-4 relative z-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">Selecione as cidades que deseja incluir no PDF:</h3>
          <div className="flex flex-wrap gap-3">
            {roadbooks.map(r => (
              <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 p-1.5 rounded pr-3 transition-colors">
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

      <div className="flex flex-col relative z-10">
        {selectedRoadbooks.map((rb, idx) => (
          <div key={rb.id} className="relative">
             {idx > 0 && <div className="h-8 bg-slate-100 dark:bg-slate-900 border-y no-print" />}
             <PublicRoadbookView r={rb} isFirst={idx === 0} isConcatenated={true} isLast={idx === selectedRoadbooks.length - 1} fetchDelay={idx * 2500} />
          </div>
        ))}
      </div>
    </div>
  );
}
