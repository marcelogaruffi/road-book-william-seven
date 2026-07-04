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
        
        {/* Banner Superior Estilo rb.$slug.tsx */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 mb-8 shadow-xl relative overflow-hidden text-center">
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
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg">
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
          VIEW DE IMPRESSÃO (NOVO MODELO TABULAR 100% SECO)
          ========================================================================= */}
      <style>{`
        @media print {
          .motorista-print-wrapper {
            display: block !important;
            color: black !important;
            background-color: white !important;
            font-family: Arial, Helvetica, sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          
          .motorista-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .motorista-table th, .motorista-table td {
            border-bottom: 1px solid #ccc;
            padding: 10px;
            text-align: left;
            vertical-align: top;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .motorista-table th {
            background-color: #f0f0f0 !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .day-header {
            background-color: #333 !important;
            color: white !important;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 16px;
            margin-top: 30px;
            margin-bottom: 0px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            page-break-after: avoid;
            break-after: avoid;
          }
        }
      `}</style>
      
      <div className="hidden print:block motorista-print-wrapper p-8">
        
        {/* HEADER LIMPO E SECO */}
        <div style={{ borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {rb.espetaculo_logo_url ? (
            <img src={rb.espetaculo_logo_url} alt={rb.espetaculo} style={{ height: '60px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '60px' }}></div>
          )}
          
          <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '2px' }}>Roteiro Motorista</p>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>{rb.espetaculo}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
              {rb.cidade && <span>{rb.cidade}{rb.estado ? `/${rb.estado}` : ""}</span>}
              {rb.cidade && (rb.data_inicial || rb.data_final) && <span> • </span>}
              {(rb.data_inicial || rb.data_final) && (
                <span>{fmtDate(rb.data_inicial)} {rb.data_final && rb.data_final !== rb.data_inicial && ` a ${fmtDate(rb.data_final)}`}</span>
              )}
            </p>
          </div>
          
          <img src="/logo-seven.png" alt="Seven" style={{ height: '50px', objectFit: 'contain' }} />
        </div>

        {/* CONTEÚDO TABULAR SECO */}
        <div style={{ paddingBottom: '40px' }}>
          {dayGroups.length === 0 ? (
            <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>Nenhuma programação cadastrada.</p>
          ) : (
            dayGroups.map((group, idx) => (
              <div key={idx}>
                <div className="day-header">
                  {fmtDate(group.data) || "Sem data"} <span style={{ opacity: 0.8, fontSize: '12px', marginLeft: '10px', fontWeight: 'normal' }}>{getDaySummary(group.itens)}</span>
                </div>
                
                <table className="motorista-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Horário</th>
                      <th style={{ width: '15%' }}>Tipo</th>
                      <th style={{ width: '70%' }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.itens.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{progHora(p)}</td>
                        <td style={{ fontSize: '12px', textTransform: 'uppercase' }}>{p.tipo || "Outro"}</td>
                        <td>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{progTitle(p)}</div>
                          {p.local && (
                            <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 'bold' }}>Local:</span> {p.local}
                            </div>
                          )}
                          {p.observacao && (
                            <div style={{ fontSize: '13px', color: '#444', backgroundColor: '#f9f9f9', padding: '8px', borderLeft: '3px solid #ccc', whiteSpace: 'pre-wrap' }}>
                              {p.observacao}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* FOOTER NO FINAL DO ARQUIVO (NÃO FIXO) */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <strong style={{ display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Gestão de Viagens e Turnês</strong>
          Desenvolvido por Marcelo Garuffi - Contemporânea produção de eventos
        </div>
      </div>
    </div>
  );
}
