import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, CalendarDays, Clock, Users, Hotel } from "lucide-react";
import {
  rowToRoadbook, progTitle, progHora, TIPO_COLORS, getDaySummary,
  type ProgItem, type OutroContato
} from "@/lib/roadbook-types";

export const Route = createFileRoute("/_authenticated/print-motorista/$slug")({
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
    <div className="min-h-screen bg-slate-50 font-sans print:bg-white print:min-h-0">
      <table className="w-full text-slate-900 bg-white antialiased max-w-[21cm] mx-auto print:w-full print:max-w-none" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <tbody>
          <tr>
            <td className="p-8">
              
              {/* HEADER */}
              <div className="mb-10 text-center border-b-2 border-slate-900 pb-6">
                <p className="uppercase tracking-[0.3em] text-slate-500 text-sm font-bold mb-4">Roteiro de viagem</p>
                <div className="flex justify-center mb-2">
                  <AppleNumber className="size-10" />
                </div>
                <p className="uppercase tracking-[0.2em] text-slate-900 text-sm font-black mb-6">William Seven</p>
                
                <h1 className="text-4xl font-black tracking-tight uppercase text-slate-900 mb-2">{rb.espetaculo}</h1>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-lg text-slate-700 font-medium">
                  {rb.cidade && <span className="flex items-center gap-1.5"><MapPin className="size-5" />{rb.cidade}{rb.estado ? `/${rb.estado}` : ""}</span>}
                  {(rb.data_inicial || rb.data_final) && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-5" />
                      {fmtDate(rb.data_inicial)} {rb.data_final && rb.data_final !== rb.data_inicial && ` a ${fmtDate(rb.data_final)}`}
                    </span>
                  )}
                </div>
              </div>

              {/* HOSPEDAGEM (HOTEL) */}
              {(r.hotel_nome || r.hotel_endereco || r.hotel_telefone || r.hotel_checkin || r.hotel_checkout || r.hotel_wifi || r.hotel_cafe_inicio || r.hotel_cafe_fim || r.hotel_observacoes) && (
                <div className="mb-8 break-inside-avoid">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                    <Hotel className="size-5" /> Hospedagem
                  </h2>
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm space-y-3">
                    {r.hotel_nome && <div className="font-bold text-base text-slate-800">{r.hotel_nome}</div>}
                    {r.hotel_endereco && <div className="text-slate-600">📍 {r.hotel_endereco}</div>}
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {r.hotel_checkin && <div><span className="font-semibold">Check-in:</span> {fmtDate(r.hotel_checkin)} {r.hotel_checkin_hora && `às ${r.hotel_checkin_hora}`}</div>}
                      {r.hotel_checkout && <div><span className="font-semibold">Check-out:</span> {fmtDate(r.hotel_checkout)} {r.hotel_checkout_hora && `às ${r.hotel_checkout_hora}`}</div>}
                    </div>

                    {(r.hotel_cafe_inicio || r.hotel_cafe_fim || r.hotel_wifi || r.hotel_observacoes) && (
                      <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
                        {(r.hotel_cafe_inicio || r.hotel_cafe_fim) && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="font-bold">Café da manhã:</span>
                            {r.hotel_cafe_inicio} {r.hotel_cafe_fim && `às ${r.hotel_cafe_fim}`}
                          </div>
                        )}
                        {r.hotel_wifi && (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">Wi-Fi:</span>
                            <span className="text-slate-600 whitespace-pre-wrap">{r.hotel_wifi}</span>
                          </div>
                        )}
                        {r.hotel_observacoes && (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">Observações:</span>
                            <span className="text-slate-600 whitespace-pre-wrap">{r.hotel_observacoes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PROGRAMAÇÃO DO DIA */}
              <div className="mb-8">
                <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <Clock className="size-5" /> Programação
                </h2>
                
                {dayGroups.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhuma programação cadastrada.</p>
                ) : (
                  <div className="space-y-8">
                    {dayGroups.map((group, idx) => (
                      <div key={idx}>
                        <div className="bg-slate-900 text-white p-3 rounded flex items-center justify-between mb-4 shadow-sm print:bg-slate-900 print:text-white print:exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <span className="font-bold text-lg">{fmtDate(group.data) || "Sem data"}</span>
                          <span className="text-sm font-medium opacity-90">{getDaySummary(group.itens)}</span>
                        </div>
                        
                        <div className="pl-2 border-l-2 border-slate-200 ml-2 space-y-4">
                          {group.itens.map((p, i) => {
                            const badge = p.tipo ? TIPO_COLORS[p.tipo] || TIPO_COLORS.Outro : TIPO_COLORS.Outro;
                            return (
                              <div key={i} className="relative pl-6 pb-2">
                                <div className="absolute left-[-5px] top-1.5 size-2 rounded-full bg-slate-400 border-2 border-white" />
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                                  <div className="font-mono text-sm font-bold text-slate-700 min-w-[120px]">
                                    {progHora(p)}
                                  </div>
                                  <div className="font-bold text-base text-slate-900">{progTitle(p)}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center mb-1.5 mt-0.5">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge} print:border-current print:text-slate-700`}>
                                    {p.tipo || "Outro"}
                                  </span>
                                  {p.local && <span className="text-sm text-slate-600 font-medium">📍 {p.local}</span>}
                                </div>
                                {p.observacao && <div className="text-sm text-slate-700 mt-1.5 bg-slate-50 p-2 rounded whitespace-pre-wrap leading-snug">{p.observacao}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center mt-12 print:hidden">
                 <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded font-medium shadow hover:bg-slate-800 transition">
                   Imprimir Roteiro
                 </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
