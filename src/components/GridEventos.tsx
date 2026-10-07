import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";

type EventoComCapa = {
  roadbookId: string | null;
  id: string;
  data: string;
  cidade: string;
  estado: string | null;
  espetaculo: string;
  local: string;
  bannerUrl: string | null;
  capa_pos_y: number;
  capa_contain: boolean;
};

export function GridEventos({ onSelect }: { onSelect: (eventoId: string, roadbookId?: string | null, fullEvento?: any) => void }) {
  const [eventos, setEventos] = useState<EventoComCapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [evRes, rbRes, tmplRes] = await Promise.all([
          supabase.from("eventos").select("id, data, cidade, local, espetaculo").order("data", { ascending: false }),
          supabase.from("roadbooks").select("id, evento_id, automacoes"),
          supabase.from('templates_espetaculos').select("nome_espetaculo, logo_espetaculo_url").neq('nome_espetaculo', 'ESTOQUE_GLOBAL')
        ]);

        if (evRes.data) {
          const rbs = rbRes.data || [];
          const tmpls = tmplRes.data || [];

          const final = evRes.data.map(ev => {
            const rb = rbs.find(r => r.evento_id === ev.id);
            const tmpl = tmpls.find(t => t.nome_espetaculo === ev.espetaculo);
            const logoUrl = tmpl?.logo_espetaculo_url;
            const bannerUrl = rb?.automacoes?.foto_capa_url || logoUrl || null;
            
            return {
              ...ev,
              estado: null,
              bannerUrl,
              roadbookId: rb?.id || null,
              capa_pos_y: rb?.automacoes?.capa_pos_y ?? 50,
              capa_contain: rb?.automacoes?.capa_contain ?? false
            };
          });
          setEventos(final);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmtDate = (d?: string | null) => {
    if (!d) return "";
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  if (loading) return <div className="py-12 text-center text-slate-400 font-medium animate-pulse">Carregando eventos...</div>;
  if (eventos.length === 0) return <div className="py-12 text-center text-slate-400 font-medium">Nenhum evento encontrado.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
      {eventos.map(ev => {
        const [y, mStr, dStr] = (ev.data || "2000-01-01").split("-");
        const monthStr = monthNames[parseInt(mStr) - 1] || mStr;
        const dayStr = dStr;
        
        return (
          <Card 
            key={ev.id} 
            onClick={() => onSelect(ev.id, ev.roadbookId, ev)}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col relative h-full cursor-pointer"
          >
            <div className="h-40 bg-indigo-50 dark:bg-slate-800 flex items-center justify-center relative group/banner shrink-0">
              <div className="absolute inset-0 overflow-hidden">
                {ev.bannerUrl ? (
                  <img 
                    src={ev.bannerUrl} 
                    className={`w-full h-full group-hover/banner:scale-105 transition-transform duration-500 ${ev.capa_contain ? 'object-contain' : 'object-cover'}`} 
                    style={{ objectPosition: `50% ${ev.capa_pos_y}%` }}
                    alt="Capa" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-indigo-800 dark:text-indigo-400 font-black text-2xl opacity-40 group-hover/banner:scale-110 transition-transform">
                      {ev.espetaculo?.toUpperCase() || 'EVENTO'}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center min-w-[3.5rem] px-3 h-16 border-2 border-slate-300 dark:border-slate-600 z-10 group-hover/banner:-translate-y-1 transition-transform">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">{monthStr}</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none tracking-tighter whitespace-nowrap">{dayStr}</span>
              </div>
            </div>
            
            <div className="p-4 pt-5 flex flex-col flex-1 bg-white dark:bg-slate-900/50">
              <div className="flex-1 relative z-10">
                <h4 className="text-lg font-black text-[var(--foreground)] leading-tight truncate pr-16 group-hover:text-primary transition-colors" title={ev.cidade + (ev.estado ? ' - ' + ev.estado : '')}>
                  {ev.cidade} {ev.estado ? `- ${ev.estado}` : ''}
                </h4>
                <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1 truncate">
                  <MapPin className="size-3 inline mr-1" /> {ev.local || ev.cidade}
                </p>
                <div className="flex flex-col gap-1 mt-3 mb-2">
                  <p className="text-xs text-[var(--muted-foreground)] font-medium flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-400" /> {fmtDate(ev.data)}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 dark:text-slate-300 uppercase truncate max-w-[120px]">
                  {ev.espetaculo}
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Acessar &rarr;
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

