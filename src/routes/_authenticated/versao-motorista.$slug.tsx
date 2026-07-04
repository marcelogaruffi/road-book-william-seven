import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, Clock, Users, Hotel, Moon, Sun } from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, getDaySummary,
  type ProgItem, type OutroContato
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/_authenticated/versao-motorista/$slug")({
  ssr: false,
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("roadbooks").select("*").eq("slug", params.slug).maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return rowToRoadbook(data);
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Roteiro Motorista: ${loaderData.espetaculo} — ${loaderData.cidade}` : "Roteiro Motorista";
    return { meta: [
      { title }, { name: "description", content: title },
      { property: "og:title", content: title },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div><h1 className="text-2xl font-semibold">Road Book não encontrado</h1></div>
    </div>
  ),
  component: DriverPrintPage,
});


function AppleNumber({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 C48 15, 55 5, 60 5 C57 12, 53 18, 50 25" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 18 C58 12, 70 12, 72 15 C70 23, 58 23, 50 18" fill="#15803d" />
      <path d="M50 27 C40 25, 20 28, 15 48 C10 65, 25 88, 50 92 C75 88, 90 65, 85 48 C80 28, 60 25, 50 27 Z" fill="#dc2626" />
    </svg>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("rb-theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
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

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function DriverPrintPage() {
  const rb = Route.useLoaderData();

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    let wasDark = false;
    const handleBeforePrint = () => {
      setIsPrinting(true);
      wasDark = document.documentElement.classList.contains("dark");
      if (wasDark) document.documentElement.classList.remove("dark");
    };
    const handleAfterPrint = () => {
      setIsPrinting(false);
      if (wasDark) document.documentElement.classList.add("dark");
    };

    const mediaQueryList = window.matchMedia('print');
    const handleMediaQueryChange = (mql: MediaQueryListEvent) => {
      if (mql.matches) {
        handleBeforePrint();
      } else {
        handleAfterPrint();
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    mediaQueryList.addEventListener("change", handleMediaQueryChange);
    
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      mediaQueryList.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  const dayGroups = useMemo(() => {
    const map = new Map<string, ProgItem[]>();
    rb.programacao.forEach((p) => {
      const k = p.data || "";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (!a) return 1; if (!b) return -1; return a.localeCompare(b);
    });
    return keys.map((k) => ({ data: k, itens: map.get(k)!.sort((a,b) => (a.hora_inicio||"").localeCompare(b.hora_inicio||"")) }));
  }, [rb.programacao]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background font-sans print:bg-white print:min-h-0 relative">
      <style>{`
        @media print {
          @page { margin: 0; }
          :root, html, body {
            color-scheme: light !important;
            margin: 0; 
            padding: 1cm; 
            background-color: white !important; 
          }
        }
      `}</style>
      {/* =========================================================================
          VIEW DE TELA (Moderno, Escuro/Claro, Inspirado no rb.$slug.tsx)
          ========================================================================= */}
      {!isPrinting && (
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ThemeToggle />
        
        {/* Banner Superior Estilo rb.$slug.tsx */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-8 sm:p-10 mb-8 shadow-xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
          
          <div className="flex justify-center items-center gap-6 mb-8 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
            <img src="/logo-seven.png" alt="Seven Produções" className="h-14 w-auto object-contain dark:brightness-200" />
            {rb.espetaculo_logo_url && (
              <>
                <div className="w-px h-10 bg-slate-300 dark:bg-white/20"></div>
                <img src={rb.espetaculo_logo_url} alt={`${rb.espetaculo} Logo`} className="h-14 w-auto object-contain dark:brightness-200" />
              </>
            )}
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mb-4">
             <Users className="size-3.5" /> Versão para Motorista
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6 drop-shadow-sm">
            {rb.espetaculo}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
            {rb.cidade && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                <MapPin className="size-4 text-primary" />
                {rb.cidade}{rb.estado ? `/${rb.estado}` : ""}
              </div>
            )}
            {(rb.data_inicial || rb.data_final) && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                <CalendarDays className="size-4 text-purple-500" />
                {fmtDate(rb.data_inicial)} {rb.data_final && rb.data_final !== rb.data_inicial && ` a ${fmtDate(rb.data_final)}`}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => {
                setIsPrinting(true);
                setTimeout(() => window.print(), 100);
              }} 
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-white transition transform hover:-translate-y-1"
            >
              Imprimir Roteiro
            </button>
          </div>
        </div>

        {/* Timeline dos Dias */}
        <div className="space-y-12">
          {dayGroups.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
               <p className="text-slate-500 dark:text-slate-400 italic">Nenhuma programação cadastrada.</p>
            </div>
          ) : (
            dayGroups.map((group, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-lg">
                <div className="bg-slate-100 dark:bg-slate-950 p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <CalendarDays className="size-6 text-primary" />
                    {fmtDate(group.data) || "Sem data"}
                  </h2>
                  <span className="text-sm font-bold bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {getDaySummary(group.itens)}
                  </span>
                </div>
                
                <div className="p-6 sm:p-8 space-y-6">
                  {group.itens.map((p, i) => {
                    const badge = p.tipo ? TIPO_COLORS[p.tipo] || TIPO_COLORS.Outro : TIPO_COLORS.Outro;
                    return (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-20 shrink-0 text-right pt-1 hidden sm:block">
                          <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">{progHora(p)}</span>
                        </div>
                        <div className="relative flex flex-col items-center">
                          <div className="h-full w-px bg-slate-200 dark:bg-slate-800 absolute top-4 left-1/2 -translate-x-1/2 group-last:hidden"></div>
                          <div className="size-3 rounded-full bg-primary border-2 border-white dark:border-background relative z-10 mt-1.5"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="sm:hidden mb-1"><span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{progHora(p)}</span></div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{progTitle(p)}</h3>
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${badge}`}>{p.tipo || "Outro"}</span>
                            {p.local && <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1"><MapPin className="size-3.5" /> {p.local}</span>}
                          </div>
                          {p.observacao && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                              {p.observacao}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* =========================================================================
          VIEW DE IMPRESSÃO (Novo PDF construído do ZERO - 100% à prova de tema escuro)
          ========================================================================= */}
      <style>{`
        @media print {
          .motorista-print-wrapper {
            display: block !important;
            color: #0f172a !important; /* slate-900 */
            background-color: white !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          
          /* Força as divs para não quebrarem bizarramente no meio da página */
          .motorista-day-section {
            margin-bottom: 2rem !important;
          }
          .motorista-item {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .motorista-footer {
            text-align: center;
            font-size: 9px;
            color: #94a3b8 !important; /* slate-400 */
            border-top: 1px solid #e2e8f0;
            padding-top: 0.5rem;
            margin-top: 2rem;
          }
        }
      `}</style>
      
      <div className="hidden print:block motorista-print-wrapper p-8">
        
        {/* HEADER LIMPO E MODERNO DO PAPEL */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-10" style={{ borderBottomColor: '#0f172a' }}>
          <img src="/logo-seven.png" alt="Seven Produções" className="h-16 w-auto object-contain" />
          <div className="text-center flex-1 mx-4">
            <p className="uppercase tracking-[0.3em] text-slate-500 text-xs font-bold mb-1" style={{ color: '#64748b' }}>Roteiro de viagem Motorista</p>
            <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900 mb-2" style={{ color: '#0f172a' }}>{rb.espetaculo}</h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-base text-slate-700 font-medium" style={{ color: '#334155' }}>
              {rb.cidade && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{rb.cidade}{rb.estado ? `/${rb.estado}` : ""}</span>}
              {(rb.data_inicial || rb.data_final) && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" />
                  {fmtDate(rb.data_inicial)} {rb.data_final && rb.data_final !== rb.data_inicial && ` a ${fmtDate(rb.data_final)}`}
                </span>
              )}
            </div>
          </div>
          {rb.espetaculo_logo_url ? (
            <div className="ml-4 border-l-2 border-slate-200 pl-4" style={{ borderLeftColor: '#e2e8f0' }}>
              <img src={rb.espetaculo_logo_url} alt={rb.espetaculo} className="h-16 w-auto object-contain" />
            </div>
          ) : (
            <div className="w-16"></div>
          )}
        </div>

        {/* CONTEÚDO DO PAPEL */}
        <div className="mb-12">
          {dayGroups.length === 0 ? (
            <p className="text-slate-500 italic text-center">Nenhuma programação cadastrada.</p>
          ) : (
            <div className="space-y-10">
              {dayGroups.map((group, idx) => (
                <div key={idx} className="motorista-day-section">
                  {/* Título do Dia (Barra Escura) */}
                  <div className="flex items-center justify-between p-3 rounded mb-5" style={{ backgroundColor: '#0f172a', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <span className="font-bold text-lg">{fmtDate(group.data) || "Sem data"}</span>
                    <span className="text-sm font-medium opacity-90">{getDaySummary(group.itens)}</span>
                  </div>
                  
                  {/* Linha do Tempo Estilizada */}
                  <div className="pl-2 ml-2 border-l-2 border-slate-300 space-y-4" style={{ borderLeftColor: '#cbd5e1' }}>
                    {group.itens.map((p, i) => {
                      return (
                        <div key={i} className="relative pl-6 pb-2 motorista-item">
                          {/* Ponto da Linha */}
                          <div className="absolute left-[-5px] top-1.5 size-2 rounded-full border-2 border-white" style={{ backgroundColor: '#94a3b8', borderColor: 'white' }}></div>
                          
                          <div className="flex items-baseline gap-3 mb-1">
                            <div className="font-mono text-sm font-bold min-w-[120px]" style={{ color: '#475569' }}>
                              {progHora(p)}
                            </div>
                            <div className="font-bold text-base" style={{ color: '#0f172a' }}>
                              {progTitle(p)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center mt-1 mb-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border" style={{ borderColor: 'currentColor', color: '#334155' }}>
                              {p.tipo || "Outro"}
                            </span>
                            {p.local && <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#475569' }}>📍 {p.local}</span>}
                          </div>
                          
                          {p.observacao && (
                            <div className="text-sm mt-1.5 p-2 rounded whitespace-pre-wrap leading-snug" style={{ backgroundColor: '#f8fafc', color: '#334155', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                              {p.observacao}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER FIXO (Impresso no rodapé) */}
        <div className="motorista-footer">
          <span className="block font-sans font-bold tracking-widest uppercase mb-1" style={{ color: '#64748b' }}>
            Gestão de Viagens e Turnês
          </span>
          <span className="block font-sans font-medium" style={{ color: '#94a3b8' }}>
            Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos
          </span>
        </div>
      </div>
    </div>
  );
}
