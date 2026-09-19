import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Route as RouteIcon, MapPin, Calendar, Users, Edit, Trash2, ArrowRight } from "lucide-react";
import { customConfirm } from "@/lib/custom-confirm";

export const Route = createFileRoute("/_authenticated/tour/")({
  head: () => ({ meta: [{ title: "Turnês - Seven Produções Artísticas" }] }),
  component: ToursPage,
});

function ToursPage() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  async function fetchTours() {
    setLoading(true);
    // Fetch tours with a count of related roadbooks
      const { data, error } = await (supabase as any)
        .from('tours')
        .select('*, roadbooks(id, data_inicial, data_final, cidade, automacoes)')
        .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Erro ao buscar turnês: " + error.message);
    } else {
      setTours(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    const ok = await customConfirm({
      title: "Apagar Turnê",
      description: `Tem certeza que deseja apagar a turnê "${name}"? Esta ação não pode ser desfeita e todos os eventos vinculados perderão a referência de turnê.`,
      confirmText: "Sim, apagar",
      cancelText: "Cancelar"
    });
    if (!ok) return;

    const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else {
      toast.success("Turnê removida com sucesso");
      fetchTours();
    }
  }

  // Separar em ativas (tem roadbooks futuros ou não tem roadbooks) e finalizadas (só roadbooks passados)
  const now = new Date().toISOString().substring(0, 10);
  
  const isTourActive = (tour: any) => {
    if (!tour.roadbooks || tour.roadbooks.length === 0) return true;
    return tour.roadbooks.some((rb: any) => rb.data_inicial >= now);
  };

  const activeTours = tours.filter(isTourActive);
  const finishedTours = tours.filter(t => !isTourActive(t));

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-snug pb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Turnês
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-2 font-medium">Gerencie e acompanhe todas as turnês da sua equipe.</p>
          </div>
          <Button asChild className="shadow-[0_8px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_12px_25px_rgba(var(--primary),0.3)] transition-all rounded-xl px-6 h-12 bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold text-white">
            <Link to="/tour/new">
              <Plus className="size-5 mr-2" />
              Nova Turnê
            </Link>
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : tours.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-transparent rounded-[2rem]">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <RouteIcon className="size-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nenhuma turnê cadastrada</h2>
          <p className="text-slate-500 max-w-md mb-8 mx-auto">
            Você ainda não possui nenhuma turnê. Crie sua primeira turnê para começar a agrupar seus eventos e shows.
          </p>
          <Button asChild className="rounded-full shadow-lg h-12 px-8">
            <Link to="/tour/new"><Plus className="size-4 mr-2" />Criar a primeira</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-12">
          {activeTours.length > 0 && (
            <section className="space-y-6 pt-4 scroll-mt-24">
              <div className="flex items-center gap-3 px-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Turnês Ativas e Próximas</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {activeTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </section>
          )}

          {finishedTours.length > 0 && (
            <section className="space-y-6 pt-4 scroll-mt-24">
              <div className="flex items-center gap-3 px-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-500 dark:text-slate-400">Turnês Finalizadas</h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                {finishedTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} isFinished={true} onDelete={() => handleDelete(tour.id, tour.nome)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TourCard({ tour, isFinished = false, onDelete }: { tour: any, isFinished?: boolean, onDelete: () => void }) {
  const eventosCount = tour.roadbooks?.length || 0;
  
  const nowTime = new Date().getTime();
  const isHappening = tour.roadbooks?.some((rb: any) => {
    if (!rb.data_inicial) return false;
    const rbTime = new Date(rb.data_inicial).getTime();
    const diff = Math.abs(rbTime - nowTime);
    return diff < 4 * 24 * 60 * 60 * 1000;
  });

  let monthStr = 'TBD';
  let dayStr = '--';
  let sortedRoadbooks = [];
  if (tour.roadbooks && tour.roadbooks.length > 0) {
    sortedRoadbooks = [...tour.roadbooks].sort((a, b) => {
      const timeA = a.data_inicial ? new Date(a.data_inicial).getTime() : 0;
      const timeB = b.data_inicial ? new Date(b.data_inicial).getTime() : 0;
      return timeA - timeB;
    });
    const firstEvent = sortedRoadbooks[0];
    const lastEvent = sortedRoadbooks[sortedRoadbooks.length - 1];
    
    if (firstEvent.data_inicial) {
      const dt1 = new Date(firstEvent.data_inicial + 'T12:00:00Z');
      monthStr = dt1.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
      dayStr = dt1.toLocaleDateString('pt-BR', { day: '2-digit' });

      const finalDate = lastEvent.data_final || lastEvent.data_inicial;
      if (finalDate && finalDate !== firstEvent.data_inicial) {
        const dt2 = new Date(finalDate + 'T12:00:00Z');
        const m2 = dt2.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
        const d2 = dt2.toLocaleDateString('pt-BR', { day: '2-digit' });
        
        if (monthStr === m2) {
          dayStr = `${dayStr} a ${d2}`;
        } else {
          dayStr = `${dayStr}/${monthStr} - ${d2}/${m2}`;
          monthStr = 'PERÍODO';
        }
      }
    }
  }

  // Get a random photo from the roadbooks if available
  const bannerUrls = tour.roadbooks?.map((rb: any) => rb.automacoes?.foto_capa_url).filter(Boolean) || [];
  const charCode = tour.nome.charCodeAt(0) || 0;
  let bannerUrl = null;
  if (bannerUrls.length > 0) {
    bannerUrl = bannerUrls[charCode % bannerUrls.length];
  }

  return (
    <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative h-full">
      <div className="h-40 bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative shrink-0">
        
        <div className="absolute inset-0 overflow-hidden bg-indigo-50 dark:bg-slate-800">
          {bannerUrl ? (
            <>
              <img 
                src={bannerUrl} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ objectPosition: '50% 30%' }}
                alt="Banner da Turnê" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </>
          ) : (
            <>
              <div className="w-full h-full flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform">
                <span className="text-indigo-800 dark:text-indigo-400 font-black text-4xl">{tour.nome.substring(0, 3).toUpperCase()}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          )}
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-8 text-white hover:text-red-400 hover:bg-black/40 bg-black/20 backdrop-blur-sm rounded-full" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        
        {/* Date Square Calendar Style */}
        <div className="absolute -bottom-4 right-4 bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col items-center justify-center min-w-[3.5rem] px-3 w-fit h-16 border-2 border-slate-300 dark:border-slate-600 z-10 group-hover:-translate-y-1 transition-transform">
          <span className="text-[10px] font-bold uppercase text-red-500 tracking-widest">{monthStr}</span>
          <span className="text-xl font-black text-slate-800 dark:text-white leading-none mt-0.5 whitespace-nowrap">{dayStr}</span>
        </div>

        <div className="relative z-10 flex flex-col justify-end w-full h-full p-5 pb-4">
          <Badge className={`w-fit mb-2 border font-bold px-2 py-0.5 rounded uppercase text-[10px] tracking-wider ${isHappening ? 'bg-indigo-500 text-white border-indigo-600 animate-pulse' : isFinished ? 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`} variant="outline">
            {isHappening ? 'Acontecendo' : (isFinished ? 'Finalizada' : (eventosCount > 0 ? 'Agendada' : 'Sem eventos'))}
          </Badge>
          <CardTitle className="text-lg font-bold tracking-tight truncate pr-16 text-white drop-shadow-md">{tour.nome}</CardTitle>
        </div>
      </div>
      
      <CardContent className="flex-1 p-5 pt-7 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <RouteIcon className="size-4 shrink-0 text-slate-400" />
          <span className="line-clamp-1">{tour.espetaculo || "Vários espetáculos"}</span>
        </div>
        
        {tour.roadbooks && tour.roadbooks.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {tour.roadbooks.slice(0, 10).map((rb: any) => (
              <Badge key={rb.id} variant="secondary" className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border-0 px-2.5 py-1">
                <MapPin className="size-3 mr-1.5 opacity-50" />
                {rb.cidade}
              </Badge>
            ))}
            {tour.roadbooks.length > 10 && (
              <Badge variant="secondary" className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800">
                +{tour.roadbooks.length - 10}
              </Badge>
            )}
          </div>
        ) : (
          <div className="py-6 mt-2 text-center text-sm font-medium text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Nenhuma cidade
          </div>
        )}
      </CardContent>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/10 mt-auto flex justify-between gap-2">
        <Button variant="ghost" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium" asChild>
          <Link to="/tour/$id" params={{ id: tour.id }} title="Editar Turnê">
            <Edit className="size-4 mr-2" /> Editar
          </Link>
        </Button>
        <Button className="font-semibold bg-slate-900 hover:bg-primary dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-primary dark:hover:text-white transition-colors" asChild>
          <Link to="/turne/$slug" params={{ slug: tour.slug }}>
            Página Pública <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

